import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, deleteRecipe, getManageableRecipes } from '../lib/api'
import { saveSession } from '../lib/tokenStorage'
import RecipeManagementPage from '../pages/RecipeManagementPage'

vi.mock('../lib/api', async (original) => {
  const api = await original<typeof import('../lib/api')>()
  return { ...api, getManageableRecipes: vi.fn(), deleteRecipe: vi.fn() }
})
const recipe = { id: 'r', title: 'Phở bò', slug: 'pho-bo', status: 'DRAFT', authorId: 'owner', authorName: 'Owner' }
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  saveSession({
    accessToken: 'token', refreshToken: 'refresh', expiresAt: '2099-01-01',
    user: { id: 'owner', fullName: 'Owner', email: 'owner@example.com', userName: 'owner', roles: ['AUTHOR'] },
  })
  vi.mocked(getManageableRecipes).mockReset().mockResolvedValue({ items: [recipe], meta: { page: 1, totalCount: 1, totalPages: 1 } })
  vi.mocked(deleteRecipe).mockReset().mockResolvedValue(null)
})
const renderPage = () => render(<MemoryRouter><RecipeManagementPage /></MemoryRouter>)
const openDialog = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Xóa công thức Phở bò' }))
  return screen.getByRole('dialog')
}

describe('Recipe deletion UI', () => {
  it('canceling the confirmation never sends a delete request', async () => {
    renderPage()
    const dialog = await openDialog()
    expect(within(dialog).getByText(/không thể hoàn tác/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deleteRecipe).not.toHaveBeenCalled()
  })
  it('deletes only after confirmation, removes the recipe and reloads', async () => {
    renderPage()
    const dialog = await openDialog()
    vi.mocked(getManageableRecipes).mockResolvedValue({ items: [], meta: { page: 1, totalCount: 0, totalPages: 0 } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận xóa vĩnh viễn' }))
    await waitFor(() => expect(deleteRecipe).toHaveBeenCalledWith('token', 'r'))
    expect(await screen.findByText(/Đã xóa vĩnh viễn công thức/)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Xóa công thức Phở bò' })).not.toBeInTheDocument())
    expect(getManageableRecipes).toHaveBeenCalledTimes(2)
  })
  it('shows forbidden errors without removing the recipe', async () => {
    vi.mocked(deleteRecipe).mockRejectedValue(new ApiError(403, 'Forbidden', null))
    renderPage()
    const dialog = await openDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận xóa vĩnh viễn' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn không có quyền')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xóa công thức Phở bò' })).toBeInTheDocument()
  })
  it('prevents duplicate requests while deletion is pending', async () => {
    let finish!: (value: null) => void
    vi.mocked(deleteRecipe).mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    renderPage()
    const dialog = await openDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận xóa vĩnh viễn' }))
    expect(within(dialog).getByRole('button', { name: 'Đang xóa…' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Hủy' })).toBeDisabled()
    expect(deleteRecipe).toHaveBeenCalledOnce()
    finish(null)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
