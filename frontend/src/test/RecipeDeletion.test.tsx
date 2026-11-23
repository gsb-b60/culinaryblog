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

function openDashboard(path = '/dashboard/recipes') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

async function chooseDelete(user: ReturnType<typeof userEvent.setup>, article: HTMLElement) {
  await user.click(within(article).getByRole('button', { name: `Thao tác ${recipe.title}` }))
  await user.click(within(article).getByRole('button', { name: 'Xóa' }))
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

describe('Recipe deletion in management', () => {
  it('redirects the old deletion URL to recipe management', async () => {
    openDashboard('/dashboard/recipes/delete')
    expect(await screen.findByRole('article', { name: recipe.title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Công thức của tôi' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Xóa công thức' })).not.toBeInTheDocument()
  })

  it('cancels deletion without calling the API', async () => {
    openDashboard()
    const user = userEvent.setup()
    const article = await screen.findByRole('article', { name: recipe.title })
    await chooseDelete(user, article)
    await user.click(within(article).getByRole('button', { name: 'Hủy' }))
    expect(within(article).queryByRole('button', { name: 'Xác nhận xóa' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === 'DELETE')).toHaveLength(0)
  })

  it('deletes from the management list after confirmation', async () => {
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

    const article = await screen.findByRole('article', { name: recipe.title })
    expect(screen.queryByRole('link', { name: 'Xóa công thức' })).not.toBeInTheDocument()
    await chooseDelete(user, article)
    expect(
      within(article).getByRole('group', { name: `Xác nhận xóa ${recipe.title}` }),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === 'DELETE')).toHaveLength(0)

    await user.click(within(article).getByRole('button', { name: 'Xác nhận xóa' }))

    expect(await screen.findByText('Đã xóa công thức.')).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: recipe.title })).not.toBeInTheDocument()
    const deletion = fetchMock.mock.calls.find(([, init]) => init.method === 'DELETE')
    expect(deletion?.[0]).toContain('/recipes/recipe-1')
    expect(deletion?.[1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer access' },
    })
  })

  it('keeps the recipe visible when deletion is rejected', async () => {
    fetchMock.mockResolvedValueOnce(response(recipePage))
    fetchMock.mockResolvedValueOnce(response({ detail: 'Forbidden' }, 403))
    openDashboard()
    const user = userEvent.setup()

    const article = await screen.findByRole('article', { name: recipe.title })
    await chooseDelete(user, article)
    await user.click(within(article).getByRole('button', { name: 'Xác nhận xóa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('không có quyền xóa')
    expect(screen.getByRole('article', { name: recipe.title })).toBeInTheDocument()
    expect(screen.queryByText('Đã xóa công thức.')).not.toBeInTheDocument()
  })
})
