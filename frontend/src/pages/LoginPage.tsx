import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { Banner } from '../components/auth/Banner'
import { BookIcon } from '../components/auth/BookIcon'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { TextField } from '../components/auth/TextField'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import { ApiError, login } from '../lib/api'
import {
  consumeGoogleErrorCode,
  describeGoogleErrorCode,
  requiresRegistration,
} from '../lib/googleErrors'
import { loadSession, saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'
import { firstErrors, loginFormSchema } from '../validation/login'
import type { LoginFieldErrors, LoginFormValues } from '../validation/login'

const EMPTY_FORM: LoginFormValues = { email: '', password: '' }

interface Notice {
  kind: 'error' | 'warning'
  title: string
  detail: string
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<LoginFieldErrors>({})
  // The OAuth callback redirects failures here with ?error=<application code>.
  // Read during the initial render rather than in an effect, so no state
  // update cascades after mount.
  const [pendingGoogleError] = useState(() => consumeGoogleErrorCode())
  const [needsRegistration, setNeedsRegistration] = useState(() =>
    requiresRegistration(pendingGoogleError),
  )
  const [notice, setNotice] = useState<Notice | null>(() => {
    if (!pendingGoogleError) {
      return null
    }
    const { title, detail } = describeGoogleErrorCode(pendingGoogleError)
    return {
      kind: requiresRegistration(pendingGoogleError) ? 'warning' : 'error',
      title,
      detail,
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const [remember, setRemember] = useState(true)
  const [session, setSession] = useState<AuthResponse | null>(null)
  const [alreadyLoggedIn] = useState(() => loadSession() !== null)

  const {
    state: googleState,
    gisRendered,
    buttonRef: googleButtonRef,
    retry: retryGoogle,
  } = useGoogleSignIn({
    text: 'signin_with',
    onSuccess: setSession,
    onError: setNotice,
  })

  function setField<K extends keyof LoginFormValues>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setNotice(null)
    setNeedsRegistration(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNotice(null)

    const parsed = loginFormSchema.safeParse(form)
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error))
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      const auth = await login({
        email: parsed.data.email,
        password: parsed.data.password,
      })
      saveSession(auth, remember)
      setSession(auth)
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setNotice({ kind: 'error', title: 'Đăng nhập thất bại', detail: 'Đã xảy ra lỗi không xác định.' })
        return
      }
      applyApiError(err, setErrors, setNotice, setNeedsRegistration)
    } finally {
      setSubmitting(false)
    }
  }

  if (alreadyLoggedIn || session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="min-h-screen bg-surface-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <BookIcon className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Đăng nhập</h1>
          <p className="text-sm text-surface-500 mt-1">Chào mừng bạn trở lại Culinary Blog</p>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
          {notice && <Banner kind={notice.kind} title={notice.title} detail={notice.detail} />}

          {needsRegistration && (
            <Link
              to="/auth/register"
              className="mb-4 w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Đăng ký tài khoản mới
            </Link>
          )}

          <GoogleAuthButton
            state={googleState}
            gisRendered={gisRendered}
            buttonRef={googleButtonRef}
            retry={retryGoogle}
          />

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 border-t border-surface-200" />
            <span className="text-xs text-surface-400">hoặc</span>
            <div className="flex-1 border-t border-surface-200" />
          </div>

          <form aria-label="Form đăng nhập" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <TextField
                id="email"
                label="Email"
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                value={form.email}
                error={errors.email}
                onChange={(v) => setField('email', v)}
              />
              <TextField
                id="password"
                label="Mật khẩu"
                type="password"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                value={form.password}
                error={errors.password}
                onChange={(v) => setField('password', v)}
              />

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-surface-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => {
                      setRemember(e.target.checked)
                    }}
                    className="rounded border-surface-300"
                  />
                  Ghi nhớ đăng nhập
                </label>
                {/* Password reset is not part of the current FR scope. */}
                <a href="#" className="text-sm text-brand-600 hover:text-brand-700">
                  Quên mật khẩu?
                </a>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-48 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 text-sm inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </div>
            </div>
          </form>

          <p className="text-center text-sm text-surface-500 mt-4">
            Chưa có tài khoản?{' '}
            <Link to="/auth/register" className="text-brand-600 font-medium hover:text-brand-700">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

/**
 * Maps an API failure to the banner and per-field errors. The RFC 7807 `type`
 * is preferred over the message text so copy can change without breaking this.
 */
function applyApiError(
  err: ApiError,
  setErrors: (errors: LoginFieldErrors) => void,
  setNotice: (notice: Notice) => void,
  setNeedsRegistration: (value: boolean) => void,
): void {
  if (err.status === 422 && err.problem?.errors) {
    const fieldErrors: LoginFieldErrors = {}
    for (const key of ['email', 'password'] as const) {
      const messages = err.problem.errors[key]
      if (messages && messages.length > 0) {
        fieldErrors[key] = messages[0]
      }
    }
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length === 0) {
      setNotice({ kind: 'error', title: 'Dữ liệu không hợp lệ', detail: err.message })
    }
    return
  }

  if (err.status === 401) {
    const message = 'Email hoặc mật khẩu không chính xác'
    setNotice({ kind: 'error', title: 'Đăng nhập thất bại', detail: message })
    setErrors({ email: message, password: message })
    return
  }

  if (err.status === 403) {
    // A Google identity with no local account must reach sign-up, so it gets
    // its own copy and a dedicated register button.
    const code = err.problem?.type
    if (requiresRegistration(code)) {
      const { title, detail } = describeGoogleErrorCode(code)
      setNotice({ kind: 'warning', title, detail })
      setNeedsRegistration(true)
      return
    }
    if (err.problem?.type === 'AUTH_ACCOUNT_LOCKED') {
      setNotice({
        kind: 'warning',
        title: 'Tài khoản tạm thời bị khóa',
        detail: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.',
      })
    } else {
      setNotice({
        kind: 'error',
        title: 'Tài khoản đã bị vô hiệu hóa',
        detail: 'Vui lòng liên hệ quản trị viên nếu cần trợ giúp.',
      })
    }
    return
  }

  if (err.status === 429) {
    setNotice({ kind: 'warning', title: 'Quá nhiều yêu cầu', detail: err.message })
    return
  }

  if (err.status === 0) {
    setNotice({
      kind: 'error',
      title: 'Đăng nhập thất bại',
      detail: 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.',
    })
    return
  }

  setNotice({ kind: 'error', title: 'Đăng nhập thất bại', detail: err.message })
}
