import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorState } from '../components/common/ErrorState'
import { EmptyState } from '../components/common/EmptyState'
import { PageLoading } from '../components/common/PageLoading'
import { getRecipeOverview, ApiError } from '../lib/api'
import { useAuthStore } from '../store'
import type { RecipeOverview } from '../types/recipe'

const labels = { DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã lưu trữ' }

/** Load statistics from the authenticated account; changing account discards old results. */
export default function DashboardPage() {
  const session = useAuthStore(state => state.session)
  if (!session) return null
  return <AccountDashboardPage key={JSON.stringify([session.user.id, [...session.user.roles].sort()])} />
}

function AccountDashboardPage() {
  const navigate = useNavigate()
  const session = useAuthStore(state => state.session)
  const [revision, setRevision] = useState(0)
  const [response, setResponse] = useState<{ revision: number; data?: RecipeOverview; error?: boolean } | null>(null)
  useEffect(() => {
    const account = useAuthStore.getState().session
    const token = account?.accessToken
    if (!token) return
    const controller = new AbortController()
    let active = true
    getRecipeOverview(token, controller.signal)
      .then(data => { if (active) setResponse({ revision, data }) })
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 401) {
          const current = useAuthStore.getState().session
          if (!current || current.user.id === account?.user.id) {
            useAuthStore.getState().signOut()
            navigate('/auth/login', { replace: true })
          }
          return
        }
        if (active) setResponse({ revision, error: true })
      })
    return () => { active = false; controller.abort() }
  }, [revision, navigate])
  if (!session) return null
  const current = response?.revision === revision ? response : null
  const data = current?.data
  const stats = data ? [
    ['Tổng công thức', data.stats.total], ['Đã xuất bản', data.stats.published],
    ['Bản nháp', data.stats.draft], ['Đã lưu trữ', data.stats.archived],
  ] as const : []

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-surface-500">Tổng quan</p>
          <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Xin chào, {session.user.fullName || session.user.email}!</h1>
          <p className="mt-2 text-sm text-surface-500">{session.user.roles.includes('ADMIN') ? 'Thống kê toàn bộ công thức trong hệ thống.' : 'Thống kê các công thức của bạn.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" disabled={!current} onClick={() => setRevision(value => value + 1)} className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm disabled:opacity-50">Tải lại</button>
          <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700" aria-label="Hồ sơ">{(session.user.fullName || session.user.email).charAt(0).toUpperCase()}</Link>
        </div>
      </div>
      {!current ? <PageLoading label="Đang tải tổng quan..." cards={4} />
        : current.error ? <ErrorState message="Không thể tải tổng quan." onRetry={() => setRevision(value => value + 1)} />
        : data && <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {stats.map(([label, value]) => (
              <div key={label} role="group" aria-label={label} className="rounded-xl border border-surface-200 bg-white p-4 sm:p-5">
                <span className="text-xs text-surface-500 sm:text-sm">{label}</span>
                <div className="mt-3 text-2xl font-bold text-surface-900">{value}</div>
              </div>
            ))}
          </div>
          <section className="mt-6 overflow-hidden rounded-xl border border-surface-200 bg-white">
            <div className="flex items-center justify-between border-b border-surface-200 p-4 sm:p-5">
              <h2 className="font-bold text-surface-900">Công thức gần đây</h2>
              <Link to="/dashboard/recipes" className="text-sm font-medium text-brand-600">Xem tất cả</Link>
            </div>
            {data.recentRecipes.length === 0 ? <EmptyState title="Chưa có công thức" description="Công thức của bạn sẽ xuất hiện tại đây sau khi được tạo." /> : (
              <ul className="divide-y divide-surface-100">
                {data.recentRecipes.map(recipe => (
                  <li key={recipe.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
                    <div><Link to={'/recipes/' + encodeURIComponent(recipe.slug)} className="font-semibold text-surface-900 hover:text-brand-600">{recipe.title}</Link>
                      <p className="mt-1 text-xs text-surface-500">{recipe.categoryName ?? 'Chưa có danh mục'} · {new Date(recipe.updatedAt).toLocaleString('vi-VN')}</p></div>
                    <span className="rounded-full bg-surface-100 px-3 py-1 text-xs">{labels[recipe.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>}
      <section aria-labelledby="archive-recipes-heading" className="mt-6 rounded-xl border border-surface-200 bg-white p-5 sm:p-6">
        <h2 id="archive-recipes-heading" className="font-bold text-surface-900">Lưu trữ công thức</h2>
        <p className="mt-2 text-sm text-surface-500">Ẩn công thức khỏi trang công khai và giữ lại nguyên liệu, các bước cùng hình ảnh.</p>
        <Link to="/dashboard/recipes/archive" className="mt-4 inline-flex rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Lưu trữ công thức</Link>
      </section>
    </>
  )
}
