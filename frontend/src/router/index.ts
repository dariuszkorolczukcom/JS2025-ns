import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import MusicListView from '../views/MusicListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/music',
      name: 'music',
      component: MusicListView,
      meta: { requiresAuth: true },
    },
  ],
})


router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token')
  const guestRoutes = ['/login']

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } 
  // Check if route requires guest (not logged in)
  else if (to.meta.requiresGuest && isLoggedIn) {
    next({ path: '/' })
  }
  // Redirect logged-in users away from guest routes
  else if (isLoggedIn && guestRoutes.includes(to.path)) {
    next({ path: '/' })
  } 
  else {
    next()
  }
})

export default router
