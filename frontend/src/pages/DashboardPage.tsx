import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-xl border border-surface-200 p-8 shadow-sm text-center">
        <div className="w-12 h-12 bg-brand-500 text-white rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Đăng ký thành công!</h1>
        <p className="text-sm text-surface-500 mt-2 mb-6">
          Tài khoản của bạn đã được tạo. Dashboard tổng quan (M9) sẽ được triển khai trong milestone
          tiếp theo.
        </p>
        <p className="text-xs text-surface-400">
          Token đã được lưu trong localStorage.{' '}
          <Link to="/register" className="text-brand-600 hover:underline">
            Đăng ký tài khoản khác
          </Link>
        </p>
      </div>
    </div>
  )
}
