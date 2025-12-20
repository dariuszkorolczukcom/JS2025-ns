export interface MusicFormData {
  title: string
  artist: string
  album: string
  year: number | null
  genre: string
}

export interface MusicFormErrors {
  title?: string
  artist?: string
  year?: string
}

export function validateMusicForm(formData: MusicFormData): MusicFormErrors {
  const errors: MusicFormErrors = {}

  if (!formData.title.trim()) {
    errors.title = 'Tytuł jest wymagany'
  }

  if (!formData.artist.trim()) {
    errors.artist = 'Artysta jest wymagany'
  }

  if (formData.year !== null && formData.year !== undefined) {
    const currentYear = new Date().getFullYear()
    if (formData.year < 1900 || formData.year > currentYear + 1) {
      errors.year = `Rok musi być między 1900 a ${currentYear + 1}`
    }
  }

  return errors
}
