import { Link, Navigate } from 'react-router-dom'

import { loadSession } from '../lib/tokenStorage'

export default function DashboardPage() {
  const session = loadSession()
  if (!session) return <Navigate to="/auth/login" replace />

  return (
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
          {['Tổng công thức', 'Đã xuất bản', 'Bản nháp', 'Lượt xem'].map((label) => <div key={label} className="rounded-xl border border-surface-200 bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-surface-500 sm:text-sm">{label}</span><span className="h-8 w-8 rounded-lg bg-surface-100" /></div><div className="text-2xl font-bold text-surface-300">—</div></div>)}
        </div>
        <section className="mt-6 overflow-hidden rounded-xl border border-surface-200 bg-white">
          <div className="flex items-center justify-between border-b border-surface-200 p-4 sm:p-5"><h2 className="font-bold text-surface-900">Công thức gần đây</h2><span className="text-sm text-surface-400">Chưa có dữ liệu</span></div>
          <div className="p-8 text-center text-sm text-surface-400">Danh sách công thức sẽ được kết nối ở issue quản lý công thức.</div>
        </section>
      </main>
  )
}
