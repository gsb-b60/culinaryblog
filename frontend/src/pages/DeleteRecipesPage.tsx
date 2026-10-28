import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { EmptyState } from '../components/common/EmptyState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import { ApiError, deleteRecipe, getManagedRecipes } from '../lib/api'
import { useAuthStore } from '../store'
import type { AuthResponse } from '../types/auth'
import type { RecipePage } from '../types/recipe'

const labels = { DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã lưu trữ' }

function errorMessage(reason: unknown): string {
  if (!(reason instanceof ApiError)) return 'Không thể thực hiện yêu cầu. Vui lòng thử lại.'
  if (reason.status === 403) return 'Bạn không có quyền xóa công thức này.'
  if (reason.status === 404) return 'Công thức không còn tồn tại. Hãy tải lại danh sách.'
  if (reason.status === 0) return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
  return 'Không thể xóa công thức. Vui lòng thử lại sau.'
}

export default function DeleteRecipesPage() {
  const session = useAuthStore((state) => state.session)
  if (!session) return null
  // A different account or permission set must never inherit the previous list or requests.
  const accountKey = JSON.stringify([session.user.id, session.user.roles])
  return <AccountDeleteRecipesPage key={accountKey} session={session} />
}

function AccountDeleteRecipesPage({ session }: { session: AuthResponse }) {
  const navigate = useNavigate()
  const signOut = useAuthStore((state) => state.signOut)
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<RecipePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const busy = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const token = useAuthStore.getState().session?.accessToken
    if (!token) return
    let active = true
    const controller = new AbortController()
    getManagedRecipes(token, page, controller.signal)
      .then((result) => {
        if (!active) return
        const lastPage = Math.max(1, result.meta.totalPages)
        if (page > lastPage) {
          setPage(lastPage)
          return
        }
        setData(result)
        setLoading(false)
      })
      .catch((reason: unknown) => {
        if (!active) return
        if (reason instanceof ApiError && reason.status === 401) {
          signOut()
          navigate('/auth/login', { replace: true })
          return
        }
        setError(errorMessage(reason))
        setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [page, revision, navigate, signOut])

  const reload = () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setRevision((value) => value + 1)
  }

  const changePage = (next: number) => {
    setLoading(true)
    setError('')
    setSuccess('')
    setConfirming(null)
    setPage(next)
    // Retry even when the requested page already matches a previous failed request.
    setRevision((value) => value + 1)
  }

  const remove = async (id: string) => {
    if (busy.current) return
    busy.current = true
    setPending(id)
    setError('')
    setSuccess('')
    try {
      const token = useAuthStore.getState().session?.accessToken ?? session.accessToken
      await deleteRecipe(token, id)
      if (!mounted.current) return
      setConfirming(null)
      setSuccess('Đã xóa công thức.')
      // Refetch offset pages so items on later pages remain reachable after a deletion.
      setData(null)
      setLoading(true)
      if (data && data.items.length === 1 && page > 1) {
        setPage((value) => value - 1)
      }
      setRevision((value) => value + 1)
    } catch (reason) {
      if (!mounted.current) return
      if (reason instanceof ApiError && reason.status === 401) {
        signOut()
        navigate('/auth/login', { replace: true })
      } else {
        setError(errorMessage(reason))
      }
    } finally {
      busy.current = false
      if (mounted.current) setPending(null)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Xóa công thức</h1>
          <p className="mt-2 text-sm text-surface-500">
            Khu vực riêng để xóa vĩnh viễn công thức và dữ liệu liên quan.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading || pending !== null}
          className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Tải lại
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </p>
      )}
      {loading ? (
        <PageLoading label="Đang tải công thức..." cards={2} />
      ) : (
        <>
          {!error && data?.items.length === 0 && (
            <EmptyState
              title="Chưa có công thức"
              description="Các công thức bạn có quyền quản lý sẽ xuất hiện tại đây."
            />
          )}
          <div className="space-y-4">
            {data?.items.map((recipe) => (
              <article
                key={recipe.id}
                aria-label={recipe.title}
                className="rounded-xl border border-surface-200 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-lg font-bold">{recipe.title}</h2>
                    <p className="mt-1 text-sm text-surface-500">
                      {recipe.categoryName ?? 'Chưa có danh mục'}
                      {session.user.roles.includes('ADMIN') && recipe.authorName
                        ? ' · ' + recipe.authorName
                        : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-surface-600">
                    {labels[recipe.status]}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line break-words text-sm text-surface-600">
                  {recipe.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 pt-4">
                  <p className="text-xs text-surface-500">
                    {recipe.steps.length} bước thực hiện · Cập nhật{' '}
                    {new Date(recipe.updatedAt).toLocaleString('vi-VN')}
                  </p>
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() => {
                      setConfirming(recipe.id)
                      setError('')
                      setSuccess('')
                    }}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
                {confirming === recipe.id && (
                  <div
                    role="group"
                    aria-label={`Xác nhận xóa ${recipe.title}`}
                    className="mt-4 rounded-lg bg-red-50 p-4"
                  >
                    <p className="text-sm text-red-800">
                      Xóa vĩnh viễn công thức “{recipe.title}” và dữ liệu liên quan?
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        disabled={pending !== null}
                        onClick={() => void remove(recipe.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        {pending === recipe.id ? 'Đang xóa...' : 'Xác nhận xóa'}
                      </button>
                      <button
                        type="button"
                        disabled={pending !== null}
                        onClick={() => setConfirming(null)}
                        className="px-3 py-2 text-sm"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
          {data && (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              totalCount={data.meta.totalCount}
              itemLabel="công thức"
              disabled={pending !== null}
              onPageChange={changePage}
              label="Phân trang công thức để xóa"
            />
          )}
        </>
      )}
      <p className="mt-6 text-sm text-surface-500">
        <Link to="/dashboard/recipes" className="text-brand-700">
          ← Về quản lý công thức
        </Link>
      </p>
    </>
  )
}
