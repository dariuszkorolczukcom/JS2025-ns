export interface ReviewFormData {
  rating: number | null
  title: string
  comment: string
  musicId: string
}

export interface ReviewFormErrors {
  rating?: string
  title?: string
  comment?: string
  musicId?: string
}

export function validateReviewForm(formData: ReviewFormData, isEditing: boolean = false): ReviewFormErrors {
  const errors: ReviewFormErrors = {}

  if (formData.rating === null || formData.rating < 1 || formData.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5'
  }

  if (!isEditing && !formData.musicId.trim()) {
    errors.musicId = 'Music track is required'
  } else if (!isEditing && formData.musicId.trim()) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(formData.musicId.trim())) {
      errors.musicId = 'Invalid song ID format'
    }
  }

  return errors
}
