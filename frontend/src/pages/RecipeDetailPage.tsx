import { useEffect, useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { ErrorState } from '../components/common/ErrorState'
import { PageLoading } from '../components/common/PageLoading'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { ApiError, getRecipeBySlug } from '../lib/api'
import { useAuthStore } from '../store'
import { formatDate } from '../lib/formatDate'
import type { RecipeDetail } from '../types/recipe'

const DIFFICULTY_LABELS: Record<RecipeDetail['difficulty'], string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  EXPERT: 'Chuyên sâu',
}

type DetailState =
  | { key: string; status: 'loading' }
  | { key: string; status: 'ready'; recipe: RecipeDetail }
  | { key: string; status: 'error'; code: number }

function failureMessage(code: number): { title: string; message: string } {
  if (code === 404) return { title: 'Không tìm thấy công thức', message: 'Công thức này không tồn tại hoặc đã ngừng xuất bản.' }
  if (code === 403) return { title: 'Không có quyền truy cập', message: 'Chỉ tác giả hoặc quản trị viên mới được xem công thức này.' }
  if (code === 401) return { title: 'Phiên đăng nhập đã hết hạn', message: 'Vui lòng đăng nhập lại để xem công thức này.' }
  return { title: 'Không thể tải công thức', message: code === 0 ? 'Không thể kết nối máy chủ. Vui lòng thử lại.' : 'Máy chủ gặp lỗi. Vui lòng thử lại sau.' }
}

function formatQuantity(ingredient: RecipeDetail['ingredients'][number]): string {
  if (ingredient.quantity === undefined) return ''
  return `${ingredient.quantity} ${ingredient.unit ?? ''}`.trim()
}

/** Load recipe details using the current account; never retain private content across sessions. */
export default function RecipeDetailPage() {
  const { slug } = useParams()
  const accessToken = useAuthStore(state => state.session?.accessToken)
  const [response, setResponse] = useState<DetailState | null>(null)
  const [revision, setRevision] = useState(0)
  const requestKey = JSON.stringify([slug, accessToken, revision])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    getRecipeBySlug(slug ?? '', accessToken, controller.signal)
      .then(recipe => {
        if (active) setResponse({ key: requestKey, status: 'ready', recipe })
      })
      .catch((reason: unknown) => {
        if (!active || controller.signal.aborted) return
        // A session change aborts the old request; the new session fetches independently.
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setResponse({ key: requestKey, status: 'error', code: reason instanceof ApiError ? reason.status : 500 })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [slug, accessToken, revision, requestKey])

  const view: DetailState = response?.key === requestKey
    ? response
    : { key: requestKey, status: 'loading' }

  if (view.status === 'loading') {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <PageLoading label="Đang tải công thức..." cards={3} />
      </main>
    )
  }

  if (view.status === 'error') {
    const failure = failureMessage(view.code)
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <ErrorState
          title={failure.title}
          message={failure.message}
          onRetry={view.code === 0 || view.code >= 500 ? () => setRevision(value => value + 1) : undefined}
        />
        <Link
          to="/recipes"
          className="mt-4 inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Quay lại danh sách công thức
        </Link>
      </main>
    )
  }

  const recipe = view.recipe
  const totalMinutes = recipe.prepTime + recipe.cookTime

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
        <Link to="/" className="hover:text-brand-700">
          Trang chủ
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/recipes" className="hover:text-brand-700">
          Công thức
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-surface-700">{recipe.title}</span>
      </nav>

      <header className="mt-5 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-brand-50 text-brand-700 hover:bg-brand-100">
            {recipe.categoryName ?? 'Khác'}
          </Badge>
          <Badge variant="outline">{DIFFICULTY_LABELS[recipe.difficulty]}</Badge>
          {recipe.status !== 'PUBLISHED' && (
            <Badge variant="outline">{recipe.status === 'ARCHIVED' ? 'Đã lưu trữ' : 'Bản nháp'}</Badge>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-surface-900 sm:text-4xl">
          {recipe.title}
        </h1>
        <p className="mt-3 text-base text-surface-600">{recipe.description}</p>
      </header>

      <div
        className="mt-6 flex h-48 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 via-brand-50 to-surface-100 sm:h-64"
        role="img"
        aria-label={`Minh họa cho công thức ${recipe.title}`}
      >
        <span className="text-sm font-semibold text-brand-700">{recipe.categoryName}</span>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <dt className="text-xs text-surface-500">Chuẩn bị</dt>
          <dd className="mt-1 font-semibold text-surface-900">{recipe.prepTime} phút</dd>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <dt className="text-xs text-surface-500">Nấu</dt>
          <dd className="mt-1 font-semibold text-surface-900">{recipe.cookTime} phút</dd>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <dt className="text-xs text-surface-500">Tổng thời gian</dt>
          <dd className="mt-1 font-semibold text-surface-900">{totalMinutes} phút</dd>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <dt className="text-xs text-surface-500">Khẩu phần</dt>
          <dd className="mt-1 font-semibold text-surface-900">{recipe.servings} người</dd>
        </div>
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <section aria-labelledby="ingredients-heading" className="self-start">
          <Card>
            <CardHeader>
              <CardTitle id="ingredients-heading" className="text-lg font-semibold text-surface-900">
                Nguyên liệu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {recipe.ingredients.map(ingredient => (
                  <li key={ingredient.id} className="flex items-start justify-between gap-3">
                    <span className="text-surface-700">
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="block text-xs text-surface-400">{ingredient.notes}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-medium text-surface-900">
                      {formatQuantity(ingredient)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="text-xl font-bold text-surface-900">
            Hướng dẫn thực hiện
          </h2>
          <ol className="mt-4 space-y-4">
            {recipe.steps.map(step => (
              <li key={step.id} className="rounded-xl border border-surface-200 bg-white p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                    {step.stepNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-surface-900">{step.title}</h3>
                      {step.timerMinutes !== undefined && (
                        <Badge variant="outline" className="text-surface-600">
                          {step.timerMinutes} phút
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-surface-600">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Separator className="mt-10" />

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-surface-500">
        <p>
          Tác giả: <span className="font-medium text-surface-800">{recipe.authorName ?? 'Ẩn danh'}</span>
          {recipe.publishedAt && <> · Đăng ngày {formatDate(recipe.publishedAt)}</>}
        </p>
        <Link to="/recipes" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Quay lại danh sách
        </Link>
      </footer>
    </main>
  )
}
