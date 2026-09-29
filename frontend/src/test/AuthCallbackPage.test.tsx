import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AuthCallbackPage from '../pages/AuthCallbackPage'
import { loadSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'

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

/** Mirrors the backend's base64url fragment encoding. */
function encodeSession(auth: AuthResponse): string {
  const bytes = new TextEncoder().encode(JSON.stringify(auth))
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function renderCallback(hash: string) {
  window.location.hash = hash
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${hash}`]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/" element={<h1>Trang chủ</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.location.hash = ''
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AuthCallbackPage', () => {
  it('decodes the fragment, stores the session and lands on the home page', async () => {
    renderCallback(`#${encodeSession(AUTH)}`)

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Trang chủ' })).toBeInTheDocument())
    expect(loadSession()).toEqual(AUTH)
  })

  it('clears the fragment so tokens do not linger in browser history', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    renderCallback(`#${encodeSession(AUTH)}`)

    await waitFor(() => expect(loadSession()).toEqual(AUTH))
    expect(replaceState).toHaveBeenCalled()
  })

  it('keeps the payload out of the address bar entirely', async () => {
    const { container } = renderCallback(`#${encodeSession(AUTH)}`)
    await waitFor(() => expect(loadSession()).toEqual(AUTH))

    // Nothing on the page should echo the tokens back at us.
    expect(container.textContent).not.toContain('access-token')
    expect(container.textContent).not.toContain('refresh-token')
  })

  it('shows an error when the fragment carries no session', async () => {
    renderCallback('')

    expect(await screen.findByRole('alert')).toHaveTextContent(/không tìm thấy thông tin đăng nhập/i)
    expect(loadSession()).toBeNull()
  })

  it('shows an error when the fragment is not decodable', async () => {
    renderCallback('#not-base64url-%%%')

    expect(await screen.findByRole('alert')).toHaveTextContent(/không tìm thấy thông tin đăng nhập/i)
    expect(loadSession()).toBeNull()
  })

  it('offers a way back to the login page when there is no session', async () => {
    renderCallback('')

    const back = await screen.findByRole('link', { name: /Đăng nhập/ })
    expect(back).toHaveAttribute('href', '/auth/login')
  })

  it('leaves a failed redirect to the login page, which renders the code', async () => {
    // The callback only strips error params on success. A failure is handed
    // to LoginPage, which maps the code to copy and offers sign-up.
    renderCallback('')
    await screen.findByRole('alert')

    expect(loadSession()).toBeNull()
    expect(screen.queryByRole('link', { name: /Đăng ký/ })).not.toBeInTheDocument()
  })

  it('lets the user retry once the session is valid', async () => {
    renderCallback('')
    await screen.findByRole('alert')

    localStorage.setItem(
      'culinary_session',
      JSON.stringify(AUTH),
    )
    await userEvent.click(screen.getByRole('button', { name: /thử lại/i }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Trang chủ' })).toBeInTheDocument())
  })
})
