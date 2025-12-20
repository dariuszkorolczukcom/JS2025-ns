import apiClient from '../config/axios'

export interface User {
  id: string
  email: string
  username: string
  first_name: string | null
  last_name: string | null
  role: string
  created_at: string
}

export interface UserFormData {
  username: string
  email: string
  password?: string
  first_name: string
  last_name: string
  role: string
}

export const usersService = {
  async fetchUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users')
    return response.data
  },

  async createUser(data: UserFormData): Promise<User> {
    const payload: any = {
      username: data.username.trim(),
      email: data.email.trim(),
      first_name: data.first_name.trim() || null,
      last_name: data.last_name.trim() || null,
      role: data.role,
    }
    
    if (data.password) {
      payload.password = data.password
    }
    
    const response = await apiClient.post<User>('/users', payload)
    return response.data
  },

  async updateUser(id: string, data: UserFormData): Promise<User> {
    const payload: any = {
      username: data.username.trim(),
      email: data.email.trim(),
      first_name: data.first_name.trim() || null,
      last_name: data.last_name.trim() || null,
      role: data.role,
    }
    
    const response = await apiClient.put<User>(`/users/${id}`, payload)
    return response.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
