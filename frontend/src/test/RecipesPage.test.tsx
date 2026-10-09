import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { loadSession, saveSession } from '../lib/tokenStorage'
import type { Recipe, RecipePage } from '../types/recipe'

const session = {
  accessToken: 'access', refreshToken: 'refresh', expiresAt: '2099-01-01',
  user: { id: 'owner-1', email: 'test@example.com', fullName: 'Owner', userName: 'owner', roles: ['AUTHOR'] },
}
const draft: Recipe = {
  id: 'recipe-1', title: 'Canh rau củ', description: 'Công thức canh rau củ thanh mát',
  slug: 'canh-rau-cu', status: 'DRAFT', authorId: 'owner-1', updatedAt: '2026-01-01',
  version: 1, steps: [{ id: 'step-1', stepNumber: 1, title: 'Nấu', description: 'Đun nước' }],
}
function recipePage(items: Recipe[] = [draft], page = 1, totalPages = 1): RecipePage {
  return { items, meta: { page, pageSize: 12, totalCount: items.length * totalPages,
    totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } }
}
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
const fetchMock = vi.fn()
function openPage(path = '/dashboard/recipes') {
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  saveSession(session)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(response(recipePage()))
})
afterEach(() => { vi.unstubAllGlobals() })

describe('Recipe management through UI and API client', () => {
  it('navigates from Dashboard, publishes, unpublishes and preserves the status after reload', async () => {
    let stored = { ...draft }
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      expect(init.headers).toMatchObject({ Authorization: 'Bearer access' })
      if (url.endsWith('/publish')) stored = { ...stored, status: 'PUBLISHED', version: 2, updatedAt: '2026-02-01', publishedAt: '2026-02-01' }
      if (url.endsWith('/unpublish')) stored = { ...stored, status: 'DRAFT', version: 3 }
      return response(init.method === 'PATCH' ? stored : recipePage([stored]))
    })
    openPage('/dashboard')
    await userEvent.click(screen.getAllByRole('link', { name: 'Công thức' })[0])
    const article = await screen.findByRole('article', { name: draft.title })
    await userEvent.click(within(article).getByRole('button', { name: 'Xuất bản' }))
    expect(await screen.findByText('Đã xuất bản công thức.')).toBeInTheDocument()
    expect(within(article).getByText('Đã xuất bản')).toBeInTheDocument()
    await userEvent.click(within(article).getByRole('button', { name: 'Chuyển về bản nháp' }))
    expect(await screen.findByText('Đã chuyển công thức về bản nháp.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(await screen.findByRole('button', { name: 'Xuất bản' })).toBeEnabled()
    const mutations = fetchMock.mock.calls.filter(([, init]) => init.method === 'PATCH')
    expect(mutations.map(([url]) => url.split('/').at(-1))).toEqual(['publish', 'unpublish'])
  })

  it('explains why drafts without steps cannot be published and hides actions for archived recipes', async () => {
    fetchMock.mockResolvedValue(response(recipePage([
      { ...draft, steps: [] },
      { ...draft, id: 'archived', title: 'Món đã lưu trữ', status: 'ARCHIVED' },
    ])))
    openPage()
    expect(await screen.findByRole('button', { name: 'Xuất bản' })).toBeDisabled()
    expect(screen.getByText('Cần ít nhất một bước thực hiện trước khi xuất bản.')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Món đã lưu trữ' })).queryByRole('button')).not.toBeInTheDocument()
  })

  it.each([403, 404, 409, 422, 500])('keeps the previous status and shows an error for HTTP %s', async status => {
    fetchMock.mockResolvedValueOnce(response(recipePage())).mockResolvedValueOnce(response({ errors: { steps: ['Missing steps'] } }, status))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Xuất bản' }))
    expect(await screen.findByRole('alert')).not.toBeEmptyDOMElement()
    expect(screen.getByText('Bản nháp')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xuất bản' })).toBeEnabled()
    expect(screen.queryByText('Đã xuất bản công thức.')).not.toBeInTheDocument()
  })

  it('disables repeat clicks until the mutation finishes', async () => {
    let finish!: (value: Response) => void
    fetchMock.mockResolvedValueOnce(response(recipePage())).mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve }))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Xuất bản' }))
    expect(screen.getByRole('button', { name: 'Đang cập nhật...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeDisabled()
    finish(response({ ...draft, status: 'PUBLISHED' }))
    expect(await screen.findByRole('button', { name: 'Chuyển về bản nháp' })).toBeEnabled()
  })

  it('paginates using the protected management API', async () => {
    fetchMock.mockResolvedValueOnce(response(recipePage([draft], 1, 2))).mockResolvedValueOnce(response(recipePage([{ ...draft, id: 'recipe-2', title: 'Canh trang hai' }], 2, 2)))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByText('Canh trang hai')).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toContain('/recipes/manage?page=2&pageSize=12')
  })

  it('offers retry after a network failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce(response(recipePage()))
    openPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể kết nối')
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(await screen.findByText(draft.title)).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    fetchMock.mockResolvedValue(response(recipePage([], 1, 0)))
    openPage()
    expect(await screen.findByText('Chưa có công thức')).toBeInTheDocument()
  })

  it('allows Admin to manage another author recipe', async () => {
    saveSession({ ...session, user: { ...session.user, id: 'admin-1', roles: ['ADMIN'] } })
    openPage()
    expect(await screen.findByRole('button', { name: 'Xuất bản' })).toBeEnabled()
    expect(screen.getByRole('heading', { name: 'Quản lý công thức' })).toBeInTheDocument()
  })

  it('redirects signed-out visitors without requesting private data', () => {
    localStorage.clear()
    openPage()
    expect(screen.getByRole('heading', { name: /Đăng nhập/ })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes an expired token and retries the protected list', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response({ ...session, accessToken: 'rotated' }))
      .mockResolvedValueOnce(response(recipePage()))
    openPage()
    expect(await screen.findByText(draft.title)).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh')
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer rotated')
    expect(loadSession()?.accessToken).toBe('rotated')
  })

  it('redirects to login when refresh fails', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({}, 401))
    openPage()
    await waitFor(() => expect(screen.getByRole('heading', { name: /Đăng nhập/ })).toBeInTheDocument())
    expect(loadSession()).toBeNull()
  })
  it('keeps the refreshed session when a publish retry returns a business error', async () => {
    fetchMock.mockResolvedValueOnce(response(recipePage()))
      .mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response({ ...session, accessToken: 'rotated' }))
      .mockResolvedValueOnce(response({ errors: { steps: ['Missing steps'] } }, 422))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Xuất bản' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Cần ít nhất một bước')
    expect(loadSession()?.accessToken).toBe('rotated')
    expect(screen.getByRole('heading', { name: 'Công thức của tôi' })).toBeInTheDocument()
  })

})
