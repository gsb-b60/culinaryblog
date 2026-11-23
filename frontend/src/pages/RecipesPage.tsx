import { useEffect, useRef, useState } from 'react'
import { ChevronDown, FilePenLine, Info, Layers3, Leaf, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { EmptyState } from '../components/common/EmptyState'
import { PageLoading } from '../components/common/PageLoading'
import { Pagination } from '../components/common/Pagination'
import {
  ApiError,
  archiveRecipe,
  deleteRecipe,
  getManagedRecipes,
  publishRecipe,
  unpublishRecipe,
} from '../lib/api'
import { useAuthStore } from '../store'
import type { Recipe, RecipePage } from '../types/recipe'

const labels = { DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã lưu trữ' }
const menuItemClass = 'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50'

/** Translate API and validation failures into a message suitable for the user. */
function errorMessage(reason: unknown): string {
  if (!(reason instanceof ApiError)) return 'Không thể thực hiện yêu cầu. Vui lòng thử lại.'
  if (reason.status === 403) return 'Bạn không có quyền thay đổi công thức này.'
  if (reason.status === 404) return 'Công thức không còn tồn tại. Hãy tải lại danh sách.'
  if (reason.status === 409)
    return 'Công thức vừa được thay đổi. Hãy tải lại danh sách rồi thử lại.'
  if (reason.status === 422) {
    return reason.problem?.errors?.steps
      ? 'Cần ít nhất một bước thực hiện trước khi xuất bản.'
      : 'Không thể đổi trạng thái công thức đã lưu trữ.'
  }
  if (reason.status === 0) return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
  return 'Máy chủ gặp lỗi. Vui lòng thử lại sau.'
}

function deleteErrorMessage(reason: unknown): string {
  if (!(reason instanceof ApiError)) return 'Không thể xóa công thức. Vui lòng thử lại.'
  if (reason.status === 403) return 'Bạn không có quyền xóa công thức này.'
  if (reason.status === 404) return 'Công thức không còn tồn tại. Hãy tải lại danh sách.'
  if (reason.status === 0) return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
  return 'Không thể xóa công thức. Vui lòng thử lại sau.'
}

/**
 * Recipe management list. Shell (sidebar, mobile navigation, sign-out dialog,
 * auth guard) is provided by DashboardLayout.
 */
export default function RecipesPage({ mode = 'publish' }: { mode?: 'publish' | 'archive' }) {
  const session = useAuthStore((state) => state.session)
  if (!session) return null
  const accountKey = JSON.stringify([session.user.id, [...session.user.roles].sort()])
  return <AccountRecipesPage key={accountKey} mode={mode} />
}

function AccountRecipesPage({ mode }: { mode: 'publish' | 'archive' }) {
  const archiveMode = mode === 'archive'
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const isAuthenticated = useAuthStore((state) => state.session !== null)
  const signOut = useAuthStore((state) => state.signOut)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<RecipePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const busy = useRef(false)
  const mounted = useRef(true)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!openMenu) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenu(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openMenu])

  useEffect(() => {
    if (!isAuthenticated) return
    // Read the token at call time: the API client may rotate it mid-flight
    // and a new object identity must not re-run this effect.
    const account = useAuthStore.getState().session
    const token = account?.accessToken
    if (!token) return
    let active = true
    let correctingPage = false
    const controller = new AbortController()
    getManagedRecipes(token, page, controller.signal, pageSize)
      .then((result) => {
        if (!active) return
        const lastPage = Math.max(1, result.meta.totalPages)
        if (page > lastPage) {
          // Keep the loading state until the corrected page has finished loading.
          correctingPage = true
          setPage(lastPage)
          return
        }
        setData(result)
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiError && reason.status === 401) {
          // Losing the session re-runs this effect (isAuthenticated flips to
          // false) and deactivates it, so this branch must not wait on
          // `active` — otherwise the redirect never happens.
          const current = useAuthStore.getState().session
          if (!current || current.user.id === account?.user.id) {
            signOut()
            navigate('/auth/login', { replace: true })
          }
          return
        }
        if (!active) return
        setError(
          reason instanceof ApiError && reason.status === 0
            ? errorMessage(reason)
            : 'Không thể tải danh sách công thức. Vui lòng thử lại.',
        )
      })
      .finally(() => {
        if (active && !correctingPage) setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [isAuthenticated, page, pageSize, revision, navigate, signOut])

  // DashboardLayout owns the auth guard, so a missing session means the layout
  // is about to redirect (or is waiting for the sign-out navigation).
  if (!session) return null

  const reload = () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setConfirming(null)
    setOpenMenu(null)
    setRevision((value) => value + 1)
  }

  const changePage = (next: number) => {
    setLoading(true)
    setError('')
    setSuccess('')
    setConfirming(null)
    setOpenMenu(null)
    setPage(next)
    // The target page may already be selected after a failed request.
    setRevision((value) => value + 1)
  }

  const changeStatus = async (recipe: Recipe, archive = false) => {
    if (busy.current) return
    busy.current = true
    setPending(recipe.id)
    setError('')
    setSuccess('')
    try {
      const token = useAuthStore.getState().session?.accessToken ?? session.accessToken
      const updated = await (
        archive ? archiveRecipe : recipe.status === 'DRAFT' ? publishRecipe : unpublishRecipe
      )(token, recipe.id)
      if (!mounted.current) return
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            }
          : current,
      )
      setSuccess(
        updated.status === 'ARCHIVED'
          ? 'Đã lưu trữ công thức. Công thức đã được ẩn khỏi trang công khai.'
          : updated.status === 'PUBLISHED'
            ? 'Đã xuất bản công thức.'
            : 'Đã chuyển công thức về bản nháp.',
      )
    } catch (reason) {
      if (!mounted.current && !(reason instanceof ApiError && reason.status === 401 && !useAuthStore.getState().session)) return
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

  const remove = async (recipe: Recipe) => {
    if (busy.current) return
    busy.current = true
    setPending(recipe.id)
    setError('')
    setSuccess('')
    try {
      const token = useAuthStore.getState().session?.accessToken ?? session.accessToken
      await deleteRecipe(token, recipe.id)
      if (!mounted.current) return
      setConfirming(null)
      setSuccess('Đã xóa công thức.')
      // Refetch after deletion so the next item fills the page and metadata stays accurate.
      setData(null)
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (reason) {
      if (!mounted.current) return
      if (reason instanceof ApiError && reason.status === 401) {
        const current = useAuthStore.getState().session
        if (!current || current.user.id === session.user.id) {
          signOut()
          navigate('/auth/login', { replace: true })
        }
      } else {
        setError(deleteErrorMessage(reason))
      }
    } finally {
      busy.current = false
      if (mounted.current) setPending(null)
    }
  }

  const isAdmin = session.user.roles.includes('ADMIN')

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {archiveMode
              ? 'Lưu trữ công thức'
              : isAdmin
                ? 'Quản lý công thức'
                : 'Công thức của tôi'}
          </h1>
          <p className="mt-2 text-sm text-surface-500">
            {archiveMode
              ? 'Lưu trữ để ẩn công thức khỏi trang công khai và giữ nguyên dữ liệu. Bạn vẫn có thể xem chi tiết sau khi lưu trữ.'
              : 'Xem danh sách, xuất bản hoặc chuyển công thức về bản nháp. Công thức cần có ít nhất một bước thực hiện để xuất bản.'}
          </p>
        </div>
        {!archiveMode && (
          <Link
            to="/dashboard/recipes/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Tạo công thức
          </Link>
        )}
        <button
          type="button"
          onClick={reload}
          disabled={loading || pending !== null}
          className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Tải lại
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-200 bg-white p-4">
        <p className="text-sm text-surface-600" aria-live="polite">
          {loading
            ? 'Đang tải danh sách...'
            : data
              ? `Trang ${data.meta.page}/${Math.max(1, data.meta.totalPages)} · ${data.meta.totalCount} công thức`
              : 'Danh sách công thức'}
        </p>
        <label className="text-sm">
          Số công thức mỗi trang
          <select
            className="ml-2 rounded-lg border border-surface-300 bg-white p-2"
            value={pageSize}
            disabled={loading || pending !== null}
            onChange={(event) => {
              const nextSize = Number(event.target.value)
              if (nextSize === pageSize) return
              setPageSize(nextSize)
              changePage(1)
            }}
          >
            {[6, 12, 24, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
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
              description="Các công thức của bạn sẽ xuất hiện tại đây khi được tạo."
            />
          )}
          <div className="space-y-4">
            {data?.items.map((recipe) => {
              const canManage = isAdmin || recipe.authorId === session.user.id
              const noSteps = recipe.status === 'DRAFT' && recipe.steps.length === 0
              const archived = recipe.status === 'ARCHIVED'
              return (
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
                        {isAdmin && recipe.authorName ? ' · ' + recipe.authorName : ''}
                      </p>
                    </div>
                    <span
                      className={
                        'rounded-full px-3 py-1 text-xs font-semibold ' +
                        (recipe.status === 'PUBLISHED'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-surface-100 text-surface-600')
                      }
                    >
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
                    {archiveMode && canManage && (
                      <Link
                        to={`/dashboard/recipes/${encodeURIComponent(recipe.slug)}/edit`}
                        className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-semibold text-brand-700"
                      >
                        Chỉnh sửa
                      </Link>
                    )}
                    {archiveMode && canManage && (
                      <Link
                        to={'/recipes/' + encodeURIComponent(recipe.slug)}
                        className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-semibold text-brand-700"
                      >
                        Xem chi tiết
                      </Link>
                    )}
                    {archiveMode && canManage && (
                      <Link
                        to={`/dashboard/ingredients?recipeId=${encodeURIComponent(recipe.id)}&page=${data?.meta.page ?? 1}&pageSize=${data?.meta.pageSize ?? 12}`}
                        className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-semibold text-brand-700"
                      >
                        Nguyên liệu
                      </Link>
                    )}
                    {archiveMode && canManage && (
                      <Link
                        to={`/dashboard/steps?recipeId=${encodeURIComponent(recipe.id)}&page=${data?.meta.page ?? 1}&pageSize=${data?.meta.pageSize ?? 12}`}
                        className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-semibold text-brand-700"
                      >
                        Các bước nấu
                      </Link>
                    )}
                    {!archiveMode && canManage && (
                      <div className="relative ml-auto" ref={openMenu === recipe.id ? menuRef : null}>
                        <button
                          type="button"
                          aria-label={`Thao tác ${recipe.title}`}
                          aria-expanded={openMenu === recipe.id}
                          aria-controls={`recipe-actions-${recipe.id}`}
                          disabled={pending !== null}
                          onClick={() => setOpenMenu((current) => current === recipe.id ? null : recipe.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-300 px-3 py-2 text-sm font-semibold text-brand-700 disabled:opacity-50"
                        >
                          Thao tác <ChevronDown aria-hidden="true" size={14} />
                        </button>
                        {openMenu === recipe.id && (
                          <div
                            id={`recipe-actions-${recipe.id}`}
                            aria-label={`Thao tác cho ${recipe.title}`}
                            className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-surface-200 bg-white p-1.5 shadow-lg sm:right-full sm:top-1/2 sm:mr-2 sm:mt-0 sm:-translate-y-1/2"
                          >
                            <Link
                              to={`/dashboard/recipes/${encodeURIComponent(recipe.slug)}/edit`}
                              onClick={() => setOpenMenu(null)}
                              className={menuItemClass + ' text-surface-700'}
                            >
                              <Pencil aria-hidden="true" size={16} />
                              Chỉnh sửa
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirming(recipe.id)
                                setOpenMenu(null)
                              }}
                              className={menuItemClass + ' text-red-600 hover:bg-red-50'}
                            >
                              <Trash2 aria-hidden="true" size={16} />
                              Xóa
                            </button>
                            <Link
                              to={'/recipes/' + encodeURIComponent(recipe.slug)}
                              onClick={() => setOpenMenu(null)}
                              className={menuItemClass + ' text-surface-700'}
                            >
                              <Info aria-hidden="true" size={16} />
                              Xem chi tiết
                            </Link>
                            <Link
                              to={`/dashboard/ingredients?recipeId=${encodeURIComponent(recipe.id)}&page=${data?.meta.page ?? 1}&pageSize=${data?.meta.pageSize ?? 12}`}
                              onClick={() => setOpenMenu(null)}
                              className={menuItemClass + ' text-surface-700'}
                            >
                              <Leaf aria-hidden="true" size={16} />
                              Nguyên liệu
                            </Link>
                            <Link
                              to={`/dashboard/steps?recipeId=${encodeURIComponent(recipe.id)}&page=${data?.meta.page ?? 1}&pageSize=${data?.meta.pageSize ?? 12}`}
                              onClick={() => setOpenMenu(null)}
                              className={menuItemClass + ' text-surface-700'}
                            >
                              <Layers3 aria-hidden="true" size={16} />
                              Các bước nấu
                            </Link>
                            {!archived && (
                              <button
                                type="button"
                                disabled={noSteps}
                                onClick={() => {
                                  setOpenMenu(null)
                                  void changeStatus(recipe)
                                }}
                                className={menuItemClass + ' font-semibold text-brand-700 hover:bg-brand-50'}
                              >
                                <FilePenLine aria-hidden="true" size={16} />
                                {recipe.status === 'DRAFT' ? 'Xuất bản' : 'Chuyển về bản nháp'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!archiveMode && canManage && confirming === recipe.id && (
                    <div
                      role="group"
                      aria-label={`Xác nhận xóa ${recipe.title}`}
                      className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4"
                    >
                      <p className="text-sm text-red-800">
                        Xóa vĩnh viễn công thức “{recipe.title}” và dữ liệu liên quan?
                      </p>
                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          disabled={pending !== null}
                          onClick={() => void remove(recipe)}
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
                  {archiveMode && canManage && !archived && (
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => void changeStatus(recipe, true)}
                      className="mt-3 rounded-lg border border-surface-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {pending === recipe.id ? 'Đang lưu trữ...' : 'Lưu trữ'}
                    </button>
                  )}
                  {!archiveMode && noSteps && (
                    <p className="mt-3 text-sm text-amber-700">
                      Cần ít nhất một bước thực hiện trước khi xuất bản.
                    </p>
                  )}
                  {archived && (
                    <p className="mt-3 text-sm text-surface-500">
                      Công thức đã lưu trữ được ẩn khỏi trang công khai và vẫn giữ nguyên dữ liệu.
                    </p>
                  )}
                </article>
              )
            })}
          </div>
          {data && (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              totalCount={data.meta.totalCount}
              itemLabel="công thức"
              disabled={pending !== null}
              onPageChange={changePage}
              label="Phân trang công thức"
            />
          )}
        </>
      )}
    </>
  )
}
