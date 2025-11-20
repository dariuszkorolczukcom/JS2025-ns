import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'

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
    },
  ],
})


router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token')
  const guestRoutes = ['/login']

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login' })
  } 
  else if (isLoggedIn && guestRoutes.includes(to.path)) {
    next({ path: '/' })
  } 
  else {
    next()
  }
})

export default router
