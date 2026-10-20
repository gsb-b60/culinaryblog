import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from '../components/ErrorBoundary'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { loadSession, saveSession } from '../lib/tokenStorage'
import { useAuthStore } from '../store'
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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Pagination', () => {
  it('reports the position and disables the control that cannot be used', () => {
    render(
      <Pagination
        page={1}
        totalPages={3}
        totalCount={36}
        itemLabel="công thức"
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('navigation', { name: 'Phân trang' })).toBeInTheDocument()
    expect(screen.getByText('Trang 1/3 · 36 công thức')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled()
  })

  it('asks the parent to move to the adjacent page', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Trang trước' }))
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1)

    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3)
  })

  it('renders nothing while there is no page to show', () => {
    render(<Pagination page={1} totalPages={0} onPageChange={vi.fn()} />)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})

describe('PageLoading', () => {
  it('announces itself as a busy status region', () => {
    render(<PageLoading label="Đang tải công thức..." />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveTextContent('Đang tải công thức...')
  })
})

describe('ErrorState', () => {
  it('shows the failure and offers to retry', async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Không thể tải dữ liệu." onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải dữ liệu.')
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('EmptyState', () => {
  it('renders title, description and an optional action', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="Chưa có công thức"
        description="Các công thức của bạn sẽ xuất hiện tại đây."
        action={{ label: 'Tạo công thức', onClick }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Chưa có công thức' })).toBeInTheDocument()
    expect(screen.getByText('Các công thức của bạn sẽ xuất hiện tại đây.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tạo công thức' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('ErrorBoundary', () => {
  it('replaces a crashing subtree with the shared error state and recovers on retry', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    let shouldThrow = true

    function Flaky() {
      if (shouldThrow) throw new Error('Nội dung không tải được')
      return <p>Đã phục hồi</p>
    }

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Nội dung không tải được')

    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(screen.getByText('Đã phục hồi')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    consoleError.mockRestore()
  })
})

describe('Header', () => {
  function renderHeader() {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Header />} />
          <Route path="/auth/login" element={<p>trang đăng nhập</p>} />
          <Route path="/auth/register" element={<p>trang đăng ký</p>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('offers sign-in and sign-up actions when signed out', () => {
    renderHeader()

    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Đăng xuất/ })).not.toBeInTheDocument()
  })

  it('navigates to the sign-in page', async () => {
    renderHeader()

    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('trang đăng nhập')).toBeInTheDocument()
  })

  it('shows dashboard and sign-out controls when signed in', () => {
    saveSession(AUTH)
    renderHeader()

    expect(screen.getByRole('button', { name: 'Bảng điều khiển' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đăng xuất/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đăng nhập' })).not.toBeInTheDocument()
  })

  it('clears the shared session when signing out', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    saveSession(AUTH)
    renderHeader()

    await userEvent.click(screen.getByRole('button', { name: /Đăng xuất/ }))

    expect(loadSession()).toBeNull()
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('opens the mobile navigation sheet', async () => {
    renderHeader()

    await userEvent.click(screen.getByRole('button', { name: 'Mở menu điều hướng' }))

    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByRole('link', { name: 'Công thức' })).toHaveAttribute('href', '/recipes')
  })
})

describe('Footer', () => {
  it('links back to the main sections of the blog', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    )

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Công thức' })).toHaveAttribute('href', '/recipes')
  })
})

describe('AppLayout', () => {
  it('wraps every public page with the shared header and footer', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<p>nội dung trang</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument()
    expect(screen.getByText('nội dung trang')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})

describe('DashboardLayout', () => {
  function renderDashboard() {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<p>trang chủ</p>} />
          <Route path="/auth/login" element={<p>trang đăng nhập</p>} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<p>trang tổng quan</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  it('sends anonymous visitors to the sign-in page', async () => {
    renderDashboard()

    expect(await screen.findByText('trang đăng nhập')).toBeInTheDocument()
    expect(screen.queryByText('trang tổng quan')).not.toBeInTheDocument()
  })

  it('renders the sidebar shell and the page for a signed-in user', async () => {
    saveSession(AUTH)
    renderDashboard()

    expect(await screen.findByText('trang tổng quan')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Dashboard menu' })).toBeInTheDocument()
  })

  it('signs out from the sidebar dialog and returns home', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    saveSession(AUTH)
    renderDashboard()

    await userEvent.click(await screen.findByRole('button', { name: /Đăng xuất/ }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /Đăng xuất/ }))

    expect(loadSession()).toBeNull()
    expect(await screen.findByText('trang chủ')).toBeInTheDocument()
  })
})
