import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiError, googleLogin, register } from '../lib/api'
import { getGoogleClientId, loadGoogleScript } from '../lib/googleAuth'
import { clearSession, saveSession } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/auth'
import { firstErrors, registerFormSchema } from '../validation/register'
import type { FieldErrors, RegisterFormValues } from '../validation/register'

const EMPTY_FORM: RegisterFormValues = {
  fullName: '',
  email: '',
  userName: '',
  password: '',
  confirmPassword: '',
}

interface Banner {
  kind: 'error' | 'warning'
  title: string
  detail: string
}

type GoogleState = 'loading' | 'ready' | 'unconfigured' | 'failed'

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="white" />
      <path d="M14 30C14 30 12 14 20 10C28 6 28 24 28 24" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M50 30C50 30 52 14 44 10C36 6 36 24 36 24" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 29C16 29 15 18 21 14C27 10 27 24 27 24" fill="#fed7aa" />
      <path d="M48 29C48 29 49 18 43 14C37 10 37 24 37 24" fill="#fed7aa" />
      <circle cx="32" cy="36" r="20" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
      <circle cx="18" cy="40" r="4" fill="#fed7aa" opacity="0.6" />
      <circle cx="46" cy="40" r="4" fill="#fed7aa" opacity="0.6" />
      <circle cx="24" cy="33" r="4" fill="#1c1917" />
      <circle cx="40" cy="33" r="4" fill="#1c1917" />
      <circle cx="26" cy="31" r="1.5" fill="white" />
      <circle cx="42" cy="31" r="1.5" fill="white" />
      <ellipse cx="32" cy="39" rx="2" ry="1.5" fill="#ea580c" />
      <path d="M27 41Q29 44 32 42Q35 44 37 41" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M29.5 42L30.5 42L30 43Z" fill="white" />
      <path d="M33.5 42L34.5 42L34 43Z" fill="white" />
      <line x1="18" y1="37" x2="6" y2="34" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="18" y1="40" x2="5" y2="40" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="18" y1="43" x2="6" y2="46" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="46" y1="37" x2="58" y2="34" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="46" y1="40" x2="59" y2="40" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="46" y1="43" x2="58" y2="46" stroke="#c2410c" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="35" cy="44" rx="1.2" ry="1.5" fill="#38bdf8" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

interface TextFieldProps {
  id: keyof RegisterFormValues
  label: string
  type?: string
  placeholder?: string
  autoComplete?: string
  hint?: string
  value: string
  error?: string
  onChange: (value: string) => void
}

