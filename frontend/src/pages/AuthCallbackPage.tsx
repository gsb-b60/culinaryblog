import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Banner } from '../components/auth/Banner'
import { BookIcon } from '../components/auth/BookIcon'
import { decodeSessionFragment } from '../lib/oauthFragment'
import { loadSession, saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'

/**
 * Landing target for the Google OAuth 2.0 redirect flow. The backend hands
 * the session over in the URL fragment, which never leaves the browser, so we
 * read it once, persist it and scrub the address bar.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  // Derived during render rather than in an effect: the fragment is fixed for
  // the life of this page, so there is nothing to synchronise.
  const [session] = useState<AuthResponse | null>(
    () => decodeSessionFragment(window.location.hash) ?? loadSession(),
  )

  useEffect(() => {
    if (!session) {
      return
    }
    saveSession(session)
    // Strip the fragment so the tokens are not kept in browser history.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    navigate('/', { replace: true })
  }, [session, navigate])

  if (!session) {
    return (
      <main className="min-h-screen bg-surface-50 flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-xl border border-surface-200 p-6 shadow-sm text-center">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookIcon className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-surface-900">Không nhận được phiên đăng nhập</h1>
          <Banner
            kind="error"
            title="Đăng nhập Google không hoàn tất"
            detail="Không tìm thấy thông tin đăng nhập trong đường dẫn trở về. Vui lòng thử lại hoặc đăng nhập bằng email và mật khẩu."
          />
          <div className="flex flex-col gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                if (loadSession()) {
                  navigate('/', { replace: true })
                  return
                }
                window.location.reload()
              }}
              className="w-full py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 text-sm justify-center"
            >
              Thử lại
            </button>
            <Link
              to="/auth/login"
              className="w-full py-2.5 border border-surface-300 rounded-lg font-medium text-surface-600 hover:bg-surface-50 text-sm justify-center"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-xl border border-surface-200 p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
          <BookIcon className="w-10 h-10" />
        </div>
        <h1 className="text-lg font-bold text-surface-900">Đang hoàn tất đăng nhập...</h1>
        <p className="text-sm text-surface-500 mt-1">Vui lòng chờ trong giây lát.</p>
      </div>
    </main>
  )
}
