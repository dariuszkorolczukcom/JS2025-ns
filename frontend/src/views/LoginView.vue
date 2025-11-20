<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-lg-4 offset-lg-4 col-md-6 offset-md-3">
        <div class="card login-card">
          <div class="card-header text-center py-4">
            <h3 class="mb-0 login-title">
              Access
            </h3>
          </div>
          <div class="card-body">

            <div v-if="serverError" class="alert alert-danger rounded-0 mb-4">
              {{ serverError }}
            </div>

            <form @submit.prevent="handleSubmit">

              <div class="mb-4">
                <label for="email" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  v-model="form.email"
                  :class="{ 'is-invalid': errors.email }"
                />
                <div class="invalid-feedback">{{ errors.email }}</div>
              </div>

              <div class="mb-4">
                <label for="password" class="form-label">Password</label>
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  v-model="form.password"
                  :class="{ 'is-invalid': errors.password }"
                />
                <div class="invalid-feedback">{{ errors.password }}</div>
              </div>

              <div class="d-flex justify-content-end mb-4">
                <button
                  type="button"
                  class="btn btn-link p-0 text-decoration-none small-link"
                  @click="handleForgotPassword">
                  FORGOT PASSWORD?
                </button>
              </div>

              <div class="d-grid">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {{ loading ? "PROCESSING..." : "ENTER" }}
                </button>
              </div>
            </form>

            <div class="mt-5 text-center border-top pt-4">
              <span class="text-muted small me-2">NO ACCOUNT?</span>
              <router-link to="/" class="btn btn-outline-primary btn-sm">REGISTER</router-link>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import axios from 'axios'

interface FormErrors {
  email?: string
  password?: string
}

export default defineComponent({
  name: 'Login',
  data() {
    return {
      form: {
        email: '',
        password: '',
      },
      errors: {} as FormErrors,
      serverError: null as string | null,
      loading: false,
    }
  },
  methods: {
    validateForm(): boolean {
      const errors: FormErrors = {}
      if (!this.form.email) errors.email = 'REQUIRED'
      if (!this.form.password) errors.password = 'REQUIRED'
      this.errors = errors
      return Object.keys(errors).length === 0
    },

    async handleSubmit() {
      this.serverError = null
      if (!this.validateForm()) {
        return
      }
      this.loading = true

      try {
        const authResponse = await axios.post(
          'http://localhost/api/auth/login',
          this.form
        )

        const { token } = authResponse.data
        localStorage.setItem('token', token)

        const profileResponse = await axios.get(
          'http://localhost/api/auth/profile',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const user = profileResponse.data
        localStorage.setItem('user', JSON.stringify(user))

        window.location.href = '/'
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          this.serverError =
            error.response.data.msg || 'LOGIN FAILED'
        } else {
          this.serverError =
            'CONNECTION ERROR'
          console.error(error)
        }

        localStorage.removeItem('token')
      } finally {
        this.loading = false
      }
    },
    async handleForgotPassword() {
    const email = window.prompt(
      'ENTER EMAIL FOR PASSWORD RESET:'
    )

    if (!email) {
      return
    }

    try {
      const response = await axios.post(
        'http://localhost:3001/auth/request-password-reset',
        { email }
      )

      alert(response.data.message)
    } catch (error) {
      console.error(error)
      alert('ERROR SENDING RESET REQUEST')
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

.small-link {
  font-size: 0.7rem;
  letter-spacing: 1px;
  font-weight: 600;
  color: var(--text-color);
}

.small-link:hover {
  text-decoration: underline !important;
}
</style>
