import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from '@/components/common/ErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Changing this value clears a captured error (e.g. on navigation). */
  resetKey?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Keeps a render crash inside one subtree from blanking the whole app. The
 * fallback reuses the shared error component so the recovery path looks and
 * behaves like every other error state.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ErrorState
          title="Trang gặp sự cố"
          message={error.message || 'Không thể hiển thị nội dung này. Vui lòng thử lại.'}
          onRetry={() => this.setState({ error: null })}
        />
      </div>
    )
  }
}

export default ErrorBoundary
