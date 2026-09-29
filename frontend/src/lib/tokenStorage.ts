import type { AuthResponse } from '../types/auth'

const SESSION_KEY = 'culinary_session'

/**
 * "Ghi nhớ đăng nhập" (M7). Remembered sessions survive a browser restart in
 * localStorage; un-remembered ones live in sessionStorage and disappear when
 * the tab closes. Only one store ever holds the session, so toggling the
 * checkbox cannot leave a stale copy behind.
 */
export function saveSession(auth: AuthResponse, remember = true): void {
  const primary = remember ? localStorage : sessionStorage
  const secondary = remember ? sessionStorage : localStorage
  const raw = JSON.stringify(auth)
  primary.setItem(SESSION_KEY, raw)
  secondary.removeItem(SESSION_KEY)
}

export function loadSession(): AuthResponse | null {
  // Try both stores so an unparseable value in one does not shadow a valid
  // session in the other.
  for (const store of [localStorage, sessionStorage]) {
    const raw = store.getItem(SESSION_KEY)
    if (!raw) continue
    try {
      return JSON.parse(raw) as AuthResponse
    } catch {
      // Corrupt entry — fall through and try the other store.
    }
  }
  return null
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
