import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { saveSession } from '../lib/tokenStorage'
import type { RecipePage, RecipeStep } from '../types/recipe'

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
const recipePage: RecipePage = {
  items: [{
    id: 'recipe-1',
    title: 'Canh rau củ',
    description: 'Công thức canh rau củ thanh mát',
    slug: 'canh-rau-cu',
    status: 'DRAFT',
    authorId: 'owner-1',
    updatedAt: '2026-01-01',
    version: 1,
    steps: [],
  }],
  meta: {
    page: 1,
    pageSize: 12,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
}
let steps: RecipeStep[]
const fetchMock = vi.fn()

function response(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function openPage() {
  render(
    <MemoryRouter initialEntries={['/dashboard/steps?recipeId=recipe-1&page=1&pageSize=12']}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  saveSession(session)
  steps = [{
    id: 'step-1',
    stepNumber: 1,
    title: 'Rửa rau',
    description: 'Rửa sạch rau củ.',
  }]
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input: string, init?: RequestInit) => {
    const url = new URL(input, 'http://localhost')
    if (url.pathname.endsWith('/recipes/manage')) return response(recipePage)
    if (url.pathname.includes('/recipes/recipe-1/steps')) {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as Omit<RecipeStep, 'id' | 'stepNumber'>
        steps.push({ ...body, id: 'step-2', stepNumber: steps.length + 1 })
        return response({ id: 'step-2', message: 'Step added successfully' }, 201)
      }
      if (init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as Partial<RecipeStep>
        const stepId = url.pathname.split('/').at(-1)
        const index = steps.findIndex((step) => step.id === stepId)
        const [moving] = steps.splice(index, 1)
        steps.splice((body.stepNumber ?? index + 1) - 1, 0, { ...moving!, ...body })
        steps = steps.map((step, stepIndex) => ({ ...step, stepNumber: stepIndex + 1 }))
        return response({ message: 'Step updated successfully' })
      }
      if (init?.method === 'DELETE') {
        const stepId = url.pathname.split('/').at(-1)
        steps = steps.filter((step) => step.id !== stepId)
        steps = steps.map((step, index) => ({ ...step, stepNumber: index + 1 }))
        return response(null, 204)
      }
      return response(steps)
    }
    return response({ detail: 'Unexpected request' }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Dashboard recipe step management page', () => {
  it('creates, edits, deletes and displays the persisted step order', async () => {
    openPage()
    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'Danh sách bước nấu' })).toBeInTheDocument()
    expect(await screen.findByText('Bước 1: Rửa rau')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Thêm - Tiêu đề bước'), 'Nêm nếm')
    await user.type(screen.getByLabelText('Thêm - Hướng dẫn'), 'Thêm gia vị vừa ăn.')
    await user.type(screen.getByLabelText('Thêm - Thời gian'), '2')
    await user.click(screen.getByRole('button', { name: 'Thêm bước nấu' }))
    expect(await screen.findByText('Bước 2: Nêm nếm')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Đã thêm bước nấu.')
    const createCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(createCall).toBeDefined()
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      title: 'Nêm nếm',
      description: 'Thêm gia vị vừa ăn.',
      timerMinutes: 2,
    })

    await user.click(screen.getByRole('button', { name: 'Sửa bước 2' }))
    await user.clear(screen.getByLabelText('Sửa - Tiêu đề bước'))
    await user.type(screen.getByLabelText('Sửa - Tiêu đề bước'), 'Nêm lại')
    await user.clear(screen.getByLabelText('Thứ tự bước'))
    await user.type(screen.getByLabelText('Thứ tự bước'), '1')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByText('Bước 1: Nêm lại')).toBeInTheDocument()
    expect(screen.getByText('Bước 2: Rửa rau')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Đã cập nhật bước nấu.')

    const item = screen.getByRole('listitem', { name: 'Bước 1: Nêm lại' })
    await user.click(within(item).getByRole('button', { name: 'Xóa bước 1' }))
    await user.click(within(item).getByRole('button', { name: 'Xác nhận xóa' }))
    expect(await screen.findByText('Bước 1: Rửa rau')).toBeInTheDocument()
    expect(screen.queryByText('Bước 2: Nêm lại')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Đã xóa bước nấu')
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true)
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true)
  })

  it('shows a server validation error and keeps the editor available', async () => {
    fetchMock.mockImplementation(async (input: string, init?: RequestInit) => {
      const url = new URL(input, 'http://localhost')
      if (url.pathname.endsWith('/recipes/manage')) return response(recipePage)
      if (url.pathname.includes('/recipes/recipe-1/steps') && !init?.method) return response(steps)
      if (init?.method === 'POST') return response({ detail: 'Invalid step data' }, 422)
      return response(null, 204)
    })
    openPage()
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Danh sách bước nấu' })
    await screen.findByText('Bước 1: Rửa rau')
    await user.type(screen.getByLabelText('Thêm - Tiêu đề bước'), 'Nêm nếm')
    await user.type(screen.getByLabelText('Thêm - Hướng dẫn'), 'Thêm gia vị.')
    await user.click(screen.getByRole('button', { name: 'Thêm bước nấu' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng kiểm tra thông tin bước nấu.')
    expect(screen.getByLabelText('Thêm - Tiêu đề bước')).toHaveValue('Nêm nếm')
    expect(screen.getByRole('button', { name: 'Thêm bước nấu' })).toBeEnabled()
  })
})
