import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ConfirmLogoutModal } from '../components/ConfirmLogoutModal'
import { ApiError, getCurrentUser, logout, updateProfile } from '../lib/api'
import { clearSession, loadSession } from '../lib/tokenStorage'
import type { UserProfile } from '../types/auth'

export default function ProfilePage() {
  const navigate = useNavigate()
  const session = loadSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const accessToken = session?.accessToken

  useEffect(() => {
    if (!accessToken) return
    let active = true

    getCurrentUser(accessToken)
      .then((user) => {
        if (!active) return
        setProfile(user)
        setDisplayName(user.displayName)
        setBio(user.bio ?? '')
      })
      .catch((reason: unknown) => {
        if (!active) return
        if (reason instanceof ApiError && reason.status === 401) {
          clearSession()
          navigate('/auth/login', { replace: true })
          return
        }
        setError(reason instanceof Error ? reason.message : 'Không thể tải hồ sơ.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [accessToken, navigate])

  if (!session) {
    navigate('/auth/login', { replace: true })
    return null
  }

  const handleLogout = () => {
    void logout(session.accessToken, session.refreshToken).catch(() => undefined)
    clearSession()
    navigate('/')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await updateProfile(session.accessToken, { displayName, bio })
      setProfile(updated)
      setDisplayName(updated.displayName)
      setBio(updated.bio ?? '')
      setSuccess('Đã cập nhật hồ sơ.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  const name = profile?.displayName || displayName || session.user.fullName || session.user.email
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
        <div className="mb-6 flex items-center gap-2 px-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</div><span className="text-sm font-bold text-white">Dashboard</span></div>
        <nav className="space-y-1" aria-label="Profile menu"><Link to="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Tổng quan</Link><Link to="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Công thức</Link><Link to="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-700">Danh mục</Link><Link to="/profile" className="block rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white">Hồ sơ</Link></nav>
        <button type="button" onClick={() => setShowLogoutModal(true)} className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-700 hover:text-white">Đăng xuất</button>
      </aside>
      <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 md:pb-8">
        <div className="mb-6 flex items-center justify-between"><div><p className="text-sm text-surface-500">Tài khoản</p><h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Hồ sơ cá nhân</h1></div><Link to="/dashboard" className="text-sm font-medium text-brand-600">← Dashboard</Link></div>
        <div className="mx-auto max-w-3xl">
          {loading ? <div className="space-y-5"><div className="h-28 animate-pulse rounded-xl bg-surface-200" /><div className="h-80 animate-pulse rounded-xl bg-surface-200" /></div> : <>
            {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {success && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
            <section className="mb-5 flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-5 sm:p-6"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}</div><div><h2 className="font-bold text-surface-900">{name}</h2><p className="text-sm text-surface-500">{profile?.email ?? session.user.email}</p><p className="mt-1 text-xs text-surface-400">Thành viên từ {profile ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '—'}</p></div></section>
            <section className="rounded-xl border border-surface-200 bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold text-surface-900">Thông tin cá nhân</h2><span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">{profile?.role ?? session.user.roles[0] ?? 'AUTHOR'}</span></div><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="display-name" className="mb-1 block text-sm font-medium text-surface-700">Họ tên</label><input id="display-name" required minLength={2} maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500" /></div><div><label htmlFor="bio" className="mb-1 block text-sm font-medium text-surface-700">Giới thiệu</label><textarea id="bio" rows={3} maxLength={2000} value={bio} onChange={(event) => setBio(event.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500" /></div><div><label htmlFor="email" className="mb-1 block text-sm font-medium text-surface-700">Email</label><input id="email" value={profile?.email ?? session.user.email} readOnly className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm text-surface-500" /></div><div className="flex justify-end"><button disabled={saving} type="submit" className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">{saving ? 'Đang lưu...' : 'Cập nhật'}</button></div></form></section>
          </>}
        </div>
        <nav className="fixed bottom-0 left-0 right-0 flex border-t border-surface-200 bg-white p-2 md:hidden" aria-label="Mobile navigation"><Link to="/dashboard" className="flex-1 text-center text-xs text-surface-400">Tổng quan</Link><Link to="/dashboard" className="flex-1 text-center text-xs text-surface-400">Công thức</Link><Link to="/profile" className="flex-1 text-center text-xs font-medium text-brand-600">Cá nhân</Link></nav>
      </main>
      {showLogoutModal && <ConfirmLogoutModal onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
    </div>
  )
}
