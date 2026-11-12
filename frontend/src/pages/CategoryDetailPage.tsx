import { ArrowLeftIcon } from 'lucide-react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import { RecipeCard } from '../components/common/RecipeCard'
import { Badge } from '../components/ui/badge'
import { useCategoryDetail } from '../hooks/useCategories'
import { ApiError } from '../lib/api'
import { useAuthStore } from '../store'

const PAGE_SIZE = 12

function positiveInteger(value: string | null, fallback: number): number {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : fallback
}

function categoryBasePath(pathname: string): string {
  return pathname.startsWith('/dashboard/categories')
    ? '/dashboard/categories'
    : '/categories'
}

/**
 * Public category detail screen. The same component is reused inside the
 * dashboard shell, so all links are derived from the current route.
 */
export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const page = positiveInteger(params.get('page'), 1)
  const accessToken = useAuthStore((state) => state.session?.accessToken)
  const basePath = categoryBasePath(location.pathname)
  const { data, isPending, isFetching, isError, error, refetch } = useCategoryDetail(
    slug ?? '',
    page,
    PAGE_SIZE,
    accessToken,
  )

  if (!slug) {
    return (
      <div data-testid="category-detail-404">
        <ErrorState
          title="Không tìm thấy danh mục"
          message="Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
        />
        <Link to={basePath} className="mt-4 inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Xem tất cả danh mục
        </Link>
      </div>
    )
  }

  if (isPending) {
    return (
      <div data-testid="category-detail-loading">
        <PageLoading label="Đang tải danh mục..." cards={3} />
      </div>
    )
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div data-testid="category-detail-404">
          <ErrorState
            title="Không tìm thấy danh mục"
            message="Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
          />
          <Link to={basePath} className="mt-4 inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Xem tất cả danh mục
          </Link>
        </div>
      )
    }
    return (
      <ErrorState
        message="Không thể tải danh mục."
        onRetry={() => { void refetch() }}
      />
    )
  }

  if (!data) return null

  const { recipes } = data
  const hasViewerDrafts = recipes.items.some((recipe) => recipe.status === 'DRAFT')

  function changePage(nextPage: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    setParams(next)
  }

  return (
    <div>
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
        <Link to={basePath} className="hover:text-brand-700">
          Danh mục
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-surface-700">{data.name}</span>
      </nav>

      <header className="mt-5 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-brand-50 text-brand-700 hover:bg-brand-100">
            {data.recipeCount ?? recipes.meta.totalCount} công thức
          </Badge>
          {hasViewerDrafts && (
            <Badge variant="outline">Bản nháp của bạn cũng được hiển thị</Badge>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-surface-900 sm:text-4xl">
          {data.name}
        </h1>
        {data.description && <p className="mt-3 text-base text-surface-600">{data.description}</p>}
      </header>

      <section className="mt-7" aria-label={`Công thức trong danh mục ${data.name}`}>
        {recipes.items.length === 0 ? (
          <div data-testid="category-detail-empty">
            <EmptyState
              title="Chưa có công thức nào"
              description="Danh mục này hiện chưa có công thức nào được xuất bản."
            />
          </div>
        ) : (
          <div data-testid="category-detail-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.items.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} headingLevel={2} />
            ))}
          </div>
        )}
        <Pagination
          page={recipes.meta.page}
          totalPages={recipes.meta.totalPages}
          totalCount={recipes.meta.totalCount}
          itemLabel="công thức"
          label="Phân trang công thức"
          disabled={isFetching}
          onPageChange={changePage}
        />
      </section>

      <Link to={basePath} className="mt-6 inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Quay lại danh sách danh mục
      </Link>
    </div>
  )
}
