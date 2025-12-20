<template>
  <main>
    <!-- Hero Section -->
    <section class="hero-section mb-5">
      <div class="hero-content text-center">
        <h1 class="display-4 mb-4">MusicWeb</h1>
        <p class="lead mb-4">
          Twoja biblioteka muzyczna w jednym miejscu. Odkrywaj, oceniaj i dziel się muzyką.
        </p>
        <router-link to="/music" class="btn btn-primary btn-lg">
          Przejdź do biblioteki
        </router-link>
      </div>
    </section>

    <!-- Recently Added Music -->
    <section class="recent-music-section">
      <h2 class="section-title mb-4">Ostatnio dodane utwory</h2>
      
      <div v-if="loading" class="loading-container">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      
      <div v-else-if="error" class="error-container">
        <p class="text-danger">{{ error }}</p>
      </div>
      
      <div v-else-if="recentMusic.length > 0" class="music-grid">
        <div 
          v-for="music in recentMusic" 
          :key="music.id" 
          class="music-card clickable-card"
          @click="goToMusicDetails(music.id)"
        >
          <div class="music-card-body">
            <h3 class="music-title">{{ music.title }}</h3>
            <p class="music-artist">{{ music.artist }}</p>
            <div class="music-meta">
              <span v-if="music.album" class="meta-item">{{ music.album }}</span>
              <span v-if="music.year" class="meta-item">{{ music.year }}</span>
              <span v-if="music.genre" class="meta-item">{{ music.genre }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>Brak utworów w bibliotece.</p>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section mt-5">
      <h2 class="section-title mb-4">Funkcje</h2>
      <div class="features-grid">
        <div class="feature-item">
          <h3>Biblioteka muzyczna</h3>
          <p>Zarządzaj swoją kolekcją utworów, albumów i artystów.</p>
        </div>
        <div class="feature-item">
          <h3>Oceny i opinie</h3>
          <p>Oceniaj utwory i dziel się swoimi opiniami z innymi.</p>
        </div>
        <div class="feature-item">
          <h3>Wyszukiwarka</h3>
          <p>Szybko znajdź ulubione utwory i artystów.</p>
        </div>
      </div>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { musicService, type Music } from '../services/musicService'

export default defineComponent({
  name: 'HomeView',
  data() {
    return {
      recentMusic: [] as Music[],
      loading: true,
      error: null as string | null,
    }
  },
  methods: {
    async fetchRecentMusic() {
      this.loading = true
      this.error = null
      
      try {
        const response = await musicService.fetchMusic({
          page: 1,
          limit: 6,
          sortBy: 'created_at',
          sortOrder: 'desc'
        })
        this.recentMusic = response.data
      } catch (err: any) {
        if (err.response?.status === 401) {
          // Not logged in - that's ok for home page
          this.recentMusic = []
        } else {
          this.error = 'Nie udało się załadować utworów'
          console.error('Error fetching music:', err)
        }
      } finally {
        this.loading = false
      }
    },
    goToMusicDetails(musicId: string) {
      this.$router.push(`/music/${musicId}`)
    }
  },
  mounted() {
    this.fetchRecentMusic()
  }
})
</script>

<style scoped>
.hero-section {
  padding: 4rem 0;
  border-bottom: 2px solid var(--bs-border-color);
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.display-4 {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.lead {
  font-size: 1.25rem;
  line-height: 1.6;
}

.section-title {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--bs-border-color);
  padding-bottom: 0.5rem;
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  text-align: center;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.25em;
  border-color: var(--primary-color);
  border-right-color: transparent;
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.music-card {
  border: 1px solid var(--bs-border-color);
  transition: all 0.2s ease;
}

.music-card.clickable-card {
  cursor: pointer;
}

.music-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.music-card-body {
  padding: 1.5rem;
}

.music-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.music-artist {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--secondary-color);
}

.music-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.meta-item {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--bs-border-color);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.features-section {
  padding-top: 3rem;
  border-top: 2px solid var(--bs-border-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-item {
  padding: 1.5rem;
  border: 1px solid var(--bs-border-color);
}

.feature-item h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.feature-item p {
  margin: 0;
  line-height: 1.6;
  color: var(--secondary-color);
}
</style>
