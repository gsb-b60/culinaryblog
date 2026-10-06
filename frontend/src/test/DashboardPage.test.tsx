import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'
import DashboardPage from '../pages/DashboardPage'

const AUTH: AuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: '2026-10-06T00:00:00.000Z',
  user: {
    id: 'user-1',
    fullName: 'Admin',
    email: 'admin@example.com',
    userName: 'admin',
    roles: ['ADMIN'],
  },
}

const fetchMock = vi.fn()

function recipesResponse(): Response {
  return new Response(JSON.stringify({
    items: [{
      id: 'recipe-1',
      title: 'Phở bò',
      slug: 'pho-bo',
      description: 'Phở bò truyền thống',
      status: 'PUBLISHED',
      createdAt: '2026-10-05T00:00:00.000Z',
      categoryName: 'Món chính',
      authorName: 'Đầu bếp',
    }],
    meta: { totalCount: 12 },
  }), { status: 200 })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
  sessionStorage.clear()
  saveSession(AUTH)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage recipes', () => {
  it('loads published recipes from the API and displays their total', async () => {
    fetchMock.mockResolvedValue(recipesResponse())

    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'Phở bò' })).toBeInTheDocument()
    expect(screen.getByText('Phở bò truyền thống')).toBeInTheDocument()
    expect(screen.getByText('Món chính · Đầu bếp')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('shows an API error and retries when requested', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network error'))
    fetchMock.mockResolvedValueOnce(recipesResponse())

    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể kết nối máy chủ')
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByRole('heading', { name: 'Phở bò' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
