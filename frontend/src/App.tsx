import { Link, Route, Routes } from 'react-router-dom'

import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'

function HomePage() {
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

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-surface-50 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-brand-500">404</h1>
        <p className="text-surface-700 mt-2 font-medium">Không tìm thấy trang</p>
        <Link to="/" className="text-brand-600 font-medium hover:text-brand-700 mt-4 inline-block">
          Về trang chủ
        </Link>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
