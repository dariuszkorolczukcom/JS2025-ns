export interface UserFormData {
  username: string
  email: string
  password?: string
  first_name: string
  last_name: string
  role: string
}

export interface UserFormErrors {
  username?: string
  email?: string
  password?: string
  role?: string
}

export function validateUserForm(formData: UserFormData, isEditing: boolean = false): UserFormErrors {
  const errors: UserFormErrors = {}

  if (!formData.username.trim()) {
    errors.username = 'Username is required'
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
  }

  if (!isEditing && !formData.password) {
    errors.password = 'Password is required'
  } else if (!isEditing && formData.password && formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }

  return errors
}
