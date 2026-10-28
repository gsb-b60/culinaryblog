import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { saveSession } from '../lib/tokenStorage'
import type { Recipe, RecipePage } from '../types/recipe'

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: '2099-01-01',
  user: {
    id: 'owner-1',
    email: 'test@example.com',
    fullName: 'Owner',
    userName: 'owner',
    roles: ['AUTHOR'],
  },
}
const recipe: Recipe = {
  id: 'recipe-1',
  title: 'Canh rau củ',
  description: 'Công thức canh rau củ thanh mát',
  slug: 'canh-rau-cu',
  status: 'DRAFT',
  authorId: 'owner-1',
  updatedAt: '2026-01-01',
  version: 1,
  steps: [{ id: 'step-1', stepNumber: 1, title: 'Nấu', description: 'Đun nước' }],
}
const recipePage: RecipePage = {
  items: [recipe],
  meta: {
    page: 1,
    pageSize: 12,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
}
const fetchMock = vi.fn()

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function openDashboard() {
  render(
    <MemoryRouter initialEntries={['/dashboard/recipes']}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  saveSession(session)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(response(recipePage))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Dashboard recipe deletion page', () => {
  it('opens from its separate Dashboard menu item and deletes after confirmation', async () => {
    fetchMock.mockResolvedValueOnce(response(recipePage))
    fetchMock.mockResolvedValueOnce(response(recipePage))
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    fetchMock.mockResolvedValueOnce(
      response({
        items: [],
        meta: { ...recipePage.meta, totalCount: 0, totalPages: 0 },
      }),
    )
    openDashboard()
    const user = userEvent.setup()

    await user.click(screen.getAllByRole('link', { name: 'Xóa công thức' })[0])

    expect(await screen.findByRole('heading', { name: 'Xóa công thức' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Xóa công thức' })[0]).toHaveAttribute(
      'aria-current',
      'page',
    )
    const article = await screen.findByRole('article', { name: recipe.title })
    await user.click(within(article).getByRole('button', { name: 'Xóa' }))
    expect(
      within(article).getByRole('group', { name: `Xác nhận xóa ${recipe.title}` }),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === 'DELETE')).toHaveLength(0)

    await user.click(within(article).getByRole('button', { name: 'Xác nhận xóa' }))

    expect(await screen.findByText('Đã xóa công thức.')).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: recipe.title })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls[2][0]).toContain('/recipes/recipe-1')
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer access' },
    })
  })

  it('keeps the recipe visible when deletion is rejected', async () => {
    fetchMock.mockResolvedValueOnce(response(recipePage))
    fetchMock.mockResolvedValueOnce(response(recipePage))
    fetchMock.mockResolvedValueOnce(response({ detail: 'Forbidden' }, 403))
    openDashboard()
    const user = userEvent.setup()

    await user.click(screen.getAllByRole('link', { name: 'Xóa công thức' })[0])
    const article = await screen.findByRole('article', { name: recipe.title })
    await user.click(within(article).getByRole('button', { name: 'Xóa' }))
    await user.click(within(article).getByRole('button', { name: 'Xác nhận xóa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('không có quyền xóa')
    expect(screen.getByRole('article', { name: recipe.title })).toBeInTheDocument()
    expect(screen.queryByText('Đã xóa công thức.')).not.toBeInTheDocument()
  })
})
