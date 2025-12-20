export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  first_name?: string
  last_name?: string
}

export interface ProfileFormData {
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface PasswordFormData {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export interface LoginFormErrors {
  email?: string
  password?: string
}

export interface RegisterFormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export interface ProfileFormErrors {
  username?: string
  email?: string
}

export interface PasswordFormErrors {
  oldPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export function validateLoginForm(formData: LoginFormData): LoginFormErrors {
  const errors: LoginFormErrors = {}
  
  if (!formData.email) {
    errors.email = 'REQUIRED'
  }
  
  if (!formData.password) {
    errors.password = 'REQUIRED'
  }
  
  return errors
}

export function validateRegisterForm(formData: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {}
  
  if (!formData.username) {
    errors.username = 'Username is required'
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
  }

  if (!formData.email) {
    errors.email = 'Email is required'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
  }

  if (!formData.password) {
    errors.password = 'Password is required'
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export function validateProfileForm(formData: ProfileFormData): ProfileFormErrors {
  const errors: ProfileFormErrors = {}

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

  return errors
}

export function validatePasswordForm(formData: PasswordFormData): PasswordFormErrors {
  const errors: PasswordFormErrors = {}

  if (!formData.oldPassword) {
    errors.oldPassword = 'Obecne hasło jest wymagane'
  }

  if (!formData.newPassword) {
    errors.newPassword = 'Nowe hasło jest wymagane'
  } else if (formData.newPassword.length < 6) {
    errors.newPassword = 'Hasło musi mieć minimum 6 znaków'
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Potwierdzenie hasła jest wymagane'
  } else if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = 'Hasła nie są identyczne'
  }

  return errors
}
