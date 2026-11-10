import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { clearSession, loadSession, saveSession } from '../lib/tokenStorage'
import type { Recipe, RecipePage } from '../types/recipe'

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: '2099-01-01',
  user: {
    id: 'owner-1',
    email: 'test@example.com',
    fullName: 'Owner',
    userName: 'owner',
    roles: ['AUTHOR'],
  },
}
const draft: Recipe = {
  id: 'recipe-1',
  title: 'Canh rau củ',
  description: 'Công thức canh rau củ thanh mát',
  slug: 'canh-rau-cu',
  status: 'DRAFT',
  authorId: 'owner-1',
  updatedAt: '2026-01-01',
  version: 1,
  steps: [{ id: 'step-1', stepNumber: 1, title: 'Nấu', description: 'Đun nước' }],
}
function recipePage(items: Recipe[] = [draft], page = 1, totalPages = 1): RecipePage {
  return {
    items,
    meta: {
      page,
      pageSize: 12,
      totalCount: items.length * totalPages,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
const fetchMock = vi.fn()
function openPage(path = '/dashboard/recipes') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  saveSession(session)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => String(url).endsWith('/recipes/manage/overview')
    ? Promise.resolve(response({ stats: { total: 1, published: 0, draft: 1, archived: 0 }, recentRecipes: [draft] }))
    : fetchMock(url, init))
  fetchMock.mockResolvedValue(response(recipePage()))
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Recipe management through UI and API client', () => {
  it('navigates from Dashboard, publishes, unpublishes and preserves the status after reload', async () => {
    let stored = { ...draft }
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      expect(init.headers).toMatchObject({ Authorization: 'Bearer access' })
      if (url.endsWith('/publish'))
        stored = {
          ...stored,
          status: 'PUBLISHED',
          version: 2,
          updatedAt: '2026-02-01',
          publishedAt: '2026-02-01',
        }
      if (url.endsWith('/unpublish')) stored = { ...stored, status: 'DRAFT', version: 3 }
      return response(init.method === 'PATCH' ? stored : recipePage([stored]))
    })
    openPage('/dashboard')
    await userEvent.click(screen.getAllByRole('button', { name: 'Công thức' })[0])
    await userEvent.click(screen.getAllByRole('link', { name: 'Quản lý công thức' })[0])
    const article = await screen.findByRole('article', { name: draft.title })
    await userEvent.click(within(article).getByRole('button', { name: 'Xuất bản' }))
    expect(await screen.findByText('Đã xuất bản công thức.')).toBeInTheDocument()
    expect(within(article).getByText('Đã xuất bản')).toBeInTheDocument()
    await userEvent.click(within(article).getByRole('button', { name: 'Chuyển về bản nháp' }))
    expect(await screen.findByText('Đã chuyển công thức về bản nháp.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(await screen.findByRole('button', { name: 'Xuất bản' })).toBeEnabled()
    const mutations = fetchMock.mock.calls.filter(([, init]) => init.method === 'PATCH')
    expect(mutations.map(([url]) => url.split('/').at(-1))).toEqual(['publish', 'unpublish'])
  })

  it('explains why drafts without steps cannot be published and hides actions for archived recipes', async () => {
    fetchMock.mockResolvedValue(
      response(
        recipePage([
          { ...draft, steps: [] },
          { ...draft, id: 'archived', title: 'Món đã lưu trữ', status: 'ARCHIVED' },
        ]),
      ),
    )
    openPage()
    expect(await screen.findByRole('button', { name: 'Xuất bản' })).toBeDisabled()
    expect(
      screen.getByText('Cần ít nhất một bước thực hiện trước khi xuất bản.'),
    ).toBeInTheDocument()
    const archivedArticle = within(screen.getByRole('article', { name: 'Món đã lưu trữ' }))
    expect(archivedArticle.queryByRole('button', { name: 'Xuất bản' })).not.toBeInTheDocument()
    expect(
      archivedArticle.queryByRole('button', { name: 'Chuyển về bản nháp' }),
    ).not.toBeInTheDocument()
    expect(archivedArticle.queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument()
  })

  it.each([403, 404, 409, 422, 500])(
    'keeps the previous status and shows an error for HTTP %s',
    async (status) => {
      fetchMock
        .mockResolvedValueOnce(response(recipePage()))
        .mockResolvedValueOnce(response({ errors: { steps: ['Missing steps'] } }, status))
      openPage()
      await userEvent.click(await screen.findByRole('button', { name: 'Xuất bản' }))
      expect(await screen.findByRole('alert')).not.toBeEmptyDOMElement()
      expect(screen.getByText('Bản nháp')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Xuất bản' })).toBeEnabled()
      expect(screen.queryByText('Đã xuất bản công thức.')).not.toBeInTheDocument()
    },
  )

  it('disables repeat clicks until the mutation finishes', async () => {
    let finish!: (value: Response) => void
    fetchMock.mockResolvedValueOnce(response(recipePage())).mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve
        }),
    )
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Xuất bản' }))
    expect(screen.getByRole('button', { name: 'Đang cập nhật...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeDisabled()
    finish(response({ ...draft, status: 'PUBLISHED' }))
    expect(await screen.findByRole('button', { name: 'Chuyển về bản nháp' })).toBeEnabled()
  })

  it('paginates using the protected management API', async () => {
    fetchMock
      .mockResolvedValueOnce(response(recipePage([draft], 1, 2)))
      .mockResolvedValueOnce(
        response(recipePage([{ ...draft, id: 'recipe-2', title: 'Canh trang hai' }], 2, 2)),
      )
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByText('Canh trang hai')).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toContain('/recipes/manage?page=2&pageSize=12')
  })

  it('resets to the first page when page size changes and keeps that size for subsequent pages', async () => {
    const result = (page: number, size: number, title: string) => {
      const data = recipePage([{ ...draft, title }], page, 3)
      data.meta.pageSize = size
      data.meta.totalCount = 60
      return response(data)
    }
    fetchMock
      .mockResolvedValueOnce(result(1, 12, draft.title))
      .mockResolvedValueOnce(result(2, 12, 'Trang hai ban đầu'))
      .mockResolvedValueOnce(result(1, 24, 'Trang đầu 24 mục'))
      .mockResolvedValueOnce(result(2, 24, 'Trang hai 24 mục'))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('article', { name: 'Trang hai ban đầu' })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Số công thức mỗi trang' }), '24')
    await screen.findByRole('article', { name: 'Trang đầu 24 mục' })
    expect(fetchMock.mock.calls[2][0]).toContain('/recipes/manage?page=1&pageSize=24')
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('article', { name: 'Trang hai 24 mục' })
    expect(fetchMock.mock.calls[3][0]).toContain('/recipes/manage?page=2&pageSize=24')
    expect(screen.getByRole('combobox', { name: 'Số công thức mỗi trang' })).toHaveValue('24')
  })

  it.each(['network', 'server'])('retries the same next page after a %s failure', async (failure) => {
    fetchMock.mockResolvedValueOnce(response(recipePage([draft], 1, 2)))
    if (failure === 'network') fetchMock.mockRejectedValueOnce(new TypeError('network'))
    else fetchMock.mockResolvedValueOnce(response({ detail: 'Server error' }, 500))
    fetchMock.mockResolvedValueOnce(response(recipePage([{ ...draft, title: 'Trang hai sau thử lại' }], 2, 2)))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByRole('article', { name: 'Trang hai sau thử lại' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toContain('page=2&pageSize=12')
    expect(fetchMock.mock.calls[2][0]).toContain('page=2&pageSize=12')
    expect(screen.queryByText('Đang tải công thức...')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeEnabled()
  })

  it.each(['/dashboard/recipes', '/dashboard/recipes/archive'])(
    'returns to the first page after all recipes disappear on %s', async (path) => {
      fetchMock.mockResolvedValueOnce(response(recipePage([draft], 1, 2)))
        .mockResolvedValueOnce(response(recipePage([{ ...draft, title: 'Công thức cuối' }], 2, 2)))
        .mockResolvedValueOnce(response(recipePage([], 2, 0)))
        .mockResolvedValueOnce(response(recipePage([], 1, 0)))
      openPage(path)
      await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
      await screen.findByRole('article', { name: 'Công thức cuối' })
      await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
      expect(await screen.findByText('Chưa có công thức')).toBeInTheDocument()
      expect(screen.getByText('Trang 1/1 · 0 công thức')).toBeInTheDocument()
      expect(screen.queryByText('Trang 2/1 · 0 công thức')).not.toBeInTheDocument()
      expect(fetchMock.mock.calls[3][0]).toContain('page=1&pageSize=12')
      expect(screen.queryByRole('navigation', { name: 'Phân trang công thức' })).not.toBeInTheDocument()
    },
  )

  it('moves to the last available recipe page when the page count decreases', async () => {
    const lastPage = recipePage([{ ...draft, title: 'Trang hợp lệ cuối' }], 2, 2)
    fetchMock.mockResolvedValueOnce(response(recipePage([draft], 1, 3)))
      .mockResolvedValueOnce(response(recipePage([{ ...draft, title: 'Trang hai' }], 2, 3)))
      .mockResolvedValueOnce(response(recipePage([{ ...draft, title: 'Trang ba' }], 3, 3)))
      .mockResolvedValueOnce(response(recipePage([], 3, 2)))
      .mockResolvedValueOnce(response(lastPage))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('article', { name: 'Trang hai' })
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('article', { name: 'Trang ba' })
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(await screen.findByRole('article', { name: 'Trang hợp lệ cuối' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[4][0]).toContain('page=2&pageSize=12')
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
  })

  it('allows reload after fetching a corrected recipe page fails', async () => {
    fetchMock.mockResolvedValueOnce(response(recipePage([draft], 1, 2)))
      .mockResolvedValueOnce(response(recipePage([{ ...draft, title: 'Trang hai' }], 2, 2)))
      .mockResolvedValueOnce(response(recipePage([], 2, 0)))
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(response(recipePage()))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    await screen.findByRole('article', { name: 'Trang hai' })
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(await screen.findByRole('article', { name: draft.title })).toBeInTheDocument()
    expect(fetchMock.mock.calls[4][0]).toContain('page=1&pageSize=12')
  })

  it('offers retry after a network failure', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(response(recipePage()))
    openPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể kết nối')
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(await screen.findByText(draft.title)).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    fetchMock.mockResolvedValue(response(recipePage([], 1, 0)))
    openPage()
    expect(await screen.findByText('Chưa có công thức')).toBeInTheDocument()
  })

  it('allows Admin to manage another author recipe', async () => {
    saveSession({ ...session, user: { ...session.user, id: 'admin-1', roles: ['ADMIN'] } })
    openPage()
    expect(await screen.findByRole('button', { name: 'Xuất bản' })).toBeEnabled()
    expect(screen.getByRole('heading', { name: 'Quản lý công thức' })).toBeInTheDocument()
  })

  it('provides a separate Dashboard destination for recipe deletion', async () => {
    openPage()
    const article = await screen.findByRole('article', { name: draft.title })

    expect(within(article).queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Xóa công thức' })[0]).toHaveAttribute(
      'href',
      '/dashboard/recipes/delete',
    )
  })

  it('redirects signed-out visitors without requesting private data', () => {
    clearSession()
    openPage()
    expect(screen.getByRole('heading', { name: /Đăng nhập/ })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes an expired token and retries the protected list', async () => {
    fetchMock
      .mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response({ ...session, accessToken: 'rotated' }))
      .mockResolvedValueOnce(response(recipePage()))
    openPage()
    expect(await screen.findByText(draft.title)).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh')
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer rotated')
    expect(loadSession()?.accessToken).toBe('rotated')
  })

  it('redirects to login when refresh fails', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({}, 401))
    openPage()
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Đăng nhập/ })).toBeInTheDocument(),
    )
    expect(loadSession()).toBeNull()
  })
  it('keeps the refreshed session when a publish retry returns a business error', async () => {
    fetchMock
      .mockResolvedValueOnce(response(recipePage()))
      .mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response({ ...session, accessToken: 'rotated' }))
      .mockResolvedValueOnce(response({ errors: { steps: ['Missing steps'] } }, 422))
    openPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Xuất bản' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Cần ít nhất một bước')
    expect(loadSession()?.accessToken).toBe('rotated')
    expect(screen.getByRole('heading', { name: 'Công thức của tôi' })).toBeInTheDocument()
  })
})

