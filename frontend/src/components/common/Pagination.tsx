import { Button } from '@/components/ui/button'

export interface PaginationProps {
  /** Current 1-based page. */
  page: number
  totalPages: number
  /** Total item count, shown in the summary when provided. */
  totalCount?: number
  /** Unit used in the summary, e.g. "công thức". */
  itemLabel?: string
  /** Blocks the controls while a page is loading. */
  disabled?: boolean
  onPageChange: (page: number) => void
  /** Accessible name of the navigation landmark. */
  label?: string
}

/**
 * Offset pagination shared by the dashboard list and the public blog list;
 * mirrors the backend contract `page` / `pageSize` / `totalPages`.
 */
export function Pagination({
  page,
  totalPages,
  totalCount,
  itemLabel = 'mục',
  disabled = false,
  onPageChange,
  label = 'Phân trang',
}: PaginationProps) {
  if (totalPages <= 0) return null

  const summary = [
    `Trang ${page}/${totalPages}`,
    totalCount !== undefined ? `${totalCount} ${itemLabel}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <nav aria-label={label} className="mt-6 flex items-center justify-between gap-3 text-sm">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Trang trước
      </Button>
      <span aria-live="polite" className="text-surface-600">
        {summary}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Trang sau
      </Button>
    </nav>
  )
}

export default Pagination
