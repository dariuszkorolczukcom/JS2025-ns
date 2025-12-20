import axios from 'axios'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - adds JWT token to all requests (except public endpoints)
apiClient.interceptors.request.use(
  (config) => {
    const requestUrl = config.url || ''
    const urlWithoutQuery = requestUrl.split('?')[0]
    
    // UUID pattern (36 znaków: 8-4-4-4-12)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    // Sprawdź czy to publiczny endpoint
    const musicIdMatch = urlWithoutQuery.match(/^\/music\/(.+)$/)
    const reviewMusicIdMatch = urlWithoutQuery.match(/^\/music\/(.+)\/reviews$/)
    
    const isPublicEndpoint = 
      urlWithoutQuery === '/music' ||
      urlWithoutQuery === '/music/genres' ||
      (musicIdMatch && uuidPattern.test(musicIdMatch[1])) ||
      (reviewMusicIdMatch && uuidPattern.test(reviewMusicIdMatch[1]))
    
    // Dla publicznych endpointów - nie dodawaj tokenu (może być nieprawidłowy)
    // Dla chronionych endpointów - dodaj token jeśli istnieje
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handles 401 errors (unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Sprawdź czy to publiczny endpoint
      const requestUrl = error.config?.url || ''
      const urlWithoutQuery = requestUrl.split('?')[0]
      
      // UUID pattern (36 znaków: 8-4-4-4-12)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      // Sprawdź czy URL zawiera UUID (dla /music/:id i /music/:id/reviews)
      const musicIdMatch = urlWithoutQuery.match(/^\/music\/(.+)$/)
      const reviewMusicIdMatch = urlWithoutQuery.match(/^\/music\/(.+)\/reviews$/)
      
      // Publiczne endpointy (dostępne bez autoryzacji)
      const isPublicEndpoint = 
        urlWithoutQuery === '/music' ||
        urlWithoutQuery === '/music/genres' ||
        (musicIdMatch && uuidPattern.test(musicIdMatch[1])) ||
        (reviewMusicIdMatch && uuidPattern.test(reviewMusicIdMatch[1]))
      
      // Nie przekierowuj dla publicznych endpointów - mogą być dostępne bez logowania
      // Po prostu pozwól na błąd 401 bez przekierowania
      if (!isPublicEndpoint) {
        // Token expired or invalid - clear storage and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      // Dla publicznych endpointów - nie przekierowuj, tylko zwróć błąd
      // To pozwoli komponentom obsłużyć błąd 401 normalnie (np. pokazać komunikat)
    }
    return Promise.reject(error)
  }
)

export default apiClient

