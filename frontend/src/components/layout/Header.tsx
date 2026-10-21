import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOutIcon, MenuIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { endSession } from '@/lib/session'
import { useAuthStore } from '@/store'

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/recipes', label: 'Công thức', end: false },
] as const

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
  ].join(' ')

/**
 * Site-wide header for the public (blog) pages. Auth actions are buttons
 * rather than links so assistive tech and tests can tell them apart from the
 * in-page call to action on the landing page.
 */
export function Header() {
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = () => {
    setMenuOpen(false)
    endSession()
    navigate('/')
  }

  const authActions = session ? (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => { setMenuOpen(false); navigate('/dashboard') }}>
        Bảng điều khiển
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
        <LogOutIcon aria-hidden="true" />
        Đăng xuất
      </Button>
    </>
  ) : (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => { setMenuOpen(false); navigate('/auth/login') }}>
        Đăng nhập
      </Button>
      <Button type="button" size="sm" onClick={() => { setMenuOpen(false); navigate('/auth/register') }}>
        Đăng ký
      </Button>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-surface-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-sm font-bold text-surface-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            C
          </span>
          Culinary Blog
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{authActions}</div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="icon" className="md:hidden" aria-label="Mở menu điều hướng">
              <MenuIcon aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-72 flex-col gap-4">
            <SheetHeader>
              <SheetTitle>Điều hướng</SheetTitle>
            </SheetHeader>
            <nav aria-label="Điều hướng trên di động" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.to}>
                  <NavLink to={link.to} end={link.end} className={linkClasses}>
                    {link.label}
                  </NavLink>
                </SheetClose>
              ))}
            </nav>
            <Separator />
            <div className="flex flex-col gap-2">{authActions}</div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export default Header
