import { Link, useNavigate } from 'react-router-dom'

import { logout } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'

const stats = [
  ['Tổng công thức', '12', 'bg-blue-100 text-blue-600'],
  ['Đã xuất bản', '8', 'bg-green-100 text-green-600'],
  ['Bản nháp', '4', 'bg-amber-100 text-amber-600'],
  ['Lượt xem', '1,247', 'bg-purple-100 text-purple-600'],
]

const recipes = [
  ['Phở Bò Hà Nội', 'Món chính', 'Đã xuất bản', 'bg-green-100 text-green-700'],
  ['Bún Chả Hà Nội', 'Món chính', 'Đã xuất bản', 'bg-green-100 text-green-700'],
  ['Bánh Mì Thịt Nướng', 'Đồ ăn sáng', 'Bản nháp', 'bg-amber-100 text-amber-700'],
  ['Chè Ba Màu', 'Tráng miệng', 'Đã xuất bản', 'bg-green-100 text-green-700'],
]

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</div>
        <span className="text-sm font-bold text-white">Dashboard</span>
      </div>
      <nav className="space-y-1" aria-label="Dashboard menu">
        <Link to="/dashboard" className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white">Tổng quan</Link>
        <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Công thức</Link>
        <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Danh mục</Link>
        <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Hồ sơ</Link>
      </nav>
      <button type="button" onClick={onLogout} className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 hover:text-white">Đăng xuất</button>
    </aside>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const session = loadSession()

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
      <Sidebar onLogout={handleLogout} />
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {stats.map(([label, value, color]) => <div key={label} className="rounded-xl border border-surface-200 bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-surface-500 sm:text-sm">{label}</span><span className={`h-8 w-8 rounded-lg ${color}`} /></div><div className="text-2xl font-bold text-surface-900">{value}</div></div>)}
        </div>
        <section className="mt-6 overflow-hidden rounded-xl border border-surface-200 bg-white">
          <div className="flex items-center justify-between border-b border-surface-200 p-4 sm:p-5"><h2 className="font-bold text-surface-900">Công thức gần đây</h2><Link to="/dashboard" className="text-sm text-brand-600">Xem tất cả →</Link></div>
          <div className="divide-y divide-surface-100 md:divide-y-0">
            {recipes.map(([name, category, status, color]) => <div key={name} className="flex items-center justify-between gap-3 p-4 md:grid md:grid-cols-[2fr_1fr_1fr] md:px-5"><span className="truncate font-medium text-surface-900">{name}</span><span className="hidden text-sm text-surface-500 md:block">{category}</span><span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span></div>)}
          </div>
        </section>
        <nav className="fixed bottom-0 left-0 right-0 flex border-t border-surface-200 bg-white p-2 md:hidden" aria-label="Mobile navigation"><Link to="/dashboard" className="flex-1 text-center text-xs font-medium text-brand-600">Tổng quan</Link><Link to="/dashboard" className="flex-1 text-center text-xs text-surface-400">Công thức</Link><Link to="/profile" className="flex-1 text-center text-xs text-surface-400">Cá nhân</Link></nav>
      </main>
    </div>
  )
}
