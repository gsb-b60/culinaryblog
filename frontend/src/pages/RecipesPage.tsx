import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { archiveRecipe, getManageableRecipes, getPublicRecipes } from '../lib/api'
import { loadSession } from '../lib/tokenStorage'
import type { RecipePage, RecipeStatus, RecipeSummary } from '../types/recipe'

const statusLabels: Record<RecipeStatus, string> = {
  DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã lưu trữ',
}

export default function RecipesPage({ management = false }: { management?: boolean }) {
  const [session] = useState(() => loadSession())
  const [status, setStatus] = useState<RecipeStatus | ''>('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<RecipePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<RecipeSummary | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [revision, setRevision] = useState(0)
  const archiveInFlight = useRef(false)

  useEffect(() => {
    if (management && !session) return
    let active = true
    setLoading(true)
    setError('')
    const request = management
      ? getManageableRecipes(session!.accessToken, page, status || undefined)
      : getPublicRecipes(page)
    request.then(result => { if (active) setData(result) })
      .catch(reason => {
        if (active) {
          setData(null)
          setError(reason instanceof Error ? reason.message : 'Không thể tải công thức.')
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [management, session, page, status, revision])

  if (management && !session) return <Navigate to="/auth/login" replace />

  async function handleArchive() {
    if (!selected || !session || archiveInFlight.current) return
    archiveInFlight.current = true
    setArchiving(true)
    setError('')
    try {
      await archiveRecipe(session.accessToken, selected.id)
      setMessage(`Đã lưu trữ “${selected.title}”. Công thức đã ẩn khỏi danh sách công khai.`)
      setSelected(null)
      setData(current => current ? {
        ...current,
        items: current.items.map(recipe => recipe.id === selected.id
          ? { ...recipe, status: 'ARCHIVED' } : recipe),
      } : current)
      if (page > 1 && data?.items.length === 1 && status && status !== 'ARCHIVED') {
        setPage(page - 1)
      } else {
        setRevision(current => current + 1)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu trữ công thức.')
    } finally {
      archiveInFlight.current = false
      setArchiving(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface-50 p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex gap-4">
          <Link to="/" className="text-brand-600">Trang chủ</Link>
          <Link to="/recipes" className="text-brand-600">Công thức công khai</Link>
          {session && <Link to="/dashboard/recipes" className="text-brand-600">Quản lý công thức</Link>}
          {session && <Link to="/dashboard" className="text-brand-600">Dashboard</Link>}
        </nav>
        <h1 className="text-2xl font-bold text-surface-900">
          {management ? 'Quản lý công thức' : 'Công thức công khai'}
        </h1>
        <p className="mt-2 text-surface-500">
          {management
            ? 'Lưu trữ để ẩn công thức khỏi danh sách công khai. Nội dung vẫn được giữ lại.'
            : 'Khám phá các công thức đã xuất bản.'}
        </p>
        {management && <label className="mt-5 block">
          Trạng thái
          <select aria-label="Trạng thái" value={status} disabled={archiving} onChange={event => {
            setStatus(event.target.value as RecipeStatus | '')
            setPage(1)
            setSelected(null)
          }} className="ml-3 rounded-lg border border-surface-300 bg-white p-2">
            <option value="">Tất cả</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>}
        {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-green-800">{message}</p>}
        {error && <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
          {!selected && <button type="button" onClick={() => setRevision(value => value + 1)} className="ml-3 underline">Thử lại</button>}
        </div>}
        {loading ? <p className="mt-6">Đang tải công thức...</p> : <>
          {data?.items.length === 0 && <p className="mt-6 text-surface-500">Chưa có công thức phù hợp.</p>}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {data?.items.map(recipe => <article key={recipe.id} className="rounded-xl border border-surface-200 bg-white p-5">
              <h2 className="text-lg font-bold text-surface-900">{recipe.title}</h2>
              <p className="mt-2 text-surface-500">{recipe.description}</p>
              <p className="mt-3 text-sm">{recipe.categoryName} · {recipe.authorName}</p>
              {management && <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-surface-100 px-3 py-1 text-sm">{statusLabels[recipe.status]}</span>
                {recipe.status !== 'ARCHIVED' && <button type="button" disabled={archiving} onClick={() => {
                  setSelected(recipe)
                  setError('')
                }} className="rounded-lg bg-brand-500 px-4 py-2 text-white disabled:opacity-50">
                  Lưu trữ
                </button>}
              </div>}
            </article>)}
          </div>
          {data && <nav aria-label="Phân trang" className="mt-6 flex items-center gap-4">
            <button type="button" disabled={!data.meta.hasPreviousPage || archiving} onClick={() => setPage(page - 1)} className="rounded border p-2 disabled:opacity-40">Trang trước</button>
            <span>Trang {data.meta.page} / {Math.max(1, data.meta.totalPages)}</span>
            <button type="button" disabled={!data.meta.hasNextPage || archiving} onClick={() => setPage(page + 1)} className="rounded border p-2 disabled:opacity-40">Trang sau</button>
          </nav>}
        </>}
        {selected && <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="archive-title" className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 id="archive-title" className="text-xl font-bold">Lưu trữ công thức?</h2>
            <p className="mt-3">“{selected.title}” sẽ ẩn khỏi danh sách công khai. Nội dung, nguyên liệu và bước nấu vẫn được giữ trong hệ thống.</p>
            {error && <p className="mt-3 text-red-700">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button autoFocus type="button" disabled={archiving} onClick={() => {
                setSelected(null)
                setError('')
              }} className="rounded-lg border px-4 py-2">Hủy</button>
              <button type="button" disabled={archiving} onClick={() => void handleArchive()} className="rounded-lg bg-brand-500 px-4 py-2 text-white disabled:opacity-50">
                {archiving ? 'Đang lưu trữ...' : 'Xác nhận lưu trữ'}
              </button>
            </div>
          </section>
        </div>}
      </div>
    </main>
  )
}
