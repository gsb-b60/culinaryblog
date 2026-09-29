import type { RefObject } from 'react'

import { GOOGLE_OAUTH_REDIRECT_URL } from '../../lib/api'
import { GoogleIcon } from './GoogleIcon'
import { GOOGLE_HINTS, type GoogleState } from '../../hooks/useGoogleSignIn'

interface GoogleAuthButtonProps {
  state: GoogleState
  /** True only once Google has injected a button into the slot. */
  gisRendered: boolean
  buttonRef: RefObject<HTMLDivElement | null>
  label: string
  retry: () => void
}

const LINK_CLASSES =
  'w-full flex items-center justify-center gap-3 px-4 py-3 border border-surface-300 rounded-lg text-sm font-medium text-surface-600 hover:border-surface-400 hover:bg-surface-50'

/**
 * Renders the real Google Identity Services button when it works, and always
 * renders the OAuth 2.0 redirect link as the primary control.
 *
 * The link is never demoted or hidden, deliberately. When `gsi/button` returns
 * 403, Google still injects a *placeholder* into the slot, so "a node appeared"
 * is not proof of a working button — an earlier version trusted that signal,
 * promoted the hollow button and hid the only control that actually worked.
 * Firefox and Chrome each also fail differently (silent no-op, or a consumed
 * single-use credential), so the redirect flow is the dependable path.
 */
export function GoogleAuthButton({
  state,
  gisRendered,
  buttonRef,
  label,
  retry,
}: GoogleAuthButtonProps) {
  return (
    <div className="mb-4">
      {/* Always mounted so the ref the watchdog reads is never null; hidden
          until Google has actually injected something. */}
      <div
        ref={buttonRef}
        className={gisRendered ? 'mb-3 [&>div]:w-full' : 'hidden'}
        aria-hidden={!gisRendered}
      />

      <a href={GOOGLE_OAUTH_REDIRECT_URL} className={LINK_CLASSES}>
        <GoogleIcon />
        {label}
      </a>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <p className="text-xs text-surface-500">{GOOGLE_HINTS[state]}</p>
        {state === 'failed' && (
          <button type="button" onClick={retry} className="text-xs text-brand-600 hover:underline">
            Thử tải lại
          </button>
        )}
      </div>
    </div>
  )
}
