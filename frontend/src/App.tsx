import { Link, Route, Routes } from 'react-router-dom'

import DashboardLayout from './components/DashboardLayout'

import AuthCallbackPage from './pages/AuthCallbackPage'
import RecipeManagementPage from './pages/RecipeManagementPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'

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
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="recipes" element={<RecipeManagementPage />} />
      </Route>
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
