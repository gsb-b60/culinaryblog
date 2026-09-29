import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { Banner } from '../components/auth/Banner'
import { BookIcon } from '../components/auth/BookIcon'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { TextField } from '../components/auth/TextField'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import { ApiError, login } from '../lib/api'
import { clearSession, loadSession, saveSession } from '../lib/tokenStorage'
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
  const [notice, setNotice] = useState<Notice | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [remember, setRemember] = useState(true)
  const [session, setSession] = useState<AuthResponse | null>(null)
  // Showcase M7: "redirect if logged in". Captured once on mount so a session
  // created by this page still shows the success card instead of redirecting.
  const [alreadyLoggedIn] = useState(() => loadSession() !== null)

  const {
    state: googleState,
    gisRendered,
    buttonRef: googleButtonRef,
    retry: retryGoogle,
    reset: resetGoogle,
  } = useGoogleSignIn({
    text: 'signin_with',
    onSuccess: setSession,
    onError: setNotice,
  })

  function setField<K extends keyof LoginFormValues>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setNotice(null)
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
      applyApiError(err, setErrors, setNotice)
    } finally {
      setSubmitting(false)
    }
  }

  if (alreadyLoggedIn) {
    return <Navigate to="/" replace />
  }

  if (session) {
    return (
      <LoginSuccess
        session={session}
        onSignOut={() => {
          setSession(null)
          setForm(EMPTY_FORM)
          setErrors({})
          setNotice(null)
          // The previous Google button holds a consumed credential; rebuild it
          // so a second sign-in attempt works.
          resetGoogle()
        }}
      />
    )
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

          <GoogleAuthButton
            state={googleState}
            gisRendered={gisRendered}
            buttonRef={googleButtonRef}
            label="Tiếp tục với Google"
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

function LoginSuccess({ session, onSignOut }: { session: AuthResponse; onSignOut: () => void }) {
  return (
    <main className="min-h-screen bg-surface-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-xl border border-surface-200 p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Đăng nhập thành công!</h1>
        <p className="text-sm text-surface-500 mt-2">
          Xin chào <strong className="text-surface-800">{session.user.fullName}</strong>
          {session.user.userName ? ` (${session.user.userName})` : null}
        </p>
        <div className="flex justify-center gap-2 mt-3">
          {session.user.roles.map((role) => (
            <span key={role} className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">
              {role}
            </span>
          ))}
        </div>
        <p className="text-xs text-surface-400 mt-4">
          Phiên đăng nhập (JWT) đã được lưu trên trình duyệt của bạn.
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <Link
            to="/"
            className="w-full py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 text-sm justify-center"
          >
            Về trang chủ
          </Link>
          <button
            type="button"
            onClick={() => {
              clearSession()
              onSignOut()
            }}
            className="w-full py-2.5 border border-surface-300 rounded-lg font-medium text-surface-600 hover:bg-surface-50 text-sm justify-center"
          >
            Đăng xuất
          </button>
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
