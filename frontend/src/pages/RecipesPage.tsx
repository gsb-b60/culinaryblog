import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import DashboardSidebar from '../components/DashboardSidebar'
import { ConfirmLogoutModal } from '../components/ConfirmLogoutModal'

import { ApiError, logout, getManagedRecipes, publishRecipe, unpublishRecipe } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'
import type { Recipe, RecipePage } from '../types/recipe'

const labels = { DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã lưu trữ' }

function errorMessage(reason: unknown): string {
  if (!(reason instanceof ApiError)) return 'Không thể thực hiện yêu cầu. Vui lòng thử lại.'
  if (reason.status === 403) return 'Bạn không có quyền thay đổi công thức này.'
  if (reason.status === 404) return 'Công thức không còn tồn tại. Hãy tải lại danh sách.'
  if (reason.status === 409) return 'Công thức vừa được thay đổi. Hãy tải lại danh sách rồi thử lại.'
  if (reason.status === 422) {
    return reason.problem?.errors?.steps
      ? 'Cần ít nhất một bước thực hiện trước khi xuất bản.'
      : 'Không thể đổi trạng thái công thức đã lưu trữ.'
  }
  if (reason.status === 0) return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
  return 'Máy chủ gặp lỗi. Vui lòng thử lại sau.'
}

export default function RecipesPage() {
  const navigate = useNavigate()
  const [session] = useState(() => loadSession())
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<RecipePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const busy = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!session) return
    let active = true
    const controller = new AbortController()
    getManagedRecipes(loadSession()?.accessToken ?? session.accessToken, page, controller.signal)
      .then(result => { if (active) setData(result) })
      .catch((reason: unknown) => {
        if (!active) return
        if (reason instanceof ApiError && reason.status === 401) {
          clearSession()
          navigate('/auth/login', { replace: true })
        } else {
          setError(errorMessage(reason))
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [session, page, revision, navigate])

  if (!session) return <Navigate to="/auth/login" replace />

  const reload = () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setRevision(value => value + 1)
  }

  const changePage = (next: number) => {
    setLoading(true)
    setError('')
    setSuccess('')
    setPage(next)
  }

  const changeStatus = async (recipe: Recipe) => {
    if (busy.current) return
    busy.current = true
    setPending(recipe.id)
    setError('')
    setSuccess('')
    try {
      const token = loadSession()?.accessToken ?? session.accessToken
      const updated = await (recipe.status === 'DRAFT' ? publishRecipe : unpublishRecipe)(token, recipe.id)
      if (!mounted.current) return
      setData(current => current ? {
        ...current, items: current.items.map(item => item.id === updated.id ? updated : item),
      } : current)
      setSuccess(updated.status === 'PUBLISHED' ? 'Đã xuất bản công thức.' : 'Đã chuyển công thức về bản nháp.')
    } catch (reason) {
      if (!mounted.current) return
      if (reason instanceof ApiError && reason.status === 401) {
        clearSession()
        navigate('/auth/login', { replace: true })
      } else {
        setError(errorMessage(reason))
      }
    } finally {
      busy.current = false
      if (mounted.current) setPending(null)
    }
  }

  const handleLogout = () => {
    const currentSession = loadSession() ?? session
    void logout(currentSession.accessToken, currentSession.refreshToken).catch(() => undefined)
    clearSession()
    navigate('/')
  }

  const isAdmin = session.user.roles.includes('ADMIN')

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 md:flex">
      <DashboardSidebar active="recipes" onLogout={() => setShowLogoutModal(true)} />
      <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 md:pb-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{isAdmin ? 'Quản lý công thức' : 'Công thức của tôi'}</h1>
            <p className="mt-2 text-sm text-surface-500">Xuất bản công thức khi đã có bước thực hiện, hoặc chuyển về bản nháp để tiếp tục chỉnh sửa.</p>
          </div>
          <button type="button" onClick={reload} disabled={loading || pending !== null} className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">Tải lại</button>
        </div>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">{success}</p>}
        {loading ? <p role="status" className="py-12 text-center text-surface-500">Đang tải công thức...</p> : (
          <>
            {!error && data?.items.length === 0 && <div className="rounded-xl border border-surface-200 bg-white p-10 text-center"><h2 className="font-semibold">Chưa có công thức</h2><p className="mt-2 text-sm text-surface-500">Các công thức của bạn sẽ xuất hiện tại đây khi được tạo.</p></div>}
            <div className="space-y-4">
              {data?.items.map(recipe => {
                const canManage = isAdmin || recipe.authorId === session.user.id
                const noSteps = recipe.status === 'DRAFT' && recipe.steps.length === 0
                const archived = recipe.status === 'ARCHIVED'
                return (
                  <article key={recipe.id} aria-label={recipe.title} className="rounded-xl border border-surface-200 bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-lg font-bold">{recipe.title}</h2>
                        <p className="mt-1 text-sm text-surface-500">{recipe.categoryName ?? 'Chưa có danh mục'}{isAdmin && recipe.authorName ? ' · ' + recipe.authorName : ''}</p>
                      </div>
                      <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (recipe.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-surface-100 text-surface-600')}>{labels[recipe.status]}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-line break-words text-sm text-surface-600">{recipe.description}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 pt-4">
                      <p className="text-xs text-surface-500">{recipe.steps.length} bước thực hiện · Cập nhật {new Date(recipe.updatedAt).toLocaleString('vi-VN')}</p>
                      {canManage && !archived && <button type="button" disabled={pending !== null || noSteps} onClick={() => { void changeStatus(recipe) }} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">{pending === recipe.id ? 'Đang cập nhật...' : recipe.status === 'DRAFT' ? 'Xuất bản' : 'Chuyển về bản nháp'}</button>}
                    </div>
                    {noSteps && <p className="mt-3 text-sm text-amber-700">Cần ít nhất một bước thực hiện trước khi xuất bản.</p>}
                    {archived && <p className="mt-3 text-sm text-surface-500">Công thức đã lưu trữ không thể đổi trạng thái tại đây.</p>}
                  </article>
                )
              })}
            </div>
            {data && data.meta.totalPages > 0 && <nav aria-label="Phân trang công thức" className="mt-6 flex items-center justify-between gap-3 text-sm">
              <button type="button" disabled={!data.meta.hasPreviousPage || pending !== null} onClick={() => changePage(page - 1)} className="rounded-lg border border-surface-300 bg-white px-4 py-2 disabled:opacity-50">Trang trước</button>
              <span>Trang {data.meta.page}/{data.meta.totalPages} · {data.meta.totalCount} công thức</span>
              <button type="button" disabled={!data.meta.hasNextPage || pending !== null} onClick={() => changePage(page + 1)} className="rounded-lg border border-surface-300 bg-white px-4 py-2 disabled:opacity-50">Trang sau</button>
            </nav>}
          </>
        )}
      </main>
      {showLogoutModal && <ConfirmLogoutModal onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
    </div>
  )
}
