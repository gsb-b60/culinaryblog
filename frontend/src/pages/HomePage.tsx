import { useState } from 'react'
import { Link } from 'react-router-dom'

import { clearSession, loadSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'

/**
 * Minimal session-aware landing page. The sign-out control here matters: the
 * auth pages redirect to "/" when a session already exists, so without a way to
 * end a session from the home page a user could never sign in a second time.
 */
export default function HomePage() {
  const [session, setSession] = useState<AuthResponse | null>(() => loadSession())

  if (session) {
    return (
      <main className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-extrabold text-surface-900">Culinary Blog</h1>
        <div className="mt-6 w-full max-w-sm rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-surface-500">Đã đăng nhập với tài khoản</p>
          <p className="mt-1 text-lg font-bold text-surface-900">
            {session.user.fullName || session.user.email}
          </p>
          <p className="text-xs text-surface-400 mt-1">{session.user.email}</p>
          {session.user.roles.length > 0 && (
            <div className="mt-3 flex justify-center gap-2">
              {session.user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              clearSession()
              setSession(null)
            }}
            className="mt-6 w-full justify-center rounded-lg border border-surface-300 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50"
          >
            Đăng xuất
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-extrabold text-surface-900">Culinary Blog</h1>
      <p className="text-surface-500 mt-2">Nền tảng chia sẻ công thức nấu ăn Việt Nam</p>
      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        <Link
          to="/auth/register"
          className="px-6 py-3 bg-brand-500 text-white rounded-lg font-bold hover:bg-brand-600 justify-center"
        >
          Đăng ký
        </Link>
        <Link
          to="/auth/login"
          className="px-6 py-3 border border-surface-300 bg-white rounded-lg font-medium text-surface-700 hover:bg-surface-50 justify-center"
        >
          Đăng nhập
        </Link>
      </div>
    </main>
  )
}
