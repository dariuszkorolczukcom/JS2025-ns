<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-lg-4 offset-lg-4 col-md-6 offset-md-3">
        <div class="card login-card">
          <div class="card-header text-center py-4">
            <h3 class="mb-0 login-title">
              Register
            </h3>
          </div>
          <div class="card-body">

            <div v-if="serverError" class="alert alert-danger rounded-0 mb-4">
              {{ serverError }}
            </div>

            <div v-if="successMessage" class="alert alert-success rounded-0 mb-4">
              {{ successMessage }}
            </div>

            <form @submit.prevent="handleSubmit">

              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input
                  type="text"
                  class="form-control"
                  id="username"
                  v-model="form.username"
                  :class="{ 'is-invalid': errors.username }"
                  placeholder="Enter username"
                />
                <div class="invalid-feedback">{{ errors.username }}</div>
              </div>

              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  v-model="form.email"
                  :class="{ 'is-invalid': errors.email }"
                  placeholder="Enter email"
                />
                <div class="invalid-feedback">{{ errors.email }}</div>
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  v-model="form.password"
                  :class="{ 'is-invalid': errors.password }"
                  placeholder="Enter password (min. 6 characters)"
                />
                <div class="invalid-feedback">{{ errors.password }}</div>
              </div>

              <div class="mb-3">
                <label for="confirmPassword" class="form-label">Confirm Password</label>
                <input
                  type="password"
                  class="form-control"
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  :class="{ 'is-invalid': errors.confirmPassword }"
                  placeholder="Confirm password"
                />
                <div class="invalid-feedback">{{ errors.confirmPassword }}</div>
              </div>

              <div class="mb-3">
                <label for="firstName" class="form-label">First Name (Optional)</label>
                <input
                  type="text"
                  class="form-control"
                  id="firstName"
                  v-model="form.first_name"
                  placeholder="Enter first name"
                />
              </div>

              <div class="mb-4">
                <label for="lastName" class="form-label">Last Name (Optional)</label>
                <input
                  type="text"
                  class="form-control"
                  id="lastName"
                  v-model="form.last_name"
                  placeholder="Enter last name"
                />
              </div>

              <div class="d-grid">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {{ loading ? "PROCESSING..." : "REGISTER" }}
                </button>
              </div>
            </form>

            <div class="mt-5 text-center border-top pt-4">
              <span class="text-muted small me-2">ALREADY HAVE AN ACCOUNT?</span>
              <router-link to="/login" class="btn btn-outline-primary btn-sm">LOGIN</router-link>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import apiClient from '../config/axios'

interface FormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default defineComponent({
  name: 'SignUp',
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
      },
      errors: {} as FormErrors,
      serverError: null as string | null,
      successMessage: null as string | null,
      loading: false,
    }
  },
  methods: {
    validateForm(): boolean {
      const errors: FormErrors = {}
      
      if (!this.form.username) {
        errors.username = 'Username is required'
      } else if (this.form.username.length < 3) {
        errors.username = 'Username must be at least 3 characters'
      }

      if (!this.form.email) {
        errors.email = 'Email is required'
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(this.form.email)) {
          errors.email = 'Invalid email format'
        }
      }

      if (!this.form.password) {
        errors.password = 'Password is required'
      } else if (this.form.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
      }

      if (!this.form.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (this.form.password !== this.form.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }

      this.errors = errors
      return Object.keys(errors).length === 0
    },

    async handleSubmit() {
      this.serverError = null
      this.successMessage = null
      
      if (!this.validateForm()) {
        return
      }

      this.loading = true

      try {
        // Przygotowanie danych do wysłania (bez confirmPassword)
        const { confirmPassword, ...registerData } = this.form

        const response = await apiClient.post('/auth/register', registerData)

        const { token, user } = response.data

        // Zapisanie tokenu i danych użytkownika
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        this.successMessage = 'Registration successful! Redirecting...'

        // Przekierowanie po 1 sekundzie
        setTimeout(() => {
          this.$router.push('/')
        }, 1000)
      } catch (error: any) {
        if (error.response) {
          this.serverError = error.response.data.msg || error.response.data.error || 'Registration failed'
        } else {
          this.serverError = 'Connection error. Please try again.'
          console.error(error)
        }
      } finally {
        this.loading = false
      }
    },
  },
})
</script>

<style scoped>
.login-card {
  border: 1px solid var(--bs-border-color);
  background-color: transparent;
}

.card-header {
  background-color: transparent;
  border-bottom: 1px solid var(--bs-border-color);
}

.login-title {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 1.2rem;
}

.form-label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 1px;
  font-weight: 600;
}

.btn-outline-primary {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 1px;
  font-weight: 600;
}
</style>

