import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { useAuthStore } from '../store'
import type { AuthResponse } from '../types/auth'
import type { Recipe, RecipePage } from '../types/recipe'

const accountA: AuthResponse = {
  accessToken: 'access-a', refreshToken: 'refresh-a', expiresAt: '2099-01-01',
  user: { id: 'owner-a', email: 'a@example.invalid', fullName: 'A', userName: 'a', roles: ['AUTHOR'] },
}
const accountB: AuthResponse = {
  ...accountA, accessToken: 'access-b', refreshToken: 'refresh-b',
  user: { ...accountA.user, id: 'owner-b', fullName: 'B', email: 'b@example.invalid' },
}
const rows: Recipe[] = Array.from({ length: 25 }, (_, i) => ({
  id: 'r' + (i + 1), title: 'Recipe ' + (i + 1), slug: 'recipe-' + (i + 1),
  description: 'Regression fixture', status: 'DRAFT', authorId: 'owner-a',
  updatedAt: '2026-01-01', version: 1,
  steps: [{ id: 's' + i, stepNumber: 1, title: 'Cook', description: 'Cook' }],
}))
const rowB: Recipe = { ...rows[0], id: 'b-1', title: 'Recipe B', authorId: 'owner-b' }
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
function paged(items: Recipe[], page = 1, pageSize = 12): RecipePage {
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, pageSize, totalCount: items.length, totalPages: Math.ceil(items.length / pageSize),
      hasNextPage: page < Math.ceil(items.length / pageSize), hasPreviousPage: page > 1 },
  }
}
const fetchMock = vi.fn()
const ingredientRequests = () => fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/ingredients'))
function open(path = '/dashboard/recipes') {
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}
beforeEach(() => {
  useAuthStore.getState().setSession(accountA)
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const query = new URL(url, 'http://localhost')
    if (query.pathname.endsWith('/ingredients')) return json([])
    const isB = new Headers(init?.headers).get('Authorization') === 'Bearer access-b'
    return json(paged(isB ? [rowB] : rows,
      Number(query.searchParams.get('page') ?? 1),
      Number(query.searchParams.get('pageSize') ?? 12)))
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('Recipe pagination context and identity regressions', () => {
  it('returns to the public home when signing out of the recipe list', async () => {
    open()
    await screen.findByRole('article', { name: 'Recipe 1' })
    await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đăng xuất' }))
    expect(await screen.findByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(useAuthStore.getState().session).toBeNull()
  })

  it.each([24, 50])('opens the exact ingredient recipe with %s items per page', async (size) => {
    open()
    await screen.findByRole('article', { name: 'Recipe 1' })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Số công thức mỗi trang' }), String(size))
    const item = await screen.findByRole('article', { name: 'Recipe 20' })
    const shortcut = within(item).getByRole('link', { name: 'Nguyên liệu' })
    expect(shortcut).toHaveAttribute('href', '/dashboard/ingredients?recipeId=r20&page=1&pageSize=' + size)
    await userEvent.click(shortcut)
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Chọn công thức' })).toHaveValue('r20'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Thêm nguyên liệu' })).toBeEnabled())
    expect(ingredientRequests().length).toBeGreaterThan(0)
    expect(ingredientRequests().every(([url]) => String(url).endsWith('/recipes/r20/ingredients'))).toBe(true)
  })

  it('uses the displayed page when the requested next page fails', async () => {
    const normal = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const query = new URL(url, 'http://localhost')
      if (query.pathname.endsWith('/manage') && query.searchParams.get('page') === '3') {
        return Promise.resolve(json({ detail: 'Server error' }, 500))
      }
      return normal(url, init)
    })
    open()
    await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('article', { name: 'Recipe 13' })
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('alert')
    const item = screen.getByRole('article', { name: 'Recipe 13' })
    expect(within(item).getByRole('link', { name: 'Nguyên liệu' })).toHaveAttribute(
      'href', '/dashboard/ingredients?recipeId=r13&page=2&pageSize=12',
    )
    await userEvent.click(within(item).getByRole('link', { name: 'Nguyên liệu' }))
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Chọn công thức' })).toHaveValue('r13'))
    await waitFor(() => expect(ingredientRequests().length).toBeGreaterThan(0))
    expect(ingredientRequests().every(([url]) => String(url).endsWith('/recipes/r13/ingredients'))).toBe(true)
  })

  it('preserves a missing explicit recipe and blocks edits instead of selecting another recipe', async () => {
    open('/dashboard/ingredients?recipeId=missing&page=1&pageSize=12')
    expect(await screen.findByRole('alert')).toHaveTextContent('Công thức đã chọn không có')
    expect(screen.getByRole('listbox', { name: 'Chọn công thức' })).toHaveValue('missing')
    expect(screen.getByRole('button', { name: 'Thêm nguyên liệu' })).toBeDisabled()
    expect(ingredientRequests()).toHaveLength(0)
    await userEvent.selectOptions(screen.getByRole('listbox', { name: 'Chọn công thức' }), 'r2')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Thêm nguyên liệu' })).toBeEnabled())
    expect(ingredientRequests().every(([url]) => String(url).endsWith('/recipes/r2/ingredients'))).toBe(true)
  })

  it('discards the previous account list immediately while the new account request is pending', async () => {
    open()
    await screen.findByRole('article', { name: 'Recipe 1' })
    let finish!: (response: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve }))
    act(() => useAuthStore.getState().setSession(accountB))
    expect(screen.queryByRole('article', { name: 'Recipe 1' })).not.toBeInTheDocument()
    await waitFor(() => expect(finish).toBeTypeOf('function'))
    expect(new Headers(fetchMock.mock.calls.at(-1)![1]?.headers).get('Authorization')).toBe('Bearer access-b')
    finish(json(paged([rowB])))
    expect(await screen.findByRole('article', { name: 'Recipe B' })).toBeInTheDocument()
  })

  it('aborts an old account request and ignores its late response', async () => {
    let finishA!: (response: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { finishA = resolve }))
    open()
    await waitFor(() => expect(finishA).toBeTypeOf('function'))
    const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal
    act(() => useAuthStore.getState().setSession(accountB))
    expect(await screen.findByRole('article', { name: 'Recipe B' })).toBeInTheDocument()
    expect(oldSignal.aborted).toBe(true)
    await act(async () => { finishA(json(paged(rows))); await Promise.resolve() })
    expect(screen.queryByRole('article', { name: 'Recipe 1' })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Recipe B' })).toBeInTheDocument()
  })

  it('resets private data when permissions change but does not reset for token rotation', async () => {
    open()
    await screen.findByRole('article', { name: 'Recipe 1' })
    const initialCalls = fetchMock.mock.calls.length
    act(() => useAuthStore.getState().setSession({ ...accountA, accessToken: 'rotated-a' }))
    expect(screen.getByRole('article', { name: 'Recipe 1' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(initialCalls)
    fetchMock.mockResolvedValueOnce(json(paged([])))
    act(() => useAuthStore.getState().setSession({
      ...accountA, accessToken: 'admin-a', user: { ...accountA.user, roles: ['ADMIN'] },
    }))
    expect(screen.queryByRole('article', { name: 'Recipe 1' })).not.toBeInTheDocument()
    expect(await screen.findByText('Chưa có công thức')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Quản lý công thức' })).toBeInTheDocument()
  })

  it('clears the selected ingredients and form when changing accounts', async () => {
    open('/dashboard/ingredients?recipeId=r1&page=1&pageSize=12')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Thêm nguyên liệu' })).toBeEnabled())
    await userEvent.type(screen.getByRole('textbox', { name: 'Thêm - Tên nguyên liệu' }), 'Private draft')
    act(() => useAuthStore.getState().setSession(accountB))
    expect(screen.getByRole('textbox', { name: 'Thêm - Tên nguyên liệu' })).toHaveValue('')
    expect(await screen.findByRole('alert')).toHaveTextContent('Công thức đã chọn không có')
    expect(screen.getByRole('button', { name: 'Thêm nguyên liệu' })).toBeDisabled()
    expect(ingredientRequests().filter(([, init]) => new Headers(init?.headers).get('Authorization') === 'Bearer access-b')).toHaveLength(0)
  })
})
