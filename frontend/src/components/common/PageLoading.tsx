import { Skeleton } from '@/components/ui/skeleton'

interface PageLoadingProps {
  /** Announced to screen readers while the placeholders are on screen. */
  label?: string
  /** Number of skeleton cards to draw under the heading placeholder. */
  cards?: number
}

/**
 * Shared loading state. Kept intentionally generic so list, detail and
 * dashboard pages all show the same shape while data is on its way.
 */
export function PageLoading({ label = 'Đang tải dữ liệu...', cards = 3 }: PageLoadingProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4 py-6">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default PageLoading
