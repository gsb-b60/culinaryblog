import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { ConfirmLogoutModal } from '../components/ConfirmLogoutModal'
import { ApiError, getCategoryDetail, logout } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'
import type { CategoryDetailDto } from '../types/category'

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

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case 'EASY':
      return <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Dễ</span>
    case 'MEDIUM':
      return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Trung bình</span>
    case 'HARD':
    case 'EXPERT':
      return <span className="rounded bg-rose-100 px-2 py-0.5 text-xs text-rose-700">Khó</span>
    default:
      return <span className="rounded bg-surface-100 px-2 py-0.5 text-xs text-surface-700">{difficulty}</span>
  }
}

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1', 10) || 1

  const navigate = useNavigate()
  const session = loadSession()
  const [data, setData] = useState<CategoryDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
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
    if (!slug) return
    setLoading(true)
    setError(null)
    getCategoryDetail(slug, page, 12, session?.accessToken)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error('Không thể tải chi tiết danh mục'))
      })
      .finally(() => setLoading(false))
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!slug) return
    let active = true

    getCategoryDetail(slug, page, 12, session?.accessToken)
      .then((res) => {
        if (!active) return
        setData(res)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err : new Error('Không thể tải chi tiết danh mục'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug, page, session?.accessToken])

  const is404 = error instanceof ApiError && error.status === 404

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      {/* Sidebar matching Dashboard & Categories */}
      <Sidebar onLogout={handleLogoutClick} />

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 md:pb-8">
        {/* Top user bar / login action */}
        <div className="mb-4 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="text-sm text-surface-400">
            <ol className="flex items-center gap-2">
              <li>
                <Link to="/" className="hover:text-brand-600">Trang chủ</Link>
              </li>
              <li>/</li>
              <li>
                <Link to="/categories" className="hover:text-brand-600">Danh mục</Link>
              </li>
              <li>/</li>
              <li className="font-medium text-surface-700 truncate max-w-[200px] sm:max-w-none">
                {data ? data.category.name : slug}
              </li>
            </ol>
          </nav>
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

        {/* Loading State (#category-detail-2-loading) */}
        {loading && (
          <div data-testid="category-detail-loading" className="space-y-6">
            <div className="flex items-center gap-4 mb-8 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-surface-200" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-surface-200 rounded" />
                <div className="h-4 w-64 bg-surface-200 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-surface-200 bg-white overflow-hidden animate-pulse">
                  <div className="h-40 w-full bg-surface-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 bg-surface-200 rounded" />
                    <div className="h-4 w-full bg-surface-200 rounded" />
                    <div className="h-3 w-1/2 bg-surface-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 404 Not Found State */}
        {!loading && is404 && (
          <div
            data-testid="category-detail-404"
            className="my-12 flex flex-col items-center justify-center rounded-xl border border-surface-200 bg-white p-12 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 text-2xl font-bold">
              404
            </div>
            <h1 className="mb-2 text-xl font-bold text-surface-800">Không tìm thấy danh mục</h1>
            <p className="mb-6 max-w-md text-sm text-surface-500">
              Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
            </p>
            <Link
              to="/categories"
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition"
            >
              Xem tất cả danh mục
            </Link>
          </div>
        )}

        {/* General Error State */}
        {!loading && !is404 && error && (
          <div className="my-8 rounded-xl border border-rose-200 bg-white p-8 text-center">
            <p className="mb-4 text-sm text-rose-600">{error.message || 'Không thể tải dữ liệu danh mục.'}</p>
            <button
              onClick={handleRetry}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Category Header (when loaded successfully) */}
        {!loading && data && (
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm flex-shrink-0">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-surface-900 md:text-3xl">
                  {data.category.name}
                </h1>
                <p className="text-sm text-surface-500 mt-1">
                  {data.recipes.totalCount} công thức {data.category.description ? `• ${data.category.description}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State (#category-detail-3-empty) */}
        {!loading && data && data.recipes.items.length === 0 && (
          <div
            data-testid="category-detail-empty"
            className="my-12 flex flex-col items-center justify-center rounded-xl border border-surface-200 bg-white p-16 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 text-surface-400">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-bold text-surface-800">Chưa có công thức nào</h2>
            <p className="mb-6 max-w-sm text-sm text-surface-400">
              Danh mục này hiện chưa có công thức nào được xuất bản.
            </p>
            <Link
              to="/categories"
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition"
            >
              Xem tất cả danh mục
            </Link>
          </div>
        )}

        {/* Populated Grid State (#category-detail-1-populated) */}
        {!loading && data && data.recipes.items.length > 0 && (
          <div className="space-y-8">
            <div
              data-testid="category-detail-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {data.recipes.items.map((recipe) => (
                <article
                  key={recipe.id}
                  className="group overflow-hidden rounded-xl border border-surface-200 bg-white hover:shadow-md transition flex flex-col"
                >
                  <div className="h-40 w-full bg-gradient-to-br from-amber-100 via-orange-200 to-amber-300 flex items-center justify-center text-amber-600/70">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-surface-900 text-base group-hover:text-brand-600 transition truncate">
                          {recipe.title}
                        </h3>
                        {recipe.status === 'DRAFT' && (
                          <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Bản nháp
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-surface-500 line-clamp-2 mb-3">
                        {recipe.description || 'Khám phá công thức nấu ăn đặc sắc.'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 text-xs text-surface-400 mb-3 pt-2 border-t border-surface-100">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {recipe.prepTime + recipe.cookTime}p
                        </span>
                        {getDifficultyBadge(recipe.difficulty)}
                        <span>{recipe.servings} phần</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">
                            {(recipe.authorName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-surface-600 truncate max-w-[140px]">
                            {recipe.authorName || 'Tác giả'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-brand-600">
                          Chi tiết &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination controls */}
            {data.recipes.totalPages > 1 && (
              <div
                data-testid="category-detail-pagination"
                className="flex items-center justify-center gap-2 pt-6"
              >
                <button
                  disabled={data.recipes.page <= 1}
                  onClick={() => handlePageChange(data.recipes.page - 1)}
                  className="rounded-lg border border-surface-300 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  &larr; Trước
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-surface-600">
                  Trang {data.recipes.page} / {data.recipes.totalPages}
                </span>
                <button
                  disabled={data.recipes.page >= data.recipes.totalPages}
                  onClick={() => handlePageChange(data.recipes.page + 1)}
                  className="rounded-lg border border-surface-300 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Sau &rarr;
                </button>
              </div>
            )}
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
