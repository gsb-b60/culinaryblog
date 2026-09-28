import type { AuthResponse } from '../types/auth'

const SESSION_KEY = 'culinary_session'

export function saveSession(auth: AuthResponse): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(auth))
}

export function loadSession(): AuthResponse | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthResponse
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