function TextField({
  id,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  hint,
  value,
  error,
  onChange,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-surface-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-red-300 bg-red-50' : 'border-surface-300'
        }`}
      />
      {error ? (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      ) : (
        hint && <p className="text-xs text-surface-400 mt-1">{hint}</p>
      )}
    </div>
  )
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormValues>(EMPTY_FORM)
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<Banner | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<AuthResponse | null>(null)
  const [googleState, setGoogleState] = useState<GoogleState>(() =>
    getGoogleClientId() ? 'loading' : 'unconfigured',
  )
  const googleButtonRef = useRef<HTMLDivElement>(null)

  function setField<K extends keyof RegisterFormValues>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleGoogleCredential = useCallback(async (credential: string) => {
    if (!credential) {
      setBanner({
        kind: 'error',
        title: 'Đăng nhập Google thất bại',
        detail: 'Không nhận được credential từ Google.',
      })
      return
    }
    setBanner(null)
    setSubmitting(true)
    try {
      const auth = await googleLogin(credential)
      saveSession(auth)
      setSession(auth)
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setBanner({
          kind: 'error',
          title: 'Đăng nhập Google thất bại',
          detail: 'Đã xảy ra lỗi không xác định.',
        })
        return
      }
      if (err.status === 401) {
        setBanner({ kind: 'error', title: 'Token Google không hợp lệ', detail: err.message })
      } else if (err.status === 400) {
        setBanner({ kind: 'error', title: 'Thông tin Google không đầy đủ', detail: err.message })
      } else if (err.status === 502 || err.status === 503) {
        setBanner({
          kind: 'warning',
          title: 'Dịch vụ Google đang gặp sự cố',
          detail: err.message,
        })
      } else if (err.status === 429) {
        setBanner({ kind: 'warning', title: 'Quá nhiều yêu cầu', detail: err.message })
      } else {
        setBanner({ kind: 'error', title: 'Đăng nhập Google thất bại', detail: err.message })
      }
    } finally {
      setSubmitting(false)
    }
  }, [])

  useEffect(() => {
    const clientId = getGoogleClientId()
    if (!clientId) {
      return
    }
    let cancelled = false
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.id) {
          return
        }
        window.google.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void handleGoogleCredential(response.credential ?? '')
          },
          error_callback: () => {
            setBanner({
              kind: 'error',
              title: 'Đăng nhập Google thất bại',
              detail: 'Không nhận được phản hồi từ Google. Vui lòng thử lại.',
            })
          },
        })
        setGoogleState('ready')
      })
      .catch(() => {
        if (!cancelled) {
          setGoogleState('failed')
        }
      })
    return () => {
      cancelled = true
    }
  }, [handleGoogleCredential])

  useEffect(() => {
    if (googleState !== 'ready') {
      return
    }
    const container = googleButtonRef.current
    if (container && window.google?.id) {
      window.google.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        width: container.offsetWidth || 360,
      })
    }
  }, [googleState])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)

    const parsed = registerFormSchema.safeParse(form)
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error))
      return
    }

    if (!agree) {
      setBanner({
        kind: 'error',
        title: 'Chưa đồng ý điều khoản',
        detail: 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.',
      })
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      const auth = await register({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        userName: parsed.data.userName,
        password: parsed.data.password,
      })
      saveSession(auth)
      setSession(auth)
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setBanner({ kind: 'error', title: 'Đăng ký thất bại', detail: 'Đã xảy ra lỗi không xác định.' })
        return
      }

      if (err.status === 422 && err.problem?.errors) {
        const fieldErrors: FieldErrors = {}
        for (const key of ['fullName', 'email', 'userName', 'password'] as const) {
          const messages = err.problem.errors[key]
          if (messages && messages.length > 0) {
            fieldErrors[key] = messages[0]
          }
        }
        setErrors(fieldErrors)
        if (Object.keys(fieldErrors).length === 0) {
          setBanner({ kind: 'error', title: 'Dữ liệu không hợp lệ', detail: err.message })
        }
      } else if (err.status === 409) {
        const isEmail = err.problem?.type === 'AUTH_EMAIL_EXISTS'
        setBanner({
          kind: 'error',
          title: isEmail ? 'Email đã được sử dụng' : 'Tên người dùng đã được sử dụng',
          detail: isEmail
            ? 'Email này đã được đăng ký. Vui lòng sử dụng email khác.'
            : 'Tên người dùng này đã tồn tại. Vui lòng chọn tên khác.',
        })
        if (isEmail) {
          setErrors({ email: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.' })
        } else {
          setErrors({ userName: 'Tên người dùng này đã tồn tại. Vui lòng chọn tên khác.' })
        }
      } else if (err.status === 429) {
        setBanner({ kind: 'warning', title: 'Quá nhiều yêu cầu', detail: err.message })
      } else {
        setBanner({ kind: 'error', title: 'Đăng ký thất bại', detail: err.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (session) {
    return (
      <main className="min-h-screen bg-surface-50 flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-xl border border-surface-200 p-6 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Đăng ký thành công!</h1>
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
                setSession(null)
                setForm(EMPTY_FORM)
                setAgree(false)
                setErrors({})
                setBanner(null)
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

  return (
    <main className="min-h-screen bg-surface-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <BookIcon className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Đăng ký tài khoản</h1>
          <p className="text-sm text-surface-500 mt-1">Tạo tài khoản để bắt đầu chia sẻ công thức</p>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
          {banner && (
            <div
              role="alert"
              className={`rounded-lg p-4 mb-4 flex items-start gap-3 border ${
                banner.kind === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <svg
                className={`w-5 h-5 shrink-0 mt-0.5 ${banner.kind === 'warning' ? 'text-amber-500' : 'text-red-500'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${banner.kind === 'warning' ? 'text-amber-800' : 'text-red-800'}`}>
                  {banner.title}
                </p>
                <p className={`text-xs mt-1 ${banner.kind === 'warning' ? 'text-amber-600' : 'text-red-600'}`}>
                  {banner.detail}
                </p>
              </div>
            </div>
          )}

          {googleState === 'ready' ? (
            <div ref={googleButtonRef} className="mb-4 [&>div]:w-full" />
          ) : (
            <button
              type="button"
              disabled
              title={
                googleState === 'unconfigured'
                  ? 'Thiếu VITE_GOOGLE_CLIENT_ID — hãy cấu hình Google OAuth'
                  : googleState === 'failed'
                    ? 'Không tải được Google Sign-In'
                    : 'Đang tải Google Sign-In...'
              }
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-surface-300 rounded-lg text-sm font-medium text-surface-400 cursor-not-allowed mb-4"
            >
              <GoogleIcon />
              Đăng ký với Google
            </button>
          )}

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 border-t border-surface-200" />
            <span className="text-xs text-surface-400">hoặc</span>
            <div className="flex-1 border-t border-surface-200" />
          </div>

          <form aria-label="Form đăng ký" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <TextField
                id="fullName"
                label="Họ tên"
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                value={form.fullName}
                error={errors.fullName}
                onChange={(v) => setField('fullName', v)}
              />
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
                id="userName"
                label="Tên người dùng"
                placeholder="nguyenvana"
                autoComplete="username"
                value={form.userName}
                error={errors.userName}
                onChange={(v) => setField('userName', v)}
              />
              <TextField
                id="password"
                label="Mật khẩu"
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
                hint="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt"
                value={form.password}
                error={errors.password}
                onChange={(v) => setField('password', v)}
              />
              <TextField
                id="confirmPassword"
                label="Nhập lại mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                value={form.confirmPassword}
                error={errors.confirmPassword}
                onChange={(v) => setField('confirmPassword', v)}
              />

              <label className="flex items-start gap-2 text-sm text-surface-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="rounded border-surface-300 mt-0.5"
                />
                <span>
                  Tôi đồng ý với{' '}
                  <a href="#" className="text-brand-600 hover:underline">
                    Điều khoản
                  </a>{' '}
                  và{' '}
                  <a href="#" className="text-brand-600 hover:underline">
                    Chính sách
                  </a>
                </span>
              </label>

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
                    'Đăng ký'
                  )}
                </button>
              </div>
            </div>
          </form>

          <p className="text-center text-sm text-surface-500 mt-4">
            Đã có tài khoản?{' '}
            <Link to="/auth/login" className="text-brand-600 font-medium hover:text-brand-700">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
