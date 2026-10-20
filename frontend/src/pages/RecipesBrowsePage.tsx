import { useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import { RecipeCard } from '../components/common/RecipeCard'
import { Input } from '../components/ui/input'
import { STATIC_CATEGORIES, listStaticRecipes } from '../data/blog-static'
import type { StaticRecipeList } from '../data/blog-static'

const PAGE_SIZE = 4

type QueryState =
  | { key: string; status: 'success'; list: StaticRecipeList }
  | { key: string; status: 'error' }
  | { key: string; status: 'loading' }

function chipClasses(active: boolean): string {
  return [
    'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'border-brand-500 bg-brand-500 text-white'
      : 'border-surface-200 bg-white text-surface-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700',
  ].join(' ')
}

/**
 * Public recipe list. Served by the static sample data for now; swapping in
 * the real API (issue #20) only means replacing `listStaticRecipes`.
 */
export default function RecipesBrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [response, setResponse] = useState<QueryState | null>(null)
  // The category lives in the URL so links into this page (home page
  // categories, the shared header, reload, back/forward) and the chips always
  // agree on the same filter even though the route stays mounted.
  const category = searchParams.get('category')

  const queryKey = [search, category, page, revision].join('|')

  useEffect(() => {
    let active = true
    const key = [search, category, page, revision].join('|')
    listStaticRecipes({ q: search, category, page, pageSize: PAGE_SIZE })
      .then(list => {
        if (active) setResponse({ key, status: 'success', list })
      })
      .catch(() => {
        if (active) setResponse({ key, status: 'error' })
      })
    return () => {
      active = false
    }
  }, [search, category, page, revision])

  // A response that does not match the filters on screen is still pending.
  const view: QueryState = response && response.key === queryKey
    ? response
    : { key: queryKey, status: 'loading' }

  const applySearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const applyCategory = (value: string | null) => {
    setPage(1)
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      if (value) next.set('category', value)
      else next.delete('category')
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setPage(1)
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.delete('category')
      return next
    })
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-brand-600">Khám phá</p>
        <h1 className="mt-1 text-3xl font-bold text-surface-900">Công thức</h1>
        <p className="mt-2 text-surface-600">
          Toàn bộ công thức được xuất bản trên Culinary Blog. Lọc theo danh mục hoặc tìm nhanh bằng
          từ khóa.
        </p>
      </header>

      <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xs">
          <label htmlFor="recipe-search" className="sr-only">
            Tìm công thức
          </label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-surface-400"
              aria-hidden="true"
            />
            <Input
              id="recipe-search"
              type="search"
              placeholder="Tìm công thức..."
              value={search}
              onChange={event => applySearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div role="group" aria-label="Lọc theo danh mục" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={category === null} onClick={() => applyCategory(null)} className={chipClasses(category === null)}>
            Tất cả
          </button>
          {STATIC_CATEGORIES.map(name => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              onClick={() => applyCategory(name)}
              className={chipClasses(category === name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {view.status === 'error' && (
        <div className="mt-8">
          <ErrorState message="Không thể tải danh sách công thức. Vui lòng thử lại." onRetry={() => setRevision(value => value + 1)} />
        </div>
      )}

      {view.status === 'loading' && (
        <div className="mt-8">
          <PageLoading label="Đang tải công thức..." cards={4} />
        </div>
      )}

      {view.status === 'success' && (
        <>
          {view.list.items.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="Không tìm thấy công thức"
                description="Thử đổi từ khóa hoặc chọn một danh mục khác."
                action={{ label: 'Xóa bộ lọc', onClick: clearFilters }}
              />
            </div>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {view.list.items.map(recipe => (
                <li key={recipe.id}>
                  <RecipeCard recipe={recipe} />
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={view.list.meta.page}
            totalPages={view.list.meta.totalPages}
            totalCount={view.list.meta.totalCount}
            itemLabel="công thức"
            onPageChange={setPage}
            label="Phân trang công thức"
          />
        </>
      )}
    </main>
  )
}
