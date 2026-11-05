import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CategoryDetailPage from '../pages/CategoryDetailPage'
import * as api from '../lib/api'
import type { CategoryDetailDto } from '../types/category'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof api>('../lib/api')
  return {
    ...actual,
    getCategoryDetail: vi.fn(),
  }
})

const MOCK_DETAIL_POPULATED: CategoryDetailDto = {
  category: {
    id: 'cat-1',
    name: 'Món chính',
    slug: 'mon-chinh',
    description: 'Các món ăn chính trong bữa cơm',
    recipeCount: 42,
  },
  recipes: {
    items: [
      {
        id: 'rec-1',
        title: 'Phở Bò Hà Nội',
        slug: 'pho-bo-ha-noi',
        description: 'Món phở truyền thống trứ danh',
        prepTime: 30,
        cookTime: 120,
        servings: 4,
        difficulty: 'MEDIUM',
        status: 'PUBLISHED',
        categoryId: 'cat-1',
        categoryName: 'Món chính',
        authorId: 'auth-1',
        authorName: 'Nguyễn Văn An',
        createdAt: '2026-01-01',
      },
      {
        id: 'rec-2',
        title: 'Bún Chả Nem Rán',
        slug: 'bun-cha-nem-ran',
        description: 'Bún chả đậm đà hương vị',
        prepTime: 20,
        cookTime: 40,
        servings: 2,
        difficulty: 'EASY',
        status: 'DRAFT',
        categoryId: 'cat-1',
        categoryName: 'Món chính',
        authorId: 'auth-2',
        authorName: 'Trần Minh Bình',
        createdAt: '2026-01-02',
      },
    ],
    totalCount: 42,
    page: 1,
    pageSize: 12,
    totalPages: 4,
    hasNextPage: true,
    hasPreviousPage: false,
  },
}

const MOCK_DETAIL_EMPTY: CategoryDetailDto = {
  category: {
    id: 'cat-2',
    name: 'Món chay',
    slug: 'mon-chay',
    description: 'Các món thuần chay thanh đạm',
    recipeCount: 0,
  },
  recipes: {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 12,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
}

function renderCategoryDetail(slug = 'mon-chinh') {
  return render(
    <MemoryRouter initialEntries={[`/categories/${slug}`]}>
      <Routes>
        <Route path="/categories/:slug" element={<CategoryDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CategoryDetailPage (Screen M5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders loading skeleton state initially (#category-detail-2-loading)', () => {
    vi.mocked(api.getCategoryDetail).mockReturnValue(new Promise(() => {}))
    renderCategoryDetail()

    expect(screen.getByTestId('category-detail-loading')).toBeInTheDocument()
  })

  it('renders populated category details and recipes (#category-detail-1-populated)', async () => {
    vi.mocked(api.getCategoryDetail).mockResolvedValue(MOCK_DETAIL_POPULATED)
    renderCategoryDetail()

    await waitFor(() => {
      expect(screen.queryByTestId('category-detail-loading')).not.toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Món chính' })).toBeInTheDocument()
    expect(screen.getByText(/42 công thức/)).toBeInTheDocument()
    expect(screen.getByTestId('category-detail-grid')).toBeInTheDocument()

    expect(screen.getByText('Phở Bò Hà Nội')).toBeInTheDocument()
    expect(screen.getByText('Bún Chả Nem Rán')).toBeInTheDocument()
    expect(screen.getByText('Bản nháp')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()

    expect(screen.getByTestId('category-detail-pagination')).toBeInTheDocument()
    expect(screen.getByText('Trang 1 / 4')).toBeInTheDocument()
  })

  it('renders empty state when category has 0 recipes (#category-detail-3-empty)', async () => {
    vi.mocked(api.getCategoryDetail).mockResolvedValue(MOCK_DETAIL_EMPTY)
    renderCategoryDetail('mon-chay')

    await waitFor(() => {
      expect(screen.queryByTestId('category-detail-loading')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('category-detail-empty')).toBeInTheDocument()
    expect(screen.getByText('Chưa có công thức nào')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem tất cả danh mục' })).toBeInTheDocument()
  })

  it('renders 404 state when category slug is invalid (AC4)', async () => {
    vi.mocked(api.getCategoryDetail).mockRejectedValue(
      new api.ApiError(404, 'Category not found', {
        type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
        title: 'Not Found',
        status: 404,
        detail: 'Category not found',
      }),
    )
    renderCategoryDetail('khong-ton-tai')

    await waitFor(() => {
      expect(screen.queryByTestId('category-detail-loading')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('category-detail-404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Không tìm thấy danh mục' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem tất cả danh mục' })).toBeInTheDocument()
  })
})
