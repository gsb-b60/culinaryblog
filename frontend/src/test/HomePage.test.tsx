import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import HomePage from '../App'
import { loadSession, saveSession } from '../lib/tokenStorage'
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

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <HomePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('HomePage — signed out', () => {
  it('offers register and login links', () => {
    renderHome()

    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '/auth/register')
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/auth/login')
  })

  it('hides the sign-out control', () => {
    renderHome()

    expect(screen.queryByRole('button', { name: /Đăng xuất/ })).not.toBeInTheDocument()
  })
})

describe('HomePage — signed in', () => {
  it('redirects authenticated users to the dashboard', () => {
    saveSession(SESSION)
    renderHome()

    expect(screen.getByText(/Nguyen Van A/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Tổng quan' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).not.toBeInTheDocument()
  })

  it('exposes a sign-out control, which is the only way out of a session', () => {
    // Regression: LoginPage redirects to / when a session exists, so without a
    // sign-out control here a user can never sign in a second time.
    saveSession(SESSION)
    renderHome()

    expect(screen.getByRole('button', { name: /Đăng xuất/ })).toBeInTheDocument()
  })

  it('clears the session and returns to the signed-out view', async () => {
    saveSession(SESSION)
    renderHome()

    await userEvent.click(screen.getByRole('button', { name: /Đăng xuất/ }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Đăng xuất/ }))

    expect(loadSession()).toBeNull()
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Đăng xuất/ })).not.toBeInTheDocument()
  })
})
