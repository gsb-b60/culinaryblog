import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ApiError } from '../lib/api'
import { difficultyLabels, parseRecipeFilters } from '../lib/recipeFilters'
import { getCategories, getRecipes } from '../lib/recipes'
import { loadSession } from '../lib/tokenStorage'
import type { Category, PagedResult, RecipeDifficulty, RecipeSummary } from '../types/recipes'

const fieldClass = 'mt-2 w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-surface-900 focus:outline-2 focus:outline-brand-500'
const buttonClass = 'rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50'

function RecipeBrowser({ search, navigate, embedded }: {
  embedded: boolean
  search: string
  navigate: (params: URLSearchParams) => void
}) {
  const params = new URLSearchParams(search)
  const { query, errors: urlErrors } = parseRecipeFilters(params)
  const invalidUrl = Object.keys(urlErrors).length > 0
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState(query.categoryId ?? '')
  const [categoryError, setCategoryError] = useState('')
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [categoryRetry, setCategoryRetry] = useState(0)
  const [result, setResult] = useState<PagedResult<RecipeSummary> | null>(null)
  const [loading, setLoading] = useState(!invalidUrl)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const errors = { ...urlErrors, ...formErrors }

  useEffect(() => {
    const controller = new AbortController()
    getCategories(controller.signal).then(items => {
      if (!controller.signal.aborted) {
        setCategories(items)
        setCategoryLoading(false)
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setCategoryError('Không tải được danh mục. Bạn vẫn có thể lọc theo độ khó, thời gian và khẩu phần.')
        setCategoryLoading(false)
      }
    })
    return () => controller.abort()
  }, [categoryRetry])

  useEffect(() => {
    if (invalidUrl) return
    const controller = new AbortController()
    const parsed = parseRecipeFilters(new URLSearchParams(search)).query
    getRecipes(parsed, controller.signal).then(data => {
      if (!controller.signal.aborted) {
        setResult(data)
        setLoading(false)
      }
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) {
        setError(cause instanceof ApiError && cause.status === 422
          ? 'Bộ lọc không hợp lệ. Hãy kiểm tra lại các giá trị.'
          : 'Không tải được công thức. Kiểm tra kết nối và thử lại.')
        setLoading(false)
      }
    })
    return () => controller.abort()
  }, [search, invalidUrl, retry])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const field of ['categoryId', 'difficulty', 'maxCookTime', 'minServings', 'pageSize']) {
      const value = String(data.get(field) ?? '').trim()
      if (value) next.set(field, value)
    }
    next.set('page', '1')
    const parsed = parseRecipeFilters(next)
    setFormErrors(parsed.errors)
    if (Object.keys(parsed.errors).length === 0) navigate(next)
  }

  function changePage(page: number) {
    const next = new URLSearchParams(search)
    next.set('page', String(page))
    navigate(next)
  }

  const session = loadSession()
  const pageSizeOptions = Array.from(new Set([12, 24, 48, query.pageSize])).sort((a, b) => a - b)
  const knownCategory = categories.some(category => category.id === query.categoryId)
  const activeFilters = [
    query.categoryId ? 'Danh mục: ' + (categories.find(c => c.id === query.categoryId)?.name ?? query.categoryId) : '',
    query.difficulty ? 'Độ khó: ' + difficultyLabels[query.difficulty] : '',
    query.maxCookTime !== undefined ? 'Nấu tối đa: ' + query.maxCookTime + ' phút' : '',
    query.minServings !== undefined ? 'Ít nhất: ' + query.minServings + ' khẩu phần' : '',
  ].filter(Boolean)

  function fieldError(field: string) {
    return errors[field] ? <p id={field + '-error'} className="mt-1 text-sm text-red-700">{errors[field]}</p> : null
  }

  const Content = embedded ? "section" : "main"

  return (
    <div className={embedded ? "min-w-0" : "min-h-screen bg-surface-50"}>
      {!embedded && <header className="border-b border-surface-200 bg-white">
        <nav aria-label="Điều hướng chính" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="text-xl font-extrabold text-brand-600">Culinary Blog</Link>
          <div className="flex gap-4 text-sm font-semibold text-surface-700">
            {session ? <Link to="/dashboard">Tổng quan</Link> : <>
              <Link to="/auth/login">Đăng nhập</Link><Link to="/auth/register">Đăng ký</Link>
            </>}
          </div>
        </nav>
      </header>}
      <Content className={embedded ? "w-full" : "mx-auto max-w-6xl px-5 py-8 sm:py-12"}>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Khám phá món ngon</p>
        <h1 className="mt-2 text-3xl font-extrabold text-surface-900 sm:text-4xl">Công thức nấu ăn</h1>
        <p className="mt-3 max-w-2xl text-surface-600">Tìm món phù hợp với thời gian, khẩu phần và kinh nghiệm của bạn. Công thức phải đáp ứng tất cả bộ lọc đã chọn.</p>

        <form onSubmit={applyFilters} noValidate aria-label="Bộ lọc công thức" className="mt-8 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className={"grid gap-5 sm:grid-cols-2 " + (embedded ? "xl:grid-cols-4" : "lg:grid-cols-4")}>
            <div>
              <label htmlFor="categoryId" className="text-sm font-semibold">Danh mục</label>
              <select id="categoryId" name="categoryId" value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)} className={fieldClass}
                disabled={categoryLoading} aria-invalid={!!errors.categoryId} aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}>
                <option value="">{categoryLoading ? 'Đang tải danh mục…' : 'Tất cả danh mục'}</option>
                {query.categoryId && !knownCategory && <option value={query.categoryId}>Danh mục đã chọn ({query.categoryId})</option>}
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {fieldError('categoryId')}
            </div>
            <div>
              <label htmlFor="difficulty" className="text-sm font-semibold">Độ khó</label>
              <select id="difficulty" name="difficulty" defaultValue={query.difficulty ?? ''} className={fieldClass}
                aria-invalid={!!errors.difficulty} aria-describedby={errors.difficulty ? 'difficulty-error' : undefined}>
                <option value="">Tất cả độ khó</option>
                {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {fieldError('difficulty')}
            </div>
            <div>
              <label htmlFor="maxCookTime" className="text-sm font-semibold">Thời gian nấu tối đa (phút)</label>
              <input id="maxCookTime" name="maxCookTime" type="number" min="0" max="2147483647" step="1" placeholder="Ví dụ: 30"
                defaultValue={params.get('maxCookTime') ?? ''} className={fieldClass}
                aria-invalid={!!errors.maxCookTime} aria-describedby={errors.maxCookTime ? "maxCookTime-hint maxCookTime-error" : "maxCookTime-hint"} />
              <p id="maxCookTime-hint" className="mt-1 text-xs text-surface-500">Chỉ tính thời gian nấu, không gồm chuẩn bị.</p>
              {fieldError('maxCookTime')}
            </div>
            <div>
              <label htmlFor="minServings" className="text-sm font-semibold">Số khẩu phần tối thiểu</label>
              <input id="minServings" name="minServings" type="number" min="1" max="2147483647" step="1" placeholder="Ví dụ: 2"
                defaultValue={params.get('minServings') ?? ''} className={fieldClass}
                aria-invalid={!!errors.minServings} aria-describedby={errors.minServings ? 'minServings-error' : undefined} />
              {fieldError('minServings')}
            </div>
          </div>
          {categoryError && <div role="alert" className="mt-4 text-sm text-amber-800">
            {categoryError}
            <button type="button" onClick={() => { setCategoryError(''); setCategoryLoading(true); setCategoryRetry(value => value + 1) }} className="ml-2 underline">Tải lại danh mục</button>
          </div>}
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-surface-100 pt-5">
            <div>
              <label htmlFor="pageSize" className="text-sm font-semibold">Công thức mỗi trang</label>
              <select id="pageSize" name="pageSize" defaultValue={query.pageSize} className={fieldClass}>
                {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
              {fieldError('pageSize')}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate(new URLSearchParams())} className={buttonClass + ' border border-surface-300 text-surface-700 hover:bg-surface-50'}>Xóa bộ lọc</button>
              <button type="submit" disabled={categoryLoading} className={buttonClass + ' bg-brand-500 text-white hover:bg-brand-600'}>Áp dụng bộ lọc</button>
            </div>
          </div>
          {invalidUrl && <p role="alert" className="mt-4 text-sm text-red-700">URL chứa bộ lọc không hợp lệ. Sửa bộ lọc hoặc chọn “Xóa bộ lọc”. {errors.page}</p>}
        </form>

        {activeFilters.length > 0 && <ul aria-label="Bộ lọc đang áp dụng" className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map(label => <li key={label} className="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-800">{label}</li>)}
        </ul>}
        <section aria-label="Kết quả công thức" aria-busy={loading} className="mt-8">
          {loading && <p role="status" className="py-8 text-center text-surface-600">Đang tải công thức…</p>}
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p>{error}</p>
            <button type="button" onClick={() => { setError(''); setLoading(true); setRetry(value => value + 1) }} className={buttonClass + ' mt-3 border border-red-300'}>Thử lại</button>
          </div>}
          {!loading && !error && result && <>
            <p role="status" className="mb-4 text-sm font-medium text-surface-600">Tìm thấy {result.meta.totalCount} công thức phù hợp</p>
            {result.items.length === 0 ? <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center">
              <h2 className="text-lg font-bold">{result.meta.totalCount === 0 ? 'Không có công thức phù hợp' : 'Trang này chưa có công thức'}</h2>
              <p className="mt-2 text-surface-600">{result.meta.totalCount === 0 ? 'Hãy giảm điều kiện lọc hoặc xóa bộ lọc để xem thêm món.' : 'Chọn trang trước hoặc áp dụng lại bộ lọc để về trang đầu.'}</p>
            </div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map(recipe => <article key={recipe.id} data-testid="recipe-card" className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap justify-between gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-surface-100 px-3 py-1 text-surface-600">{recipe.categoryName ?? 'Công thức'}</span>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">{difficultyLabels[recipe.difficulty as RecipeDifficulty]}</span>
                </div>
                <h2 className="mt-4 text-xl font-bold text-surface-900">{recipe.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-surface-600">{recipe.description}</p>
                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-surface-100 pt-4 text-sm">
                  <div><dt className="text-xs text-surface-500">Chuẩn bị</dt><dd className="mt-1 font-semibold">{recipe.prepTime} phút</dd></div>
                  <div><dt className="text-xs text-surface-500">Nấu</dt><dd className="mt-1 font-semibold">{recipe.cookTime} phút</dd></div>
                  <div><dt className="text-xs text-surface-500">Khẩu phần</dt><dd className="mt-1 font-semibold">{recipe.servings}</dd></div>
                </dl>
                {recipe.authorName && <p className="mt-4 text-xs text-surface-500">Chia sẻ bởi {recipe.authorName}</p>}
              </article>)}
            </div>}
            {result.meta.totalCount > 0 && <nav aria-label="Phân trang công thức" className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <button type="button" disabled={!result.meta.hasPreviousPage} onClick={() => changePage(Math.max(1, result.meta.page - 1))} className={buttonClass + ' border border-surface-300 bg-white'}>Trang trước</button>
              <span className="text-sm text-surface-600">Trang {result.meta.page} / {result.meta.totalPages}</span>
              <button type="button" disabled={!result.meta.hasNextPage} onClick={() => changePage(result.meta.page + 1)} className={buttonClass + ' border border-surface-300 bg-white'}>Trang sau</button>
            </nav>}
          </>}
        </section>
      </Content>
    </div>
  )
}

export default function RecipesPage({ embedded = false }: { embedded?: boolean }) {
  const [params, setParams] = useSearchParams()
  const search = params.toString()
  // URL changes remount the browser: form values and results always match
  // browser Back/Forward, reloads and shared links. Cleanup aborts stale fetches.
  return <RecipeBrowser key={search} search={search} navigate={setParams} embedded={embedded} />
}
