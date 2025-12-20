import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import SignUpView from '../views/SignUpView.vue'
import MusicListView from '../views/MusicListView.vue'
import MusicDetailsView from '../views/MusicDetailsView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ProfileView from '../views/ProfileView.vue'
import UsersView from '../views/UsersView.vue'

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
      path: '/signup',
      name: 'SignUp',
      component: SignUpView,
      meta: { requiresGuest: true },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPasswordView,
      meta: { requiresGuest: true },
    },
    {
      path: '/music',
      name: 'music',
      component: MusicListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/music/:id',
      name: 'music-details',
      component: MusicDetailsView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})


router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token')
  const guestRoutes = ['/login', '/signup', '/forgot-password']

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  // Check if route requires admin (users only)
  if ((to.path === '/users' || to.meta.requiresAdmin) && isLoggedIn) {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user?.role !== 'ADMIN') {
          next({ path: '/', query: { error: 'admin_required' } })
          return
        }
      } catch (e) {
        next({ path: '/login' })
        return
      }
    } else {
      next({ path: '/login' })
      return
    }
  }
  
  // Check if route requires guest (not logged in)
  // Allow access to signup/login if not logged in
  if (to.meta.requiresGuest && !isLoggedIn) {
    next()
    return
  }
  
  // Redirect logged-in users away from guest routes
  if (isLoggedIn && guestRoutes.includes(to.path)) {
    next({ path: '/' })
    return
  }
  
  // Default: allow navigation
  next()
})

export default router
