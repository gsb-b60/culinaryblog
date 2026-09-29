import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPage from '../pages/LoginPage'

const fetchMock = vi.fn()

function renderLogin(search = '') {
  window.history.replaceState(null, '', `/auth/login${search}`)
  return render(
    <MemoryRouter initialEntries={[`/auth/login${search}`]}>
      <LoginPage />
    </MemoryRouter>,
  )
}

function noticeText(): string {
  return screen.getByRole('alert').textContent ?? ''
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  window.history.replaceState(null, '', '/auth/login')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LoginPage — Google failure codes from the OAuth callback', () => {
  it('offers sign-up when the Google identity has no account', async () => {
    renderLogin('?error=AUTH_ACCOUNT_NOT_REGISTERED&status=403')

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(noticeText()).toContain('Bạn chưa có tài khoản')
    expect(noticeText()).toContain('đăng ký')
    expect(screen.getByRole('link', { name: 'Đăng ký tài khoản mới' })).toHaveAttribute(
      'href',
      '/auth/register',
    )
  })

  it('strips the error and status params so a refresh does not replay the banner', async () => {
    renderLogin('?error=AUTH_ACCOUNT_NOT_REGISTERED&status=403')

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(window.location.search).toBe('')
  })

  it('explains a declined consent screen instead of failing silently', async () => {
    renderLogin('?error=GOOGLE_AUTH_DENIED')

    await waitFor(() => expect(noticeText()).toContain('Đã hủy đăng nhập Google'))
    expect(screen.queryByRole('link', { name: 'Đăng ký tài khoản mới' })).not.toBeInTheDocument()
  })

  it('explains an expired or invalid state', async () => {
    renderLogin('?error=AUTH_GOOGLE_INVALID_STATE')

    await waitFor(() => expect(noticeText()).toContain('Yêu cầu đăng nhập không hợp lệ'))
  })

  it('explains a failed code exchange', async () => {
    renderLogin('?error=AUTH_GOOGLE_CODE_EXCHANGE_FAILED')

    await waitFor(() => expect(noticeText()).toContain('Không hoàn tất được đăng nhập Google'))
  })

  it('falls back to a generic message for an unknown code', async () => {
    renderLogin('?error=SOMETHING_ELSE')

    await waitFor(() => expect(noticeText()).toContain('Đăng nhập Google thất bại'))
  })

  it('shows no banner when the query string is clean', async () => {
    renderLogin()

    await waitFor(() => expect(screen.getByRole('form', { name: 'Form đăng nhập' })).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('hides the register button once the user starts typing again', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    renderLogin('?error=AUTH_ACCOUNT_NOT_REGISTERED')
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Đăng ký tài khoản mới' })).toBeInTheDocument(),
    )

    await userEvent.type(screen.getByLabelText('Email'), 'a')

    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Đăng ký tài khoản mới' })).not.toBeInTheDocument(),
    )
  })
})
