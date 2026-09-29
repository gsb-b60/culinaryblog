export interface BannerProps {
  kind: 'error' | 'warning'
  title: string
  detail: string
}

export function Banner({ kind, title, detail }: BannerProps) {
  const isWarning = kind === 'warning'
  return (
    <div
      role="alert"
      className={`rounded-lg p-4 mb-4 flex items-start gap-3 border ${
        isWarning ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
      }`}
    >
      <svg
        className={`w-5 h-5 shrink-0 mt-0.5 ${isWarning ? 'text-amber-500' : 'text-red-500'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${isWarning ? 'text-amber-800' : 'text-red-800'}`}>
          {title}
        </p>
        <p className={`text-xs mt-1 ${isWarning ? 'text-amber-600' : 'text-red-600'}`}>{detail}</p>
      </div>
    </div>
  )
}
