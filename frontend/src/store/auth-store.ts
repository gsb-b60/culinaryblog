import { create } from 'zustand'

import { clearSession, loadSession, saveSession, subscribeSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'

/**
 * Single source of truth for the signed-in session (M7).
 *
 * Storage stays authoritative: every action writes through `tokenStorage` and
 * the subscription below pulls the new value back into the store, so a token
 * rotated by the API client refresh flow is visible to every component
 * without a page reload. The store itself only exists so React re-renders
 * when the session changes.
 */
interface AuthState {
  session: AuthResponse | null
  /** Persists the session (remembered by default) and publishes it. */
  setSession: (auth: AuthResponse, remember?: boolean) => void
  /** Removes the session from storage and from every subscriber. */
  signOut: () => void
  /** Re-reads storage; called automatically on any external write. */
  syncSession: () => void
}

function sameSession(a: AuthResponse | null, b: AuthResponse | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  // Compare the whole payload: a re-issued session can keep its tokens and
  // only change the user (role updates), which components must observe.
  return JSON.stringify(a) === JSON.stringify(b)
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: loadSession(),

  setSession: (auth, remember = true) => {
    saveSession(auth, remember)
    // saveSession notifies the subscription below, which usually wins the race
    // to update the state; this set is the fallback and stays a no-op when the
    // value is already published, so listeners fire exactly once per change.
    set((state) => (sameSession(state.session, auth) ? state : { session: auth }))
  },

  signOut: () => {
    clearSession()
    set((state) => (state.session === null ? state : { session: null }))
  },

  syncSession: () =>
    set((state) => {
      const session = loadSession()
      return sameSession(state.session, session) ? state : { session }
    }),
}))

subscribeSession(() => {
  useAuthStore.getState().syncSession()
})

/** Convenience selectors used by components. */
export const selectSession = (state: AuthState): AuthResponse | null => state.session
export const selectAccessToken = (state: AuthState): string | null => state.session?.accessToken ?? null
export const selectIsAuthenticated = (state: AuthState): boolean => state.session !== null
