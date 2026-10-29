import { useState } from 'react'
import { Link } from 'react-router-dom'

type Section =
  'overview' | 'categories' | 'recipes' | 'delete-recipes' | 'archive-recipes' | 'ingredients' | 'profile'

/** Render dashboard destinations and indicate the active page. */
export default function DashboardSidebar({
  onLogout,
  active = 'overview',
}: {
  onLogout: () => void
  active?: Section
}) {
  const [recipesMenu, setRecipesMenu] = useState<{ section: Section; expanded: boolean } | null>(
    null,
  )
  const [categoriesMenu, setCategoriesMenu] = useState<{ section: Section; expanded: boolean } | null>(null)
  const categoriesActive = active === 'categories'
  const categoriesExpanded = categoriesMenu?.section === active ? categoriesMenu.expanded : categoriesActive
  const toggleCategories = () => {
    setCategoriesMenu({ section: active, expanded: !categoriesExpanded })
    setRecipesMenu({ section: active, expanded: false })
  }
  const recipesActive =
    active === 'recipes' ||
    active === 'delete-recipes' ||
    active === 'archive-recipes' ||
    active === 'ingredients'
  // A destination opened from the overview must reveal its active submenu.
  const recipesExpanded = recipesMenu?.section === active ? recipesMenu.expanded : recipesActive
  const toggleRecipes = () => {
    setRecipesMenu({ section: active, expanded: !recipesExpanded })
    setCategoriesMenu({ section: active, expanded: false })
  }
  const itemClass = (selected: boolean) =>
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm ' +
    (selected ? 'bg-brand-500 font-medium text-white' : 'hover:bg-surface-700')
  const submenuClass = (selected: boolean) =>
    'block rounded-lg px-3 py-2 text-sm ' +
    (selected ? 'bg-surface-700 font-medium text-white' : 'text-surface-300 hover:bg-surface-700')

  return (
    <>
      <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
            C
          </div>
          <span className="text-sm font-bold text-white">Dashboard</span>
        </div>
        <nav className="space-y-1" aria-label="Dashboard menu">
          <Link
            to="/dashboard"
            aria-current={active === 'overview' ? 'page' : undefined}
            className={itemClass(active === 'overview')}
          >
            Tổng quan
          </Link>
          <button
            type="button"
            aria-label="Công thức"
            aria-expanded={recipesExpanded}
            aria-controls="dashboard-recipes-submenu"
            onClick={toggleRecipes}
            className={itemClass(recipesActive) + ' w-full justify-between'}
          >
            Công thức
            <span aria-hidden="true">{recipesExpanded ? '−' : '+'}</span>
          </button>
          {recipesExpanded && (
            <div
              id="dashboard-recipes-submenu"
              className="ml-3 space-y-1 border-l border-surface-600 pl-2"
            >
              <Link
                to="/dashboard/recipes"
                aria-current={active === 'recipes' ? 'page' : undefined}
                className={submenuClass(active === 'recipes')}
              >
                Danh sách công thức
              </Link>
              <Link
                to="/dashboard/ingredients"
                aria-current={active === 'ingredients' ? 'page' : undefined}
                className={submenuClass(active === 'ingredients')}
              >
                Nguyên liệu
              </Link>
              <Link
                to="/dashboard/recipes/delete"
                aria-current={active === 'delete-recipes' ? 'page' : undefined}
                className={submenuClass(active === 'delete-recipes')}
              >
                Xóa công thức
              </Link>
              <Link
                to="/dashboard/recipes/archive"
                aria-current={active === 'archive-recipes' ? 'page' : undefined}
                className={submenuClass(active === 'archive-recipes')}
              >
                Lưu trữ công thức
              </Link>
            </div>
          )}
          <button
            type="button"
            aria-label="Danh mục"
            aria-expanded={categoriesExpanded}
            aria-controls="dashboard-categories-submenu"
            onClick={toggleCategories}
            className={itemClass(categoriesActive) + ' w-full justify-between'}
          >
            Danh mục
            <span aria-hidden="true">{categoriesExpanded ? '−' : '+'}</span>
          </button>
          {categoriesExpanded && (
            <div
              id="dashboard-categories-submenu"
              className="ml-3 space-y-1 border-l border-surface-600 pl-2"
            >
              <Link
                to="/dashboard/categories?page=1&pageSize=12"
                aria-current={categoriesActive ? 'page' : undefined}
                className={submenuClass(categoriesActive)}
              >
                Phân trang
              </Link>
            </div>
          )}
          <Link
            to="/profile"
            aria-current={active === 'profile' ? 'page' : undefined}
            className={itemClass(active === 'profile')}
          >
            Hồ sơ
          </Link>
        </nav>
        <button
          type="button"
          onClick={onLogout}
          className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 hover:text-white"
        >
          Đăng xuất
        </button>
      </aside>
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-surface-200 bg-white p-3 md:hidden"
        aria-label="Mobile navigation"
      >
        {recipesExpanded && (
          <div
            id="mobile-dashboard-recipes-submenu"
            className="absolute bottom-full left-0 right-0 space-y-1 border-t border-surface-200 bg-white p-3 shadow-lg"
          >
            <Link
              to="/dashboard/recipes"
              aria-current={active === 'recipes' ? 'page' : undefined}
              className={submenuClass(active === 'recipes')}
            >
              Danh sách công thức
            </Link>
            <Link
              to="/dashboard/ingredients"
              aria-current={active === 'ingredients' ? 'page' : undefined}
              className={submenuClass(active === 'ingredients')}
            >
              Nguyên liệu
            </Link>
            <Link
              to="/dashboard/recipes/delete"
              aria-current={active === 'delete-recipes' ? 'page' : undefined}
              className={submenuClass(active === 'delete-recipes')}
            >
              Xóa công thức
            </Link>
            <Link
              to="/dashboard/recipes/archive"
              aria-current={active === 'archive-recipes' ? 'page' : undefined}
              className={submenuClass(active === 'archive-recipes')}
            >
              Lưu trữ công thức
            </Link>
          </div>
        )}
        <Link
          to="/dashboard"
          aria-current={active === 'overview' ? 'page' : undefined}
          className={
            'flex-1 text-center text-xs ' +
            (active === 'overview' ? 'font-medium text-brand-600' : 'text-surface-400')
          }
        >
          Tổng quan
        </Link>
        <button
          type="button"
          aria-label="Công thức"
          aria-expanded={recipesExpanded}
          aria-controls="mobile-dashboard-recipes-submenu"
          onClick={toggleRecipes}
          className={
            'flex-1 text-center text-xs ' +
            (recipesActive ? 'font-medium text-brand-600' : 'text-surface-400')
          }
        >
          Công thức
        </button>
        {categoriesExpanded && (
          <div
            id="mobile-dashboard-categories-submenu"
            className="absolute bottom-full left-0 right-0 border-t border-surface-200 bg-white p-3 shadow-lg"
          >
            <Link
              to="/dashboard/categories?page=1&pageSize=12"
              aria-current={categoriesActive ? 'page' : undefined}
              className={'block rounded-lg px-3 py-2 text-sm ' + (categoriesActive ? 'font-medium text-brand-600' : 'text-surface-600')}
            >
              Phân trang
            </Link>
          </div>
        )}
        <button
          type="button"
          aria-label="Danh mục"
          aria-expanded={categoriesExpanded}
          aria-controls="mobile-dashboard-categories-submenu"
          onClick={toggleCategories}
          className={'flex-1 text-center text-xs ' + (categoriesActive ? 'font-medium text-brand-600' : 'text-surface-400')}
        >
          Danh mục
        </button>
        <Link
          to="/profile"
          aria-current={active === 'profile' ? 'page' : undefined}
          className={
            'flex-1 text-center text-xs ' +
            (active === 'profile' ? 'font-medium text-brand-600' : 'text-surface-400')
          }
        >
          Cá nhân
        </Link>
      </nav>
    </>
  )
}
