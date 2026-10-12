import { useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { ConfirmLogoutModal } from './ConfirmLogoutModal'
import { logout } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'

const menu = [
  { to: '/dashboard', label: 'Tổng quan', end: true },
  { to: '/dashboard/recipes', label: 'Công thức', end: true },
  { to: '/profile', label: 'Hồ sơ', end: true },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [session] = useState(() => loadSession())
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  function handleLogout() {
    if (session) void logout(session.accessToken, session.refreshToken).catch(() => undefined)
    clearSession()
    navigate('/')
  }

  if (!session) return <Navigate to="/auth/login" replace />

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
        <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</span>
          <span className="text-sm font-bold text-white">Dashboard</span>
        </Link>
        <nav className="space-y-1" aria-label="Dashboard menu">
          {menu.map(item => <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive
              ? 'bg-brand-500 font-medium text-white' : 'hover:bg-surface-700'}`}>
            {item.label}
          </NavLink>)}
          <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Danh mục</Link>
        </nav>
        <button type="button" onClick={() => setShowLogoutModal(true)}
          className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-700 hover:text-white">Đăng xuất</button>
      </aside>
      <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 md:pb-8">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-surface-200 bg-white p-3 md:hidden" aria-label="Mobile navigation">
        {menu.map(item => <NavLink key={item.to} to={item.to} end={item.end}
          className={({ isActive }) => `flex-1 text-center text-xs ${isActive ? 'font-medium text-brand-600' : 'text-surface-500'}`}>
          {item.label}
        </NavLink>)}
      </nav>
      {showLogoutModal && <ConfirmLogoutModal onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
    </div>
  )
}
