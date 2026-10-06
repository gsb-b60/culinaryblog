import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ConfirmLogoutModal } from '../components/ConfirmLogoutModal'
import { ApiError, getRecipes, logout, type RecipeSummary } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</div>
        <span className="text-sm font-bold text-white">Dashboard</span>
      </div>
      <nav className="space-y-1" aria-label="Dashboard menu">
        <Link to="/dashboard" className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white">Tổng quan</Link>
        <Link to="/dashboard/ingredients" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Nguyên liệu</Link>
        <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Hồ sơ</Link>
      </nav>
      <button type="button" onClick={onLogout} className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 hover:text-white">Đăng xuất</button>
    </aside>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const session = loadSession()
  const accessToken = session?.accessToken
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [totalPublished, setTotalPublished] = useState(0)
  const [loadingRecipes, setLoadingRecipes] = useState(true)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!accessToken) return

    let cancelled = false

    getRecipes()
      .then((result) => {
        if (cancelled) return
        setRecipes(result.items)
        setTotalPublished(result.meta.totalCount)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setRecipeError(
          error instanceof ApiError
            ? error.message
            : 'Không thể tải danh sách công thức. Vui lòng thử lại.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingRecipes(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, retryCount])

  const retryRecipes = () => {
    setLoadingRecipes(true)
    setRecipeError(null)
    setRetryCount((count) => count + 1)
  }

  const handleLogout = () => {
    if (session) void logout(session.accessToken, session.refreshToken).catch(() => undefined)
    clearSession()
    navigate('/')
  }

  if (!session) {
    navigate('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      <Sidebar onLogout={() => setShowLogoutModal(true)} />
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-500">Tổng quan</p>
            <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Xin chào, {session.user.fullName || session.user.email}!</h1>
          </div>
          <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700" aria-label="Hồ sơ">
            {(session.user.fullName || session.user.email).charAt(0).toUpperCase()}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {[
            {
              label: 'Công thức đã xuất bản',
              value: loadingRecipes ? '…' : recipeError ? '—' : String(totalPublished),
            },
            { label: 'Bản nháp', value: '—' },
            { label: 'Lượt xem', value: '—' },
          ].map(({ label, value }) => <div key={label} className="rounded-xl border border-surface-200 bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-surface-500 sm:text-sm">{label}</span><span className="h-8 w-8 rounded-lg bg-surface-100" /></div><div className="text-2xl font-bold text-surface-300">{value}</div></div>)}
        </div>
        <section className="mt-6 overflow-hidden rounded-xl border border-surface-200 bg-white">
          <div className="flex items-center justify-between border-b border-surface-200 p-4 sm:p-5"><h2 className="font-bold text-surface-900">Công thức gần đây</h2><span className="text-sm text-surface-400">{loadingRecipes ? 'Đang tải…' : recipeError ? 'Không tải được' : `${recipes.length} công thức`}</span></div>
          {loadingRecipes ? (
            <p className="p-8 text-center text-sm text-surface-400">Đang tải danh sách công thức…</p>
          ) : recipeError ? (
            <div className="p-8 text-center">
              <p role="alert" className="text-sm text-red-600">{recipeError}</p>
              <button type="button" onClick={retryRecipes} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">Thử lại</button>
            </div>
          ) : recipes.length === 0 ? (
            <p className="p-8 text-center text-sm text-surface-400">Chưa có công thức đã xuất bản.</p>
          ) : (
            <ul className="divide-y divide-surface-200">
              {recipes.map((recipe) => (
                <li key={recipe.id} className="p-4 sm:p-5">
                  <h3 className="font-medium text-surface-900">{recipe.title}</h3>
                  <p className="mt-1 text-sm text-surface-500">{recipe.description}</p>
                  <p className="mt-2 text-xs text-surface-400">
                    {[recipe.categoryName, recipe.authorName].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <nav className="fixed bottom-0 left-0 right-0 flex border-t border-surface-200 bg-white p-2 md:hidden" aria-label="Mobile navigation"><Link to="/dashboard" className="flex-1 text-center text-xs font-medium text-brand-600">Tổng quan</Link><Link to="/dashboard/ingredients" className="flex-1 text-center text-xs text-surface-400">Nguyên liệu</Link><Link to="/profile" className="flex-1 text-center text-xs text-surface-400">Cá nhân</Link></nav>
      </main>
      {showLogoutModal && <ConfirmLogoutModal onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
    </div>
  )
}
