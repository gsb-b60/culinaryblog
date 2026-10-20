import { useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

import DashboardSidebar from '@/components/DashboardSidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ConfirmLogoutModal } from '@/components/ConfirmLogoutModal'
import { endSession } from '@/lib/session'
import { useAuthStore } from '@/store'

/**
 * Shell for the authenticated area: sidebar, mobile navigation, sign-out
 * dialog and the auth guard — all in one place so dashboard pages render only
 * their own content.
 */
export function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  // Visitors who arrived signed out are redirected to the login page; when the
  // session disappears after "Đăng xuất" this renders nothing and the handler
  // below decides where to go, so the two never race each other.
  const [enteredSignedIn] = useState(() => useAuthStore.getState().session !== null)

  const active = location.pathname.startsWith('/dashboard/recipes')
    ? 'recipes'
    : location.pathname.startsWith('/profile')
      ? 'profile'
      : 'overview'

  const handleLogout = () => {
    setShowLogoutModal(false)
    endSession()
    navigate('/')
  }

  // Anonymous deep links go straight to the login page. Once a signed-in user
  // loses the session the shell stays mounted (pages render nothing while it
  // is gone) so the code that triggered it can decide the destination:
  // "Đăng xuất" navigates home, an expired token navigates to the login page.
  if (!session && !enteredSignedIn) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <div className="min-h-screen bg-surface-50 md:flex">
      <DashboardSidebar active={active} onLogout={() => setShowLogoutModal(true)} />
      <main className="min-w-0 flex-1 p-5 pb-24 sm:p-8 md:pb-8">
        <ErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      {showLogoutModal && (
        <ConfirmLogoutModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  )
}

export default DashboardLayout
