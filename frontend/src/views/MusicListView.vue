<template>
  <main>
    <div class="music-list-container">
      <div class="header-section mb-4">
        <h1>Biblioteka muzyczna</h1>
        <button 
          v-if="isAdmin" 
          class="btn btn-primary" 
          @click="showAddForm = true"
        >
          Dodaj utwór
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="filters-section mb-4">
        <div class="row g-3">
          <div class="col-md-6">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Szukaj po tytule lub artyście..."
              @input="filterMusic"
            />
          </div>
          <div class="col-md-4">
            <select
              v-model="selectedGenre"
              class="form-control"
              @change="filterMusic"
            >
              <option value="">Wszystkie gatunki</option>
              <option v-for="genre in availableGenres" :key="genre" :value="genre">
                {{ genre }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" @click="clearFilters">
              Wyczyść
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Ładowanie muzyki...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="alert alert-danger" role="alert">
          <h4>Błąd ładowania muzyki</h4>
          <p>{{ error }}</p>
          <button class="btn btn-outline-primary mt-2" @click="fetchMusic">Spróbuj ponownie</button>
        </div>
      </div>

      <!-- Music List -->
      <div v-else-if="filteredMusicList.length > 0" class="music-table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Tytuł</th>
              <th>Artysta</th>
              <th>Album</th>
              <th>Rok</th>
              <th>Gatunek</th>
              <th>Utworzono</th>
              <th v-if="isAdmin" class="actions-column">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="music in filteredMusicList" :key="music.id">
              <td>{{ music.title }}</td>
              <td>{{ music.artist }}</td>
              <td>{{ music.album || '-' }}</td>
              <td>{{ music.year || '-' }}</td>
              <td>{{ music.genre || '-' }}</td>
              <td>{{ formatDate(music.created_at) }}</td>
              <td v-if="isAdmin" class="actions-cell">
                <div class="actions-buttons">
                  <button 
                    class="btn btn-sm btn-outline-primary" 
                    @click="editMusic(music)"
                  >
                    Edytuj
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    @click="confirmDelete(music)"
                  >
                    Usuń
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-container">
        <p>Nie znaleziono utworów.</p>
        <p v-if="searchQuery || selectedGenre" class="text-muted">
          Spróbuj zmienić kryteria wyszukiwania.
        </p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || editingMusic" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingMusic ? 'Edytuj utwór' : 'Dodaj nowy utwór' }}</h2>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveMusic">
            <div class="mb-3">
              <label class="form-label">Tytuł *</label>
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
              <label class="form-label">Artysta *</label>
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
              <label class="form-label">Rok</label>
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
              <label class="form-label">Gatunek</label>
              <input
                v-model="formData.genre"
                type="text"
                class="form-control"
                list="genres-list"
              />
              <datalist id="genres-list">
                <option v-for="genre in availableGenres" :key="genre" :value="genre" />
              </datalist>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="closeModal">
                Anuluj
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Zapisywanie...' : 'Zapisz' }}
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
import apiClient from '../config/axios'

interface Music {
  id: string
  title: string
  artist: string
  album: string | null
  year: number | null
  genre: string
  created_at: string
}

interface FormData {
  title: string
  artist: string
  album: string
  year: number | null
  genre: string
}

interface FormErrors {
  title?: string
  artist?: string
  year?: string
}

export default defineComponent({
  name: 'MusicListView',
  data() {
    return {
      musicList: [] as Music[],
      filteredMusicList: [] as Music[],
      loading: true,
      error: null as string | null,
      searchQuery: '',
      selectedGenre: '',
      showAddForm: false,
      editingMusic: null as Music | null,
      formData: {
        title: '',
        artist: '',
        album: '',
        year: null as number | null,
        genre: '',
      } as FormData,
      formErrors: {} as FormErrors,
      saving: false,
      user: null as { role?: string } | null,
    }
  },
  computed: {
    isAdmin(): boolean {
      return this.user?.role === 'ADMIN' || this.user?.role === 'EDITOR'
    },
    availableGenres(): string[] {
      const genres = new Set<string>()
      this.musicList.forEach(music => {
        if (music.genre) {
          genres.add(music.genre)
        }
      })
      return Array.from(genres).sort()
    }
  },
  methods: {
    async fetchMusic() {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.get<Music[]>('/music')
        this.musicList = response.data
        this.filteredMusicList = response.data
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się załadować muzyki'
          console.error('Error fetching music:', err)
        }
      } finally {
        this.loading = false
      }
    },
    filterMusic() {
      let filtered = [...this.musicList]

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(
          music =>
            music.title.toLowerCase().includes(query) ||
            music.artist.toLowerCase().includes(query)
        )
      }

      if (this.selectedGenre) {
        filtered = filtered.filter(music => music.genre === this.selectedGenre)
      }

      this.filteredMusicList = filtered
    },
    clearFilters() {
      this.searchQuery = ''
      this.selectedGenre = ''
      this.filteredMusicList = [...this.musicList]
    },
    editMusic(music: Music) {
      this.editingMusic = music
      this.formData = {
        title: music.title,
        artist: music.artist,
        album: music.album || '',
        year: music.year,
        genre: music.genre || '',
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
      }
      this.formErrors = {}
    },
    validateForm(): boolean {
      this.formErrors = {}

      if (!this.formData.title.trim()) {
        this.formErrors.title = 'Tytuł jest wymagany'
      }

      if (!this.formData.artist.trim()) {
        this.formErrors.artist = 'Artysta jest wymagany'
      }

      if (this.formData.year !== null && this.formData.year !== undefined) {
        const currentYear = new Date().getFullYear()
        if (this.formData.year < 1900 || this.formData.year > currentYear + 1) {
          this.formErrors.year = `Rok musi być między 1900 a ${currentYear + 1}`
        }
      }

      return Object.keys(this.formErrors).length === 0
    },
    async saveMusic() {
      if (!this.validateForm()) {
        return
      }

      this.saving = true
      this.error = null

      try {
        const payload = {
          title: this.formData.title.trim(),
          artist: this.formData.artist.trim(),
          album: this.formData.album.trim() || null,
          year: this.formData.year || null,
          genre: this.formData.genre.trim() || null,
        }

        if (this.editingMusic) {
          await apiClient.put(`/music/${this.editingMusic.id}`, payload)
        } else {
          await apiClient.post('/music', payload)
        }

        this.closeModal()
        await this.fetchMusic()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Brak uprawnień do wykonania tej operacji'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się zapisać utworu'
          console.error('Error saving music:', err)
        }
      } finally {
        this.saving = false
      }
    },
    confirmDelete(music: Music) {
      if (confirm(`Czy na pewno chcesz usunąć utwór "${music.title}"?`)) {
        this.deleteMusic(music)
      }
    },
    async deleteMusic(music: Music) {
      this.error = null

      try {
        await apiClient.delete(`/music/${music.id}`)
        await this.fetchMusic()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Brak uprawnień do wykonania tej operacji'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się usunąć utworu'
          console.error('Error deleting music:', err)
        }
      }
    },
    formatDate(dateString: string): string {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
    checkUserRole() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          this.user = JSON.parse(userStr)
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
  },
  mounted() {
    this.checkUserRole()
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

.table td {
  padding: 1rem;
  border-bottom: 1px solid var(--bs-border-color);
  color: var(--text-color);
}

.table tbody tr:hover {
  background-color: var(--bs-border-color);
  opacity: 0.5;
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
</style>
