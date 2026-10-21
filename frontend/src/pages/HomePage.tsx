import { ArrowRightIcon, BookOpenIcon, ListChecksIcon, PenLineIcon } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { RecipeCard } from '../components/common/RecipeCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { STATIC_CATEGORIES, STATIC_RECIPES } from '../data/blog-static'
import { useAuthStore } from '../store'

const HIGHLIGHTS = [
  {
    icon: BookOpenIcon,
    title: 'Công thức Việt Nam',
    description: 'Từ phở, bún chả đến chè chuối — công thức của người Việt, cho người Việt.',
  },
  {
    icon: ListChecksIcon,
    title: 'Bước thực hiện rõ ràng',
    description: 'Nguyên liệu, thời gian chuẩn bị và từng bước nấu được liệt kê đầy đủ.',
  },
  {
    icon: PenLineIcon,
    title: 'Viết và chia sẻ',
    description: 'Đăng ký tài khoản để viết công thức của riêng bạn rồi xuất bản khi hoàn thiện.',
  },
] as const

/**
 * Public landing page. Authenticated users continue from the dashboard.
 * Content comes from the static sample data — no API calls yet.
 */
export default function HomePage() {
  const session = useAuthStore((state) => state.session)

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  const featured = STATIC_RECIPES.slice(0, 3)

  return (
    <main>
      <section className="bg-gradient-to-b from-brand-50 to-surface-50">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <Badge className="mx-auto bg-brand-100 text-brand-700 hover:bg-brand-200">
            Nền tảng ẩm thực Việt Nam
          </Badge>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl">
            Culinary Blog
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-surface-600 sm:text-lg">
            Khám phá, chia sẻ và lưu giữ những công thức nấu ăn Việt Nam — từ món ăn hàng ngày đến
            công thức cho dịp đặc biệt, do cộng đồng đầu bếp cùng xây dựng.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth/register">Đăng ký</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth/login">Đăng nhập</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="highlights-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 id="highlights-heading" className="sr-only">
          Vì sao chọn Culinary Blog
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="rounded-xl border border-surface-200 bg-white p-5 text-left">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="font-semibold text-surface-900">{title}</p>
              <p className="mt-1 text-sm text-surface-500">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="featured-heading" className="text-2xl font-bold text-surface-900">
              Công thức nổi bật
            </h2>
            <p className="mt-1 text-sm text-surface-500">Một vài công thức mẫu đang có trên blog.</p>
          </div>
          <Link
            to="/recipes"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Xem tất cả công thức
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(recipe => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} headingLevel={3} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="categories-heading" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <h2 id="categories-heading" className="text-2xl font-bold text-surface-900">
          Danh mục
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATIC_CATEGORIES.map(category => (
            <li key={category}>
              <Link
                to={`/recipes?category=${encodeURIComponent(category)}`}
                className="flex items-center justify-between rounded-xl border border-surface-200 bg-white p-4 font-medium text-surface-800 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {category}
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl bg-surface-900 p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold text-white">Sẵn sàng chia sẻ công thức của bạn?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-surface-300">
            Tạo tài khoản miễn phí, viết công thức theo từng bước và xuất bản khi đã hoàn thiện.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link to="/auth/register">Bắt đầu ngay</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
