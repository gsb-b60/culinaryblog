import type { RefObject } from 'react'

import { GOOGLE_OAUTH_REDIRECT_URL } from '../../lib/api'
import { GoogleIcon } from './GoogleIcon'
import { GOOGLE_HINTS, type GoogleState } from '../../hooks/useGoogleSignIn'

interface GoogleAuthButtonProps {
  state: GoogleState
  buttonRef: RefObject<HTMLDivElement | null>
  label: string
  retry: () => void
}

const LINK_CLASSES =
  'w-full flex items-center justify-center gap-3 px-4 py-3 border border-surface-300 rounded-lg text-sm font-medium text-surface-600 hover:border-surface-400 hover:bg-surface-50'

/**
 * Prefers the real Google Identity Services button. When GIS cannot render
 * (Firefox, blocking extensions) it degrades to a plain link into the OAuth 2.0
 * redirect flow, so Google sign-in keeps working instead of showing a dead box.
 */
export function GoogleAuthButton({ state, buttonRef, label, retry }: GoogleAuthButtonProps) {
  if (state === 'ready') {
    return <div ref={buttonRef} className="mb-4 [&>div]:w-full" />
  }

  return (
    <>
      <a href={GOOGLE_OAUTH_REDIRECT_URL} className={`${LINK_CLASSES} mb-2`}>
        <GoogleIcon />
        {label}
      </a>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <p className="text-xs text-surface-500">{GOOGLE_HINTS[state]}</p>
        {state === 'failed' && (
          <button type="button" onClick={retry} className="text-xs text-brand-600 hover:underline">
            Thử tải lại
          </button>
        )}
      </div>
    </>
  )
}
