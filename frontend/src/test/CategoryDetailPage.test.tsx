import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CategoryDetailPage from '../pages/CategoryDetailPage'
import { useAuthStore } from '../store'

const fetchMock = vi.fn()

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function recipe(id: string, title: string, status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED') {
  return {
    id,
    title,
    slug: id,
    description: `Mô tả ${title}`,
    prepTime: 15,
    cookTime: 30,
    servings: 2,
    difficulty: 'MEDIUM',
    status,
    categoryId: 'cat-1',
    categoryName: 'Món chính',
    authorId: 'user-1',
    authorName: 'Nguyễn Văn An',
    createdAt: '2026-01-01T00:00:00.000Z',
    publishedAt: status === 'PUBLISHED' ? '2026-01-02T00:00:00.000Z' : undefined,
  }
}

function categoryDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    name: 'Món chính',
    slug: 'mon-chinh',
    description: 'Các món ăn chính trong bữa cơm',
    orderIndex: 1,
    recipeCount: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    recipes: {
      items: [recipe('pho-bo', 'Phở bò'), recipe('bun-cha', 'Bún chả', 'DRAFT')],
      meta: { page: 1, pageSize: 12, totalCount: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    },
    ...overrides,
  }
}

function mount(url = '/categories/mon-chinh') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/categories/:slug" element={<CategoryDetailPage />} />
          <Route path="/dashboard/categories/:slug" element={<CategoryDetailPage />} />
          <Route path="/categories" element={<p>Danh sách danh mục</p>} />
          <Route path="/dashboard/categories" element={<p>Danh sách danh mục dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ session: null })
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  useAuthStore.setState({ session: null })
  vi.unstubAllGlobals()
})

describe('CategoryDetailPage', () => {
  it('renders the category, published recipes and the author draft badge', async () => {
    fetchMock.mockResolvedValue(json(categoryDetail()))

    mount()

    expect(await screen.findByRole('heading', { name: 'Món chính' })).toBeInTheDocument()
    expect(screen.getByText('Các món ăn chính trong bữa cơm')).toBeInTheDocument()
    expect(screen.getByText('Phở bò')).toBeInTheDocument()
    expect(screen.getByText('Bún chả')).toBeInTheDocument()
    expect(screen.getByText('Bản nháp')).toBeInTheDocument()
    expect(screen.getByText('2 công thức')).toBeInTheDocument()
  })

  it('shows the empty state when a category has no recipes', async () => {
    fetchMock.mockResolvedValue(json(categoryDetail({
      recipeCount: 0,
      recipes: {
        items: [],
        meta: { page: 1, pageSize: 12, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      },
    })))

    mount()

    expect(await screen.findByText('Chưa có công thức nào')).toBeInTheDocument()
    expect(screen.getByTestId('category-detail-empty')).toBeInTheDocument()
  })

  it('shows a not-found state for a missing category', async () => {
    fetchMock.mockResolvedValue(json({
      title: 'Not Found',
      status: 404,
      detail: 'Category not found',
    }, 404))

    mount()

    expect(await screen.findByText('Không tìm thấy danh mục')).toBeInTheDocument()
    expect(screen.getByTestId('category-detail-404')).toBeInTheDocument()
  })

  it('requests the next recipe page through the shared pagination control', async () => {
    fetchMock
      .mockResolvedValueOnce(json(categoryDetail({
        recipes: {
          items: [recipe('pho-bo', 'Phở bò')],
          meta: { page: 1, pageSize: 12, totalCount: 13, totalPages: 2, hasNextPage: true, hasPreviousPage: false },
        },
      })))
      .mockResolvedValueOnce(json(categoryDetail({
        recipes: {
          items: [recipe('bun-cha', 'Bún chả')],
          meta: { page: 2, pageSize: 12, totalCount: 13, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
        },
      })))

    mount()
    await screen.findByText('Phở bò')
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))

    expect(await screen.findByText('Bún chả')).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toContain('/categories/mon-chinh?page=2&pageSize=12')
    expect(screen.getByText('Trang 2/2 · 13 công thức')).toBeInTheDocument()
  })

  it('sends the access token so the API can include the viewer own drafts', async () => {
    useAuthStore.setState({
      session: {
        accessToken: 'tok',
        refreshToken: 'refresh',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: {
          id: 'user-1',
          fullName: 'Nguyễn Văn An',
          email: 'an@example.com',
          userName: 'an',
          roles: ['AUTHOR'],
        },
      },
    })
    fetchMock.mockResolvedValue(json(categoryDetail()))

    mount()
    await screen.findByText('Phở bò')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    expect(screen.getByText('Bản nháp của bạn cũng được hiển thị')).toBeInTheDocument()
  })
})
