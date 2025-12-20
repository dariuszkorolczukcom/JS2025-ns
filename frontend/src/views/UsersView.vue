<template>
  <main>
    <div class="users-container">
      <div class="header-section mb-4">
        <h1>Zarządzanie użytkownikami</h1>
        <button 
          class="btn btn-primary" 
          @click="showAddForm = true"
        >
          Dodaj użytkownika
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="filters-section mb-4">
        <div class="row g-3">
          <!-- Search -->
          <div class="col-md-4">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Szukaj po username, email..."
              @input="debouncedFetchUsers"
            />
          </div>
          
          <!-- Role Filter -->
          <div class="col-md-2">
            <select
              v-model="selectedRole"
              class="form-control"
              @change="resetPageAndFetch"
            >
              <option value="">Wszystkie role</option>
              <option value="ADMIN">Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="USER">User</option>
            </select>
          </div>

          <!-- Sort By -->
          <div class="col-md-2">
            <select
              v-model="sortBy"
              class="form-control"
              @change="fetchUsers"
            >
              <option value="created_at">Data utworzenia</option>
              <option value="username">Username</option>
              <option value="email">Email</option>
              <option value="role">Rola</option>
            </select>
          </div>

          <!-- Sort Order & Clear -->
          <div class="col-md-4 d-flex gap-2">
            <button 
                class="btn btn-outline-secondary" 
                @click="toggleSortOrder"
                title="Zmień kierunek sortowania"
            >
              <span v-if="sortOrder === 'asc'">↑</span>
              <span v-else>↓</span>
            </button>
            <button class="btn btn-outline-primary w-100" @click="clearFilters">
              Wyczyść
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Ładowanie użytkowników...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="alert alert-danger" role="alert">
          <h4>Błąd ładowania użytkowników</h4>
          <p>{{ error }}</p>
          <button class="btn btn-outline-primary mt-2" @click="fetchUsers">Spróbuj ponownie</button>
        </div>
      </div>

      <!-- Users List -->
      <div v-else-if="usersList.length > 0" class="users-table-container">
        <table class="table">
          <thead>
            <tr>
              <th @click="setSort('username')" class="cursor-pointer">Username</th>
              <th @click="setSort('email')" class="cursor-pointer">Email</th>
              <th>Imię</th>
              <th>Nazwisko</th>
              <th @click="setSort('role')" class="cursor-pointer">Rola</th>
              <th @click="setSort('created_at')" class="cursor-pointer">Utworzono</th>
              <th class="actions-column">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in usersList" :key="user.id">
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.first_name || '-' }}</td>
              <td>{{ user.last_name || '-' }}</td>
              <td>
                <span class="badge" :class="getRoleBadgeClass(user.role)">
                  {{ user.role }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td class="actions-cell">
                <div class="actions-buttons">
                  <button 
                    class="btn btn-sm btn-outline-primary" 
                    @click="editUser(user)"
                  >
                    Edytuj
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    @click="confirmDelete(user)"
                    :disabled="user.id === currentUserId"
                  >
                    Usuń
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-container">
        <p>Nie znaleziono użytkowników.</p>
        <p v-if="searchQuery || selectedRole" class="text-muted">
          Spróbuj zmienić kryteria wyszukiwania.
        </p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddForm || editingUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingUser ? 'Edytuj użytkownika' : 'Dodaj nowego użytkownika' }}</h2>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUser">
            <div class="mb-3">
              <label class="form-label">Username *</label>
              <input
                v-model="formData.username"
                type="text"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.username }"
              />
              <div v-if="formErrors.username" class="invalid-feedback">
                {{ formErrors.username }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Email *</label>
              <input
                v-model="formData.email"
                type="email"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.email }"
              />
              <div v-if="formErrors.email" class="invalid-feedback">
                {{ formErrors.email }}
              </div>
            </div>

            <div v-if="!editingUser" class="mb-3">
              <label class="form-label">Hasło *</label>
              <input
                v-model="formData.password"
                type="password"
                class="form-control"
                required
                minlength="6"
                :class="{ 'is-invalid': formErrors.password }"
              />
              <div v-if="formErrors.password" class="invalid-feedback">
                {{ formErrors.password }}
              </div>
              <small class="form-text text-muted">Minimum 6 znaków</small>
            </div>

            <div class="mb-3">
              <label class="form-label">Imię</label>
              <input
                v-model="formData.first_name"
                type="text"
                class="form-control"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Nazwisko</label>
              <input
                v-model="formData.last_name"
                type="text"
                class="form-control"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Rola *</label>
              <select
                v-model="formData.role"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.role }"
              >
                <option value="USER">User</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div v-if="formErrors.role" class="invalid-feedback">
                {{ formErrors.role }}
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="closeModal">
                Anuluj
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Zapisywanie...' : 'Zapisz' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import apiClient from '../config/axios'

