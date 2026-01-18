<template>
  <main>
    <div class="music-list-container">
      <div class="header-section mb-4">
        <h1>Music Library</h1>
        <button 
          v-if="isAdmin" 
          class="btn btn-primary" 
          @click="showAddForm = true"
        >
          Add Song
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="filters-section mb-4">
        <div class="row g-3 align-items-center">
          <!-- Search -->
          <div class="col-md-4">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Search by title or artist..."
              @input="debouncedFetchMusic"
            />
          </div>
          
          <!-- Genre Filter -->
          <div class="col-md-2">
            <select
              v-model="selectedGenre"
              class="form-control"
              @change="resetPageAndFetch"
            >
              <option value="">All genres</option>
              <option v-for="genre in availableGenres" :key="genre.slug" :value="genre.slug">
                {{ genre.name }}
              </option>
            </select>
          </div>

          <!-- Year Filter -->
           <div class="col-md-2">
            <input
              v-model.number="filterYear"
              type="number"
              class="form-control"
              placeholder="Year"
              @input="debouncedFetchMusic"
            />
          </div>

          <!-- Sort By -->
          <div class="col-md-2">
            <select
              v-model="sortBy"
              class="form-control"
              @change="fetchMusic"
            >
              <option value="created_at">Date added</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="year">Year</option>
            </select>
          </div>

          <!-- Sort Order & Clear -->
          <div class="col-md-2 d-flex gap-2 align-items-center">
            <button 
                class="btn btn-outline-secondary sort-order-btn" 
                @click="toggleSortOrder"
                title="Change sort direction"
            >
              <span v-if="sortOrder === 'asc'">↑</span>
              <span v-else>↓</span>
            </button>
            <button class="btn btn-outline-primary flex-grow-1" @click="clearFilters">
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading music...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="alert alert-danger" role="alert">
          <h4>Error loading music</h4>
          <p>{{ error }}</p>
          <button class="btn btn-outline-primary mt-2" @click="fetchMusic">Try again</button>
        </div>
      </div>

      <!-- Music List -->
      <div v-else-if="musicList.length > 0" class="music-table-container">
        <table class="table">
          <thead>
            <tr>
              <th @click="setSort('title')" class="cursor-pointer">Title</th>
              <th @click="setSort('artist')" class="cursor-pointer">Artist</th>
              <th @click="setSort('album')" class="cursor-pointer">Album</th>
              <th @click="setSort('year')" class="cursor-pointer">Year</th>
              <th>Genre</th>
              <th @click="setSort('created_at')" class="cursor-pointer">Created</th>
              <th v-if="isAdmin" class="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="music in musicList" 
              :key="music.id"
              class="clickable-row"
              @click="goToMusicDetails(music.id)"
            >
              <td>
                <router-link 
                  :to="`/music/${music.id}`" 
                  class="music-title-link"
                  @click.stop
                >
                  {{ music.title }}
                </router-link>
              </td>
              <td>{{ music.artist }}</td>
              <td>{{ music.album || '-' }}</td>
              <td>{{ music.year || '-' }}</td>
              <td>{{ music.genre || '-' }}</td>
              <td>{{ formatDate(music.created_at) }}</td>
              <td v-if="isAdmin" class="actions-cell" @click.stop>
                <div class="actions-buttons">
                  <button 
                    class="btn btn-sm btn-outline-primary" 
                    @click.stop="editMusic(music)"
                  >
                    Edit
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    @click.stop="confirmDelete(music)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-container">
        <p>No songs found.</p>
        <p v-if="searchQuery || selectedGenre || filterYear" class="text-muted">
          Try changing the search criteria.
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1 && !loading" class="pagination-container mt-4">
        <nav aria-label="Page navigation">
          <ul class="pagination justify-content-center" style="display: flex; gap: 5px; list-style: none; padding: 0;">
            <li class="page-item" :class="{ disabled: page === 1 }">
              <button class="btn btn-outline-secondary" @click="changePage(page - 1)" :disabled="page === 1">
                Previous
              </button>
            </li>
            
            <li class="page-item disabled">
              <span class="btn btn-outline-secondary disabled" style="border: none;">
                Page {{ page }} of {{ totalPages }}
              </span>
            </li>
            
            <li class="page-item" :class="{ disabled: page === totalPages }">
              <button class="btn btn-outline-secondary" @click="changePage(page + 1)" :disabled="page === totalPages">
                Next
              </button>
            </li>
          </ul>
        </nav>
        <div class="text-center text-muted mt-2">
             <small>Total results: {{ totalCount }}</small>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || editingMusic" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingMusic ? 'Edit Song' : 'Add New Song' }}</h2>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveMusic">
            <div class="mb-3">
              <label class="form-label">Title *</label>
              <input
                v-model="formData.title"
                type="text"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.title }"
              />
              <div v-if="formErrors.title" class="invalid-feedback">
                {{ formErrors.title }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Artist *</label>
              <input
                v-model="formData.artist"
                type="text"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.artist }"
              />
              <div v-if="formErrors.artist" class="invalid-feedback">
                {{ formErrors.artist }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Album</label>
              <input
                v-model="formData.album"
                type="text"
                class="form-control"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Year</label>
              <input
                v-model.number="formData.year"
                type="number"
                class="form-control"
                min="1900"
                :max="new Date().getFullYear() + 1"
                :class="{ 'is-invalid': formErrors.year }"
              />
              <div v-if="formErrors.year" class="invalid-feedback">
                {{ formErrors.year }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Genre</label>
              <input
                v-model="formData.genre"
                type="text"
                class="form-control"
                list="genres-list"
              />
              <datalist id="genres-list">
                <option v-for="genre in availableGenres" :key="genre.slug" :value="genre.name" />
              </datalist>
            </div>

            <div class="mb-3">
              <label class="form-label">YouTube Link (optional)</label>
              <input
                v-model="formData.youtube_url"
                type="url"
                class="form-control"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <small class="form-text text-muted">Paste the full YouTube video link</small>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="closeModal">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { musicService, type Music, type Genre, type MusicFormData } from '../services/musicService'
import { formatDate } from '../utils/dateUtils'
import { getUserFromStorage, isAdmin } from '../utils/userUtils'
import { validateMusicForm, type MusicFormErrors } from '../validators/musicValidators'
import { debounce } from '../utils/debounce'

export default defineComponent({
  name: 'MusicListView',
  data() {
    return {
      musicList: [] as Music[],
      loading: true,
      error: null as string | null,
      
      // Filters & Pagination
      searchQuery: '',
      selectedGenre: '',
      filterYear: null as number | null,
      sortBy: 'created_at',
      sortOrder: 'desc' as 'asc' | 'desc',
      page: 1,
      limit: 20,
      totalPages: 0,
      totalCount: 0,

      // Metadata
      availableGenres: [] as Genre[],

      // Form
      showAddForm: false,
      editingMusic: null as Music | null,
      formData: {
        title: '',
        artist: '',
        album: '',
        year: null as number | null,
        genre: '',
        youtube_url: '',
      } as MusicFormData,
      formErrors: {} as MusicFormErrors,
      saving: false,
      user: null as { role?: string } | null,
      debouncedFetchMusicFn: null as (() => void) | null,
    }
  },
  computed: {
    isAdmin(): boolean {
      return isAdmin(this.user)
    }
  },
  methods: {
    debouncedFetchMusic() {
      if (!this.debouncedFetchMusicFn) {
        this.debouncedFetchMusicFn = debounce(() => {
          this.page = 1
          this.fetchMusic()
        }, 300)
      }
      this.debouncedFetchMusicFn()
    },
    resetPageAndFetch() {
      this.page = 1
      this.fetchMusic()
    },
    async fetchGenres() {
      try {
        this.availableGenres = await musicService.fetchGenres()
      } catch (err) {
        console.error('Failed to load genres', err)
      }
    },
    async fetchMusic() {
      this.loading = true
      this.error = null

      try {
        const params: any = {
          page: this.page,
          limit: this.limit,
          sortBy: this.sortBy,
          sortOrder: this.sortOrder
        }

        if (this.searchQuery) params.search = this.searchQuery
        if (this.selectedGenre) params.genre = this.selectedGenre
        if (this.filterYear) params.year = this.filterYear

        const response = await musicService.fetchMusic(params)
        
        this.musicList = response.data
        this.totalCount = response.totalCount
        this.totalPages = response.totalPages
        
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Failed to load music'
          console.error('Error fetching music:', err)
        }
      } finally {
        this.loading = false
      }
    },
    changePage(newPage: number) {
      if (newPage >= 1 && newPage <= this.totalPages) {
        this.page = newPage
        this.fetchMusic()
      }
    },
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      this.fetchMusic()
    },
    setSort(field: string) {
      if (this.sortBy === field) {
        this.toggleSortOrder()
      } else {
        this.sortBy = field
        this.sortOrder = 'asc'
        this.fetchMusic()
      }
    },
    clearFilters() {
      this.searchQuery = ''
      this.selectedGenre = ''
      this.filterYear = null
      this.sortBy = 'created_at'
      this.sortOrder = 'desc'
      this.page = 1
      this.fetchMusic()
    },
    editMusic(music: Music) {
      this.editingMusic = music
      this.formData = {
        title: music.title,
        artist: music.artist,
        album: music.album || '',
        year: music.year,
        genre: music.genre || '',
        youtube_url: music.youtube_url || '',
      }
      this.formErrors = {}
    },
    closeModal() {
      this.showAddForm = false
      this.editingMusic = null
      this.formData = {
        title: '',
        artist: '',
        album: '',
        year: null,
        genre: '',
        youtube_url: '',
      }
      this.formErrors = {}
    },
    validateForm(): boolean {
      this.formErrors = validateMusicForm(this.formData)
      return Object.keys(this.formErrors).length === 0
    },
    async saveMusic() {
      if (!this.validateForm()) {
        return
      }

      this.saving = true
      this.error = null

      try {
        if (this.editingMusic) {
          await musicService.updateMusic(this.editingMusic.id, this.formData)
        } else {
          await musicService.createMusic(this.formData)
        }

        this.closeModal()
        await this.fetchMusic()
        await this.fetchGenres()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Insufficient permissions to perform this operation'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Failed to save song'
          console.error('Error saving music:', err)
        }
      } finally {
        this.saving = false
      }
    },
    confirmDelete(music: Music) {
      if (confirm(`Are you sure you want to delete the song "${music.title}"?`)) {
        this.deleteMusic(music)
      }
    },
    async deleteMusic(music: Music) {
      this.error = null

      try {
        await musicService.deleteMusic(music.id)
        await this.fetchMusic()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Insufficient permissions to perform this operation'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Failed to delete song'
          console.error('Error deleting music:', err)
        }
      }
    },
    formatDate,
    goToMusicDetails(musicId: string) {
      this.$router.push(`/music/${musicId}`)
    },
    checkUserRole() {
      this.user = getUserFromStorage()
    }
  },
  mounted() {
    this.checkUserRole()
    this.fetchGenres()
    this.fetchMusic()
  }
})
</script>

