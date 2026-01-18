<template>
  <main>
    <div class="profile-container">
      <div class="header-section mb-4">
        <h1>My Profile</h1>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading profile...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="alert alert-danger" role="alert">
          <h4>Error</h4>
          <p>{{ error }}</p>
          <button class="btn btn-outline-primary mt-2" @click="fetchProfile">Try again</button>
        </div>
      </div>

      <!-- Profile Content -->
      <div v-else class="profile-content">
        <!-- Profile Info Section -->
        <div class="profile-section mb-4">
          <h2 class="section-title">Profile Information</h2>
          <div class="profile-info">
            <div class="info-item">
              <label>Email:</label>
              <span>{{ userProfile?.email || '-' }}</span>
            </div>
            <div class="info-item">
              <label>Username:</label>
              <span>{{ userProfile?.username || '-' }}</span>
            </div>
            <div class="info-item">
              <label>First Name:</label>
              <span>{{ userProfile?.first_name || '-' }}</span>
            </div>
            <div class="info-item">
              <label>Last Name:</label>
              <span>{{ userProfile?.last_name || '-' }}</span>
            </div>
            <div class="info-item">
              <label>Role:</label>
              <span>{{ userProfile?.role || '-' }}</span>
            </div>
          </div>
          <button class="btn btn-primary mt-3" @click="showEditProfile = true">
            Edit Profile
          </button>
        </div>

        <!-- Change Password Section -->
        <div class="profile-section">
          <h2 class="section-title">Change Password</h2>
          <button class="btn btn-outline-primary" @click="showChangePassword = true">
            Change Password
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="showEditProfile" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Profile</h2>
          <button class="btn-close" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveProfile">
            <div class="mb-3">
              <label class="form-label">Username *</label>
              <input
                v-model="profileForm.username"
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
                v-model="profileForm.email"
                type="email"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.email }"
              />
              <div v-if="formErrors.email" class="invalid-feedback">
                {{ formErrors.email }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">First Name</label>
              <input
                v-model="profileForm.first_name"
                type="text"
                class="form-control"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Last Name</label>
              <input
                v-model="profileForm.last_name"
                type="text"
                class="form-control"
              />
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="closeEditModal">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePassword" class="modal-overlay" @click.self="closePasswordModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Change Password</h2>
          <button class="btn-close" @click="closePasswordModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="savePassword">
            <div class="mb-3">
              <label class="form-label">Current Password *</label>
              <input
                v-model="passwordForm.oldPassword"
                type="password"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.oldPassword }"
              />
              <div v-if="formErrors.oldPassword" class="invalid-feedback">
                {{ formErrors.oldPassword }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">New Password *</label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                class="form-control"
                required
                minlength="6"
                :class="{ 'is-invalid': formErrors.newPassword }"
              />
              <div v-if="formErrors.newPassword" class="invalid-feedback">
                {{ formErrors.newPassword }}
              </div>
              <small class="form-text text-muted">Minimum 6 characters</small>
            </div>

            <div class="mb-3">
              <label class="form-label">Confirm New Password *</label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                class="form-control"
                required
                :class="{ 'is-invalid': formErrors.confirmPassword }"
              />
              <div v-if="formErrors.confirmPassword" class="invalid-feedback">
                {{ formErrors.confirmPassword }}
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="closePasswordModal">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Change Password' }}
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
import { authService, type UserProfile, type ProfileUpdateData, type ChangePasswordData } from '../services/authService'
import { validateProfileForm, validatePasswordForm, type ProfileFormErrors, type PasswordFormErrors } from '../validators/authValidators'

interface ProfileForm {
  username: string
  email: string
  first_name: string
  last_name: string
}

interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export default defineComponent({
  name: 'ProfileView',
  data() {
    return {
      userProfile: null as UserProfile | null,
      loading: true,
      error: null as string | null,
      
      // Modals
      showEditProfile: false,
      showChangePassword: false,
      
      // Forms
      profileForm: {
        username: '',
        email: '',
        first_name: '',
        last_name: '',
      } as ProfileForm,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      } as PasswordForm,
      formErrors: {} as ProfileFormErrors & PasswordFormErrors,
      saving: false,
    }
  },
  methods: {
    async fetchProfile() {
      this.loading = true
      this.error = null

      try {
        const profile = await authService.getProfile()
        this.userProfile = profile
        
        // Populate form with current data
        this.profileForm = {
          username: profile.username || '',
          email: profile.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Failed to load profile'
          console.error('Error fetching profile:', err)
        }
      } finally {
        this.loading = false
      }
    },
    closeEditModal() {
      this.showEditProfile = false
      this.formErrors = {}
      // Reset form to current profile data
      if (this.userProfile) {
        this.profileForm = {
          username: this.userProfile.username || '',
          email: this.userProfile.email || '',
          first_name: this.userProfile.first_name || '',
          last_name: this.userProfile.last_name || '',
        }
      }
    },
    closePasswordModal() {
      this.showChangePassword = false
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      }
      this.formErrors = {}
    },
    validateProfileFormMethod(): boolean {
      this.formErrors = validateProfileForm(this.profileForm)
      return Object.keys(this.formErrors).length === 0
    },
    validatePasswordFormMethod(): boolean {
      this.formErrors = validatePasswordForm(this.passwordForm)
      return Object.keys(this.formErrors).length === 0
    },
    async saveProfile() {
      if (!this.validateProfileFormMethod()) {
        return
      }

      this.saving = true
      this.error = null

      try {
        const payload: ProfileUpdateData = {}
        
        if (this.profileForm.username !== this.userProfile?.username) {
          payload.username = this.profileForm.username.trim()
        }
        if (this.profileForm.email !== this.userProfile?.email) {
          payload.email = this.profileForm.email.trim()
        }
        if (this.profileForm.first_name !== (this.userProfile?.first_name || '')) {
          payload.first_name = this.profileForm.first_name.trim() || null
        }
        if (this.profileForm.last_name !== (this.userProfile?.last_name || '')) {
          payload.last_name = this.profileForm.last_name.trim() || null
        }

        if (Object.keys(payload).length === 0) {
          this.closeEditModal()
          return
        }

        const updatedProfile = await authService.updateProfile(payload)
        this.userProfile = updatedProfile
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedProfile))
        
        this.closeEditModal()
        this.error = null
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 409) {
          this.error = 'User with this email or username already exists'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Failed to update profile'
          console.error('Error updating profile:', err)
        }
      } finally {
        this.saving = false
      }
    },
    async savePassword() {
      if (!this.validatePasswordFormMethod()) {
        return
      }

      this.saving = true
      this.error = null

      try {
        const data: ChangePasswordData = {
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword,
        }
        
        await authService.changePassword(data)

        this.closePasswordModal()
        this.error = null
        alert('Password changed successfully')
      } catch (err: any) {
        if (err.response?.status === 401) {
          this.$router.push('/login')
        } else if (err.response?.status === 400) {
          this.formErrors.oldPassword = err.response?.data?.error || 'Invalid password'
        } else {
          this.error = err.response?.data?.error || err.response?.data?.message || 'Failed to change password'
          console.error('Error changing password:', err)
        }
      } finally {
        this.saving = false
      }
    },
  },
  mounted() {
    this.fetchProfile()
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

.header-section {
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

.loading-container,
.error-container {
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

.profile-section {
  border: 1px solid var(--bs-border-color);
  padding: 1.5rem;
  background-color: transparent;
}

.section-title {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--bs-border-color);
  padding-bottom: 0.5rem;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  gap: 1rem;
}

.info-item label {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  min-width: 120px;
}

.info-item span {
  color: var(--text-color);
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
  z-index: 1050;
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
