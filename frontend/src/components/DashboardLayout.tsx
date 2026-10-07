import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { ConfirmLogoutModal } from '../components/ConfirmLogoutModal'
import { logout } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const session = loadSession()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  if (!session) return <Navigate to="/auth/login" replace />

  const handleLogout = () => {
    void logout(session.accessToken, session.refreshToken).catch(() => undefined)
    clearSession()
    navigate('/')
  }
  const menuClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand-500 font-medium text-white' : 'hover:bg-surface-700'}`
  const mobileClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 py-2 text-center text-xs ${isActive ? 'font-medium text-brand-600' : 'text-surface-400'}`

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
        <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</div>
          <span className="text-sm font-bold text-white">Dashboard</span>
        </Link>
        <nav className="space-y-1" aria-label="Dashboard menu">
          <NavLink to="/dashboard" end className={menuClass}>Tổng quan</NavLink>
          <NavLink to="/dashboard/recipes" className={menuClass}>Công thức</NavLink>
          <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Danh mục</Link>
          <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Hồ sơ</Link>
        </nav>
        <button type="button" onClick={() => setShowLogoutModal(true)} className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-700 hover:text-white">Đăng xuất</button>
      </aside>
      <div className="min-w-0 flex-1 pb-16 md:pb-0">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-surface-200 bg-white p-2 md:hidden" aria-label="Mobile navigation">
        <NavLink to="/dashboard" end className={mobileClass}>Tổng quan</NavLink>
        <NavLink to="/dashboard/recipes" className={mobileClass}>Công thức</NavLink>
        <Link to="/profile" className="flex-1 py-2 text-center text-xs text-surface-400">Cá nhân</Link>
      </nav>
      {showLogoutModal && <ConfirmLogoutModal onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
    </div>
  )
}