interface User {
  id: string
  email: string
  username: string
  first_name: string | null
  last_name: string | null
  role: string
  created_at: string
}

interface FormData {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  role: string
}

interface FormErrors {
  username?: string
  email?: string
  password?: string
  role?: string
}

export default defineComponent({
  name: 'UsersView',
  data() {
    return {
      usersList: [] as User[],
      loading: true,
      error: null as string | null,
      
      // Filters & Pagination
      searchQuery: '',
      selectedRole: '',
      sortBy: 'created_at',
      sortOrder: 'desc' as 'asc' | 'desc',

      // Form
      showAddForm: false,
      editingUser: null as User | null,
      formData: {
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'USER',
      } as FormData,
      formErrors: {} as FormErrors,
      saving: false,
      currentUserId: null as string | null,
      
      // Utilities
      debounceTimer: null as any
    }
  },
  methods: {
    debouncedFetchUsers() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.fetchUsers()
      }, 300)
    },
    resetPageAndFetch() {
      this.fetchUsers()
    },
    async fetchUsers() {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.get<User[]>('/users')
        
        // Client-side filtering and sorting
        let filtered = [...response.data]

        // Search filter
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase()
          filtered = filtered.filter(user => 
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            (user.first_name && user.first_name.toLowerCase().includes(query)) ||
            (user.last_name && user.last_name.toLowerCase().includes(query))
          )
        }

        // Role filter
        if (this.selectedRole) {
          filtered = filtered.filter(user => user.role === this.selectedRole)
        }

        // Sort
        filtered.sort((a, b) => {
          const aVal = (a as any)[this.sortBy] || ''
          const bVal = (b as any)[this.sortBy] || ''
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
          return this.sortOrder === 'asc' ? comparison : -comparison
        })

        this.usersList = filtered
        
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Brak uprawnień - dostęp mają tylko administratorzy'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się załadować użytkowników'
          console.error('Error fetching users:', err)
        }
      } finally {
        this.loading = false
      }
    },
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      this.fetchUsers()
    },
    setSort(field: string) {
      if (this.sortBy === field) {
        this.toggleSortOrder()
      } else {
        this.sortBy = field
        this.sortOrder = 'asc'
        this.fetchUsers()
      }
    },
    clearFilters() {
      this.searchQuery = ''
      this.selectedRole = ''
      this.sortBy = 'created_at'
      this.sortOrder = 'desc'
      this.fetchUsers()
    },
    editUser(user: User) {
      this.editingUser = user
      this.formData = {
        username: user.username,
        email: user.email,
        password: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role,
      }
      this.formErrors = {}
    },
    closeModal() {
      this.showAddForm = false
      this.editingUser = null
      this.formData = {
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'USER',
      }
      this.formErrors = {}
    },
    validateForm(): boolean {
      this.formErrors = {}

      if (!this.formData.username.trim()) {
        this.formErrors.username = 'Username jest wymagany'
      } else if (this.formData.username.length < 3) {
        this.formErrors.username = 'Username musi mieć minimum 3 znaki'
      }

      if (!this.formData.email.trim()) {
        this.formErrors.email = 'Email jest wymagany'
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(this.formData.email)) {
          this.formErrors.email = 'Nieprawidłowy format email'
        }
      }

      if (!this.editingUser && !this.formData.password) {
        this.formErrors.password = 'Hasło jest wymagane'
      } else if (!this.editingUser && this.formData.password.length < 6) {
        this.formErrors.password = 'Hasło musi mieć minimum 6 znaków'
      }

      return Object.keys(this.formErrors).length === 0
    },
    async saveUser() {
      if (!this.validateForm()) {
        return
      }

      this.saving = true
      this.error = null

      try {
        const payload: any = {
          username: this.formData.username.trim(),
          email: this.formData.email.trim(),
          first_name: this.formData.first_name.trim() || null,
          last_name: this.formData.last_name.trim() || null,
          role: this.formData.role,
        }

        if (!this.editingUser) {
          payload.password = this.formData.password
          await apiClient.post('/users', payload)
        } else {
          await apiClient.put(`/users/${this.editingUser.id}`, payload)
        }

        this.closeModal()
        await this.fetchUsers()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Brak uprawnień do wykonania tej operacji'
        } else if (err.response?.status === 409) {
          this.error = 'Użytkownik z tym emailem lub username już istnieje'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się zapisać użytkownika'
          console.error('Error saving user:', err)
        }
      } finally {
        this.saving = false
      }
    },
    confirmDelete(user: User) {
      if (user.id === this.currentUserId) {
        alert('Nie możesz usunąć własnego konta')
        return
      }
      if (confirm(`Czy na pewno chcesz usunąć użytkownika "${user.username}"?`)) {
        this.deleteUser(user)
      }
    },
    async deleteUser(user: User) {
      this.error = null

      try {
        await apiClient.delete(`/users/${user.id}`)
        await this.fetchUsers()
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 403) {
          this.error = 'Brak uprawnień do wykonania tej operacji'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Nie udało się usunąć użytkownika'
          console.error('Error deleting user:', err)
        }
      }
    },
    formatDate(dateString: string): string {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
    getRoleBadgeClass(role: string): string {
      switch (role) {
        case 'ADMIN':
          return 'badge-danger'
        case 'EDITOR':
          return 'badge-warning'
        case 'USER':
          return 'badge-secondary'
        default:
          return 'badge-secondary'
      }
    },
    checkCurrentUser() {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          this.currentUserId = user.id
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
  },
  mounted() {
    this.checkCurrentUser()
    this.fetchUsers()
  }
})
</script>

