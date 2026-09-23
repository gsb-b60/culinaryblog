import { Link } from 'react-router-dom'

import { BookLogo } from '../components/icons'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md text-center">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <BookLogo />
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Đăng nhập</h1>
        <p className="text-sm text-surface-500 mt-2 mb-6">
          Trang đăng nhập sẽ được triển khai trong FR-AUTH-002.
        </p>
        <Link
          to="/register"
          className="inline-block w-48 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 text-sm"
        >
          Đăng ký trước
        </Link>
      </div>
    </div>
  )
}
