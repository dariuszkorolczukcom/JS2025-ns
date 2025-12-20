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
    errors.username = 'Username jest wymagany'
  } else if (formData.username.length < 3) {
    errors.username = 'Username musi mieć minimum 3 znaki'
  }

  if (!formData.email.trim()) {
    errors.email = 'Email jest wymagany'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Nieprawidłowy format email'
    }
  }

  if (!isEditing && !formData.password) {
    errors.password = 'Hasło jest wymagane'
  } else if (!isEditing && formData.password && formData.password.length < 6) {
    errors.password = 'Hasło musi mieć minimum 6 znaków'
  }

  return errors
}
