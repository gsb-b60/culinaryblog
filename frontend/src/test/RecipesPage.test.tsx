import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import RecipesPage from '../pages/RecipesPage'
import { saveSession } from '../lib/tokenStorage'
import type { RecipeSummary } from '../types/recipe'

const id = '44444444-4444-4444-8444-444444444444'
let recipes: RecipeSummary[]
let failArchive: boolean
const fetchMock = vi.fn()
const session = {
  accessToken: 'access-token', refreshToken: 'refresh-token', expiresAt: '2099-01-01',
  user: { id: 'owner', fullName: 'Author', userName: 'author', email: 'author@example.com', roles: ['AUTHOR'] },
}
function renderPage(management = true) {
  return render(<MemoryRouter><RecipesPage management={management} /></MemoryRouter>)
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  saveSession(session)
  failArchive = false
  recipes = [{ id, title: 'Phở bò', slug: 'pho-bo', description: 'Công thức phở bò ngon',
    status: 'PUBLISHED', authorId: 'owner', authorName: 'Author' }]
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const parsed = new URL(url)
    if (init?.method === 'PATCH') {
      if (failArchive) return new Response(JSON.stringify({ detail: 'Bạn không có quyền lưu trữ công thức này.' }), { status: 403 })
      recipes[0].status = 'ARCHIVED'
      return new Response(JSON.stringify({ id, status: 'ARCHIVED', message: 'Recipe archived successfully' }), { status: 200 })
    }
    const management = parsed.pathname.endsWith('/manageable')
    const status = parsed.searchParams.get('status')
    const items = recipes.filter(recipe => management ? !status || recipe.status === status : recipe.status === 'PUBLISHED')
    return new Response(JSON.stringify({
      items, meta: { page: 1, pageSize: 12, totalCount: items.length, totalPages: items.length ? 1 : 0,
        hasNextPage: false, hasPreviousPage: false },
    }), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('Archive Recipe interface and API client', () => {
  it('confirms archive, sends authenticated PATCH, retains Archived in management and hides public listing', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await user.click(await screen.findByRole('button', { name: 'Lưu trữ' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Nội dung, nguyên liệu/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Xác nhận lưu trữ' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu trữ')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Phở bò' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lưu trữ' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`/recipes/${id}/archive`), expect.objectContaining({
      method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Trạng thái' }), 'ARCHIVED')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('status=ARCHIVED'), expect.anything(),
    ))
    expect(await screen.findByRole('heading', { name: 'Phở bò' })).toBeInTheDocument()
    view.unmount()
    renderPage(false)
    expect(await screen.findByText('Chưa có công thức phù hợp.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Phở bò' })).not.toBeInTheDocument()
  })

  it('cancel leaves the recipe published and does not PATCH', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Lưu trữ' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hủy' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(recipes[0].status).toBe('PUBLISHED')
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)
  })

  it('shows server errors, keeps dialog open and permits retry', async () => {
    const user = userEvent.setup()
    failArchive = true
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Lưu trữ' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xác nhận lưu trữ' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn không có quyền')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(recipes[0].status).toBe('PUBLISHED')
    failArchive = false
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xác nhận lưu trữ' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu trữ')
  })

  it('public browsing has no archive controls', async () => {
    renderPage(false)
    expect(await screen.findByRole('heading', { name: 'Phở bò' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lưu trữ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('shows a load error and retries successfully', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('heading', { name: 'Phở bò' })).toBeInTheDocument()
  })
});
