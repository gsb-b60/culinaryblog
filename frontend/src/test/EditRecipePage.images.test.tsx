import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
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

const primaryImage = {
  id: 'i1',
  originalUrl: 'http://localhost:9000/lethimcook/recipes/r1/original.png',
  thumbnailUrl: 'http://localhost:9000/lethimcook/recipes/r1/thumb.png',
  altText: 'Phở bò',
  isPrimary: true,
  orderIndex: 0,
}

const secondaryImage = {
  id: 'i2',
  originalUrl: 'http://localhost:9000/lethimcook/recipes/r1/second.png',
  altText: 'Bát phở',
  isPrimary: false,
  orderIndex: 1,
}

const recipe = {
  id: 'r1',
  slug: 'pho-bo',
  title: 'Phở bò',
  description: 'Món phở truyền thống thơm ngon.',
  status: 'DRAFT',
  categoryId: 'category-1',
  authorId: 'author-1',
  prepTime: 15,
  cookTime: 60,
  servings: 4,
  difficulty: 'MEDIUM',
  instructions: 'Ninh xương trong hai giờ.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 3,
  steps: [],
  ingredients: [],
  images: [primaryImage, secondaryImage],
}

function response(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('edit recipe image gallery', () => {
  beforeEach(() => {
    saveSession(session)
  })

  it('sets a primary image and deletes one through the API', async () => {
    const images = [primaryImage, { ...secondaryImage }]

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/recipes/pho-bo') && !init?.method) {
        return response({ ...recipe, images: images.map((image) => ({ ...image })) })
      }
      if (url.endsWith('/recipes/r1/images/i2/primary') && init?.method === 'PATCH') {
        images.forEach((image) => {
          image.isPrimary = image.id === 'i2'
        })
        return response({ ...images[1], isPrimary: true })
      }
      if (url.endsWith('/recipes/r1/images/i2') && init?.method === 'DELETE') {
        images.splice(1, 1)
        if (images.length > 0 && !images.some((image) => image.isPrimary)) {
          images[0].isPrimary = true
        }
        return response(null, 204)
      }
      return response({ items: [], meta: { page: 1, pageSize: 12, totalCount: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard/recipes/pho-bo/edit']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Ảnh món ăn')).toBeInTheDocument()
    expect(screen.getAllByText('Ảnh chính')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Đặt làm ảnh chính' }))

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url, init]) =>
        String(url).endsWith('/recipes/r1/images/i2/primary') && init?.method === 'PATCH')).toBe(true)
      const secondaryCard = screen.getByAltText('Bát phở').closest('li')!
      expect(within(secondaryCard).getByText('Ảnh chính')).toBeInTheDocument()
      const primaryCard = screen.getByAltText('Phở bò').closest('li')!
      expect(within(primaryCard).getByRole('button', { name: 'Đặt làm ảnh chính' })).toBeInTheDocument()
    }, { timeout: 3000 })

    await user.click(
      within(screen.getByAltText('Bát phở').closest('li')!).getByRole('button', { name: 'Xóa' }),
    )

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url, init]) =>
        String(url).endsWith('/recipes/r1/images/i2') && init?.method === 'DELETE')).toBe(true)
      expect(screen.queryByAltText('Bát phở')).not.toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Xóa' })).toHaveLength(1)
    }, { timeout: 3000 })
  }, 15000)
})
