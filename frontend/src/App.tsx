import { Link, Route, Routes } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import AuthCallbackPage from './pages/AuthCallbackPage'
import RecipesPage from './pages/RecipesPage'
import IngredientManagementPage from './pages/IngredientManagementPage'
import RecipesBrowsePage from './pages/RecipesBrowsePage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'

/** Render the fallback for an unknown application route. */
function NotFoundPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
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

/** Compose public, authentication and dashboard routes. */
export default function App() {
  return (
    <Routes>
      {/* Public blog shell: header, content, footer. */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes" element={<RecipesBrowsePage />} />
        <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Authenticated area shell: sidebar, mobile navigation, sign-out dialog. */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/recipes" element={<RecipesPage />} />
        <Route path="/dashboard/ingredients" element={<IngredientManagementPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Standalone full-screen sign-in / sign-up flows. */}
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
    </Routes>
  )
}
