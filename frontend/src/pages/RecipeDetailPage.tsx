import { useEffect, useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { ErrorState } from '../components/common/ErrorState'
import { PageLoading } from '../components/common/PageLoading'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { getStaticRecipeBySlug } from '../data/blog-static'
import { formatDate } from '../lib/formatDate'
import type { RecipeDetail } from '../types/recipe'

const DIFFICULTY_LABELS: Record<RecipeDetail['difficulty'], string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  EXPERT: 'Chuyên sâu',
}

type DetailState = { key: string; status: 'loading' } | { key: string; status: 'ready'; recipe: RecipeDetail | null }

function formatQuantity(ingredient: RecipeDetail['ingredients'][number]): string {
  if (ingredient.quantity === undefined) return ''
  return `${ingredient.quantity} ${ingredient.unit ?? ''}`.trim()
}

/**
 * Public recipe detail. Served by the static sample data for now; swapping in
 * the real API (issue #21) only means replacing `getStaticRecipeBySlug`.
 */
export default function RecipeDetailPage() {
  const { slug } = useParams()
  const [response, setResponse] = useState<DetailState | null>(null)

  useEffect(() => {
    let active = true
    const key = slug ?? ''
    getStaticRecipeBySlug(key)
      .then(found => {
        if (active) setResponse({ key, status: 'ready', recipe: found })
      })
      .catch(() => {
        // The sample data cannot fail; a rejection is treated as "not found".
        if (active) setResponse({ key, status: 'ready', recipe: null })
      })
    return () => {
      active = false
    }
  }, [slug])

  const view: DetailState = response && response.key === (slug ?? '')
    ? response
    : { key: slug ?? '', status: 'loading' }

  if (view.status === 'loading') {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <PageLoading label="Đang tải công thức..." cards={3} />
      </main>
    )
  }

  const recipe = view.recipe

  if (recipe === null) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <ErrorState
          title="Không tìm thấy công thức"
          message="Công thức này không tồn tại hoặc đã ngừng xuất bản."
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
