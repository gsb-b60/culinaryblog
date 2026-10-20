import { TriangleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  /** Failure message shown to the user, already localised by the caller. */
  message: string
  title?: string
  /** Renders a "retry" action when the caller can reload the data. */
  onRetry?: () => void
  retryLabel?: string
}

/** Shared error state used by pages and by the error boundary. */
export function ErrorState({
  message,
  title = 'Đã xảy ra lỗi',
  onRetry,
  retryLabel = 'Thử lại',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-6 text-center sm:text-left"
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <TriangleAlertIcon className="size-6 shrink-0 text-red-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-red-800">{title}</h2>
          <p className="mt-1 break-words text-sm text-red-700">{message}</p>
        </div>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0">
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ErrorState
