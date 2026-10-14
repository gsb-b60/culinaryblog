import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../lib/api'
import { getCategories, getRecipes } from '../lib/recipes'
import RecipesPage from '../pages/RecipesPage'
import type { Category, PagedResult, RecipeSummary } from '../types/recipes'

vi.mock('../lib/recipes', () => ({ getCategories: vi.fn(), getRecipes: vi.fn() }))
const categoryId = '11111111-1111-4111-8111-111111111111'
const categories = [{ id: categoryId, name: 'Món chính' }]
const result: PagedResult<RecipeSummary> = {
  items: [{
    id: 'one', title: 'Cơm gà', slug: 'com-ga', description: 'Cơm gà thơm ngon',
    prepTime: 10, cookTime: 30, servings: 2, difficulty: 'EASY',
    categoryId, categoryName: 'Món chính', authorName: 'Đầu bếp',
  }],
  meta: { page: 1, pageSize: 12, totalCount: 25, totalPages: 3, hasNextPage: true, hasPreviousPage: false },
}

function Location() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}
function renderPage(url = '/recipes') {
  return render(<MemoryRouter initialEntries={[url]}><RecipesPage /><Location /></MemoryRouter>)
}
beforeEach(() => {
  localStorage.clear()
  vi.mocked(getCategories).mockReset().mockResolvedValue(categories)
  vi.mocked(getRecipes).mockReset().mockResolvedValue(result)
})

describe('RecipesPage', () => {
  it('loads public recipes and categories and displays the filtered total', async () => {
    renderPage()
    expect(await screen.findByText('Cơm gà')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Tìm thấy 25 công thức phù hợp')
    expect(getRecipes).toHaveBeenCalledWith({ page: 1, pageSize: 12 }, expect.any(AbortSignal))
    expect(screen.getByRole('option', { name: 'Món chính' })).toHaveValue(categoryId)
  })

  it('applies all filters and resets pagination to page one', async () => {
    const user = userEvent.setup()
    renderPage('/recipes?page=2')
    await screen.findByText('Cơm gà')
    await user.selectOptions(screen.getByLabelText('Danh mục', { exact: true }), categoryId)
    await user.selectOptions(screen.getByLabelText('Độ khó', { exact: true }), 'EASY')
    await user.type(screen.getByLabelText('Thời gian nấu tối đa (phút)'), '30')
    await user.type(screen.getByLabelText('Số khẩu phần tối thiểu'), '2')
    await user.selectOptions(screen.getByLabelText('Công thức mỗi trang'), '24')
    await user.click(screen.getByRole('button', { name: 'Áp dụng bộ lọc' }))
    await waitFor(() => expect(getRecipes).toHaveBeenLastCalledWith({
      categoryId, difficulty: 'EASY', maxCookTime: 30, minServings: 2, page: 1, pageSize: 24,
    }, expect.any(AbortSignal)))
    expect(screen.getByTestId('location')).toHaveTextContent('page=1')
  })

  it('keeps the category selected when asynchronous options arrive for a shared URL', async () => {
    let resolveCategories!: (value: Category[]) => void
    vi.mocked(getCategories).mockImplementation(() => new Promise(resolve => { resolveCategories = resolve }))
    renderPage('/recipes?categoryId=' + categoryId + '&difficulty=Easy&maxCookTime=0&minServings=2')
    expect(screen.getByLabelText('Danh mục', { exact: true })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Áp dụng bộ lọc' })).toBeDisabled()
    await act(async () => resolveCategories(categories))
    expect(screen.getByLabelText('Danh mục', { exact: true })).toHaveValue(categoryId)
    expect(screen.getByLabelText('Độ khó', { exact: true })).toHaveValue('EASY')
    expect(screen.getByLabelText('Thời gian nấu tối đa (phút)')).toHaveValue(0)
  })

  it('retains filters while going to the next page', async () => {
    renderPage('/recipes?difficulty=Easy&maxCookTime=30')
    await screen.findByText('Cơm gà')
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    await waitFor(() => expect(getRecipes).toHaveBeenLastCalledWith({
      difficulty: 'EASY', maxCookTime: 30, page: 2, pageSize: 12,
    }, expect.any(AbortSignal)))
  })

  it('clears the URL and restores default filters', async () => {
    renderPage('/recipes?difficulty=Hard&minServings=5&page=2')
    await screen.findByText('Cơm gà')
    await userEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
    await waitFor(() => expect(getRecipes).toHaveBeenLastCalledWith({ page: 1, pageSize: 12 }, expect.any(AbortSignal)))
    expect(screen.getByTestId('location')).toHaveTextContent('/recipes')
    expect(screen.getByLabelText('Số khẩu phần tối thiểu')).toHaveValue(null)
  })

  it('does not send invalid form values to the API', async () => {
    renderPage()
    await screen.findByText('Cơm gà')
    await userEvent.type(screen.getByLabelText('Số khẩu phần tối thiểu'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Áp dụng bộ lọc' }))
    expect(screen.getByText('Nhập số nguyên từ 1 đến 2147483647.')).toBeInTheDocument()
    expect(getRecipes).toHaveBeenCalledTimes(1)
  })

  it('blocks invalid shared URL values and offers reset', async () => {
    renderPage('/recipes?difficulty=Unknown')
    expect(screen.getByRole('alert')).toHaveTextContent('URL chứa bộ lọc không hợp lệ')
    expect(getRecipes).not.toHaveBeenCalled()
    await screen.findByRole('option', { name: 'Món chính' })
    await userEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
    expect(await screen.findByText('Cơm gà')).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    vi.mocked(getRecipes).mockResolvedValue({ ...result, items: [], meta: { ...result.meta, totalCount: 0, totalPages: 0 } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Không có công thức phù hợp' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Phân trang công thức' })).not.toBeInTheDocument()
  })

  it('retries failed recipe requests', async () => {
    vi.mocked(getRecipes).mockRejectedValueOnce(new ApiError(0, 'Network error', null)).mockResolvedValue(result)
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được công thức')
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Cơm gà')).toBeInTheDocument()
  })

  it('can load recipes when the category request fails and retry categories', async () => {
    vi.mocked(getCategories).mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(categories)
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được danh mục')
    expect(await screen.findByText('Cơm gà')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại danh mục' }))
    expect(await screen.findByRole('option', { name: 'Món chính' })).toBeInTheDocument()
  })

  it('aborts pending requests when the page is unmounted', async () => {
    vi.mocked(getRecipes).mockImplementation(() => new Promise(() => {}))
    vi.mocked(getCategories).mockImplementation(() => new Promise(() => {}))
    const view = renderPage()
    const recipeSignal = vi.mocked(getRecipes).mock.calls[0][1]
    const categorySignal = vi.mocked(getCategories).mock.calls[0][0]
    view.unmount()
    expect(recipeSignal?.aborted).toBe(true)
    expect(categorySignal?.aborted).toBe(true)
  })
})
