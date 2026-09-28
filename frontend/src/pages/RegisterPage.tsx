import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Banner } from '../components/auth/Banner'
import { BookIcon } from '../components/auth/BookIcon'
import { GoogleIcon } from '../components/auth/GoogleIcon'
import { TextField } from '../components/auth/TextField'
import { GOOGLE_HINTS, useGoogleSignIn } from '../hooks/useGoogleSignIn'
import { ApiError, register } from '../lib/api'
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

interface BannerState {
  kind: 'error' | 'warning'
  title: string
  detail: string
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormValues>(EMPTY_FORM)
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<AuthResponse | null>(null)

  const { state: googleState, buttonRef: googleButtonRef, retry: retryGoogle } = useGoogleSignIn({
    text: 'signup_with',
    onSuccess: (auth) => {
      setBanner(null)
      setSession(auth)
    },
    onError: setBanner,
  })

  function setField<K extends keyof RegisterFormValues>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

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
          {banner && <Banner kind={banner.kind} title={banner.title} detail={banner.detail} />}

          {googleState === 'ready' ? (
            <div ref={googleButtonRef} className="mb-4 [&>div]:w-full" />
          ) : (
            <>
              <button
                type="button"
                onClick={retryGoogle}
                title={GOOGLE_HINTS[googleState]}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-surface-300 rounded-lg text-sm font-medium text-surface-600 hover:border-surface-400 hover:bg-surface-50 mb-2"
              >
                <GoogleIcon />
                Đăng ký với Google
              </button>
              <p className="text-xs text-surface-500 mb-4">{GOOGLE_HINTS[googleState]}</p>
            </>
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
