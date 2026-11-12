import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteRecipesPage from '../pages/DeleteRecipesPage'
import { saveSession } from '../lib/tokenStorage'

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: '2099-01-01',
  user: {
    id: 'owner',
    email: 'owner@example.invalid',
    fullName: 'Owner',
    userName: 'owner',
    roles: ['AUTHOR'],
  },
}
const recipe = {
  id: 'recipe-a',
  title: 'Recovery recipe',
  description: 'Fixture',
  slug: 'recovery',
  status: 'DRAFT',
  authorId: 'owner',
  updatedAt: '2026-10-28',
  version: 1,
  steps: [],
}
const meta = {
  page: 1,
  pageSize: 12,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  saveSession(session)
})
afterEach(() => vi.unstubAllGlobals())
function open() {
  render(
    <MemoryRouter>
      <DeleteRecipesPage />
    </MemoryRouter>,
  )
  return userEvent.setup()
}
async function confirm(user: ReturnType<typeof userEvent.setup>) {
  const article = await screen.findByRole('article', { name: recipe.title })
  await user.click(within(article).getByRole('button', { name: 'Xóa' }))
  await user.click(within(article).getByRole('button', { name: 'Xác nhận xóa' }))
}

describe('real API client deletion recovery', () => {
  it('keeps deletion success separate from a failed list reload and permits retry', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ items: [recipe], meta }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json({}, 500))
      .mockResolvedValueOnce(json({ items: [], meta: { ...meta, totalCount: 0, totalPages: 0 } }))
    const user = open()
    await confirm(user)
    const alert = await screen.findByRole('alert')
    expect(screen.getByText('Đã xóa công thức.')).toBeInTheDocument()
    expect(alert).toHaveTextContent('tải danh sách')
    expect(alert).not.toHaveTextContent('Không thể xóa công thức')
    expect(screen.queryByRole('article', { name: recipe.title })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(await screen.findByText('Chưa có công thức')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === 'DELETE')).toHaveLength(1)
  })

  it('reports a genuine deletion failure and keeps the recipe visible', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ items: [recipe], meta }))
      .mockResolvedValueOnce(json({}, 500))
    const user = open()
    await confirm(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể xóa công thức')
    expect(screen.getByRole('article', { name: recipe.title })).toBeInTheDocument()
    expect(screen.queryByText('Đã xóa công thức.')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('uses a list-loading error when the initial request fails', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 500))
    open()
    expect(await screen.findByRole('alert')).toHaveTextContent('tải danh sách')
    expect(screen.queryByText('Đã xóa công thức.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeEnabled()
  })
})
