import apiClient from '../config/axios'

export interface Music {
  id: string
  title: string
  artist: string
  album: string | null
  year: number | null
  genre: string
  created_at: string
}

export interface Genre {
  slug: string
  name: string
}

export interface MusicParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  genre?: string
  year?: number
}

export interface MusicResponse {
  data: Music[]
  totalCount: number
  totalPages: number
}

export interface MusicFormData {
  title: string
  artist: string
  album: string
  year: number | null
  genre: string
}

export const musicService = {
  async fetchMusic(params?: MusicParams): Promise<MusicResponse> {
    const response = await apiClient.get<Music[]>('/music', { params })
    
    return {
      data: response.data,
      totalCount: parseInt(response.headers['x-total-count'] || '0'),
      totalPages: parseInt(response.headers['x-total-pages'] || '0'),
    }
  },

  async fetchGenres(): Promise<Genre[]> {
    const response = await apiClient.get<Genre[]>('/music/genres')
    return response.data
  },

  async createMusic(data: MusicFormData): Promise<Music> {
    const payload = {
      title: data.title.trim(),
      artist: data.artist.trim(),
      album: data.album.trim() || null,
      year: data.year || null,
      genre: data.genre.trim() || null,
    }
    const response = await apiClient.post<Music>('/music', payload)
    return response.data
  },

  async updateMusic(id: string, data: MusicFormData): Promise<Music> {
    const payload = {
      title: data.title.trim(),
      artist: data.artist.trim(),
      album: data.album.trim() || null,
      year: data.year || null,
      genre: data.genre.trim() || null,
    }
    const response = await apiClient.put<Music>(`/music/${id}`, payload)
    return response.data
  },

  async deleteMusic(id: string): Promise<void> {
    await apiClient.delete(`/music/${id}`)
  },
}
