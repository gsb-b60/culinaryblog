import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, googleLogin } from '../lib/api'
import { getGsiIdApi, getGoogleClientId, loadGoogleScript, waitForGsiIdApi } from '../lib/googleAuth'
import { saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'

/**
 * 'unavailable' means the GIS script is present but its button cannot be
 * rendered — typically Firefox Enhanced Tracking Protection or a blocking
 * extension. It is deliberately distinct from 'failed' (the script never
 * arrived) so the UI can offer a redirect fallback instead of a retry.
 */
export type GoogleState = 'loading' | 'ready' | 'unavailable' | 'failed' | 'unconfigured'

/** How long to wait for Google to actually inject a button before giving up. */
export const GSI_RENDER_TIMEOUT_MS = 1500
export const GSI_RENDER_POLL_MS = 100

/**
 * Width requested from Google. Matches the `max-w-[360px]` cap on the slot in
 * GoogleAuthButton, so the injected node is not stretched by the flex parent
 * and stays centred in the card.
 */
export const GSI_BUTTON_WIDTH = 360

export const GOOGLE_HINTS: Record<GoogleState, string> = {
  loading: 'Đang tải Google Sign-In...',
  ready: '',
  unavailable:
    'Nút Google không hoạt động trong trình duyệt này (thường do Enhanced Tracking Protection của Firefox, tiện ích chặn, hoặc origin chưa được đăng ký trong Google Cloud Console). Vui lòng đăng nhập bằng email và mật khẩu.',
  failed: 'Không tải được Google Sign-In (do mạng hoặc trình duyệt/chặn quảng cáo). Bấm nút để thử lại.',
  unconfigured:
    'Thiếu VITE_GOOGLE_CLIENT_ID trong frontend/.env.local — bấm để thử lại sau khi khởi động lại Vite',
}

export interface GoogleAuthNotice {
  kind: 'error' | 'warning'
  title: string
  detail: string
}

export interface GsiCallbacks {
  onCredential: (credential: string) => void
  onError: (error: { type?: string; message?: string }) => void
}

/**
 * GIS is a global singleton: calling initialize() more than once makes Google
 * warn that only the last instance is used. A per-hook ref cannot prevent that
 * because every page visit creates a new hook instance, so the guard lives at
 * module scope and is keyed by client id.
 *
 * The callbacks are held in a module-level slot that each hook refreshes, so
 * initialising only once never leaves us calling back into a page that has
 * already unmounted.
 */
let initializedClientId: string | null = null
let activeCallbacks: GsiCallbacks | null = null

function ensureGsiInitialized(clientId: string): boolean {
  const gsi = getGsiIdApi()
  if (!gsi) {
    return false
  }
  if (initializedClientId === clientId) {
    return true
  }
  gsi.initialize({
    client_id: clientId,
    callback: (response) => {
      activeCallbacks?.onCredential(response.credential ?? '')
    },
    error_callback: (error) => {
      activeCallbacks?.onError(error)
    },
  })
  initializedClientId = clientId
  return true
}

/** Forces the next mount (or an explicit reset) to build a brand new button. */
export function resetGoogleSignIn(): void {
  initializedClientId = null
  activeCallbacks = null
}

interface UseGoogleSignInOptions {
  /** Button label rendered by Google, e.g. 'signin_with' or 'signup_with'. */
  text: 'signin_with' | 'signup_with'
  onSuccess: (auth: AuthResponse) => void
  onError: (notice: GoogleAuthNotice) => void
}

export function useGoogleSignIn({ text, onSuccess, onError }: UseGoogleSignInOptions) {
  const [state, setState] = useState<GoogleState>(() =>
    getGoogleClientId() ? 'loading' : 'unconfigured',
  )
  const [attempt, setAttempt] = useState(0)
  const [gisRendered, setGisRendered] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  // Guard so StrictMode's double effect run cannot stack two Google iframes
  // into the same slot.
  const renderedRef = useRef(false)

  // Keep the latest callbacks without re-running the GIS init effect, which
  // would otherwise re-initialise Google on every parent re-render.
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  const handleCredential = useCallback(async (credential: string) => {
    if (!credential) {
      onErrorRef.current({
        kind: 'error',
        title: 'Đăng nhập Google thất bại',
        detail: 'Không nhận được credential từ Google.',
      })
      return
    }
    try {
      const auth = await googleLogin(credential)
      saveSession(auth)
      onSuccessRef.current(auth)
    } catch (err) {
      onErrorRef.current(describeGoogleError(err))
    }
  }, [])

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
    // Publish to the module-level slot that the one-time Google
    // initialisation closes over, so navigating between the auth pages never
    // leaves us calling back into a page that has already unmounted.
    activeCallbacks = {
      onCredential: (credential) => {
        void handleCredential(credential)
      },
      onError: (error) => {
        console.error('[Google] GIS error', error)
        onErrorRef.current({
          kind: 'error',
          title: 'Đăng nhập Google thất bại',
          detail: error?.message || 'Không nhận được phản hồi từ Google. Vui lòng thử lại.',
        })
      },
    }
  }, [onSuccess, onError, handleCredential])

  function retry() {
    setState(getGoogleClientId() ? 'loading' : 'unconfigured')
    setAttempt((n) => n + 1)
  }

  /**
   * Rebuilds the Google button from scratch. Needed after signing out: the
   * previous button holds a consumed single-use credential, so clicking it a
   * second time can silently do nothing.
   */
  function reset() {
    resetGoogleSignIn()
    renderedRef.current = false
    setGisRendered(false)
    setState(getGoogleClientId() ? 'loading' : 'unconfigured')
    setAttempt((n) => n + 1)
  }

  useEffect(() => {
    const clientId = getGoogleClientId()
    if (!clientId) {
      return
    }
    let cancelled = false

    loadGoogleScript()
      .then(() => waitForGsiIdApi())
      .then((gsi) => {
        if (cancelled) {
          return
        }
        if (!gsi) {
          console.error(
            '[Google] google.accounts.id never became available — Enhanced Tracking Protection or a blocking extension is likely',
          )
          setState('unavailable')
          return
        }
        if (!ensureGsiInitialized(clientId)) {
          setState('unavailable')
          return
        }
        setState('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        console.error('[Google] Failed to load Google Identity Services', error)
        setState('failed')
      })
    return () => {
      cancelled = true
    }
  }, [handleCredential, attempt])

  /**
   * Polls the slot until Google injects a node. renderButton returning without
   * throwing is not proof of success: in Firefox it can complete while
   * inserting nothing at all.
   */
  function watchForButton(container: HTMLElement) {
    const deadline = Date.now() + GSI_RENDER_TIMEOUT_MS
    const poll = () => {
      if (container.childElementCount > 0) {
        setGisRendered(true)
        return
      }
      if (Date.now() >= deadline) {
        console.warn('[Google] renderButton produced no button; using the OAuth redirect instead')
        setState('unavailable')
        return
      }
      setTimeout(poll, GSI_RENDER_POLL_MS)
    }
    setTimeout(poll, GSI_RENDER_POLL_MS)
  }

  useEffect(() => {
    if (state !== 'ready') {
      return
    }
    // renderButton mutates the DOM, so run it outside the effect body instead
    // of during the synchronous render pass.
    const timer = setTimeout(() => {
      const container = buttonRef.current
      if (!container) {
        // The slot is mounted unconditionally, so this should not happen; keep
        // the guard rather than throwing on a null dereference.
        console.error('[Google] renderButton aborted: container ref was not attached')
        setState('unavailable')
        return
      }
      if (renderedRef.current) {
        return
      }
      const gsi = getGsiIdApi()
      if (!gsi) {
        console.error(
          '[Google] google.accounts.id disappeared between initialize and renderButton',
        )
        setState('unavailable')
        return
      }
      container.innerHTML = ''
      try {
        gsi.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text,
          // A fixed width keeps the injected button centred. Using
          // container.offsetWidth made it stretch to the full card width, since
          // the slot is wider than the button.
          width: Math.min(container.offsetWidth || GSI_BUTTON_WIDTH, GSI_BUTTON_WIDTH),
        })
        renderedRef.current = true
        // renderButton returning without throwing is not proof of success: in
        // Firefox it can complete while inserting nothing at all. Watch the
        // slot until a node actually appears, and fall back if it stays empty.
        watchForButton(container)
      } catch (error) {
        console.error('[Google] renderButton threw; falling back to the OAuth redirect', error)
        setState('unavailable')
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [state, text])

  return { state, gisRendered, buttonRef, retry, reset, handleCredential }
}

function describeGoogleError(err: unknown): GoogleAuthNotice {
  if (!(err instanceof ApiError)) {
    return {
      kind: 'error',
      title: 'Đăng nhập Google thất bại',
      detail: 'Đã xảy ra lỗi không xác định.',
    }
  }
  if (err.status === 401) {
    return { kind: 'error', title: 'Token Google không hợp lệ', detail: err.message }
  }
  if (err.status === 400) {
    return { kind: 'error', title: 'Thông tin Google không đầy đủ', detail: err.message }
  }
  if (err.status === 502 || err.status === 503) {
    return { kind: 'warning', title: 'Dịch vụ Google đang gặp sự cố', detail: err.message }
  }
  if (err.status === 429) {
    return { kind: 'warning', title: 'Quá nhiều yêu cầu', detail: err.message }
  }
  return { kind: 'error', title: 'Đăng nhập Google thất bại', detail: err.message }
}
