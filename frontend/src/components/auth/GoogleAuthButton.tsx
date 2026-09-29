import type { RefObject } from 'react'

import { GOOGLE_HINTS, type GoogleState } from '../../hooks/useGoogleSignIn'

interface GoogleAuthButtonProps {
  state: GoogleState
  /** True once Google has actually injected a button into the slot. */
  gisRendered: boolean
  buttonRef: RefObject<HTMLDivElement | null>
  retry: () => void
}

/**
 * Renders the Google Identity Services button as the single Google control.
 *
 * There is deliberately no second control. An earlier version also rendered an
 * OAuth 2.0 redirect link "just in case", which produced two stacked Google
 * buttons and read as a bug. When `gsi/button` returns 403 Google still injects
 * a container, so the status line below is what tells the user the button did
 * not work rather than a second button pretending to be a backup.
 */
export function GoogleAuthButton({ state, gisRendered, buttonRef, retry }: GoogleAuthButtonProps) {
  return (
    <div className="mb-4">
      {/* Always mounted so the ref the watchdog reads is never null, and always
          visible: this is the only Google control, so it must hold its place
          in the layout whether or not Google filled the slot.

          Google's button is an injected node, so centring it means centring
          the slot and capping the injected width. The cap mirrors
          GSI_BUTTON_WIDTH, which is what the hook passes to renderButton. */}
      <div
        ref={buttonRef}
        className="flex min-h-[44px] justify-center [&>div]:max-w-[360px]"
        aria-hidden={!gisRendered}
      />

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {/* data-testid so tests can assert the status line exists without
            depending on which state the copy below happens to be. */}
        <p data-testid="google-status" className="text-xs text-surface-500">
          {GOOGLE_HINTS[state]}
        </p>
        {state === 'failed' && (
          <button type="button" onClick={retry} className="text-xs text-brand-600 hover:underline">
            Thử tải lại
          </button>
        )}
      </div>
    </div>
  )
}
