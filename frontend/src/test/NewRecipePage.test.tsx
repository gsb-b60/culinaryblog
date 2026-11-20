import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { saveSession } from '../lib/tokenStorage'

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: '2099-01-01',
  user: {
    id: 'author-1',
    email: 'author@example.com',
    fullName: 'Author',
    userName: 'author',
    roles: ['AUTHOR'],
  },
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

class FakeUploadXhr {
  upload = { addEventListener: vi.fn() }
  status = 201
  responseText = JSON.stringify({ imageId: 'image-1', originalUrl: 'http://minio/recipe.jpg', isPrimary: true })
  open = vi.fn()
  setRequestHeader = vi.fn()
  send = vi.fn(() => this.loadListeners.forEach((listener) => listener()))
  private loadListeners: Array<() => void> = []
  addEventListener = vi.fn((event: string, listener: () => void) => {
    if (event === 'load') this.loadListeners.push(listener)
  })
}

describe('new recipe wizard', () => {
  beforeEach(() => {
    saveSession(session)
  })

  it('submits basic data, ingredients, steps, and nutrition as one recipe request', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/categories?page=1&pageSize=50')) {
        return response({
          items: [{ id: 'category-1', name: 'Món Việt', slug: 'mon-viet', orderIndex: 0, createdAt: '' }],
          meta: { page: 1, pageSize: 50, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        })
      }
      if (url.endsWith('/recipes') && init?.method === 'POST') {
        return response({ id: 'recipe-1', slug: 'pho-bo-ha-noi', status: 'DRAFT' }, 201)
      }
      return response({ items: [], meta: { page: 1, pageSize: 12, totalCount: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard/recipes/new']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await user.type(await screen.findByPlaceholderText('Ví dụ: Phở bò Hà Nội'), 'Phở bò Hà Nội')
    await user.type(screen.getByPlaceholderText('Món ăn này có gì đặc biệt?'), 'Món phở truyền thống thơm ngon.')
    await user.click(screen.getByRole('combobox', { name: 'Danh mục' }))
    await user.type(screen.getByRole('combobox', { name: 'Danh mục' }), 'Món Việt')
    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))

    await user.type(screen.getByPlaceholderText('Tên nguyên liệu'), 'Bánh phở')
    await user.type(screen.getByPlaceholderText('Số lượng'), '1')
    await user.type(screen.getByPlaceholderText('Tên bước'), 'Nấu nước dùng')
    await user.type(screen.getByPlaceholderText('Mô tả chi tiết bước nấu'), 'Ninh xương trong hai giờ.')
    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    await user.type(screen.getAllByPlaceholderText('0')[0], '450')
    await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))

    expect(await screen.findByText('Công thức của tôi')).toBeInTheDocument()
    const createCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(createCall).toBeDefined()
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      title: 'Phở bò Hà Nội',
      categoryId: 'category-1',
      steps: [{ title: 'Nấu nước dùng', description: 'Ninh xương trong hai giờ.' }],
      ingredients: [{ name: 'Bánh phở', quantity: 1 }],
      nutrition: { calories: 450 },
    })
  }, 15000)

  it('does not create the recipe before the final step and uploads the selected image on save', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/categories?page=1&pageSize=50')) {
        return response({ items: [{ id: 'category-1', name: 'Món Việt', slug: 'mon-viet', orderIndex: 0, createdAt: '' }], meta: { page: 1, pageSize: 50, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
      }
      if (url.endsWith('/recipes') && init?.method === 'POST') return response({ id: 'recipe-2', slug: 'canh', status: 'DRAFT' }, 201)
      return response({ items: [], meta: { page: 1, pageSize: 12, totalCount: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
    })
    const xhr = new FakeUploadXhr()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('XMLHttpRequest', class { constructor() { return xhr } })

    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/dashboard/recipes/new']}><App /></MemoryRouter></QueryClientProvider>)

    await user.type(await screen.findByPlaceholderText('Ví dụ: Phở bò Hà Nội'), 'Canh rau củ')
    await user.type(screen.getByPlaceholderText('Món ăn này có gì đặc biệt?'), 'Canh rau củ thanh mát dễ nấu.')
    await user.type(screen.getByRole('combobox', { name: 'Danh mục' }), 'Món Việt')
    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    await user.type(screen.getByPlaceholderText('Tên nguyên liệu'), 'Cà rốt')
    await user.type(screen.getByPlaceholderText('Tên bước'), 'Nấu canh')
    await user.type(screen.getByPlaceholderText('Mô tả chi tiết bước nấu'), 'Đun đến khi rau củ chín mềm.')
    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))

    expect(screen.getByText('Ảnh món ăn (không bắt buộc)')).toBeInTheDocument()
    const finalStepButton = screen.getByRole('button', { name: /Ảnh, dinh dưỡng & lưu/ })
    expect(finalStepButton).toHaveClass('bg-brand-500')
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:canh-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const file = new File(['image'], 'canh.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Ảnh món ăn'), file)
    expect(screen.getByRole('img', { name: 'Xem trước canh.jpg' })).toHaveAttribute('src', 'blob:canh-preview')
    expect(screen.getByRole('img', { name: 'Ảnh món ăn trong bản xem trước' })).toHaveAttribute('src', 'blob:canh-preview')
    expect(screen.getByRole('button', { name: 'Xóa ảnh' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
    expect(createObjectUrl).toHaveBeenCalledWith(file)

    expect(await screen.findByText('Công thức của tôi')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
    expect(xhr.send).toHaveBeenCalledWith(expect.any(FormData))
    expect(xhr.open).toHaveBeenCalledWith('POST', expect.stringContaining('/recipes/recipe-2/images'))
  }, 15000)
})
