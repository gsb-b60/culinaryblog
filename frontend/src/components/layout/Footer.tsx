import { Link } from 'react-router-dom'

/** Shared footer for the public (blog) pages. */
export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
            C
          </span>
          <div>
            <p className="text-sm font-bold text-surface-900">Culinary Blog</p>
            <p className="text-xs text-surface-500">Nền tảng chia sẻ công thức nấu ăn Việt Nam</p>
          </div>
        </div>

        <nav aria-label="Liên kết chân trang" className="flex flex-wrap gap-4 text-sm">
          <Link to="/" className="text-surface-600 hover:text-brand-700">
            Trang chủ
          </Link>
          <Link to="/recipes" className="text-surface-600 hover:text-brand-700">
            Công thức
          </Link>
        </nav>

        <p className="text-xs text-surface-400">© {new Date().getFullYear()} Culinary Blog</p>
      </div>
    </footer>
  )
}

export default Footer
