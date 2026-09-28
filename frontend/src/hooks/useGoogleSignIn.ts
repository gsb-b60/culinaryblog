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

export const GOOGLE_HINTS: Record<GoogleState, string> = {
  loading: 'Đang tải Google Sign-In...',
  ready: '',
  unavailable:
    'Trình duyệt này không cho hiển thị nút Google (thường do Enhanced Tracking Protection của Firefox hoặc tiện ích chặn). Bạn vẫn có thể đăng nhập bằng Google qua nút bên dưới.',
  failed: 'Không tải được Google Sign-In (do mạng hoặc trình duyệt/chặn quảng cáo). Bấm nút để thử lại.',
  unconfigured:
    'Thiếu VITE_GOOGLE_CLIENT_ID trong frontend/.env.local — bấm để thử lại sau khi khởi động lại Vite',
}

export interface GoogleAuthNotice {
  kind: 'error' | 'warning'
  title: string
  detail: string
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
  const buttonRef = useRef<HTMLDivElement>(null)

  // Keep the latest callbacks without re-running the GIS init effect, which
  // would otherwise call gsi.initialize again on every parent re-render.
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

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

  function retry() {
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
        gsi.initialize({
          client_id: clientId,
          callback: (response) => {
            void handleCredential(response.credential ?? '')
          },
          error_callback: (error) => {
            console.error('[Google] GIS error', error)
            onErrorRef.current({
              kind: 'error',
              title: 'Đăng nhập Google thất bại',
              detail: error?.message || 'Không nhận được phản hồi từ Google. Vui lòng thử lại.',
            })
          },
        })
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

  useEffect(() => {
    if (state !== 'ready') {
      return
    }
    // renderButton mutates the DOM, so run it outside the effect body instead
    // of during the synchronous render pass.
    const timer = setTimeout(() => {
      const container = buttonRef.current
      if (!container) {
        console.error('[Google] renderButton aborted: container ref was not attached')
        setState('unavailable')
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
      // StrictMode runs effects twice in dev; clear first so we do not stack
      // two Google iframes in the same container.
      container.innerHTML = ''
      try {
        gsi.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text,
          width: container.offsetWidth || 360,
        })
      } catch (error) {
        console.error('[Google] renderButton threw; falling back to the OAuth redirect', error)
        setState('unavailable')
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [state, text])

  return { state, buttonRef, retry, handleCredential }
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
