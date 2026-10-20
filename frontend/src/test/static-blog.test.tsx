import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import HomePage from '../pages/HomePage'
import RecipeDetailPage from '../pages/RecipeDetailPage'
import RecipesBrowsePage from '../pages/RecipesBrowsePage'

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

function renderBrowsePage() {
  return render(
    <MemoryRouter initialEntries={['/recipes']}>
      <Routes>
        <Route path="/recipes" element={<RecipesBrowsePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderDetailPage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/recipes/${slug}`]}>
      <Routes>
        <Route path="/recipes" element={<p>danh sách công thức</p>} />
        <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomePage static landing', () => {
  it('presents the hero and both sign-up actions', () => {
    renderHomePage()

    expect(screen.getByRole('heading', { name: 'Culinary Blog', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '/auth/register')
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/auth/login')
  })

  it('shows the featured recipes and links each one to its detail page', () => {
    renderHomePage()

    const featured = screen.getByRole('heading', { name: 'Công thức nổi bật' })
    expect(featured).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Phở bò tái nạm' })
    expect(link).toHaveAttribute('href', '/recipes/pho-bo-tai-nam')
    expect(screen.getByRole('link', { name: 'Bún chả Hà Nội' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Canh chua cá hồi' })).toBeInTheDocument()
  })

  it('links every category to the pre-filtered list', () => {
    renderHomePage()

    const link = screen.getByRole('link', { name: 'Món nướng' })
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toBe('/recipes?category=Món nướng')
  })
})

describe('RecipesBrowsePage', () => {
  it('lists the first page of recipes with a pagination summary', async () => {
    renderBrowsePage()

    expect(await screen.findByRole('heading', { name: 'Phở bò tái nạm' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Phân trang công thức' })).toBeInTheDocument()
    expect(screen.getByText('Trang 1/2 · 6 công thức')).toBeInTheDocument()
  })

  it('moves to the second page', async () => {
    renderBrowsePage()
    await screen.findByRole('heading', { name: 'Phở bò tái nạm' })

    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))

    expect(await screen.findByRole('heading', { name: 'Gà nướng mật ong' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Phở bò tái nạm' })).not.toBeInTheDocument()
  })

  it('narrows the list down with a keyword', async () => {
    renderBrowsePage()
    await screen.findByRole('heading', { name: 'Phở bò tái nạm' })

    await userEvent.type(screen.getByLabelText('Tìm công thức'), 'chè')

    expect(await screen.findByRole('heading', { name: 'Chè chuối nướng' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Phở bò tái nạm' })).not.toBeInTheDocument()
  })

  it('filters by a category chip', async () => {
    renderBrowsePage()
    await screen.findByRole('heading', { name: 'Phở bò tái nạm' })

    await userEvent.click(screen.getByRole('button', { name: 'Món nướng' }))

    expect(await screen.findByRole('heading', { name: 'Gà nướng mật ong' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Phở bò tái nạm' })).not.toBeInTheDocument()
  })

  it('shows the shared empty state and can clear the filters again', async () => {
    renderBrowsePage()
    await screen.findByRole('heading', { name: 'Phở bò tái nạm' })

    await userEvent.type(screen.getByLabelText('Tìm công thức'), 'zzzz')

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy công thức' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))

    expect(await screen.findByRole('heading', { name: 'Phở bò tái nạm' })).toBeInTheDocument()
  })
})

describe('RecipeDetailPage', () => {
  it('renders the recipe with its ingredients and steps', async () => {
    renderDetailPage('pho-bo-tai-nam')

    expect(
      await screen.findByRole('heading', { name: 'Phở bò tái nạm', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Nguyên liệu' })).toBeInTheDocument()
    expect(screen.getByText('Xương ống bò')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hướng dẫn thực hiện' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sơ chế xương và thịt' })).toBeInTheDocument()
  })

  it('falls back to the shared error state for an unknown slug', async () => {
    renderDetailPage('khong-ton-tai')

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy công thức' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Công thức này không tồn tại hoặc đã ngừng xuất bản.',
    )
    expect(screen.getByRole('link', { name: 'Quay lại danh sách công thức' })).toHaveAttribute(
      'href',
      '/recipes',
    )
  })
})
