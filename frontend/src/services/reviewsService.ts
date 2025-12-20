import apiClient from '../config/axios'

export interface Review {
  id: string
  user_id: string
  music_id: string
  rating: number
  title: string | null
  comment: string | null
  created_at: string
  updated_at: string
  username?: string
}

export interface ReviewsByMusicResponse {
  reviews: Review[]
  averageRating: number
  reviewCount: number
}

export interface ReviewParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  minRating?: number
  maxRating?: number
}

export interface ReviewResponse {
  data: Review[]
  totalCount: number
  totalPages: number
}

export interface ReviewFormData {
  rating: number | null
  title: string
  comment: string
  musicId?: string
}

export const reviewsService = {
  async fetchReviews(params?: ReviewParams): Promise<ReviewResponse> {
    const response = await apiClient.get<Review[]>('/reviews', { params })
    
    return {
      data: response.data,
      totalCount: parseInt(response.headers['x-total-count'] || '0'),
      totalPages: parseInt(response.headers['x-total-pages'] || '0'),
    }
  },

  async createReview(data: ReviewFormData): Promise<Review> {
    const payload: any = {
      rating: data.rating,
      title: (data.title && data.title.trim()) || null,
      comment: (data.comment && data.comment.trim()) || null,
    }
    
    if (data.musicId) {
      payload.musicId = data.musicId.trim()
    }
    
    const response = await apiClient.post<Review>('/reviews', payload)
    return response.data
  },

  async updateReview(id: string, data: ReviewFormData): Promise<Review> {
    const payload = {
      rating: data.rating,
      title: data.title.trim() || null,
      comment: data.comment.trim() || null,
    }
    const response = await apiClient.put<Review>(`/reviews/${id}`, payload)
    return response.data
  },

  async deleteReview(id: string): Promise<void> {
    await apiClient.delete(`/reviews/${id}`)
  },

  async fetchReviewsByMusicId(musicId: string): Promise<ReviewsByMusicResponse> {
    const response = await apiClient.get<ReviewsByMusicResponse>(`/music/${musicId}/reviews`)
    return response.data
  },
}
