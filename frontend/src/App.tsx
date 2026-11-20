import { Link, Route, Routes } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import RecipesPage from './pages/RecipesPage'
import DeleteRecipesPage from './pages/DeleteRecipesPage'
import IngredientManagementPage from './pages/IngredientManagementPage'
import RecipeStepsPage from './pages/RecipeStepsPage'
import RecipesBrowsePage from './pages/RecipesBrowsePage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import DashboardPage from './pages/DashboardPage'
import CategoriesPage from './pages/CategoriesPage'
import CategoryDetailPage from './pages/CategoryDetailPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import NewRecipePage from './pages/NewRecipePage'
import EditRecipePage from './pages/EditRecipePage'

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
        <Route
          path="/categories"
          element={
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
              <CategoriesPage />
            </main>
          }
        />
        <Route
          path="/categories/:slug"
          element={
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
              <CategoryDetailPage />
            </main>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Authenticated area shell: sidebar, mobile navigation, sign-out dialog. */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/categories" element={<AdminCategoriesPage />} />
        <Route path="/dashboard/categories/:slug" element={<CategoryDetailPage />} />
        <Route path="/dashboard/recipes/new" element={<NewRecipePage />} />
        <Route path="/dashboard/recipes/:slug/edit" element={<EditRecipePage />} />
        <Route path="/dashboard/recipes/delete" element={<DeleteRecipesPage />} />
        <Route
          path="/dashboard/recipes/archive"
          element={<RecipesPage key="archive" mode="archive" />}
        />
        <Route path="/dashboard/recipes" element={<RecipesPage key="publish" />} />
        <Route path="/dashboard/ingredients" element={<IngredientManagementPage />} />
        <Route path="/dashboard/steps" element={<RecipeStepsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Standalone full-screen sign-in / sign-up flows. */}
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/categories/:slug" element={<CategoryDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
