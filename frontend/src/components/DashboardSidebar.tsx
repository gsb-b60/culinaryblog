import { Link } from 'react-router-dom'

type Section = 'overview' | 'recipes'

export default function DashboardSidebar({ onLogout, active = 'overview' }: {
  onLogout: () => void
  active?: Section
}) {
  const itemClass = (selected: boolean) => 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm ' + (
    selected ? 'bg-brand-500 font-medium text-white' : 'hover:bg-surface-700'
  )
  return (
    <>
      <aside className="hidden min-h-screen w-56 shrink-0 bg-surface-800 p-4 text-surface-300 md:block">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">C</div>
          <span className="text-sm font-bold text-white">Dashboard</span>
        </div>
        <nav className="space-y-1" aria-label="Dashboard menu">
          <Link to="/dashboard" aria-current={active === 'overview' ? 'page' : undefined} className={itemClass(active === 'overview')}>Tổng quan</Link>
          <Link to="/dashboard/recipes" aria-current={active === 'recipes' ? 'page' : undefined} className={itemClass(active === 'recipes')}>Công thức</Link>
          <Link to="/dashboard" className={itemClass(false)}>Danh mục</Link>
          <Link to="/profile" className={itemClass(false)}>Hồ sơ</Link>
        </nav>
        <button type="button" onClick={onLogout} className="mt-8 w-full rounded-lg px-3 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 hover:text-white">Đăng xuất</button>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-surface-200 bg-white p-3 md:hidden" aria-label="Mobile navigation">
        <Link to="/dashboard" aria-current={active === 'overview' ? 'page' : undefined} className={'flex-1 text-center text-xs ' + (active === 'overview' ? 'font-medium text-brand-600' : 'text-surface-400')}>Tổng quan</Link>
        <Link to="/dashboard/recipes" aria-current={active === 'recipes' ? 'page' : undefined} className={'flex-1 text-center text-xs ' + (active === 'recipes' ? 'font-medium text-brand-600' : 'text-surface-400')}>Công thức</Link>
        <Link to="/profile" className="flex-1 text-center text-xs text-surface-400">Cá nhân</Link>
      </nav>
    </>
  )
}
