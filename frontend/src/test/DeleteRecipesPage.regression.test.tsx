import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteRecipesPage from '../pages/DeleteRecipesPage'
import { ApiError, deleteRecipe, getManagedRecipes } from '../lib/api'
import { useAuthStore } from '../store'
import type { Recipe, RecipePage } from '../types/recipe'

vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  getManagedRecipes: vi.fn(),
  deleteRecipe: vi.fn(),
}))
const session = {
  accessToken: 'access-owner-a',
  refreshToken: 'fixture',
  expiresAt: '2099-01-01',
  user: {
    id: 'owner-a',
    email: 'a@example.invalid',
    fullName: 'Owner A',
    userName: 'owner-a',
    roles: ['AUTHOR'],
  },
}
const rows = Array.from({ length: 13 }, (_, index) => ({
  id: 'r' + (index + 1),
  title: 'Review recipe ' + (index + 1),
  description: 'Review fixture',
  slug: 'review-' + index,
  status: 'DRAFT',
  authorId: 'owner-a',
  updatedAt: '2026-10-28',
  version: 1,
  steps: [],
})) as Recipe[]
function page(items = rows.slice(0, 12), totalCount = 13, currentPage = 1): RecipePage {
  return {
    items,
    meta: {
      page: currentPage,
      pageSize: 12,
      totalCount,
      totalPages: Math.ceil(totalCount / 12),
      hasNextPage: currentPage < Math.ceil(totalCount / 12),
      hasPreviousPage: currentPage > 1,
    },
  }
}
function open() {
  render(
    <MemoryRouter>
      <DeleteRecipesPage />
    </MemoryRouter>,
  )
  return userEvent.setup()
}
beforeEach(() => {
  vi.mocked(getManagedRecipes).mockReset()
  vi.mocked(deleteRecipe).mockReset().mockResolvedValue(null)
  useAuthStore.getState().setSession(session)
})
describe('Recipe deletion regressions', () => {
  it('keeps the 13th recipe reachable after deleting from a full first page', async () => {
    let remaining = [...rows]
    vi.mocked(getManagedRecipes).mockImplementation(async (_token, number = 1) =>
      page(remaining.slice((number - 1) * 12, number * 12), remaining.length, number),
    )
    vi.mocked(deleteRecipe).mockImplementation(async (_token, id) => {
      remaining = remaining.filter((r) => r.id !== id)
      return null
    })
    const user = open()
    await screen.findByRole('article', { name: rows[0].title })
    const item = await screen.findByRole('article', { name: rows[0].title })
    await user.click(within(item).getByRole('button', { name: 'Xóa' }))
    await user.click(within(item).getByRole('button', { name: 'Xác nhận xóa' }))
    await waitFor(() =>
      expect(screen.queryByRole('article', { name: rows[0].title })).not.toBeInTheDocument(),
    )
    expect(remaining).toHaveLength(12)
    // The database still has recipe 13, which should remain visible or reachable.
    expect(await screen.findByRole('article', { name: rows[12].title })).toBeInTheDocument()
    expect(screen.getByText('Trang 1/1 · 12 công thức')).toBeInTheDocument()
  })
  it('reloads and clears previous data after the authenticated account changes', async () => {
    vi.mocked(getManagedRecipes).mockImplementation(async (token) =>
      token === session.accessToken ? page() : page([], 0),
    )
    open()
    await screen.findByRole('article', { name: rows[0].title })
    act(() =>
      useAuthStore.getState().setSession({
        ...session,
        accessToken: 'access-owner-b',
        user: { ...session.user, id: 'owner-b', email: 'b@example.invalid' },
      }),
    )
    await waitFor(() => expect(getManagedRecipes).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('article', { name: rows[0].title })).not.toBeInTheDocument()
  })
  it('allows retrying next-page navigation after a network failure', async () => {
    vi.mocked(getManagedRecipes)
      .mockResolvedValueOnce(page(rows.slice(0, 12), 24))
      .mockRejectedValueOnce(new ApiError(0, 'Offline', null))
      .mockResolvedValue(page([rows[12]], 24, 2))
    const user = open()
    await screen.findByRole('article', { name: rows[0].title })
    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    await waitFor(() => expect(getManagedRecipes).toHaveBeenCalledTimes(3))
    expect(await screen.findByRole('article', { name: rows[12].title })).toBeInTheDocument()
  })
})

