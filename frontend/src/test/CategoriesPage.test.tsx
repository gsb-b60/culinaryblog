import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CategoriesPage from '../pages/CategoriesPage'
import * as api from '../lib/api'
import type { CategoryDto } from '../types/category'

vi.mock('../lib/api', () => ({
  getCategories: vi.fn(),
}))

const MOCK_CATEGORIES: CategoryDto[] = [
  {
    id: 'cat-1',
    name: 'Món chính',
    slug: 'mon-chinh',
    description: 'Các món ăn chính trong bữa cơm Việt Nam',
    recipeCount: 42,
  },
  {
    id: 'cat-2',
    name: 'Đồ uống',
    slug: 'do-uong',
    description: 'Trà, cafe, sinh tố',
    recipeCount: 18,
  },
]

function renderCategories() {
  return render(
    <MemoryRouter initialEntries={['/categories']}>
      <CategoriesPage />
    </MemoryRouter>,
  )
}

describe('CategoriesPage (Screen M4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders loading skeleton state initially', () => {
    vi.mocked(api.getCategories).mockReturnValue(new Promise(() => {}))
    renderCategories()

    expect(screen.getByTestId('categories-loading')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Danh mục công thức' })).toBeInTheDocument()
  })

  it('renders category cards with recipe count when data is populated', async () => {
    vi.mocked(api.getCategories).mockResolvedValue(MOCK_CATEGORIES)
    renderCategories()

    await waitFor(() => {
      expect(screen.queryByTestId('categories-loading')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('categories-grid')).toBeInTheDocument()
    expect(screen.getByText('Món chính')).toBeInTheDocument()
    expect(screen.getByText(/42 công thức/)).toBeInTheDocument()
    expect(screen.getByText('Đồ uống')).toBeInTheDocument()
    expect(screen.getByText(/18 công thức/)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /Món chính/ })
    expect(link).toHaveAttribute('href', '/categories/mon-chinh')
  })

  it('renders empty state when category list is empty', async () => {
    vi.mocked(api.getCategories).mockResolvedValue([])
    renderCategories()

    await waitFor(() => {
      expect(screen.queryByTestId('categories-loading')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('categories-empty')).toBeInTheDocument()
    expect(screen.getByText('Chưa có danh mục nào')).toBeInTheDocument()
  })

  it('renders error state with retry button when API fails', async () => {
    vi.mocked(api.getCategories).mockRejectedValue(new Error('Network error'))
    renderCategories()

    await waitFor(() => {
      expect(screen.queryByTestId('categories-loading')).not.toBeInTheDocument()
    })

    expect(screen.getByText(/Không thể tải danh sách danh mục/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})
