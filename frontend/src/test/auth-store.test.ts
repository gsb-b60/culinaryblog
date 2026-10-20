import { describe, expect, it } from 'vitest'

import { clearSession, loadSession, saveSession } from '../lib/tokenStorage'
import { useAuthStore } from '../store'
import type { AuthResponse } from '../types/auth'

// src/test/setup.ts clears both storages and resets the store before each test.

const AUTH: AuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: '2026-09-28T19:00:00.000Z',
  user: {
    id: 'user-1',
    fullName: 'Nguyen Van A',
    email: 'an@example.com',
    userName: 'nguyenvana',
    roles: ['AUTHOR'],
  },
}

describe('auth store', () => {
  it('starts signed out when nothing is stored', () => {
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('publishes a session and persists it through tokenStorage', () => {
    useAuthStore.getState().setSession(AUTH)

    expect(useAuthStore.getState().session).toEqual(AUTH)
    expect(loadSession()).toEqual(AUTH)
  })

  it('honours the remember flag', () => {
    useAuthStore.getState().setSession(AUTH, false)

    expect(localStorage.getItem('culinary_session')).toBeNull()
    expect(loadSession()).toEqual(AUTH)
    expect(useAuthStore.getState().session).toEqual(AUTH)
  })

  it('signs out of the store and the storage at once', () => {
    useAuthStore.getState().setSession(AUTH)

    useAuthStore.getState().signOut()

    expect(useAuthStore.getState().session).toBeNull()
    expect(loadSession()).toBeNull()
  })

  it('follows a session written outside React, as the token refresh does', () => {
    useAuthStore.getState().setSession(AUTH)

    saveSession({ ...AUTH, accessToken: 'rotated' })

    expect(useAuthStore.getState().session?.accessToken).toBe('rotated')
  })

  it('observes a re-issued session that keeps its tokens and only changes the user', () => {
    useAuthStore.getState().setSession(AUTH)

    saveSession({ ...AUTH, user: { ...AUTH.user, roles: ['AUTHOR', 'ADMIN'] } })

    expect(useAuthStore.getState().session?.user.roles).toContain('ADMIN')
  })

  it('follows a sign-out triggered by the API client', () => {
    useAuthStore.getState().setSession(AUTH)

    clearSession()

    expect(useAuthStore.getState().session).toBeNull()
  })

  it('notifies subscribers once per change instead of on every read', () => {
    const seen: (string | null)[] = []
    const unsubscribe = useAuthStore.subscribe((state) => seen.push(state.session?.accessToken ?? null))

    useAuthStore.getState().setSession(AUTH)
    useAuthStore.getState().setSession(AUTH)
    unsubscribe()

    expect(seen).toEqual(['access-token'])
    expect(loadSession()).toEqual(AUTH)
  })

  it('follows a sign-out another tab performed', () => {
    useAuthStore.getState().setSession(AUTH)

    // The other tab cleared localStorage; this tab only receives the storage
    // event, never the in-memory notification.
    localStorage.removeItem('culinary_session')
    window.dispatchEvent(new StorageEvent('storage', { key: 'culinary_session' }))

    expect(useAuthStore.getState().session).toBeNull()
  })

  it('follows a sign-in another tab performed', () => {
    localStorage.setItem('culinary_session', JSON.stringify(AUTH))
    window.dispatchEvent(new StorageEvent('storage', { key: 'culinary_session' }))

    expect(useAuthStore.getState().session).toEqual(AUTH)
  })

  it('ignores storage events for unrelated keys', () => {
    useAuthStore.getState().setSession(AUTH)
    const seen: (string | null)[] = []
    const unsubscribe = useAuthStore.subscribe((state) => seen.push(state.session?.accessToken ?? null))

    window.dispatchEvent(new StorageEvent('storage', { key: 'some-other-key' }))
    unsubscribe()

    expect(seen).toEqual([])
  })
})
