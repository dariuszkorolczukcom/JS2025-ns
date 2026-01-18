<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '../services/authService'

const email = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const onSubmit = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Please provide an email address.'
    return
  }

  loading.value = true

  try {
    const response = await authService.requestPasswordReset(email.value)
    successMessage.value = response.message || 'If the account exists, we have sent a password reset link.'
    email.value = ''
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || err.response?.data?.error || 'Failed to connect to server.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-md-4">
      <h1 class="mb-4 text-center">Password Reset</h1>

      <form @submit.prevent="onSubmit">
        <div class="mb-3">
          <label class="form-label">Email Address</label>
          <input
            v-model="email"
            type="email"
            class="form-control"
            required
          />
        </div>

        <button type="submit" class="btn btn-success w-100" :disabled="loading">
          <span v-if="loading">Sending...</span>
          <span v-else>Send Reset Link</span>
        </button>
      </form>

      <p v-if="successMessage" class="mt-3 text-success">
        {{ successMessage }}
      </p>

      <p v-if="errorMessage" class="mt-3 text-danger">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
