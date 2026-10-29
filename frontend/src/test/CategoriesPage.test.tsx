import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CategoriesPage from '../pages/CategoriesPage'

const fetchMock = vi.fn()
function response(page: number, totalCount = 13) {
  return new Response(JSON.stringify({
    items: totalCount && page <= 2 ? [{
      id: String(page), name: page === 1 ? 'Món nước' : 'Món chay',
      slug: String(page), orderIndex: 0, recipeCount: page, createdAt: '',
    }] : [],
    meta: { page, pageSize: 12, totalCount, totalPages: Math.ceil(totalCount / 12), hasNextPage: page < 2, hasPreviousPage: page > 1 },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
function Location() {
  const location = useLocation()
  const navigate = useNavigate()
  return <><output aria-label="URL">{location.search}</output><button onClick={() => navigate(-1)}>Quay lại</button></>
}
function mount(url = '/dashboard/categories') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}><CategoriesPage /><Location /></MemoryRouter></QueryClientProvider>)
}
beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset() })
afterEach(() => { vi.unstubAllGlobals() })

describe('Paginated categories', () => {
  it('loads pages through the shared control and restores the page with browser history', async () => {
    fetchMock.mockImplementation((url: string) => Promise.resolve(response(Number(new URL(url, 'http://localhost').searchParams.get('page')))))
    mount()
    expect(await screen.findByText('Món nước')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByText('Món chay')).toBeInTheDocument()
    expect(screen.queryByText('Món nước')).not.toBeInTheDocument()
    expect(screen.getByText('Trang 2/2 · 13 danh mục')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
    expect(fetchMock.mock.calls[1][0]).toContain('/categories?page=2&pageSize=12')
    await userEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
    expect(await screen.findByText('Món nước')).toBeInTheDocument()
  })

  it('resets to page one when page size changes', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(response(2)))
    mount('/dashboard/categories?page=2&pageSize=12')
    await screen.findByText('Món chay')
    fetchMock.mockImplementation(() => Promise.resolve(response(1)))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Số mục mỗi trang' }), '24')
    await screen.findByText('Món nước')
    expect(fetchMock.mock.calls[1][0]).toContain('/categories?page=1&pageSize=24')
    expect(screen.getByLabelText('URL')).toHaveTextContent('?page=1&pageSize=24')
  })

  it('automatically returns to page one when an out-of-range list is empty', async () => {
    fetchMock.mockImplementation((url: string) => Promise.resolve(
      response(Number(new URL(url, 'http://localhost').searchParams.get('page')), 0),
    ))
    mount('/dashboard/categories?page=99&pageSize=12')
    await screen.findByText('Chưa có danh mục')
    expect(screen.getByLabelText('URL')).toHaveTextContent('?page=1&pageSize=12')
    expect(fetchMock.mock.calls[1][0]).toContain('/categories?page=1&pageSize=12')
    expect(screen.queryByRole('navigation', { name: 'Phân trang danh mục' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Trang 99\//)).not.toBeInTheDocument()
  })

  it('replaces an out-of-range URL with the last page and preserves other parameters', async () => {
    fetchMock.mockImplementation((url: string) => Promise.resolve(
      response(Number(new URL(url, 'http://localhost').searchParams.get('page'))),
    ))
    mount('/dashboard/categories?page=99&pageSize=12&source=dashboard')
    await screen.findByText('Món chay')
    expect(screen.getByLabelText('URL')).toHaveTextContent('?page=2&pageSize=12&source=dashboard')
    expect(screen.getByText('Trang 2/2 · 13 danh mục')).toBeInTheDocument()
    expect(screen.queryByText(/Trang 99\//)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Trang trước' }))
    await screen.findByText('Món nước')
    await userEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
    await screen.findByText('Món chay')
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('page=99'))).toHaveLength(1)
  })

  it('allows retry if fetching the corrected category page fails', async () => {
    fetchMock.mockResolvedValueOnce(response(99))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response(2))
    mount('/dashboard/categories?page=99&pageSize=12')
    await screen.findByRole('alert')
    expect(screen.getByLabelText('URL')).toHaveTextContent('?page=2&pageSize=12')
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Món chay')).toBeInTheDocument()
    expect(fetchMock.mock.calls[2][0]).toContain('/categories?page=2&pageSize=12')
  })

  it('retries failures without displaying stale items', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response(1))
    mount()
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Món nước')).toBeInTheDocument()
  })

  it('sanitizes malformed URL pagination before requesting the API', async () => {
    fetchMock.mockResolvedValue(response(1))
    mount('/dashboard/categories?page=-1&pageSize=51')
    await screen.findByText('Món nước')
    expect(fetchMock.mock.calls[0][0]).toContain('/categories?page=1&pageSize=12')
  })
})
