import { Outlet, useLocation } from 'react-router-dom'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

/**
 * Shell for every public page of the blog: header, content, footer. Page
 * components keep their own `<main>` so the landmark structure stays valid.
 */
export function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Header />
      <div className="flex flex-1 flex-col">
        <ErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
      <Footer />
    </div>
  )
}

export default AppLayout
