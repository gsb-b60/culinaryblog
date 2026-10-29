import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STATIC_RECIPES, STATIC_CATEGORIES, getStaticRecipeBySlug } from '../data/blog-static'

import HomePage from '../pages/HomePage'
import RecipeDetailPage from '../pages/RecipeDetailPage'
import RecipesBrowsePage from '../pages/RecipesBrowsePage'

const apiCategories = STATIC_CATEGORIES.map((name, i) => ({
  id: '00000000-0000-4000-8000-' + String(i + 1).padStart(12, '0'),
  name, slug: 'cat-' + i, orderIndex: i, createdAt: '',
}))
const apiRecipes = [
  ...STATIC_RECIPES,
  ...Array.from({ length: 7 }, (_, i) => ({ ...STATIC_RECIPES[0]!, id: 'extra-' + i, slug: 'extra-' + i, title: i === 6 ? 'Công thức trang hai' : 'Công thức thêm ' + i })),
].map(recipe => ({ ...recipe, categoryId: apiCategories.find(c => c.name === recipe.categoryName)!.id }))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const query = new URL(url, 'http://localhost')
    const page = Number(query.searchParams.get('page') ?? 1)
    const pageSize = Number(query.searchParams.get('pageSize') ?? 12)
    const q = query.searchParams.get('searchQuery')?.toLowerCase() ?? ''
    const category = query.searchParams.get('categoryId')
    const filtered = query.pathname.endsWith('/categories') ? apiCategories
      : apiRecipes.filter(recipe => (!category || recipe.categoryId === category) &&
        (!q || (recipe.title + ' ' + recipe.description).toLowerCase().includes(q)))
    return new Response(JSON.stringify({
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: { page, pageSize, totalCount: filtered.length, totalPages: Math.ceil(filtered.length / pageSize),
        hasNextPage: page < Math.ceil(filtered.length / pageSize), hasPreviousPage: page > 1 },
    }), { status: 200 })
  }))
})
afterEach(() => vi.unstubAllGlobals())

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname + location.search}</p>
}

function renderBrowsePage(path = '/recipes') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      {/* Stands in for the shared header's link back to the list. */}
      <Link to="/recipes">Đi tới danh sách</Link>
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

describe('HomePage live API landing', () => {
  it('presents the hero and both sign-up actions', () => {
    renderHomePage()

    expect(screen.getByRole('heading', { name: 'Culinary Blog', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '/auth/register')
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/auth/login')
  })

  it('shows the featured recipes and links each one to its detail page', async () => {
    renderHomePage()

    const featured = screen.getByRole('heading', { name: 'Công thức nổi bật' })
    expect(featured).toBeInTheDocument()

    const link = await screen.findByRole('link', { name: 'Phở bò tái nạm' })
    expect(link).toHaveAttribute('href', '/recipes/pho-bo-tai-nam')
    expect(screen.getByRole('link', { name: 'Bún chả Hà Nội' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Canh chua cá hồi' })).toBeInTheDocument()
  })

  it('links every category to the pre-filtered list', async () => {
    renderHomePage()

    const link = await screen.findByRole('link', { name: 'Món nướng' })
    expect(link).toHaveAttribute('href', '/recipes?categoryId=' + apiCategories.find(c => c.name === 'Món nướng')!.id)
  })
})

describe('RecipesBrowsePage', () => {
  it('restores sorting and resets the page while preserving filters', async () => {
    renderBrowsePage('/recipes?page=2&sort=-cookTime&minServings=2')
    await screen.findByRole('heading', { name: 'Công thức trang hai' })
    expect(screen.getByLabelText('Sắp xếp')).toHaveValue('-cookTime')
    await userEvent.selectOptions(screen.getByLabelText('Sắp xếp'), 'title')
    await screen.findByRole('heading', { name: 'Phở bò tái nạm' })
    const params = new URLSearchParams(screen.getByTestId('location').textContent!.split('?')[1])
    expect(params.get('sort')).toBe('title')
    expect(params.get('page')).toBeNull()
    expect(params.get('minServings')).toBe('2')
    expect(vi.mocked(fetch).mock.calls.some(([url]) => {
      const query = new URL(String(url), 'http://localhost').searchParams
      return query.get('sort') === 'title' && query.get('page') === '1'
    })).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
    expect(screen.getByLabelText('Sắp xếp')).toHaveValue('title')
  })
  it('falls back to newest for unknown URL sorting', async () => {
    renderBrowsePage('/recipes?sort=invalid')
    await screen.findByRole('heading', { name: 'Phở bò tái nạm' })
    expect(screen.getByLabelText('Sắp xếp')).toHaveValue('-createdAt')
  })

  it('lists the first page of recipes with a pagination summary', async () => {
    renderBrowsePage()

    expect(await screen.findByRole('heading', { name: 'Phở bò tái nạm' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Phân trang công thức' })).toBeInTheDocument()
    expect(screen.getByText('Trang 1/2 · 13 công thức')).toBeInTheDocument()
  })

  it('moves to the second page', async () => {
    renderBrowsePage()
    await screen.findByRole('heading', { name: 'Phở bò tái nạm' })

    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }))

    expect(await screen.findByRole('heading', { name: 'Công thức trang hai' })).toBeInTheDocument()
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

  it('reads the category from the URL and writes chip selections back to it', async () => {
    renderBrowsePage('/recipes?category=M%C3%B3n%20n%C6%B0%E1%BB%9Bng')

    expect(await screen.findByRole('heading', { name: 'Gà nướng mật ong' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Phở bò tái nạm' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Món nướng' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Món khai vị' }))

    const search = (screen.getByTestId('location').textContent ?? '').split('?')[1] ?? ''
    expect(new URLSearchParams(search).get('categoryId')).toBe(apiCategories.find(c => c.name === 'Món khai vị')!.id)
    expect(await screen.findByRole('heading', { name: 'Gỏi cuốn tôm thịt' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tất cả' }))

    expect(await screen.findByRole('heading', { name: 'Phở bò tái nạm' })).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe('/recipes')
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('drops the category when the list is opened again while still mounted', async () => {
    renderBrowsePage('/recipes?category=M%C3%B3n%20n%C6%B0%E1%BB%9Bng')

    expect(await screen.findByRole('heading', { name: 'Gà nướng mật ong' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Đi tới danh sách' }))

    expect(await screen.findByRole('heading', { name: 'Phở bò tái nạm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('location').textContent).toBe('/recipes')
  })
})

describe('RecipeDetailPage', () => {
  beforeEach(() => {
    // The detail page now uses HTTP; sample data is only a fixture for these rendering tests.
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const recipe = await getStaticRecipeBySlug(decodeURIComponent(url.split('/').at(-1) ?? ''))
      return new Response(JSON.stringify(recipe ?? {}), { status: recipe ? 200 : 404 })
    }))
  })
  afterEach(() => vi.unstubAllGlobals())

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
