<script setup lang="ts">
import { ref, onMounted } from 'vue'
import WalkmanLogo from './WalkmanLogo.vue'

defineProps<{
  isLoggedIn: boolean
}>()

defineEmits(['logout'])

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  updateTheme()
}

const updateTheme = () => {
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  updateTheme()
})
</script>

<template>
  <nav class="navbar navbar-expand-lg sticky-top">
    <div class="container-fluid px-4">
      <!-- Logo Section -->
      <router-link class="navbar-brand d-flex align-items-center gap-3" to="/">
        <WalkmanLogo />
        <span class="brand-text">MusicWeb</span>
      </router-link>

      <!-- Mobile Toggle -->
      <div class="d-flex align-items-center gap-3 d-lg-none">
        <button class="btn btn-link theme-toggle" @click="toggleTheme">
          {{ isDark ? 'LIGHT' : 'DARK' }}
        </button>
        <button
          class="navbar-toggler border-0 p-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon-custom">MENU</span>
        </button>
      </div>

      <!-- Desktop Links -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto align-items-center gap-4">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/about">About</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/music">Music</router-link>
          </li>
          
          <li class="nav-item d-none d-lg-block">
            <button class="btn btn-link nav-link theme-toggle" @click="toggleTheme">
              {{ isDark ? 'LIGHT' : 'DARK' }}
            </button>
          </li>

          <template v-if="!isLoggedIn">
            <li class="nav-item ms-lg-4">
              <router-link to="/login" class="btn btn-outline-primary btn-sm">Login</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/" class="btn btn-primary btn-sm">Sign up</router-link>
            </li>
          </template>

          <template v-if="isLoggedIn">
            <li class="nav-item ms-lg-4">
              <button class="btn btn-outline-danger btn-sm" @click="$emit('logout')">
                Logout
              </button>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: var(--navbar-bg);
  border-bottom: 1px solid var(--navbar-border);
  padding: 1rem 0;
  transition: all 0.3s ease;
}

.brand-text {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1rem;
  color: var(--primary-color);
}

.nav-link {
  color: var(--text-color) !important;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 2px;
  font-weight: 400;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 1px;
  bottom: 0;
  left: 0;
  background-color: var(--primary-color);
  transition: width 0.3s;
}

.nav-link:hover::after,
.router-link-active::after {
  width: 100%;
}

.theme-toggle {
  font-size: 0.7rem;
  text-decoration: none;
  cursor: pointer;
  color: var(--text-color);
  border: 1px solid var(--text-color);
  padding: 2px 8px;
}

.navbar-toggler-icon-custom {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--text-color);
}
</style>
