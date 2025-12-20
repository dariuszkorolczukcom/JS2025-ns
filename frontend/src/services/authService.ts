import apiClient from '../config/axios'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export interface LoginResponse {
  token: string
  user?: any
}

export interface UserProfile {
  id: string
  email: string
  username: string
  first_name: string | null
  last_name: string | null
  role: string
  permissions?: string[]
}

export interface ProfileUpdateData {
  username?: string
  email?: string
  first_name?: string | null
  last_name?: string | null
}

export interface ChangePasswordData {
  oldPassword: string
  newPassword: string
}

export const authService = {
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data)
    return response.data
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/auth/profile')
    return response.data
  },

  async updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/auth/profile', data)
    return response.data
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient.post('/auth/change-password', data)
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/request-password-reset', { email })
    return response.data
  },
}
