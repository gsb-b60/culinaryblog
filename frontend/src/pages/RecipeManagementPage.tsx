import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { ApiError, deleteRecipe, getManageableRecipes } from '../lib/api'
import type { ManagedRecipe } from '../lib/api'
import { loadSession } from '../lib/tokenStorage'

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Bạn không có quyền xóa công thức này.'
    if (error.status === 409) return 'Công thức vừa thay đổi. Vui lòng tải lại và thử xóa lần nữa.'
    if (error.status === 404) return 'Công thức không còn tồn tại. Hãy tải lại danh sách.'
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    return error.message
  }
  return 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.'
}

export default function RecipeManagementPage() {
  const session = loadSession()
  const accessToken = session?.accessToken
  const [recipes, setRecipes] = useState<ManagedRecipe[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<ManagedRecipe | null>(null)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const cancelButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!accessToken) return
    let active = true
    getManageableRecipes(accessToken, page).then((result) => {
      if (!active) return
      if (page > 1 && result.items.length === 0) {
        setPage(Math.max(1, result.meta.totalPages))
        return
      }
      setRecipes(result.items)
      setTotalPages(result.meta.totalPages)
    }).catch((reason: unknown) => {
      if (active) setError(errorMessage(reason))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [accessToken, page, reload])

  useEffect(() => {
    if (deleting) cancelButton.current?.focus()
  }, [deleting])

  if (!session) return <Navigate to="/auth/login" replace />

  const refreshList = () => { setLoading(true); setError(''); setReload((value) => value + 1) }
  const confirmDelete = async () => {
    if (!deleting || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await deleteRecipe(loadSession()?.accessToken ?? session.accessToken, deleting.id)
      setRecipes((current) => current.filter((recipe) => recipe.id !== deleting.id))
      setSuccess(`Đã xóa vĩnh viễn công thức “${deleting.title}”.`)
      setDeleting(null)
      refreshList()
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  return (
    <main className="p-5 sm:p-8">
      <div className="w-full">
        <h1 className="text-2xl font-bold text-surface-900">Quản lý công thức</h1>
        <p className="mt-2 text-surface-600">Xóa vĩnh viễn công thức cùng nguyên liệu, bước nấu và ảnh liên quan.</p>
        {success && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-green-800">{success}</p>}
        {error && !deleting && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        <button type="button" disabled={busy || loading} onClick={refreshList} className="my-4 text-brand-600 disabled:opacity-50">Tải lại danh sách</button>
        {loading ? <p role="status">Đang tải công thức…</p> : (
          <ul className="space-y-3">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="flex items-center justify-between gap-4 rounded-xl border border-surface-200 bg-white p-5">
                <div><h2 className="font-bold">{recipe.title}</h2><p className="text-sm text-surface-500">{recipe.authorName} · {recipe.status === 'PUBLISHED' ? 'Đã xuất bản' : recipe.status === 'DRAFT' ? 'Bản nháp' : 'Đã lưu trữ'}</p></div>
                <button type="button" disabled={busy} onClick={() => { setError(''); setSuccess(''); setDeleting(recipe) }} className="rounded-lg border border-red-200 px-4 py-2 text-red-700 disabled:opacity-50" aria-label={`Xóa công thức ${recipe.title}`}>Xóa công thức</button>
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && recipes.length === 0 && <p className="py-8 text-surface-500">Bạn chưa có công thức nào để quản lý.</p>}
        {totalPages > 1 && <nav aria-label="Phân trang" className="mt-5 flex gap-4">
          <button disabled={page <= 1 || busy || loading} onClick={() => { setLoading(true); setError(''); setPage(page - 1) }}>Trang trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page >= totalPages || busy || loading} onClick={() => { setLoading(true); setError(''); setPage(page + 1) }}>Trang sau</button>
        </nav>}
      </div>
      {deleting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
        <div role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" className="w-full max-w-md rounded-xl bg-white p-6"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !busy) setDeleting(null)
            if (event.key === 'Tab') {
              const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
              const first = buttons[0]
              const last = buttons[buttons.length - 1]
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
              if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
            }
          }}>
          <h2 id="delete-title" className="text-xl font-bold">Xóa công thức “{deleting.title}”?</h2>
          <p id="delete-description" className="mt-3 text-surface-600">Công thức, nguyên liệu, bước nấu và ảnh sẽ bị xóa vĩnh viễn. Bạn không thể hoàn tác.</p>
          {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button ref={cancelButton} disabled={busy} onClick={() => setDeleting(null)} className="rounded-lg border px-4 py-2">Hủy</button>
            <button disabled={busy} onClick={() => void confirmDelete()} className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Đang xóa…' : 'Xác nhận xóa vĩnh viễn'}</button>
          </div>
        </div>
      </div>}
    </main>
  )
}
