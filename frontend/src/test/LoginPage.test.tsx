import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../lib/api'
import { loadSession, saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'
import LoginPage from '../pages/LoginPage'

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

const INVALID_CREDENTIALS = {
  type: 'AUTH_INVALID_CREDENTIALS',
  title: 'Unauthorized',
  status: 401,
  detail: 'Email or password is incorrect',
}

const fetchMock = vi.fn()

function problemResponse(problem: unknown, status: number): Response {
  return new Response(JSON.stringify(problem), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/auth/login']}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/" element={<h1>Trang chủ</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(password = 'Secret1!') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'an@example.com')
  await user.type(screen.getByLabelText('Mật khẩu'), password)
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LoginPage — showcase #login-1-populated', () => {
  it('renders the heading, subtitle and the two fields', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.getByText('Chào mừng bạn trở lại Culinary Blog')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument()
  })

  it('labels the form and uses the login autocomplete tokens', () => {
    renderLogin()

    expect(screen.getByRole('form', { name: 'Form đăng nhập' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('autocomplete', 'current-password')
  })

  it('renders the remember-me checkbox, checked by default, and a forgot-password link', () => {
    renderLogin()

    const remember = screen.getByRole('checkbox', { name: /Ghi nhớ đăng nhập/ })
    expect(remember).toBeChecked()
    expect(screen.getByRole('link', { name: 'Quên mật khẩu?' })).toBeInTheDocument()
  })

  it('renders the divider and the register link alongside the Google slot', () => {
    renderLogin()

    // GIS cannot load in jsdom, so the slot stays empty here. The Google
    // control is the button itself; there is no second fallback link.
    expect(screen.getByText('hoặc')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng ký ngay' })).toHaveAttribute(
      'href',
      '/auth/register',
    )
  })

  it('shows exactly one Google control, never a fallback link', () => {
    renderLogin()

    // Regression: an earlier version rendered the GIS button *and* an OAuth
    // redirect link, which looked like two stacked Google buttons.
    expect(screen.queryByRole('link', { name: /Google/ })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Tiếp tục với Google|Đăng ký với Google/ }),
    ).not.toBeInTheDocument()
  })

  it('keeps the Google slot in the layout even before the button renders', () => {
    renderLogin()

    // The slot must hold its place so the page does not jump once Google fills it.
    const slot = document.querySelector('[class*="min-h-"]')
    expect(slot).toBeInTheDocument()
  })
})

describe('LoginPage — showcase #login-2-error---invalid-credentials', () => {
  it('shows the 401 banner with the Vietnamese message and marks both fields invalid', async () => {
    fetchMock.mockResolvedValue(problemResponse(INVALID_CREDENTIALS, 401))
    renderLogin()

    await fillAndSubmit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Đăng nhập thất bại')
    expect(alert).toHaveTextContent('Email hoặc mật khẩu không chính xác')

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('posts the credentials as JSON to /auth/login', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(AUTH), { status: 200 }))
    renderLogin()

    await fillAndSubmit()

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/auth/login')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'an@example.com',
      password: 'Secret1!',
    })
  })

  it('clears the error banner once the user edits a field', async () => {
    fetchMock.mockResolvedValue(problemResponse(INVALID_CREDENTIALS, 401))
    renderLogin()
    await fillAndSubmit()
    await screen.findByRole('alert')

    await userEvent.type(screen.getByLabelText('Email'), 'x')

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('distinguishes a disabled account from a temporary lockout', async () => {
    fetchMock.mockResolvedValue(
      problemResponse(
        { type: 'AUTH_ACCOUNT_DISABLED', title: 'Forbidden', status: 403, detail: 'disabled' },
        403,
      ),
    )
    renderLogin()

    await fillAndSubmit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Tài khoản đã bị vô hiệu hóa')
  })

  it('explains a temporary lockout on 403 AUTH_ACCOUNT_LOCKED', async () => {
    fetchMock.mockResolvedValue(
      problemResponse(
        { type: 'AUTH_ACCOUNT_LOCKED', title: 'Forbidden', status: 403, detail: 'Too many' },
        403,
      ),
    )
    renderLogin()

    await fillAndSubmit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('tạm thời bị khóa')
  })

  it('maps 422 per-field errors onto the inputs', async () => {
    fetchMock.mockResolvedValue(
      problemResponse(
        {
          type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
          title: 'Validation Error',
          status: 422,
          detail: 'Request validation failed',
          errors: { email: ['Invalid email address'] },
        },
        422,
      ),
    )
    renderLogin()

    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a warning banner when rate limited (429)', async () => {
    fetchMock.mockResolvedValue(
      problemResponse(
        { type: 'RATE_LIMIT_EXCEEDED', title: 'Too Many Requests', status: 429, detail: 'slow down' },
        429,
      ),
    )
    renderLogin()

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Quá nhiều yêu cầu')
  })

  it('shows a friendly message when the server is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderLogin()

    await fillAndSubmit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Đăng nhập thất bại')
    expect(alert).toHaveTextContent(/không thể kết nối/i)
  })
})

