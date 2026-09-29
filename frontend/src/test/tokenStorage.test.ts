import { beforeEach, describe, expect, it } from 'vitest'

import { clearSession, loadSession, saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'

const SESSION: AuthResponse = {
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

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('saveSession', () => {
  it('stores the session in localStorage when remember is true', () => {
    saveSession(SESSION, true)

    expect(JSON.parse(localStorage.getItem('culinary_session') as string)).toEqual(SESSION)
    expect(sessionStorage.getItem('culinary_session')).toBeNull()
  })

  it('defaults to localStorage when remember is omitted', () => {
    saveSession(SESSION)

    expect(localStorage.getItem('culinary_session')).not.toBeNull()
  })

  it('stores the session in sessionStorage when remember is false', () => {
    saveSession(SESSION, false)

    expect(JSON.parse(sessionStorage.getItem('culinary_session') as string)).toEqual(SESSION)
    expect(localStorage.getItem('culinary_session')).toBeNull()
  })

  it('clears the other store so switching remember cannot leak a session', () => {
    saveSession(SESSION, true)
    saveSession(SESSION, false)

    expect(localStorage.getItem('culinary_session')).toBeNull()
    expect(sessionStorage.getItem('culinary_session')).not.toBeNull()

    saveSession(SESSION, true)

    expect(sessionStorage.getItem('culinary_session')).toBeNull()
    expect(localStorage.getItem('culinary_session')).not.toBeNull()
  })
})

describe('loadSession', () => {
  it('returns null when nothing is stored', () => {
    expect(loadSession()).toBeNull()
  })

  it('reads a remembered session from localStorage', () => {
    saveSession(SESSION, true)

    expect(loadSession()).toEqual(SESSION)
  })

  it('reads a non-remembered session from sessionStorage', () => {
    saveSession(SESSION, false)

    expect(loadSession()).toEqual(SESSION)
  })

  it('prefers the remembered session when both stores hold one', () => {
    localStorage.setItem('culinary_session', JSON.stringify({ ...SESSION, accessToken: 'local' }))
    sessionStorage.setItem(
      'culinary_session',
      JSON.stringify({ ...SESSION, accessToken: 'session' }),
    )

    expect(loadSession()?.accessToken).toBe('local')
  })

  it('falls back to sessionStorage when the remembered value is corrupt', () => {
    localStorage.setItem('culinary_session', '{not json')
    sessionStorage.setItem('culinary_session', JSON.stringify(SESSION))

    expect(loadSession()).toEqual(SESSION)
  })

  it('returns null when the stored value is corrupt in both stores', () => {
    localStorage.setItem('culinary_session', '{not json')
    sessionStorage.setItem('culinary_session', 'also not json')

    expect(loadSession()).toBeNull()
  })
})

describe('clearSession', () => {
  it('removes the session from both stores', () => {
    saveSession(SESSION, true)
    clearSession()
    saveSession(SESSION, false)

    clearSession()

    expect(localStorage.getItem('culinary_session')).toBeNull()
    expect(sessionStorage.getItem('culinary_session')).toBeNull()
  })
})
