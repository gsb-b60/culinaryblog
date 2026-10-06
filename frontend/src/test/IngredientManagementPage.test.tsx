import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addRecipeIngredient,
  deleteRecipeIngredient,
  getManageableRecipes,
  getRecipeIngredients,
  updateRecipeIngredient,
} from '../lib/api'
import type { RecipeSummary } from '../lib/api'
import { saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'
import IngredientManagementPage from '../pages/IngredientManagementPage'

vi.mock('../lib/api', () => ({
  addRecipeIngredient: vi.fn(),
  ApiError: class ApiError extends Error {},
  deleteRecipeIngredient: vi.fn(),
  getManageableRecipes: vi.fn(),
  getRecipeIngredients: vi.fn(),
  updateRecipeIngredient: vi.fn(),
}))

const AUTH: AuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: '2026-10-06T00:00:00.000Z',
  user: {
    id: 'user-1',
    fullName: 'Chef',
    email: 'chef@example.com',
    userName: 'chef',
    roles: ['AUTHOR'],
  },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/ingredients']}>
      <Routes>
        <Route path="/dashboard/ingredients" element={<IngredientManagementPage />} />
        <Route path="/auth/login" element={<h1>Đăng nhập</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(getManageableRecipes).mockReset()
  vi.mocked(getRecipeIngredients).mockReset()
  vi.mocked(addRecipeIngredient).mockReset()
  vi.mocked(updateRecipeIngredient).mockReset()
  vi.mocked(deleteRecipeIngredient).mockReset()
  localStorage.clear()
  sessionStorage.clear()
  saveSession(AUTH)
  vi.mocked(getManageableRecipes).mockResolvedValue({
    items: [{
      id: 'recipe-1',
      title: 'Phở bò',
      slug: 'pho-bo',
      description: '',
      status: 'DRAFT',
      createdAt: '2026-10-05T00:00:00.000Z',
    }] satisfies RecipeSummary[],
    meta: { page: 1, pageSize: 50, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  })
  vi.mocked(getRecipeIngredients).mockResolvedValue([{
    id: 'ingredient-1',
    name: 'Muối',
    quantity: 1,
    unit: 'muỗng',
    orderIndex: 0,
  }])
  vi.mocked(addRecipeIngredient).mockResolvedValue({
    id: 'ingredient-2',
    name: 'Đường',
    quantity: 2,
    unit: 'muỗng',
    orderIndex: 1,
  })
  vi.mocked(updateRecipeIngredient).mockResolvedValue({
    id: 'ingredient-1',
    name: 'Muối biển',
    quantity: 1,
    unit: 'muỗng',
    orderIndex: 0,
  })
  vi.mocked(deleteRecipeIngredient).mockResolvedValue(null)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('IngredientManagementPage', () => {
  it('loads a user’s recipes and ingredients and adds an ingredient', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(getRecipeIngredients).toHaveBeenCalledWith('access-token', 'recipe-1'))
    expect(await screen.findByRole('heading', { name: 'Muối' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Chọn công thức' })).toHaveValue('recipe-1')
    await user.type(screen.getByRole('textbox', { name: 'Thêm - Tên nguyên liệu' }), 'Đường')
    await user.type(screen.getByRole('spinbutton', { name: 'Thêm - Số lượng' }), '2')
    await user.type(screen.getByRole('textbox', { name: 'Thêm - Đơn vị' }), 'muỗng')
    await user.click(screen.getByRole('button', { name: 'Thêm nguyên liệu' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Đã thêm nguyên liệu')
    expect(addRecipeIngredient).toHaveBeenCalledWith('access-token', 'recipe-1', {
      name: 'Đường',
      quantity: 2,
      unit: 'muỗng',
      orderIndex: 1,
    })
  }, 15000)

  it('updates and confirms deletion of an ingredient', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Sửa' }))
    const nameInput = screen.getByRole('textbox', { name: 'Sửa Muối - Tên nguyên liệu' })
    await user.clear(nameInput)
    await user.type(nameInput, 'Muối biển')
    await user.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(updateRecipeIngredient).toHaveBeenCalledWith(
      'access-token',
      'recipe-1',
      'ingredient-1',
      { name: 'Muối biển', quantity: 1, unit: 'muỗng', orderIndex: 0 },
    ))

    await user.click(await screen.findByRole('button', { name: 'Xóa' }))
    await user.click(screen.getByRole('button', { name: 'Xác nhận xóa' }))

    await waitFor(() => expect(deleteRecipeIngredient).toHaveBeenCalledWith(
      'access-token',
      'recipe-1',
      'ingredient-1',
    ))
  }, 15000)
})
