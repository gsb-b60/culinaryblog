import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, googleLogin } from '../lib/api'
import { getGsiIdApi, getGoogleClientId, loadGoogleScript } from '../lib/googleAuth'
import { saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'

export type GoogleState = 'loading' | 'ready' | 'unconfigured' | 'failed'

export const GOOGLE_HINTS: Record<GoogleState, string> = {
  loading: 'Đang tải Google Sign-In...',
  ready: '',
  unconfigured:
    'Thiếu VITE_GOOGLE_CLIENT_ID trong frontend/.env.local — bấm để thử lại sau khi khởi động lại Vite',
  failed:
    'Không tải được Google Sign-In (do mạng hoặc trình duyệt/chặn quảng cáo). Bấm nút để thử lại.',
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
      .then(() => {
        if (cancelled) {
          return
        }
        const gsi = getGsiIdApi()
        if (!gsi) {
          console.error('[Google] GIS script loaded but window.google.accounts.id is missing', {
            hasGoogle: !!window.google,
          })
          setState('failed')
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
    const container = buttonRef.current
    const gsi = getGsiIdApi()
    if (!container || !gsi) {
      console.error('[Google] renderButton aborted: container or google.accounts.id missing')
      return
    }
    gsi.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text,
      width: container.offsetWidth || 360,
    })
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
