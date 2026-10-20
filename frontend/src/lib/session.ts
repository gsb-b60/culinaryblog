import { logout } from './api'
import { useAuthStore } from '../store'

/**
 * Ends the current session from anywhere in the UI: the refresh token is
 * revoked server-side on a best-effort basis and the shared store is cleared,
 * which signs out every subscribed component at once.
 */
export function endSession(): void {
  const session = useAuthStore.getState().session
  if (session) {
    void logout(session.accessToken, session.refreshToken).catch(() => undefined)
  }
  useAuthStore.getState().signOut()
}
