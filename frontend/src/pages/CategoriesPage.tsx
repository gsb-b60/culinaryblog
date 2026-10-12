import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ConfirmLogoutModal } from '../components/ConfirmLogoutModal'
import { getCategories, logout } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'
import type { CategoryDto } from '../types/category'

const COLOR_CLASSES = [
  { bg: 'bg-orange-100', text: 'text-orange-600', hoverBorder: 'hover:border-orange-300' },
  { bg: 'bg-blue-100', text: 'text-blue-600', hoverBorder: 'hover:border-blue-300' },
  { bg: 'bg-amber-100', text: 'text-amber-600', hoverBorder: 'hover:border-amber-300' },
  { bg: 'bg-pink-100', text: 'text-pink-600', hoverBorder: 'hover:border-pink-300' },
  { bg: 'bg-green-100', text: 'text-green-600', hoverBorder: 'hover:border-green-300' },
  { bg: 'bg-rose-100', text: 'text-rose-600', hoverBorder: 'hover:border-rose-300' },
]

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</div>
        <span className="text-sm font-bold text-white">Dashboard</span>
      </div>
      <nav className="space-y-1" aria-label="Dashboard menu">
        <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Tổng quan</Link>
        <Link to="/categories" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Công thức</Link>
        <Link to="/categories" className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white">Danh mục</Link>
        <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Hồ sơ</Link>
      </nav>
      <button
        type="button"
        onClick={onLogout}
        className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 hover:text-white"
      >
        Đăng xuất
      </button>
    </aside>
  )
}

export default function CategoriesPage() {
  const navigate = useNavigate()
  const session = loadSession()
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    if (session) void logout(session.accessToken, session.refreshToken).catch(() => undefined)
    clearSession()
    navigate('/')
  }

  const handleLogoutClick = () => {
    if (session) {
      setShowLogoutModal(true)
    } else {
      navigate('/auth/login')
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    getCategories()
      .then((data) => setCategories(data))
      .catch(() => setError('Không thể tải danh sách danh mục. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true

    getCategories()
      .then((data) => {
        if (!active) return
        setCategories(data)
      })
      .catch(() => {
        if (!active) return
        setError('Không thể tải danh sách danh mục. Vui lòng thử lại.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      {/* Sidebar matching Dashboard */}
      <Sidebar onLogout={handleLogoutClick} />

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 md:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-500">Khám phá</p>
            <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Danh mục công thức</h1>
          </div>
          {session ? (
            <Link
              to="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700"
              aria-label="Hồ sơ"
            >
              {(session.user.fullName || session.user.email).charAt(0).toUpperCase()}
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login" className="px-3 py-1.5 text-sm font-medium text-surface-700 hover:text-brand-600">
                Đăng nhập
              </Link>
              <Link
                to="/auth/register"
                className="px-3 py-1.5 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition shadow-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div
            data-testid="categories-loading"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-surface-200 bg-white space-y-3 animate-pulse"
              >
                <div className="w-14 h-14 rounded-xl bg-surface-200" />
                <div className="h-5 w-32 bg-surface-200 rounded" />
                <div className="h-4 w-full bg-surface-200 rounded" />
                <div className="h-3 w-24 bg-surface-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center bg-white rounded-xl border border-rose-200 my-6">
            <p className="text-rose-600 text-sm mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && categories.length === 0 && (
          <div
            data-testid="categories-empty"
            className="py-16 text-center bg-white rounded-xl border border-surface-200 my-6 flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-surface-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-surface-800 mb-1">Chưa có danh mục nào</h2>
            <p className="text-sm text-surface-400 max-w-sm">
              Hiện tại chưa có danh mục công thức nào trong hệ thống.
            </p>
          </div>
        )}

        {/* Populated Grid State (Screen M4) */}
        {!loading && !error && categories.length > 0 && (
          <div
            data-testid="categories-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {categories.map((cat, idx) => {
              const theme = COLOR_CLASSES[idx % COLOR_CLASSES.length]!
              return (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className={`group p-5 rounded-xl border border-surface-200 bg-white hover:shadow-md transition flex items-start gap-4 ${theme.hoverBorder}`}
                >
                  <div
                    className={`w-14 h-14 ${theme.bg} ${theme.text} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition`}
                    aria-hidden="true"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-surface-900 text-lg mb-1 group-hover:text-brand-600 transition truncate">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-surface-500 mb-2 line-clamp-2">
                      {cat.description || 'Khám phá các công thức nấu ăn đặc sắc trong danh mục này.'}
                    </p>
                    <span className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                      {cat.recipeCount} công thức &rarr;
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 flex border-t border-surface-200 bg-white p-2 md:hidden" aria-label="Mobile navigation">
          <Link to="/dashboard" className="flex-1 text-center text-xs text-surface-400">Tổng quan</Link>
          <Link to="/categories" className="flex-1 text-center text-xs font-medium text-brand-600">Danh mục</Link>
          <Link to="/profile" className="flex-1 text-center text-xs text-surface-400">Cá nhân</Link>
        </nav>
      </main>

      {showLogoutModal && <ConfirmLogoutModal onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
    </div>
  )
}