describe('Archive through recipe management', () => {
  it.each(['DRAFT', 'PUBLISHED'] as const)(
    'archives a %s recipe and keeps the badge after reload',
    async (status) => {
      let stored: Recipe = { ...draft, status, steps: [] }
      fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
        if (url.endsWith('/archive')) {
          expect(init.method).toBe('PATCH')
          expect(init.headers).toMatchObject({ Authorization: 'Bearer access' })
          stored = { ...stored, status: 'ARCHIVED', version: 2 }
          return response(stored)
        }
        return response(recipePage([stored]))
      })
      openPage('/dashboard/recipes/archive')
      await userEvent.click(await screen.findByRole('button', { name: 'Lưu trữ' }))
      expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu trữ công thức.')
      expect(screen.getByText('Đã lưu trữ')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Lưu trữ' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Xuất bản' })).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }))
      expect(await screen.findByText('Đã lưu trữ')).toBeInTheDocument()
    },
  )

  it.each([403, 404, 409, 500])(
    'keeps the recipe unchanged after archive fails with %s',
    async (status) => {
      fetchMock
        .mockResolvedValueOnce(response(recipePage()))
        .mockResolvedValueOnce(response({}, status))
      openPage('/dashboard/recipes/archive')
      await userEvent.click(await screen.findByRole('button', { name: 'Lưu trữ' }))
      expect(await screen.findByRole('alert')).not.toBeEmptyDOMElement()
      expect(screen.getByText('Bản nháp')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Lưu trữ' })).toBeEnabled()
    },
  )

  it('allows Admin to archive another author recipe', async () => {
    saveSession({ ...session, user: { ...session.user, id: 'admin-1', roles: ['ADMIN'] } })
    fetchMock
      .mockResolvedValueOnce(response(recipePage()))
      .mockResolvedValueOnce(response({ ...draft, status: 'ARCHIVED' }))
    openPage('/dashboard/recipes/archive')
    await userEvent.click(await screen.findByRole('button', { name: 'Lưu trữ' }))
    expect(await screen.findByText('Đã lưu trữ')).toBeInTheDocument()
  })

  it('prevents duplicate archive submissions and competing status changes', async () => {
    let finish!: (value: Response) => void
    fetchMock.mockResolvedValueOnce(response(recipePage())).mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve
        }),
    )
    openPage('/dashboard/recipes/archive')
    const button = await screen.findByRole('button', { name: 'Lưu trữ' })
    await userEvent.dblClick(button)
    expect(button).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Đang lưu trữ...' })).toBeDisabled()
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === 'PATCH')).toHaveLength(1)
    finish(response({ ...draft, status: 'ARCHIVED' }))
    expect(await screen.findByText('Đã lưu trữ')).toBeInTheDocument()
  })
})

