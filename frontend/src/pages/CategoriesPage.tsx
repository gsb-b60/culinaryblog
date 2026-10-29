import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import { useCategories } from '../hooks/useCategories'

function positiveInteger(value: string | null, fallback: number, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 && number <= maximum ? number : fallback
}

/** Category list uses the same pagination controls and API envelope as recipes. */
export default function CategoriesPage() {
  const [params, setParams] = useSearchParams()
  const page = positiveInteger(params.get('page'), 1)
  const pageSize = positiveInteger(params.get('pageSize'), 12, 50)
  const { data, isPending, isFetching, isError, refetch } = useCategories({ page, pageSize })
  const lastPage = Math.max(1, data?.meta.totalPages ?? 1)
  const correctingPage = !isError && data !== undefined && page > lastPage

  useEffect(() => {
    if (!correctingPage) return
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(lastPage))
      return next
    }, { replace: true })
  }, [correctingPage, lastPage, setParams])

  function changePage(nextPage: number, nextSize = pageSize) {
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    next.set('pageSize', String(nextSize))
    setParams(next)
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Danh sách danh mục</h1>
        <label className="text-sm">
          Số mục mỗi trang
          <select
            className="ml-2 rounded-lg border border-surface-300 bg-white p-2"
            value={pageSize}
            disabled={isFetching || correctingPage}
            onChange={(event) => changePage(1, Number(event.target.value))}
          >
            {[...new Set([12, 24, 50, pageSize])].sort((a, b) => a - b).map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </header>
      {isPending || correctingPage ? <PageLoading label="Đang tải danh mục..." /> : isError ? (
        <ErrorState message="Không thể tải danh mục." onRetry={() => { void refetch() }} />
      ) : data && (
        <>
          {data.items.length === 0 ? (
            <EmptyState
              title="Chưa có danh mục"
              description="Danh mục sẽ xuất hiện tại đây."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Danh sách danh mục">
              {data.items.map((category) => (
                <li key={category.id} className="rounded-xl border border-surface-200 bg-white p-5">
                  <h2 className="font-semibold">{category.name}</h2>
                  {category.description && <p className="mt-2 text-sm text-surface-600">{category.description}</p>}
                  <p className="mt-3 text-sm text-surface-500">{category.recipeCount ?? 0} công thức</p>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            totalCount={data.meta.totalCount}
            itemLabel="danh mục"
            label="Phân trang danh mục"
            disabled={isFetching || correctingPage}
            onPageChange={changePage}
          />
        </>
      )}
    </>
  )
}