describe('Account and pagination lifecycle', () => {
  it('returns to the previous page when the last recipe on page two is deleted', async () => {
    let remaining = [...rows]
    vi.mocked(getManagedRecipes).mockImplementation(async (_token, number = 1) =>
      page(remaining.slice((number - 1) * 12, number * 12), remaining.length, number),
    )
    vi.mocked(deleteRecipe).mockImplementation(async (_token, id) => {
      remaining = remaining.filter((r) => r.id !== id)
      return null
    })
    const user = open()
    await screen.findByRole('article', { name: rows[0].title })
    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    const item = await screen.findByRole('article', { name: rows[12].title })
    await user.click(within(item).getByRole('button', { name: 'Xóa' }))
    await user.click(within(item).getByRole('button', { name: 'Xác nhận xóa' }))
    expect(await screen.findByRole('article', { name: rows[0].title })).toBeInTheDocument()
    expect(screen.getByText('Trang 1/1 · 12 công thức')).toBeInTheDocument()
    expect(remaining).toHaveLength(12)
  })
  it('clamps the current page when concurrent deletions make it invalid', async () => {
    vi.mocked(getManagedRecipes)
      .mockResolvedValueOnce(page(rows.slice(0, 12), 13))
      .mockResolvedValueOnce(page([], 0, 2))
      .mockResolvedValue(page([], 0, 1))
    const user = open()
    await screen.findByRole('article', { name: rows[0].title })
    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByText('Chưa có công thức')).toBeInTheDocument()
    expect(vi.mocked(getManagedRecipes).mock.calls.map((call) => call[1])).toEqual([1, 2, 1])
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeEnabled()
  })
  it('ignores a late list response from the previous account', async () => {
    let resolveOld!: (value: RecipePage) => void
    vi.mocked(getManagedRecipes)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve
          }),
      )
      .mockResolvedValue(page([], 0))
    open()
    await waitFor(() => expect(getManagedRecipes).toHaveBeenCalledTimes(1))
    act(() =>
      useAuthStore.getState().setSession({
        ...session,
        accessToken: 'access-owner-b',
        user: { ...session.user, id: 'owner-b' },
      }),
    )
    await screen.findByText('Chưa có công thức')
    await act(async () => resolveOld(page()))
    expect(screen.queryByRole('article', { name: rows[0].title })).not.toBeInTheDocument()
  })
  it('does not sign out a new account when an old deletion returns 401', async () => {
    let rejectOld!: (reason: unknown) => void
    vi.mocked(getManagedRecipes).mockResolvedValueOnce(page()).mockResolvedValue(page([], 0))
    vi.mocked(deleteRecipe).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectOld = reject
        }),
    )
    const user = open()
    const item = await screen.findByRole('article', { name: rows[0].title })
    await user.click(within(item).getByRole('button', { name: 'Xóa' }))
    await user.click(within(item).getByRole('button', { name: 'Xác nhận xóa' }))
    act(() =>
      useAuthStore.getState().setSession({
        ...session,
        accessToken: 'access-owner-b',
        user: { ...session.user, id: 'owner-b' },
      }),
    )
    await screen.findByText('Chưa có công thức')
    await act(async () => rejectOld(new ApiError(401, 'Expired', null)))
    expect(useAuthStore.getState().session?.user.id).toBe('owner-b')
    expect(screen.queryByText('Đã xóa công thức.')).not.toBeInTheDocument()
  })
  it('does not reload the account data on token rotation alone', async () => {
    vi.mocked(getManagedRecipes).mockResolvedValue(page())
    open()
    await screen.findByRole('article', { name: rows[0].title })
    act(() => useAuthStore.getState().setSession({ ...session, accessToken: 'rotated-owner-a' }))
    expect(getManagedRecipes).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('article', { name: rows[0].title })).toBeInTheDocument()
  })
  it('reloads when the same account gains Admin permissions', async () => {
    vi.mocked(getManagedRecipes).mockResolvedValue(page())
    open()
    await screen.findByRole('article', { name: rows[0].title })
    act(() =>
      useAuthStore
        .getState()
        .setSession({ ...session, user: { ...session.user, roles: ['ADMIN'] } }),
    )
    await waitFor(() => expect(getManagedRecipes).toHaveBeenCalledTimes(2))
  })
})
