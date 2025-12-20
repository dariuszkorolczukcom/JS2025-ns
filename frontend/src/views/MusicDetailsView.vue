<template>
  <main>
    <div v-if="loading" class="loading-container">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Ładowanie szczegółów utworu...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="alert alert-danger" role="alert">
        <h4>Błąd ładowania</h4>
        <p>{{ error }}</p>
        <button class="btn btn-outline-primary mt-2" @click="fetchMusicDetails">Spróbuj ponownie</button>
      </div>
    </div>

    <div v-else-if="music" class="music-details-container">
      <!-- Music Info -->
      <section class="music-info-section mb-5">
        <h1 class="music-title">{{ music.title }}</h1>
        <div class="music-meta">
          <p><strong>Artysta:</strong> {{ music.artist }}</p>
          <p v-if="music.album"><strong>Album:</strong> {{ music.album }}</p>
          <p v-if="music.year"><strong>Rok:</strong> {{ music.year }}</p>
          <p v-if="music.genre"><strong>Gatunek:</strong> {{ music.genre }}</p>
          <p><strong>Data dodania:</strong> {{ formatDate(music.created_at) }}</p>
        </div>
      </section>

      <!-- Lyrics Section -->
      <section v-if="music.lyrics" class="lyrics-section mb-5">
        <h2 class="section-title">Tekst utworu</h2>
        <div class="lyrics-content">
          <p :class="{ 'collapsed-lyrics': !showFullLyrics }">{{ music.lyrics }}</p>
          <button 
            v-if="music.lyrics.split('\n').length > 3" 
            @click="toggleLyrics" 
            class="btn btn-link"
          >
            {{ showFullLyrics ? 'Pokaż mniej' : 'Pokaż więcej' }}
          </button>
        </div>
      </section>

      <!-- Ratings Section -->
      <section class="ratings-section mb-5">
        <h2 class="section-title">Oceny</h2>
        <div class="ratings-display">
          <div v-if="reviewsData.reviewCount > 0" class="rating-info">
            <StarRating 
              :rating="reviewsData.averageRating" 
              :max="5" 
              :readonly="true"
              :show-value="false"
            />
            <p class="review-count">
              Średnia ocena: <strong>{{ reviewsData.averageRating.toFixed(1) }}</strong> / 5.0 
              ({{ reviewsData.reviewCount }} {{ reviewsData.reviewCount === 1 ? 'opinia' : 'opinii' }})
            </p>
          </div>
          <div v-else class="no-reviews">
            <p>Brak opinii. Bądź pierwszy!</p>
          </div>
        </div>
      </section>

      <!-- Add Review Section (only for logged in users) -->
      <section v-if="isLoggedIn" class="add-review-section mb-5">
        <h2 class="section-title">Dodaj opinię</h2>
        <form @submit.prevent="submitReview" class="review-form">
          <div class="mb-3">
            <label class="form-label">Ocena *</label>
            <div class="star-rating-input">
              <StarRating 
                :rating="reviewForm.rating || 0" 
                :max="5" 
                :readonly="false"
                @rating-selected="reviewForm.rating = $event"
              />
              <span v-if="reviewForm.rating" class="rating-selected-text">
                Wybrano: {{ reviewForm.rating }} / 5
              </span>
              <span v-else class="rating-hint">Kliknij gwiazdkę, aby wybrać ocenę</span>
            </div>
            <div v-if="reviewErrors.rating" class="invalid-feedback">
              {{ reviewErrors.rating }}
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Tytuł opinii (opcjonalny)</label>
            <input
              v-model="reviewForm.title"
              type="text"
              class="form-control"
              placeholder="Krótki tytuł..."
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Komentarz</label>
            <textarea
              v-model="reviewForm.comment"
              class="form-control"
              rows="4"
              placeholder="Twoja opinia..."
            ></textarea>
          </div>

          <div class="form-errors" v-if="reviewSubmitError">
            <p class="text-danger">{{ reviewSubmitError }}</p>
          </div>

          <div class="form-footer">
            <button type="submit" class="btn btn-primary" :disabled="submittingReview">
              {{ submittingReview ? 'Dodawanie...' : 'Dodaj opinię' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Login Prompt for non-logged users -->
      <section v-else class="login-prompt-section mb-5">
        <div class="alert alert-info">
          <p>
            <router-link to="/login">Zaloguj się</router-link>, aby dodać opinię.
          </p>
        </div>
      </section>

      <!-- Reviews Section -->
      <section class="reviews-section mb-5">
        <h2 class="section-title">Opinie użytkowników</h2>
        
        <!-- Reviews List -->
        <div v-if="reviewsData.reviews.length > 0" class="reviews-list-container">
          <div 
            v-for="review in reviewsData.reviews" 
            :key="review.id"
            class="review-item"
          >
            <div class="review-header">
              <div class="review-user">
                <strong>{{ review.username || 'Anonimowy' }}</strong>
                <span class="review-date">{{ formatDate(review.created_at) }}</span>
              </div>
              <div class="review-rating-actions">
                <StarRating :rating="review.rating" :max="5" :readonly="true" />
                <button 
                  v-if="isAdmin" 
                  class="btn btn-sm btn-outline-danger delete-review-btn"
                  @click="confirmDeleteReview(review)"
                  title="Usuń opinię"
                >
                  Usuń
                </button>
              </div>
            </div>
            <div v-if="review.title" class="review-title">
              <strong>{{ review.title }}</strong>
            </div>
            <div v-if="review.comment" class="review-comment">
              {{ review.comment }}
            </div>
          </div>
        </div>
        
        <div v-else class="no-reviews">
          <p>Brak opinii. Dodaj pierwszą opinię!</p>
        </div>
      </section>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { musicService, type Music } from '../services/musicService'
import { reviewsService, type Review, type ReviewFormData } from '../services/reviewsService'
import StarRating from '../components/StarRating.vue'

interface ReviewsData {
  reviews: Review[]
  averageRating: number
  reviewCount: number
}

interface ReviewForm {
  rating: number | null
  title: string
  comment: string
}

interface ReviewErrors {
  rating?: string
}

export default defineComponent({
  name: 'MusicDetailsView',
  components: {
    StarRating
  },
  data() {
    return {
      music: null as Music | null,
      reviewsData: {
        reviews: [] as Review[],
        averageRating: 0,
        reviewCount: 0
      } as ReviewsData,
      loading: true,
      error: null as string | null,
      isLyricsCollapsed: true,
      isLoggedIn: false,
      user: null as { id?: string; role?: string } | null,
      reviewForm: {
        rating: null as number | null,
        title: '',
        comment: ''
      } as ReviewForm,
      reviewErrors: {} as ReviewErrors,
      reviewSubmitError: null as string | null,
      submittingReview: false
    }
  },
  computed: {
    showFullLyrics(): boolean {
      return !this.isLyricsCollapsed
    },
    isAdmin(): boolean {
      return this.user && ((this.user as any).role === 'ADMIN' || (this.user as any).role === 'EDITOR')
    }
  },
  methods: {
    async fetchMusicDetails() {
      this.loading = true
      this.error = null

      try {
        const musicId = this.$route.params.id as string
        const [musicResponse, reviewsResponse] = await Promise.all([
          musicService.fetchMusicById(musicId),
          reviewsService.fetchReviewsByMusicId(musicId)
        ])

        this.music = musicResponse
        this.reviewsData = reviewsResponse
      } catch (err: any) {
        if (err.response?.status === 404) {
          this.error = 'Utwór nie został znaleziony'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się załadować szczegółów utworu'
          console.error('Error fetching music details:', err)
        }
      } finally {
        this.loading = false
      }
    },
    toggleLyrics() {
      this.isLyricsCollapsed = !this.isLyricsCollapsed
    },
    validateReviewForm(): boolean {
      this.reviewErrors = {}

      if (!this.reviewForm.rating || this.reviewForm.rating === 0) {
        this.reviewErrors.rating = 'Ocena jest wymagana (wybierz od 1 do 5 gwiazdek)'
      } else if (this.reviewForm.rating < 1 || this.reviewForm.rating > 5) {
        this.reviewErrors.rating = 'Ocena musi być między 1 a 5'
      }

      return Object.keys(this.reviewErrors).length === 0
    },
    async submitReview() {
      if (!this.validateReviewForm() || !this.user || !this.music) {
        return
      }

      this.submittingReview = true
      this.reviewSubmitError = null

      try {
        const formData: ReviewFormData = {
          rating: this.reviewForm.rating!,
          title: (this.reviewForm.title && this.reviewForm.title.trim()) || null,
          comment: (this.reviewForm.comment && this.reviewForm.comment.trim()) || null,
          musicId: this.music.id
        }

        await reviewsService.createReview(formData)

        // Reset form
        this.reviewForm = {
          rating: null,
          title: '',
          comment: ''
        }
        this.reviewErrors = {}

        // Refresh reviews
        await this.fetchMusicDetails()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.reviewSubmitError = 'Brak uprawnień do wykonania tej operacji'
        } else {
          this.reviewSubmitError = err.response?.data?.error || err.response?.data?.message || 'Nie udało się dodać opinii'
          console.error('Error submitting review:', err)
        }
      } finally {
        this.submittingReview = false
      }
    },
    confirmDeleteReview(review: Review) {
      if (confirm(`Czy na pewno chcesz usunąć opinię użytkownika "${review.username || 'Anonimowy'}"?`)) {
        this.deleteReview(review)
      }
    },
    async deleteReview(review: Review) {
      try {
        await reviewsService.deleteReview(review.id)
        // Refresh data after deletion
        await this.fetchMusicDetails()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          alert('Brak uprawnień do wykonania tej operacji')
        } else {
          alert(err.response?.data?.error || err.response?.data?.message || 'Nie udało się usunąć opinii')
          console.error('Error deleting review:', err)
        }
      }
    },
    formatDate(dateString: string): string {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    checkLoginStatus() {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      this.isLoggedIn = !!token
      
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
    this.checkLoginStatus()
    this.fetchMusicDetails()
  },
  watch: {
    '$route'() {
      this.fetchMusicDetails()
    }
  }
})
</script>

<style scoped>
.music-details-container {
  max-width: 1000px;
  margin: 0 auto;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.25em;
  border-color: var(--primary-color);
  border-right-color: transparent;
}

.music-info-section {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
}

.music-title {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.music-meta p {
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.section-title {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--bs-border-color);
  padding-bottom: 0.5rem;
}

.lyrics-section {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
}

.lyrics-content {
  margin-top: 1rem;
}

.collapsed-lyrics {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ratings-section {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
}

.rating-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

.review-count {
  margin: 0;
  font-size: 1.1rem;
}

.no-reviews {
  text-align: center;
  padding: 2rem;
  color: var(--secondary-color);
}

.reviews-section {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
}

.reviews-list-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
}

.reviews-list-container::-webkit-scrollbar {
  width: 8px;
}

.reviews-list-container::-webkit-scrollbar-track {
  background: var(--bs-border-color);
}

.reviews-list-container::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 4px;
}

.reviews-list-container::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
  opacity: 0.8;
}

.review-item {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
  background-color: transparent;
  min-height: 120px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.review-rating-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.delete-review-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

.review-user {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.review-user strong {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9rem;
}

.review-date {
  font-size: 0.85rem;
  color: var(--secondary-color);
}

.review-title {
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.review-comment {
  line-height: 1.6;
  white-space: pre-wrap;
}

.add-review-section {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
}

.review-form {
  margin-top: 1rem;
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

.form-errors {
  margin-bottom: 1rem;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
}

.login-prompt-section {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
}

.star-rating-input {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.rating-selected-text {
  font-size: 0.9rem;
  color: var(--text-color);
  font-weight: 500;
}

.rating-hint {
  font-size: 0.85rem;
  color: var(--secondary-color);
  font-style: italic;
}
</style>

