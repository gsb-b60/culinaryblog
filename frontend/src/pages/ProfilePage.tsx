import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { logout } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'

export default function ProfilePage() {
  const navigate = useNavigate()
  const session = loadSession()
  const [displayName, setDisplayName] = useState(session?.user.fullName ?? '')
  const [bio, setBio] = useState('Tôi là tác giả yêu thích ẩm thực.')

  if (!session) {
    navigate('/auth/login')
    return null
  }

  const handleLogout = () => {
    void logout(session.accessToken, session.refreshToken).catch(() => undefined)
    clearSession()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
        <div className="mb-6 flex items-center gap-2 px-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</div><span className="text-sm font-bold text-white">Dashboard</span></div>
        <nav className="space-y-1" aria-label="Profile menu">
          <Link to="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Tổng quan</Link>
          <Link to="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Công thức</Link>
          <Link to="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Danh mục</Link>
          <Link to="/profile" className="block rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white">Hồ sơ</Link>
        </nav>
        <button type="button" onClick={handleLogout} className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-700 hover:text-white">Đăng xuất</button>
      </aside>
      <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 md:pb-8">
        <div className="mb-6 flex items-center justify-between"><div><p className="text-sm text-surface-500">Tài khoản</p><h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Hồ sơ cá nhân</h1></div><Link to="/dashboard" className="text-sm font-medium text-brand-600">← Dashboard</Link></div>
        <div className="mx-auto max-w-3xl">
          <section className="mb-5 flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-5 sm:p-6"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">{(displayName || session.user.email).charAt(0).toUpperCase()}</div><div><h2 className="font-bold text-surface-900">{displayName || session.user.email}</h2><p className="text-sm text-surface-500">{session.user.email}</p><p className="mt-1 text-xs text-surface-400">Thành viên từ 01/01/2026</p></div></section>
          <section className="rounded-xl border border-surface-200 bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold text-surface-900">Thông tin cá nhân</h2><span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">{session.user.roles[0] ?? 'AUTHOR'}</span></div><form onSubmit={(event) => event.preventDefault()} className="space-y-4"><div><label htmlFor="display-name" className="mb-1 block text-sm font-medium text-surface-700">Họ tên</label><input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500" /></div><div><label htmlFor="bio" className="mb-1 block text-sm font-medium text-surface-700">Giới thiệu</label><textarea id="bio" rows={3} value={bio} onChange={(event) => setBio(event.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500" /></div><div><label htmlFor="email" className="mb-1 block text-sm font-medium text-surface-700">Email</label><input id="email" value={session.user.email} readOnly className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm text-surface-500" /></div><div className="flex justify-end"><button type="submit" className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600">Cập nhật</button></div></form></section>
        </div>
        <nav className="fixed bottom-0 left-0 right-0 flex border-t border-surface-200 bg-white p-2 md:hidden" aria-label="Mobile navigation"><Link to="/dashboard" className="flex-1 text-center text-xs text-surface-400">Tổng quan</Link><Link to="/dashboard" className="flex-1 text-center text-xs text-surface-400">Công thức</Link><Link to="/profile" className="flex-1 text-center text-xs font-medium text-brand-600">Cá nhân</Link></nav>
      </main>
    </div>
  )
}
