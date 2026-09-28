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

    // Whether the real GIS button or the OAuth redirect fallback shows depends
    // on VITE_GOOGLE_CLIENT_ID and whether the script loads, so assert the
    // stable parts: a Google entry point plus the divider.
    const google = screen.getByRole('link', { name: /Google/ })
    expect(google).toHaveAttribute('href', expect.stringContaining('/auth/google/redirect'))
    expect(screen.getByText('hoặc')).toBeInTheDocument()
  })
})
