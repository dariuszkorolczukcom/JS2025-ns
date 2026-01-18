export interface MusicFormData {
  title: string
  artist: string
  album: string
  year: number | null
  genre: string
  youtube_url?: string
}

export interface MusicFormErrors {
  title?: string
  artist?: string
  year?: string
}

export function validateMusicForm(formData: MusicFormData): MusicFormErrors {
  const errors: MusicFormErrors = {}

  if (!formData.title.trim()) {
    errors.title = 'Title is required'
  }

  if (!formData.artist.trim()) {
    errors.artist = 'Artist is required'
  }

  if (formData.year !== null && formData.year !== undefined) {
    const currentYear = new Date().getFullYear()
    if (formData.year < 1900 || formData.year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`
    }
  }

  return errors
}
