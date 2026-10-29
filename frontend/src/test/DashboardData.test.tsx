import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from '../pages/DashboardPage'
import { useAuthStore } from '../store'
import type { AuthResponse } from '../types/auth'

const auth: AuthResponse = { accessToken: 'a', refreshToken: 'r', expiresAt: '2099-01-01', user: {
  id: 'owner-a', fullName: 'Owner A', email: 'a@example.invalid', userName: 'a', roles: ['AUTHOR'],
} }
const overview = { stats: { total: 40, published: 38, draft: 0, archived: 2 }, recentRecipes: [
  { id: 'r1', slug: 'live-soup', title: 'Canh từ database', categoryName: 'Món nước', status: 'PUBLISHED', updatedAt: '2026-01-01' },
] }
const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
function open() { render(<MemoryRouter><DashboardPage /></MemoryRouter>) }
beforeEach(() => {
  useAuthStore.getState().setSession(auth)
  fetchMock.mockReset().mockImplementation(async () => json(overview))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())
describe('Dashboard real data integration', () => {
  it('shows API totals and recent recipes, with authorization', async () => {
    open()
    expect(await screen.findByRole('link', { name: 'Canh từ database' })).toHaveAttribute('href', '/recipes/live-soup')
    expect(within(screen.getByRole('group', { name: 'Tổng công thức' })).getByText('40')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Đã lưu trữ' })).getByText('2')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toContain('/recipes/manage/overview')
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer a')
    expect(screen.queryByText('Lượt xem')).not.toBeInTheDocument()
  })
  it('reloads data and retries errors without showing invented totals', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    open()
    await screen.findByRole('alert')
    expect(screen.queryByRole('group', { name: 'Tổng công thức' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findByRole('link', { name: 'Canh từ database' })
    fetchMock.mockImplementation(async () => json({ ...overview, stats: { ...overview.stats, total: 41 } }))
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(await screen.findByText('41')).toBeInTheDocument()
  })
  it('hides previous statistics immediately when switching accounts', async () => {
    open()
    await screen.findByRole('link', { name: 'Canh từ database' })
    fetchMock.mockImplementation(async () => json({ stats: { total: 0, draft: 0, published: 0, archived: 0 }, recentRecipes: [] }))
    act(() => useAuthStore.getState().setSession({ ...auth, accessToken: 'b', user: { ...auth.user, id: 'owner-b' } }))
    expect(screen.queryByRole('link', { name: 'Canh từ database' })).not.toBeInTheDocument()
    await screen.findByText('Chưa có công thức')
    expect(new Headers(fetchMock.mock.calls.at(-1)![1].headers).get('Authorization')).toBe('Bearer b')
  })
})