<style scoped>
.music-list-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--bs-border-color);
  padding-bottom: 1rem;
}

h1 {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 2rem;
  font-weight: 700;
}

.filters-section {
  padding: 1rem;
  border: 1px solid var(--bs-border-color);
  background-color: transparent;
}

.filters-section .form-control,
.filters-section .btn {
  height: 38px;
  display: flex;
  align-items: center;
}

.filters-section select.form-control {
  padding: 0.375rem 0.75rem;
}

.sort-order-btn {
  min-width: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.25em;
  border-color: var(--primary-color);
  border-right-color: transparent;
}

.music-table-container {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background-color: transparent;
}

.table thead {
  border-bottom: 2px solid var(--bs-border-color);
}

.table th {
  padding: 1rem;
  text-align: left;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 1px;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 2px solid var(--bs-border-color);
}

.cursor-pointer {
    cursor: pointer;
    user-select: none;
}
.cursor-pointer:hover {
    color: var(--primary-color);
}

.table td {
  padding: 1rem;
  border-bottom: 1px solid var(--bs-border-color);
  color: var(--text-color);
}

.table tbody tr.clickable-row {
  cursor: pointer;
}

.table tbody tr:hover {
  background-color: var(--bs-border-color);
  opacity: 0.5;
}

.music-title-link {
  color: var(--primary-color);
  text-decoration: none;
}

