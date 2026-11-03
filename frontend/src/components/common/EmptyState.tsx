import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description?: string
  /** Optional primary action, e.g. "Tạo công thức đầu tiên". */
  action?: { label: string; onClick: () => void }
  icon?: ReactNode
}

/** Shared placeholder for a list that has nothing to show yet. */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-10 text-center">
      {icon && <div className="mb-3 flex justify-center text-surface-400">{icon}</div>}
      <h2 className="font-semibold text-surface-900">{title}</h2>
      {description && <p className="mt-2 text-sm text-surface-500">{description}</p>}
      {action && (
        <Button type="button" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
