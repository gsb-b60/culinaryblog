import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RecipeDetailPage from '../pages/RecipeDetailPage'
import { clearSession, loadSession, saveSession } from '../lib/tokenStorage'
import type { RecipeDetail } from '../types/recipe'

const session = {
  accessToken: 'owner-token', refreshToken: 'refresh', expiresAt: '2099-01-01',
  user: { id: 'owner-1', email: 'owner@example.com', fullName: 'Owner', userName: 'owner', roles: ['AUTHOR'] },
}
const recipe: RecipeDetail = {
  id: 'real-recipe', title: 'Công thức riêng trong database', slug: 'real-recipe',
  description: 'Nội dung riêng của tác giả', status: 'ARCHIVED', authorId: 'owner-1',
  categoryId: 'category-1', categoryName: 'Canh', prepTime: 5, cookTime: 10,
  servings: 2, difficulty: 'EASY', createdAt: '2026-01-01',
  ingredients: [{ id: 'i1', name: 'Rau cải', quantity: 2, unit: 'bó', orderIndex: 0 }],
  steps: [{ id: 's1', stepNumber: 1, title: 'Nấu rau', description: 'Nấu chín rau.' }],
  images: [],
}
const fetchMock = vi.fn()
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
function openPage(slug = recipe.slug) {
  render(
    <MemoryRouter initialEntries={['/recipes/' + slug]}>
      <Link to="/recipes/other-recipe">Công thức khác</Link>
      <Routes><Route path="/recipes/:slug" element={<RecipeDetailPage />} /></Routes>
    </MemoryRouter>,
  )
}
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('Live recipe detail', () => {
  it.each(['AUTHOR', 'ADMIN'])('loads an archived recipe as %s using account credentials', async role => {
    saveSession({ ...session, user: { ...session.user, roles: [role] } })
    fetchMock.mockResolvedValue(response(recipe))
    openPage()
    expect(await screen.findByRole('heading', { name: recipe.title, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Đã lưu trữ')).toBeInTheDocument()
    expect(screen.getByText('Rau cải')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nấu rau' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toContain('/recipes/real-recipe')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer owner-token')
  })

  it('loads published detail anonymously without Authorization', async () => {
    fetchMock.mockResolvedValue(response({ ...recipe, status: 'PUBLISHED' }))
    openPage()
    expect(await screen.findByRole('heading', { name: recipe.title, level: 1 })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  it.each([403, 404])('shows HTTP %s without falling back to a static recipe with the same slug', async status => {
    fetchMock.mockResolvedValue(response({}, status))
    openPage('pho-bo-tai-nam')
    expect(await screen.findByRole('alert')).toHaveTextContent(status === 403 ? 'Không có quyền truy cập' : 'Không tìm thấy công thức')
    expect(screen.queryByRole('heading', { name: 'Phở bò tái nạm', level: 1 })).not.toBeInTheDocument()
  })

  it.each([0, 500])('offers retry after failure %s', async status => {
    if (status === 0) fetchMock.mockRejectedValueOnce(new TypeError('network'))
    else fetchMock.mockResolvedValueOnce(response({}, status))
    fetchMock.mockResolvedValueOnce(response(recipe))
    openPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải công thức')
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('heading', { name: recipe.title, level: 1 })).toBeInTheDocument()
  })

  it('hides archived content immediately after sign-out and reloads without credentials', async () => {
    saveSession(session)
    fetchMock.mockResolvedValueOnce(response(recipe)).mockResolvedValueOnce(response({}, 403))
    openPage()
    await screen.findByRole('heading', { name: recipe.title, level: 1 })
    act(() => clearSession())
    expect(screen.queryByText(recipe.description)).not.toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền truy cập')
    expect(fetchMock.mock.calls[1][1].headers).not.toHaveProperty('Authorization')
  })

  it('does not display the previous account response after switching accounts', async () => {
    let finish!: (value: Response) => void
    saveSession(session)
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve }))
      .mockResolvedValueOnce(response({}, 403))
    openPage()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    act(() => saveSession({ ...session, accessToken: 'other-token', user: { ...session.user, id: 'other-1' } }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền truy cập')
    await act(async () => finish(response(recipe)))
    expect(screen.queryByText(recipe.description)).not.toBeInTheDocument()
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('refreshes expired credentials before showing archived detail', async () => {
    saveSession(session)
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return response({ ...session, accessToken: 'rotated' })
      const token = (init.headers as Record<string, string>).Authorization
      return token === 'Bearer rotated' ? response(recipe) : response({}, 401)
    })
    openPage()
    expect(await screen.findByRole('heading', { name: recipe.title, level: 1 })).toBeInTheDocument()
    expect(loadSession()?.accessToken).toBe('rotated')
  })

  it('discards a late response from the previous slug', async () => {
    let finish!: (value: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve }))
      .mockResolvedValueOnce(response({ ...recipe, slug: 'other-recipe', title: 'Công thức mới' }))
    openPage()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await userEvent.click(screen.getByRole('link', { name: 'Công thức khác' }))
    expect(await screen.findByRole('heading', { name: 'Công thức mới', level: 1 })).toBeInTheDocument()
    await act(async () => finish(response(recipe)))
    expect(screen.queryByRole('heading', { name: recipe.title, level: 1 })).not.toBeInTheDocument()
  })
})
