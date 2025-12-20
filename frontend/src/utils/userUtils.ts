export interface User {
  id?: string
  role?: string
}

export function getUserFromStorage(): User | null {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {
      console.error('Error parsing user data:', e)
      return null
    }
  }
  return null
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'EDITOR'
}

export function getCurrentUserId(): string | null {
  const user = getUserFromStorage()
  return user?.id || null
}

export function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'badge-danger'
    case 'EDITOR':
      return 'badge-warning'
    case 'USER':
      return 'badge-secondary'
    default:
      return 'badge-secondary'
  }
}
