<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <Navbar :isLoggedIn="isLoggedIn" @logout="logout" />
    
    <main class="flex-fill container my-4">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

export default defineComponent({
  name: 'App',
  components: { Navbar, Footer },

  data() {
    return {
      isLoggedIn: false,
      user: null as { [key: string]: any } | null,
    }
  },

  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (token && user) {
        this.isLoggedIn = true
        this.user = JSON.parse(user)
      } else {
        this.isLoggedIn = false
        this.user = null
      }
    },

    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      this.isLoggedIn = false
      this.user = null

      
      this.$router.push('/')
    },

  },

  mounted() {
    this.checkLoginStatus()
  },

  watch: {
    '$route'() {
      this.checkLoginStatus()
    },
  },
})
</script>
