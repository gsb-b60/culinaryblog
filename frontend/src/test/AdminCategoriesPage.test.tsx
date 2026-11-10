import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminCategoriesPage from '../pages/AdminCategoriesPage'
import * as api from '../lib/api'
import { useAuthStore } from '../store'
import type { Category } from '../types/category'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    listCategories: vi.fn(),
    createCategory: vi.fn(),
  }
})

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Món chính',
    slug: 'mon-chinh',
    description: 'Các món ăn chính trong bữa cơm hàng ngày',
    orderIndex: 1,
    recipeCount: 10,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    name: 'Món khai vị',
    slug: 'mon-khai-vi',
    description: 'Các món ăn nhẹ mở đầu bữa ăn',
    orderIndex: 2,
    recipeCount: 5,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
]

describe('AdminCategoriesPage (Screen M13 — Quản trị danh mục)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      session: {
        accessToken: 'mock-admin-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: {
          id: 'admin-id',
          email: 'admin@lethimcook.com',
          fullName: 'Admin User',
          userName: 'admin',
          roles: ['ADMIN'],
        },
      },
    })
    vi.mocked(api.listCategories).mockResolvedValue({
      items: mockCategories,
      meta: {
        page: 1,
        pageSize: 12,
        totalCount: mockCategories.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
  })

  it('renders Screen M13 populated with categories table and open dialog button', async () => {
    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Quản trị danh mục')).toBeInTheDocument()
    expect(screen.getByText('Món chính')).toBeInTheDocument()
    expect(screen.getByText('mon-chinh')).toBeInTheDocument()
    expect(screen.getByText('Món khai vị')).toBeInTheDocument()
    expect(screen.getByTestId('create-category-open-btn')).toBeInTheDocument()
  })

  it('opens create category dialog with empty state and can cancel it', async () => {
    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>,
    )

    await screen.findByText('Món chính')
    fireEvent.click(screen.getByTestId('create-category-open-btn'))

    expect(screen.getByTestId('create-category-dialog')).toBeInTheDocument()
    expect(screen.getByText('Thêm danh mục mới')).toBeInTheDocument()

    const nameInput = screen.getByTestId('create-category-name-input') as HTMLInputElement
    expect(nameInput.value).toBe('')

    fireEvent.click(screen.getByTestId('create-category-cancel-button'))
    expect(screen.queryByTestId('create-category-dialog')).not.toBeInTheDocument()
  })

  it('validates name length and HTML tags with 422 error banner (AC5, AC6)', async () => {
    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>,
    )

    await screen.findByText('Món chính')
    fireEvent.click(screen.getByTestId('create-category-open-btn'))

    const nameInput = screen.getByTestId('create-category-name-input')
    const submitBtn = screen.getByTestId('create-category-submit-button')

    // Test name < 2 chars
    fireEvent.change(nameInput, { target: { value: 'A' } })
    fireEvent.click(submitBtn)
    expect(screen.getByTestId('create-category-error-422')).toBeInTheDocument()
    expect(screen.getByText('Tên danh mục phải có độ dài từ 2 đến 50 ký tự.')).toBeInTheDocument()

    // Test HTML tags
    fireEvent.change(nameInput, { target: { value: '<script>alert(1)</script>' } })
    fireEvent.click(submitBtn)
    expect(screen.getByTestId('create-category-error-422')).toBeInTheDocument()
    expect(screen.getByText('Tên danh mục không được chứa các thẻ HTML.')).toBeInTheDocument()
  })

  it('handles 409 conflict error when category name already exists', async () => {
    const error409 = new api.ApiError(409, 'Danh mục với tên này đã tồn tại trong hệ thống.', null)
    vi.mocked(api.createCategory).mockRejectedValueOnce(error409)

    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>,
    )

    await screen.findByText('Món chính')
    fireEvent.click(screen.getByTestId('create-category-open-btn'))

    fireEvent.change(screen.getByTestId('create-category-name-input'), {
      target: { value: 'Món chính' },
    })
    fireEvent.click(screen.getByTestId('create-category-submit-button'))

    expect(await screen.findByTestId('create-category-error-409')).toBeInTheDocument()
    expect(screen.getByText('Danh mục với tên này đã tồn tại trong hệ thống.')).toBeInTheDocument()
  })

  it('submits form successfully, shows saving state and adds category to list (AC1)', async () => {
    const newCategory: Category = {
      id: 'cat-new',
      name: 'Món Lẩu',
      slug: 'mon-lau',
      description: 'Lẩu thơm ngon',
      orderIndex: 2,
      recipeCount: 0,
      createdAt: '2026-11-03T12:00:00.000Z',
    }

    vi.mocked(api.createCategory).mockResolvedValueOnce(newCategory)

    render(
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>,
    )

    await screen.findByText('Món chính')
    fireEvent.click(screen.getByTestId('create-category-open-btn'))

    fireEvent.change(screen.getByTestId('create-category-name-input'), {
      target: { value: 'Món Lẩu' },
    })
    fireEvent.change(screen.getByTestId('create-category-desc-input'), {
      target: { value: 'Lẩu thơm ngon' },
    })

    fireEvent.click(screen.getByTestId('create-category-submit-button'))

    await waitFor(() => {
      expect(api.createCategory).toHaveBeenCalledWith('mock-admin-token', {
        name: 'Món Lẩu',
        description: 'Lẩu thơm ngon',
        orderIndex: 2,
      })
    })

    expect(await screen.findByTestId('success-banner')).toBeInTheDocument()
    expect(screen.getByText('Món Lẩu')).toBeInTheDocument()
    expect(screen.getByText('mon-lau')).toBeInTheDocument()
    expect(screen.queryByTestId('create-category-dialog')).not.toBeInTheDocument()
  })
})
