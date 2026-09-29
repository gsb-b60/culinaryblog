import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import RegisterPage from '../pages/RegisterPage'

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/auth/register']}>
      <RegisterPage />
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  it('renders the heading, subtitle and all five fields', () => {
    renderRegister()

    expect(screen.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeInTheDocument()
    expect(screen.getByText('Tạo tài khoản để bắt đầu chia sẻ công thức')).toBeInTheDocument()
    expect(screen.getByLabelText('Họ tên')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Tên người dùng')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument()
    expect(screen.getByLabelText('Nhập lại mật khẩu')).toBeInTheDocument()
  })

  it('exposes the password hint on the password field', () => {
    renderRegister()

    expect(
      screen.getByText('Tối thiểu 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt'),
    ).toBeInTheDocument()
  })

  it('uses the right autocomplete tokens and input types', () => {
    renderRegister()

    expect(screen.getByLabelText('Họ tên')).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('autocomplete', 'new-password')
  })

  it('renders a submit button and a link to the login page', () => {
    renderRegister()

    expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/auth/login')
  })

  it('labels the form for assistive technology', () => {
    renderRegister()

    expect(screen.getByRole('form', { name: 'Form đăng ký' })).toBeInTheDocument()
  })

  it('renders the Google button and the "hoặc" divider', () => {
    renderRegister()

    expect(screen.getByText('hoặc')).toBeInTheDocument()
  })

  it('shows exactly one Google control, never a fallback link', () => {
    renderRegister()

    // Regression: an earlier version rendered the GIS button *and* an OAuth
    // redirect link, which looked like two stacked Google buttons.
    expect(screen.queryByRole('link', { name: /Google/ })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Đăng ký với Google/ }),
    ).not.toBeInTheDocument()
  })

  it('shows a status line so the user is never left with a silent dead control', () => {
    renderRegister()

    // Assert the line exists, not what it says. The starting state depends on
    // VITE_GOOGLE_CLIENT_ID, which is gitignored and therefore absent in CI, so
    // the copy differs between a dev machine and the runner. The per-state
    // wording is covered in useGoogleSignIn.test.tsx.
    expect(screen.getByTestId('google-status')).toBeInTheDocument()
  })
})
