import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { loadSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'

/**
 * Public landing page. Authenticated users continue from the dashboard.
 */
export default function HomePage() {
  const [session] = useState<AuthResponse | null>(() => loadSession())

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-extrabold text-surface-900">Culinary Blog</h1>
      <p className="text-surface-500 mt-2">Nền tảng chia sẻ công thức nấu ăn Việt Nam</p>
      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        <Link to="/recipes" className="px-6 py-3 text-brand-600 font-medium">Khám phá công thức</Link>
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
