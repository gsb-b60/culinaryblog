import { StrictMode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ProfilePage from '../pages/ProfilePage'
import { loadSession, saveSession } from '../lib/tokenStorage'
import { useAuthStore } from '../store'
import type { AuthResponse, UserProfile } from '../types/auth'

const AUTH: AuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: '2099-01-01T00:00:00.000Z',
  user: {
    id: 'user-1',
    fullName: 'Nguyen Van A',
    email: 'an@example.com',
    userName: 'nguyenvana',
    roles: ['AUTHOR'],
  },
}

const PROFILE: UserProfile = {
  id: 'user-1',
  email: 'an@example.com',
  displayName: 'Nguyen Van A',
  bio: 'Nau an moi ngay',
  role: 'AUTHOR',
  emailVerified: true,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn()

beforeEach(() => {
  saveSession(AUTH)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function LoginProbe() {
  const location = useLocation()
  return location.pathname === '/auth/login' ? <p>trang đăng nhập</p> : null
}

/**
 * Renders the page directly under the router (no `<Routes>`): React only
 * replays effects for subtrees mounted in the first commit, so Strict Mode
 * has to sit *outside* the router for the replay to happen at all.
 */
function renderProfile({ strict = false }: { strict?: boolean } = {}) {
  const tree = (
    <MemoryRouter initialEntries={['/profile']}>
      <ProfilePage />
      <LoginProbe />
    </MemoryRouter>
  )

  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

describe('ProfilePage session handling', () => {
  it('redirects to the login page when saving fails with an expired session', async () => {
    fetchMock
      .mockResolvedValueOnce(response(PROFILE)) // GET /auth/me
      .mockResolvedValueOnce(response({ detail: 'expired' }, 401)) // PATCH /auth/me
      .mockResolvedValueOnce(response({ detail: 'expired' }, 401)) // POST /auth/refresh
    renderProfile()

    await screen.findByDisplayValue('Nguyen Van A')
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật' }))

    expect(await screen.findByText('trang đăng nhập')).toBeInTheDocument()
    expect(loadSession()).toBeNull()
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('still reaches the login page when the load fails after a Strict Mode replay', async () => {
    // Strict Mode runs the load effect twice; both the request and the refresh
    // it triggers must fail for the redirect to happen.
    fetchMock.mockImplementation(async (url: string) => {
      expect(typeof url).toBe('string')
      return response({ detail: 'expired' }, 401)
    })
    renderProfile({ strict: true })

    expect(await screen.findByText('trang đăng nhập')).toBeInTheDocument()
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('keeps editing when the save fails for a non-session reason', async () => {
    fetchMock
      .mockResolvedValueOnce(response(PROFILE)) // GET /auth/me
      .mockResolvedValueOnce(response({ detail: 'validation' }, 422)) // PATCH /auth/me
    renderProfile()

    await screen.findByDisplayValue('Nguyen Van A')
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('validation')
    expect(useAuthStore.getState().session).toEqual(AUTH)
  })
})