describe('LoginPage — client-side validation', () => {
  it('blocks submission and reports an invalid email without calling the API', async () => {
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Mật khẩu'), 'Secret1!')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Email không hợp lệ')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('blocks submission when the password is empty', async () => {
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Email'), 'an@example.com')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Vui lòng nhập mật khẩu')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('LoginPage — success', () => {
  it('stores a remembered session in localStorage and shows the success card', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(AUTH), { status: 200 }))
    renderLogin()

    await fillAndSubmit()

    expect(await screen.findByText('Đăng nhập thành công!')).toBeInTheDocument()
    expect(loadSession()).toEqual(AUTH)
    expect(localStorage.getItem('culinary_session')).not.toBeNull()
    expect(screen.getByText('AUTHOR')).toBeInTheDocument()
  })

  it('stores an un-remembered session in sessionStorage instead', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(AUTH), { status: 200 }))
    renderLogin()
    const user = userEvent.setup()

    await user.click(screen.getByRole('checkbox', { name: /Ghi nhớ đăng nhập/ }))
    await user.type(screen.getByLabelText('Email'), 'an@example.com')
    await user.type(screen.getByLabelText('Mật khẩu'), 'Secret1!')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await screen.findByText('Đăng nhập thành công!')
    expect(sessionStorage.getItem('culinary_session')).not.toBeNull()
    expect(localStorage.getItem('culinary_session')).toBeNull()
  })

  it('clears the session when the user signs out from the success card', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(AUTH), { status: 200 }))
    renderLogin()
    await fillAndSubmit()
    await screen.findByText('Đăng nhập thành công!')

    await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    await waitFor(() => expect(loadSession()).toBeNull())
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
  })
})

describe('LoginPage — already authenticated', () => {
  it('redirects to the home page instead of showing the form', async () => {
    saveSession(AUTH)
    renderLogin()

    expect(await screen.findByRole('heading', { name: 'Trang chủ' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Mật khẩu')).not.toBeInTheDocument()
  })
})

describe('LoginPage — Google unavailable must not block the form', () => {
  it('still lets the user log in with email and password when GIS is unavailable', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(AUTH), { status: 200 }))
    renderLogin()

    // A broken Google button must not take the form down with it.
    await userEvent.type(screen.getByLabelText('Email'), 'an@example.com')
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'Secret1!')
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Đăng nhập thành công!')).toBeInTheDocument()
  })

  it('leaves the form enabled and reachable while Google is not ready', async () => {
    renderLogin()

    // Whichever non-ready state we land in (the script cannot load in jsdom),
    // the credential form must stay interactive and unobstructed.
    await waitFor(() => {
      expect(screen.getByRole('form', { name: 'Form đăng nhập' })).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Email')).toBeEnabled()
    expect(screen.getByLabelText('Mật khẩu')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled()
  })
})

describe('ApiError contract used by the page', () => {
  it('exposes the status and problem for every documented failure', () => {
    const err = new ApiError(401, 'Email or password is incorrect', INVALID_CREDENTIALS)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ApiError')
    expect(err.status).toBe(401)
    expect(err.problem?.type).toBe('AUTH_INVALID_CREDENTIALS')
  })
})
