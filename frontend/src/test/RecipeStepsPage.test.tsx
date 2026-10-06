import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RecipeStepsPage from '../pages/RecipeStepsPage'
import * as api from '../lib/api'
import { saveSession } from '../lib/tokenStorage'

vi.mock('../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/api')>()
  return {
    ...original,
    getManagedRecipes: vi.fn(),
    getRecipeSteps: vi.fn(),
    addRecipeStep: vi.fn(),
    updateRecipeStep: vi.fn(),
    deleteRecipeStep: vi.fn(),
  }
})
const recipes = [
  {
    id: 'recipe-1',
    title: 'Canh rau',
    authorId: 'owner',
    status: 'DRAFT' as const,
  },
  {
    id: 'recipe-2',
    title: 'Cơm chiên',
    authorId: 'owner',
    status: 'DRAFT' as const,
  },
]
const first = {
  id: 'step-1',
  stepNumber: 1,
  title: 'Rửa rau',
  description: 'Rửa sạch rau',
  timerMinutes: 0,
}
const second = {
  id: 'step-2',
  stepNumber: 2,
  title: 'Nấu rau',
  description: 'Nấu trong nước sôi',
  timerMinutes: 5,
}
function show() {
  render(
    <MemoryRouter>
      <RecipeStepsPage />
    </MemoryRouter>,
  )
}
async function loaded() {
  await screen.findByRole('heading', { name: 'Rửa rau' })
}
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.resetAllMocks()
  saveSession({
    accessToken: 'token',
    refreshToken: 'refresh',
    expiresAt: '2099-01-01',
    user: {
      id: 'owner',
      fullName: 'Author',
      email: 'author@example.com',
      userName: 'author',
      roles: ['AUTHOR'],
    },
  })
  vi.mocked(api.getManagedRecipes).mockResolvedValue(recipes)
  vi.mocked(api.getRecipeSteps).mockResolvedValue({
    recipe: recipes[0],
    steps: [first, second],
  })
})

describe('Recipe step management', () => {
  it('loads recipe choices and displays persisted steps including a zero minute timer', async () => {
    show()
    await loaded()
    expect(api.getManagedRecipes).toHaveBeenCalledWith('token')
    expect(api.getRecipeSteps).toHaveBeenCalledWith('token', 'recipe-1')
    expect(screen.getByText('Thời gian: 0 phút')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Các bước thực hiện (2)' })).toBeInTheDocument()
  })
  it('adds a step with the server-assigned number', async () => {
    vi.mocked(api.addRecipeStep).mockResolvedValue({
      ...first,
      id: 'step-3',
      stepNumber: 3,
      title: 'Dọn món',
      description: 'Cho ra bát',
    })
    show()
    await loaded()
    await userEvent.type(screen.getByLabelText('Tiêu đề *'), 'Dọn món')
    await userEvent.type(screen.getByLabelText('Mô tả *'), 'Cho ra bát')
    await userEvent.click(screen.getByRole('button', { name: 'Thêm bước' }))
    expect(await screen.findByRole('heading', { name: 'Dọn món' })).toBeInTheDocument()
    expect(api.addRecipeStep).toHaveBeenCalledWith('token', 'recipe-1', {
      title: 'Dọn món',
      description: 'Cho ra bát',
      timerMinutes: undefined,
      imageUrl: undefined,
    })
    expect(screen.getByLabelText('Tiêu đề *')).toHaveValue('')
  })
  it('edits a step and preserves its identity', async () => {
    vi.mocked(api.updateRecipeStep).mockResolvedValue({
      ...first,
      title: 'Rửa kỹ rau',
    })
    show()
    await loaded()
    await userEvent.click(screen.getByRole('button', { name: 'Sửa bước 1' }))
    await userEvent.clear(screen.getByLabelText('Tiêu đề *'))
    await userEvent.type(screen.getByLabelText('Tiêu đề *'), 'Rửa kỹ rau')
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await screen.findByRole('heading', { name: 'Rửa kỹ rau' })
    expect(api.updateRecipeStep).toHaveBeenCalledWith(
      'token',
      'recipe-1',
      'step-1',
      expect.objectContaining({
        title: 'Rửa kỹ rau',
        description: first.description,
        timerMinutes: 0,
      }),
    )
  })
  it('confirms deletion and reloads the renumbered steps from the API', async () => {
    vi.mocked(api.deleteRecipeStep).mockResolvedValue(null)
    show()
    await loaded()
    await userEvent.click(screen.getByRole('button', { name: 'Xóa bước 1' }))
    expect(api.deleteRecipeStep).not.toHaveBeenCalled()
    vi.mocked(api.getRecipeSteps).mockResolvedValue({
      recipe: recipes[0],
      steps: [{ ...second, stepNumber: 1 }],
    })
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Xác nhận xóa',
      }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Rửa rau' })).not.toBeInTheDocument(),
    )
    expect(api.deleteRecipeStep).toHaveBeenCalledWith('token', 'recipe-1', 'step-1')
    expect(await screen.findByRole('button', { name: 'Sửa bước 1' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sửa bước 2' })).not.toBeInTheDocument()
    expect(api.getRecipeSteps).toHaveBeenCalledTimes(2)
  })
  it('keeps the step and form content when an API mutation fails', async () => {
    vi.mocked(api.updateRecipeStep).mockRejectedValue(new api.ApiError(403, 'Forbidden', null))
    show()
    await loaded()
    await userEvent.click(screen.getByRole('button', { name: 'Sửa bước 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn không có quyền')
    expect(screen.getByLabelText('Tiêu đề *')).toHaveValue(first.title)
    expect(screen.getByRole('heading', { name: first.title })).toBeInTheDocument()
  })
  it('shows an empty state for authors without recipes', async () => {
    vi.mocked(api.getManagedRecipes).mockResolvedValue([])
    show()
    expect(
      await screen.findByText('Bạn chưa có công thức nào để quản lý bước nấu.'),
    ).toBeInTheDocument()
    expect(api.getRecipeSteps).not.toHaveBeenCalled()
  })
  it('switches recipes and clears an unfinished edit', async () => {
    show()
    await loaded()
    await userEvent.click(screen.getByRole('button', { name: 'Sửa bước 1' }))
    vi.mocked(api.getRecipeSteps).mockResolvedValue({
      recipe: recipes[1],
      steps: [],
    })
    await userEvent.selectOptions(screen.getByLabelText('Chọn công thức'), 'recipe-2')
    expect(await screen.findByText('Chưa có bước nấu. Hãy thêm bước đầu tiên.')).toBeInTheDocument()
    expect(screen.getByLabelText('Tiêu đề *')).toHaveValue('')
    expect(api.getRecipeSteps).toHaveBeenLastCalledWith('token', 'recipe-2')
  })
})
