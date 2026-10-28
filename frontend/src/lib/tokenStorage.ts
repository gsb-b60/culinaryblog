import type { AuthResponse } from '../types/auth'

const SESSION_KEY = 'culinary_session'

type SessionListener = () => void

// The API client and any page may write the session without going through
// React (the automatic token refresh does), so the auth store subscribes to
// every write and mirrors it instead of polling storage.
const listeners = new Set<SessionListener>()

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notifySessionChanged(): void {
  for (const listener of [...listeners]) listener()
}

// Writes made by another tab never reach the in-memory listeners above: the
// `storage` event only fires in the *other* documents, and only for
// localStorage (where remembered sessions live). Without this, a tab that was
// signed out elsewhere would keep its stale session and bounce the user from
// `/auth/login` straight back to the dashboard.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // `key === null` means the whole storage area was cleared.
    if (event.key === null || event.key === SESSION_KEY) notifySessionChanged()
  })
}

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
  notifySessionChanged()
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
  notifySessionChanged()
}

/** Replace rotated credentials without changing the remember-me choice. */
export function replaceSession(auth: AuthResponse): void {
  saveSession(auth, localStorage.getItem(SESSION_KEY) !== null)
}
