import { useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import { RecipeCard } from '../components/common/RecipeCard'
import { Input } from '../components/ui/input'
import { usePublicCategories } from '../hooks/usePublicCategories'
import { listRecipes } from '../lib/api'
import type { PagedRecipes, RecipeDifficulty } from '../types/recipe'

const PAGE_SIZE = 12
type QueryState =
  | { key: string; status: 'success'; list: PagedRecipes }
  | { key: string; status: 'error' }

function chipClasses(active: boolean): string {
  return 'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ' +
    (active ? 'border-brand-500 bg-brand-500 text-white' : 'border-surface-200 bg-white text-surface-600 hover:border-brand-300')
}

/** Public recipes are always loaded from the published-only API. */
export default function RecipesBrowsePage() {
  const [params, setParams] = useSearchParams()
  const catalog = usePublicCategories()
  const search = params.get('q') ?? ''
  const requestedPage = Number(params.get('page') ?? 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const legacyCategory = params.get('category')
  const categoryId = params.get('categoryId') ??
    catalog.data.find(item => item.name === legacyCategory)?.id
  const unresolvedCategory = Boolean(legacyCategory) && catalog.loading && !categoryId
  const unknownCategory = Boolean(legacyCategory) && !catalog.loading && !catalog.error && !categoryId
  const difficulty = params.get('difficulty') ?? ''
  const maxCookTime = params.get('maxCookTime') ?? ''
  const minServings = params.get('minServings') ?? ''
  const validNumber = (value: string, minimum: number) => value === '' ||
    (value.trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= minimum && Number(value) <= 2147483647)
  const invalidFilters = (difficulty !== '' && !['Easy', 'Medium', 'Hard', 'Expert', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(difficulty)) ||
    !validNumber(maxCookTime, 0) || !validNumber(minServings, 1)
  const shortSearch = search.trim().length === 1
  const [revision, setRevision] = useState(0)
  const [response, setResponse] = useState<QueryState | null>(null)
  const queryKey = JSON.stringify([search.trim(), categoryId, difficulty, maxCookTime, minServings, page, revision])

  useEffect(() => {
    if (shortSearch || unresolvedCategory || unknownCategory || invalidFilters) return
    const controller = new AbortController()
    let active = true
    const timer = window.setTimeout(() => {
      listRecipes({ page, pageSize: PAGE_SIZE, categoryId, searchQuery: search.trim() || undefined,
        difficulty: difficulty ? difficulty.toUpperCase() as RecipeDifficulty : undefined,
        maxCookTime: maxCookTime === '' ? undefined : Number(maxCookTime),
        minServings: minServings === '' ? undefined : Number(minServings),
      }, controller.signal)
        .then(list => {
          if (!active) return
          const lastPage = Math.max(1, list.meta.totalPages)
          if (page > lastPage) {
            setParams(current => {
              const next = new URLSearchParams(current)
              next.set('page', String(lastPage))
              return next
            }, { replace: true })
            return
          }
          setResponse({ key: queryKey, status: 'success', list })
        })
        .catch(() => { if (active) setResponse({ key: queryKey, status: 'error' }) })
    }, search.trim() ? 250 : 0)
    return () => { active = false; window.clearTimeout(timer); controller.abort() }
  }, [search, categoryId, difficulty, maxCookTime, minServings, invalidFilters, page, queryKey, shortSearch, unresolvedCategory, unknownCategory, setParams])

  const view = response?.key === queryKey ? response : null
  function updateFilter(key: string, value: string | null) {
    setParams(current => {
      const next = new URLSearchParams(current)
      next.delete('page')
      if (key === 'categoryId') next.delete('category')
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }
  function clearFilters() { setParams({}) }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-brand-600">Khám phá</p>
        <h1 className="mt-1 text-3xl font-bold text-surface-900">Công thức</h1>
        <p className="mt-2 text-surface-600">Toàn bộ công thức được xuất bản trên Culinary Blog. Kết hợp danh mục, độ khó, thời gian nấu, khẩu phần và từ khóa để tìm công thức phù hợp.</p>
      </header>
      <div className="mt-7 flex flex-col gap-4">
        <div className="w-full lg:max-w-sm">
          <label htmlFor="recipe-search" className="sr-only">Tìm công thức</label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-surface-400" aria-hidden="true" />
            <Input id="recipe-search" type="search" placeholder="Tìm công thức..." value={search}
              onChange={event => updateFilter('q', event.target.value)} className="pl-9" />
          </div>
        </div>
        <div role="group" aria-label="Lọc theo danh mục" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!categoryId && !legacyCategory} onClick={() => updateFilter('categoryId', null)} className={chipClasses(!categoryId && !legacyCategory)}>Tất cả</button>
          {catalog.data.map(category => (
            <button key={category.id} type="button" aria-pressed={categoryId === category.id}
              onClick={() => updateFilter('categoryId', category.id)} className={chipClasses(categoryId === category.id)}>{category.name}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4" role="group" aria-label="Bộ lọc công thức">
          <div className="flex flex-col gap-1 text-sm">
            <label htmlFor="recipe-difficulty">Độ khó</label>
            <select id="recipe-difficulty" className="h-9 rounded-md border bg-white px-3" value={difficulty.toUpperCase()}
              onChange={event => updateFilter('difficulty', event.target.value)}>
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Dễ</option><option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option><option value="EXPERT">Chuyên gia</option>
            </select>
          </div>
          <label className="flex flex-col gap-1 text-sm" htmlFor="recipe-max-time">Thời gian nấu tối đa (phút)
            <Input id="recipe-max-time" type="number" min="0" max="2147483647" step="1" value={maxCookTime}
              onChange={event => updateFilter('maxCookTime', event.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm" htmlFor="recipe-min-servings">Khẩu phần tối thiểu
            <Input id="recipe-min-servings" type="number" min="1" max="2147483647" step="1" value={minServings}
              onChange={event => updateFilter('minServings', event.target.value)} />
          </label>
          <button type="button" className={chipClasses(false)} onClick={clearFilters}>Xóa bộ lọc</button>
        </div>
        {catalog.error && <ErrorState message="Không thể tải danh mục." onRetry={catalog.reload} />}
      </div>
      {invalidFilters ? <p role="alert" className="mt-8 text-sm text-red-600">Bộ lọc không hợp lệ. Thời gian nấu phải là số nguyên từ 0; khẩu phần phải là số nguyên từ 1 (tối đa 2147483647). Chọn độ khó hợp lệ hoặc xóa bộ lọc.</p>
        : shortSearch ? <p className="mt-8 text-sm text-surface-500">Nhập ít nhất 2 ký tự để tìm kiếm công thức.</p>
        : unknownCategory ? <div className="mt-8"><EmptyState title="Không tìm thấy danh mục" /></div>
        : view?.status === 'error' ? <div className="mt-8"><ErrorState message="Không thể tải danh sách công thức. Vui lòng thử lại." onRetry={() => setRevision(value => value + 1)} /></div>
        : !view || unresolvedCategory ? <div className="mt-8"><PageLoading label="Đang tải công thức..." cards={4} /></div>
        : <>
          {view.list.items.length === 0 ? (
            <div className="mt-8"><EmptyState title="Không tìm thấy công thức" description="Thử đổi từ khóa hoặc chọn một danh mục khác." /></div>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{view.list.items.map(recipe => <li key={recipe.id}><RecipeCard recipe={recipe} /></li>)}</ul>
          )}
          <Pagination page={view.list.meta.page} totalPages={view.list.meta.totalPages} totalCount={view.list.meta.totalCount}
            itemLabel="công thức" label="Phân trang công thức" onPageChange={value => setParams(current => {
              const next = new URLSearchParams(current); next.set('page', String(value)); return next
            })} />
        </>}
    </main>
  )
}