.music-title-link:hover {
  text-decoration: underline;
}

.actions-column {
  text-align: center;
  width: 220px;
  min-width: 220px;
}

.actions-cell {
  text-align: center;
  padding: 0.75rem 0.5rem !important;
}

.actions-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.actions-cell .btn {
  min-width: 80px;
  white-space: nowrap;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.alert {
  border: 1px solid var(--bs-border-color);
  background-color: transparent;
  color: var(--text-color);
  padding: 1.5rem;
  max-width: 500px;
}

.alert-danger {
  border-color: #dc3545;
  color: #dc3545;
}

.alert h4 {
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-color);
  border: 2px solid var(--bs-border-color);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--bs-border-color);
}

.modal-header h2 {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1.5rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-color);
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  opacity: 0.7;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--bs-border-color);
}

.form-label {
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1px;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-control {
  background-color: transparent;
  border: 1px solid var(--bs-border-color);
  color: var(--text-color);
}

.form-control:focus {
  background-color: transparent;
  border-color: var(--primary-color);
  box-shadow: none;
  color: var(--text-color);
}

.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  text-transform: none;
}

.pagination-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.page-item.disabled .page-link {
    background-color: transparent;
    border-color: var(--bs-border-color);
    color: var(--text-color);
    opacity: 0.6;
}

.page-link {
    background-color: transparent;
    border-color: var(--bs-border-color);
    color: var(--primary-color);
    cursor: pointer;
}

.page-link:hover {
    background-color: var(--bs-border-color);
    color: var(--primary-color);
}
</style>