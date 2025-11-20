<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const onSubmit = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Podaj adres e-mail.'
    return
  }

  loading.value = true

  try {
    const response = await fetch('http://localhost:3001/auth/request-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.value }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      errorMessage.value = data.message || 'Wystąpił błąd podczas wysyłania żądania.'
    } else {
      const data = await response.json()
      successMessage.value =
        data.message || 'Jeśli konto istnieje, wysłaliśmy link do resetu hasła.'
      email.value = ''
    }
  } catch (err) {
    errorMessage.value = 'Nie udało się połączyć z serwerem.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-md-4">
      <h1 class="mb-4 text-center">Reset hasła</h1>

      <form @submit.prevent="onSubmit">
        <div class="mb-3">
          <label class="form-label">Adres e-mail</label>
          <input
            v-model="email"
            type="email"
            class="form-control"
            required
          />
        </div>

        <button type="submit" class="btn btn-success w-100" :disabled="loading">
          <span v-if="loading">Wysyłanie...</span>
          <span v-else>Wyślij link resetujący</span>
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