it('links archived recipes to their live detail page', async () => {
  fetchMock.mockResolvedValue(response(recipePage([{ ...draft, status: 'ARCHIVED' }])))
  openPage()
  expect(await screen.findByRole('link', { name: 'Xem chi tiết' })).toHaveAttribute(
    'href',
    '/recipes/' + draft.slug,
  )
})

describe('Separate archive destination in Dashboard', () => {
  it('opens the archive page from the button below the overview', async () => {
    openPage('/dashboard')
    const shortcut = screen.getByRole('region', { name: 'Lưu trữ công thức' })
    await userEvent.click(within(shortcut).getByRole('link', { name: 'Lưu trữ công thức' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Lưu trữ công thức' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Lưu trữ' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Xuất bản' })).not.toBeInTheDocument()
    const menu = within(screen.getByRole('navigation', { name: 'Dashboard menu' }))
    expect(menu.getByRole('link', { name: 'Lưu trữ công thức' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(menu.getByRole('link', { name: 'Xóa công thức' }).nextElementSibling).toHaveTextContent(
      'Lưu trữ công thức',
    )
  })

  it('keeps archive actions out of the publish/unpublish list', async () => {
    openPage()
    await screen.findByRole('article', { name: draft.title })
    expect(screen.queryByRole('button', { name: 'Lưu trữ' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xuất bản' })).toBeInTheDocument()
    const mobile = within(screen.getByRole('navigation', { name: 'Mobile navigation' }))
    expect(mobile.getByRole('link', { name: 'Lưu trữ công thức' })).toHaveAttribute(
      'href',
      '/dashboard/recipes/archive',
    )
  })

  it('retains the Dashboard auth guard for the archive route', () => {
    clearSession()
    openPage('/dashboard/recipes/archive')
    expect(screen.getByRole('heading', { name: /Đăng nhập/ })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('paginates independently on the archive page', async () => {
    fetchMock
      .mockResolvedValueOnce(response(recipePage([draft], 1, 2)))
      .mockResolvedValueOnce(
        response(recipePage([{ ...draft, title: 'Công thức trang hai' }], 2, 2)),
      )
    openPage('/dashboard/recipes/archive')
    await userEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByRole('article', { name: 'Công thức trang hai' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toContain('/recipes/manage?page=2&pageSize=12')
  })
})
