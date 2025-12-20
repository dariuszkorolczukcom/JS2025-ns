<template>
  <main>
    <div class="reviews-container">
      <div class="header-section mb-4">
        <h1>Opinie i oceny</h1>
        <button 
          v-if="isAdmin || canCreateReview" 
          class="btn btn-primary" 
          @click="showAddForm = true"
        >
          Dodaj opinię
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="filters-section mb-4">
        <div class="row g-3">
          <!-- Search -->
          <div class="col-md-3">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Szukaj w tytule lub komentarzu..."
              @input="debouncedFetchReviews"
            />
          </div>
          
          <!-- Rating Filter -->
          <div class="col-md-2">
            <select
              v-model="minRating"
              class="form-control"
              @change="resetPageAndFetch"
            >
              <option value="">Min. ocena</option>
              <option v-for="r in [1, 2, 3, 4, 5]" :key="r" :value="r">
                {{ r }}+
              </option>
            </select>
          </div>

          <div class="col-md-2">
            <select
              v-model="maxRating"
              class="form-control"
              @change="resetPageAndFetch"
            >
              <option value="">Max. ocena</option>
              <option v-for="r in [1, 2, 3, 4, 5]" :key="r" :value="r">
                {{ r }}
              </option>
            </select>
          </div>

          <!-- Sort By -->
          <div class="col-md-2">
            <select
              v-model="sortBy"
              class="form-control"
              @change="fetchReviews"
            >
              <option value="created_at">Data dodania</option>
              <option value="rating">Ocena</option>
              <option value="title">Tytuł</option>
              <option value="updated_at">Data aktualizacji</option>
            </select>
          </div>

          <!-- Sort Order & Clear -->
          <div class="col-md-3 d-flex gap-2">
            <button 
                class="btn btn-outline-secondary" 
                @click="toggleSortOrder"
                title="Zmień kierunek sortowania"
            >
              <span v-if="sortOrder === 'asc'">↑</span>
              <span v-else>↓</span>
            </button>
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
        <p class="mt-3">Ładowanie opinii...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="alert alert-danger" role="alert">
          <h4>Błąd ładowania opinii</h4>
          <p>{{ error }}</p>
          <button class="btn btn-outline-primary mt-2" @click="fetchReviews">Spróbuj ponownie</button>
        </div>
      </div>

      <!-- Reviews List -->
      <div v-else-if="reviewsList.length > 0" class="reviews-list">
        <div 
          v-for="review in reviewsList" 
          :key="review.id" 
          class="review-card"
        >
          <div class="review-header">
            <div class="review-rating">
              <span class="rating-stars">
                <span v-for="i in 5" :key="i" :class="i <= review.rating ? 'star-filled' : 'star-empty'">
                  ★
                </span>
              </span>
              <span class="rating-value">{{ review.rating }}/5</span>
            </div>
            <div class="review-actions" v-if="isAdmin || (user && user.id === review.user_id)">
              <button 
                class="btn btn-sm btn-outline-primary" 
                @click="editReview(review)"
              >
                Edytuj
              </button>
              <button 
                class="btn btn-sm btn-outline-danger" 
                @click="confirmDelete(review)"
              >
                Usuń
              </button>
            </div>
          </div>
          
          <div v-if="review.title" class="review-title">
            <h3>{{ review.title }}</h3>
          </div>
          
          <div v-if="review.comment" class="review-comment">
            <p>{{ review.comment }}</p>
          </div>
          
          <div class="review-meta">
            <span class="meta-item">Utworzono: {{ formatDate(review.created_at) }}</span>
            <span v-if="review.updated_at && review.updated_at !== review.created_at" class="meta-item">
              Zaktualizowano: {{ formatDate(review.updated_at) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-container">
        <p>Nie znaleziono opinii.</p>
        <p v-if="searchQuery || minRating || maxRating" class="text-muted">
          Spróbuj zmienić kryteria wyszukiwania.
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1 && !loading" class="pagination-container mt-4">
        <nav aria-label="Page navigation">
          <ul class="pagination justify-content-center" style="display: flex; gap: 5px; list-style: none; padding: 0;">
            <li class="page-item" :class="{ disabled: page === 1 }">
              <button class="btn btn-outline-secondary" @click="changePage(page - 1)" :disabled="page === 1">
                Poprzednia
              </button>
            </li>
            
            <li class="page-item disabled">
              <span class="btn btn-outline-secondary disabled" style="border: none;">
                Strona {{ page }} z {{ totalPages }}
              </span>
            </li>
            
            <li class="page-item" :class="{ disabled: page === totalPages }">
              <button class="btn btn-outline-secondary" @click="changePage(page + 1)" :disabled="page === totalPages">
                Następna
              </button>
            </li>
          </ul>
        </nav>
        <div class="text-center text-muted mt-2">
          <small>Liczba wyników: {{ totalCount }}</small>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || editingReview" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingReview ? 'Edytuj opinię' : 'Dodaj nową opinię' }}</h2>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveReview">
            <div class="mb-3">
              <label class="form-label">Ocena (1-5) *</label>
              <select
                v-model.number="formData.rating"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.rating }"
              >
                <option value="">Wybierz ocenę</option>
                <option v-for="r in [1, 2, 3, 4, 5]" :key="r" :value="r">
                  {{ r }}
                </option>
              </select>
              <div v-if="formErrors.rating" class="invalid-feedback">
                {{ formErrors.rating }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Tytuł</label>
              <input
                v-model="formData.title"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': formErrors.title }"
              />
              <div v-if="formErrors.title" class="invalid-feedback">
                {{ formErrors.title }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Komentarz</label>
              <textarea
                v-model="formData.comment"
                class="form-control"
                rows="4"
                :class="{ 'is-invalid': formErrors.comment }"
              ></textarea>
              <div v-if="formErrors.comment" class="invalid-feedback">
                {{ formErrors.comment }}
              </div>
            </div>

            <div v-if="!editingReview" class="mb-3">
              <label class="form-label">Utwór muzyczny *</label>
              <select
                v-model="formData.musicId"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.musicId }"
              >
                <option value="">Wybierz utwór</option>
                <option v-for="music in availableMusic" :key="music.id" :value="music.id">
                  {{ music.artist }} - {{ music.title }} {{ music.album ? `(${music.album})` : '' }} {{ music.year ? `[${music.year}]` : '' }}
                </option>
              </select>
              <div v-if="formErrors.musicId" class="invalid-feedback">
                {{ formErrors.musicId }}
              </div>
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
import { reviewsService, type Review, type ReviewFormData } from '../services/reviewsService'
import { musicService, type Music } from '../services/musicService'
import { formatDate } from '../utils/dateUtils'
import { getUserFromStorage, isAdmin } from '../utils/userUtils'
import { validateReviewForm, type ReviewFormErrors } from '../validators/reviewValidators'
import { debounce } from '../utils/debounce'

export default defineComponent({
  name: 'ReviewsView',
  data() {
    return {
      reviewsList: [] as Review[],
      loading: true,
      error: null as string | null,
      
      // Filters & Pagination
      searchQuery: '',
      minRating: '',
      maxRating: '',
      sortBy: 'created_at',
      sortOrder: 'desc' as 'asc' | 'desc',
      page: 1,
      limit: 20,
      totalPages: 0,
      totalCount: 0,

      // Form
      showAddForm: false,
      editingReview: null as Review | null,
      formData: {
        rating: null as number | null,
        title: '',
        comment: '',
        musicId: '',
      } as ReviewFormData,
      formErrors: {} as ReviewFormErrors,
      saving: false,
      user: null as { id?: string; role?: string } | null,
      debouncedFetchReviewsFn: null as (() => void) | null,
      availableMusic: [] as Music[]
    }
  },
  computed: {
    isAdmin(): boolean {
      return isAdmin(this.user)
    },
    canCreateReview(): boolean {
      return !!this.user
    }
  },
  methods: {
    debouncedFetchReviews() {
      if (!this.debouncedFetchReviewsFn) {
        this.debouncedFetchReviewsFn = debounce(() => {
          this.page = 1
          this.fetchReviews()
        }, 300)
      }
      this.debouncedFetchReviewsFn()
    },
    resetPageAndFetch() {
      this.page = 1
      this.fetchReviews()
    },
    async fetchReviews() {
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
        if (this.minRating) params.minRating = parseInt(this.minRating)
        if (this.maxRating) params.maxRating = parseInt(this.maxRating)

        const response = await reviewsService.fetchReviews(params)
        
        this.reviewsList = response.data
        this.totalCount = response.totalCount
        this.totalPages = response.totalPages
        
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Brak uprawnień - dostęp do opinii mają tylko administratorzy'
          console.error('Error fetching reviews:', err)
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się załadować opinii'
          console.error('Error fetching reviews:', err)
        }
      } finally {
        this.loading = false
      }
    },
    changePage(newPage: number) {
      if (newPage >= 1 && newPage <= this.totalPages) {
        this.page = newPage
        this.fetchReviews()
      }
    },
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      this.fetchReviews()
    },
    clearFilters() {
      this.searchQuery = ''
      this.minRating = ''
      this.maxRating = ''
      this.sortBy = 'created_at'
      this.sortOrder = 'desc'
      this.page = 1
      this.fetchReviews()
    },
    editReview(review: Review) {
      this.editingReview = review
      this.formData = {
        rating: review.rating,
        title: review.title || '',
        comment: review.comment || '',
        musicId: review.music_id
      }
      this.formErrors = {}
    },
    closeModal() {
      this.showAddForm = false
      this.editingReview = null
      this.formData = {
        rating: null,
        title: '',
        comment: '',
        musicId: '',
      }
      this.formErrors = {}
    },
    validateForm(): boolean {
      this.formErrors = validateReviewForm(this.formData, !!this.editingReview)
      return Object.keys(this.formErrors).length === 0
    },
    async fetchMusic() {
      try {
        const response = await musicService.fetchMusic({
          limit: 1000,
          sortBy: 'artist',
          sortOrder: 'asc'
        })
        this.availableMusic = response.data
      } catch (err: any) {
        console.error('Error fetching music:', err)
      }
    },
    async saveReview() {
      if (!this.validateForm()) {
        return
      }

      this.saving = true
      this.error = null

      try {
        if (this.editingReview) {
          await reviewsService.updateReview(this.editingReview.id, this.formData)
        } else {
          await reviewsService.createReview(this.formData)
        }

        this.closeModal()
        await this.fetchReviews()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Brak uprawnień do wykonania tej operacji'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się zapisać opinii'
          console.error('Error saving review:', err)
        }
      } finally {
        this.saving = false
      }
    },
    confirmDelete(review: Review) {
      if (confirm(`Czy na pewno chcesz usunąć tę opinię?`)) {
        this.deleteReview(review)
      }
    },
    async deleteReview(review: Review) {
      this.error = null

      try {
        await reviewsService.deleteReview(review.id)
        await this.fetchReviews()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Brak uprawnień do wykonania tej operacji'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się usunąć opinii'
          console.error('Error deleting review:', err)
        }
      }
    },
    formatDate(dateString: string): string {
      return formatDate(dateString, true)
    },
    checkUserRole() {
      this.user = getUserFromStorage()
    }
  },
  mounted() {
    this.checkUserRole()
    this.fetchMusic()
    this.fetchReviews()
  }
})
</script>

<style scoped>
.reviews-container {
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

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-card {
  border: 1px solid var(--bs-border-color);
  padding: 1.5rem;
  background-color: transparent;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-stars {
  font-size: 1.2rem;
  color: var(--primary-color);
}

.star-filled {
  color: var(--primary-color);
}

.star-empty {
  color: var(--bs-border-color);
  opacity: 0.3;
}

.rating-value {
  font-weight: 600;
  font-size: 0.9rem;
}

.review-actions {
  display: flex;
  gap: 0.5rem;
}

.review-title h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.review-comment {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.review-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--secondary-color);
}

.meta-item {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
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