<style scoped>
.users-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--bs-border-color);
  padding-bottom: 1rem;
}

h1 {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 2rem;
  font-weight: 700;
}

.filters-section {
  padding: 1rem;
  border: 1px solid var(--bs-border-color);
  background-color: transparent;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.25em;
  border-color: var(--primary-color);
  border-right-color: transparent;
}

.users-table-container {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background-color: transparent;
}

.table thead {
  border-bottom: 2px solid var(--bs-border-color);
}

.table th {
  padding: 1rem;
  text-align: left;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 1px;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 2px solid var(--bs-border-color);
}

.cursor-pointer {
  cursor: pointer;
  user-select: none;
}

.cursor-pointer:hover {
  color: var(--primary-color);
}

.table td {
  padding: 1rem;
  border-bottom: 1px solid var(--bs-border-color);
  color: var(--text-color);
}

.table tbody tr:hover {
  background-color: var(--bs-border-color);
  opacity: 0.5;
}

.actions-column {
  text-align: center;
  width: 220px;
  min-width: 220px;
}

.actions-cell {
  text-align: center;
  padding: 0.75rem 0.5rem !important;
}

.actions-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.actions-cell .btn {
  min-width: 80px;
  white-space: nowrap;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-danger {
  background-color: #dc3545;
  color: white;
}

.badge-warning {
  background-color: #ffc107;
  color: #000;
}

.badge-secondary {
  background-color: #6c757d;
  color: white;
}

.alert {
  border: 1px solid var(--bs-border-color);
  background-color: transparent;
  color: var(--text-color);
  padding: 1.5rem;
  max-width: 500px;
}

.alert-danger {
  border-color: #dc3545;
  color: #dc3545;
}

.alert h4 {
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-color);
  border: 2px solid var(--bs-border-color);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--bs-border-color);
}

.modal-header h2 {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1.5rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-color);
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  opacity: 0.7;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--bs-border-color);
}

.form-label {
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1px;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-control {
  background-color: transparent;
  border: 1px solid var(--bs-border-color);
  color: var(--text-color);
}

.form-control:focus {
  background-color: transparent;
  border-color: var(--primary-color);
  box-shadow: none;
  color: var(--text-color);
}

.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  text-transform: none;
}

.form-text {
  font-size: 0.875rem;
  color: var(--secondary-color);
}
</style>
