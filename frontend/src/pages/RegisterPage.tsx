import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { BookLogo, GoogleIcon, XIcon } from '../components/icons'
import { ApiError, register as registerRequest } from '../lib/api'

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Họ tên là bắt buộc')
      .max(100, 'Họ tên tối đa 100 ký tự'),
    email: z
      .string()
      .trim()
      .min(1, 'Email là bắt buộc')
      .email('Email không hợp lệ')
      .max(256, 'Email tối đa 256 ký tự'),
    userName: z
      .string()
      .trim()
      .min(3, 'Tối thiểu 3 ký tự')
      .max(30, 'Tối đa 30 ký tự')
      .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ gồm chữ, số và dấu gạch dưới'),
    password: z
      .string()
      .min(8, 'Tối thiểu 8 ký tự')
      .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
      .regex(/[0-9]/, 'Cần ít nhất 1 chữ số')
      .regex(/[^A-Za-z0-9]/, 'Cần ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    terms: z.boolean().refine((v) => v, 'Bạn cần đồng ý điều khoản'),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Mật khẩu nhập lại không khớp',
      })
    }
  })

type RegisterFormValues = z.infer<typeof registerSchema>

interface Banner {
  title: string
  detail: string
}

const inputClass =
  'w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm bg-white text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none'

const errorInputClass = 'border-red-300 bg-red-50'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [banner, setBanner] = useState<Banner | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      userName: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    setBanner(null)
    try {
      await registerRequest({
        fullName: values.fullName,
        email: values.email,
        userName: values.userName,
        password: values.password,
      })
      navigate('/dashboard')
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setBanner({
          title: 'Đăng ký thất bại',
          detail: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
        })
        return
      }

      if (error.status === 409) {
        setBanner({
          title: 'Email đã được sử dụng',
          detail: error.detail ?? 'Email này đã được đăng ký. Vui lòng sử dụng email khác.',
        })
        setError('email', { type: 'server', message: 'Email này đã được đăng ký' })
        return
      }

      if (error.status === 422 && error.errors) {
        (Object.keys(error.errors) as (keyof RegisterFormValues)[]).forEach((field) => {
          const messages = error.errors?.[field]
          if (messages && messages.length > 0) {
            setError(field, { type: 'server', message: messages[0] })
          }
        })
        setBanner({
          title: 'Dữ liệu không hợp lệ',
          detail: 'Vui lòng kiểm tra các trường được đánh dấu.',
        })
        return
      }

      if (error.status === 429) {
        setBanner({
          title: 'Quá nhiều yêu cầu',
          detail: error.detail ?? 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
        })
        return
      }

      setBanner({
        title: 'Đăng ký thất bại',
        detail: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <BookLogo />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Đăng ký tài khoản</h1>
          <p className="text-sm text-surface-500 mt-1">
            Tạo tài khoản để bắt đầu chia sẻ công thức
          </p>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
          {banner && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3"
              role="alert"
            >
              <div className="text-red-500 flex-shrink-0 mt-0.5">
                <XIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-800">{banner.title}</p>
                <p className="text-xs text-red-600 mt-1">{banner.detail}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-surface-300 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50 transition mb-4 cursor-not-allowed opacity-70"
            title="Sắp ra mắt"
          >
            <GoogleIcon />
            Đăng ký với Google
          </button>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 border-t border-surface-200" />
            <span className="text-xs text-surface-400">hoặc</span>
            <div className="flex-1 border-t border-surface-200" />
          </div>

          <form aria-label="Form đăng ký" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-surface-700 mb-1">
                  Họ tên
                </label>
                <input
                  type="text"
                  id="reg-name"
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  aria-invalid={errors.fullName ? true : undefined}
                  className={`${inputClass} ${errors.fullName ? errorInputClass : ''}`}
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1" role="alert">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-surface-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="reg-email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  className={`${inputClass} ${errors.email ? errorInputClass : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-user" className="block text-sm font-medium text-surface-700 mb-1">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  id="reg-user"
                  placeholder="nguyenvana"
                  autoComplete="username"
                  aria-invalid={errors.userName ? true : undefined}
                  className={`${inputClass} ${errors.userName ? errorInputClass : ''}`}
                  {...register('userName')}
                />
                {errors.userName && (
                  <p className="text-xs text-red-500 mt-1" role="alert">
                    {errors.userName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-pass" className="block text-sm font-medium text-surface-700 mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="reg-pass"
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  aria-invalid={errors.password ? true : undefined}
                  className={`${inputClass} ${errors.password ? errorInputClass : ''}`}
                  {...register('password')}
                />
                <p className="text-xs text-surface-400 mt-1">
                  Tối thiểu 8 ký tự, 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt
                </p>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-pass2" className="block text-sm font-medium text-surface-700 mb-1">
                  Nhập lại mật khẩu
                </label>
                <input
                  type="password"
                  id="reg-pass2"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? true : undefined}
                  className={`${inputClass} ${errors.confirmPassword ? errorInputClass : ''}`}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm text-surface-600">
                <input
                  type="checkbox"
                  className="rounded border-surface-300 mt-0.5 w-4 h-4 accent-brand-500"
                  {...register('terms')}
                />
                <span>
                  Tôi đồng ý với <a href="#" className="text-brand-600 hover:underline">Điều khoản</a> và{' '}
                  <a href="#" className="text-brand-600 hover:underline">Chính sách</a>
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.terms.message}
                </p>
              )}

              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-48 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 text-sm inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2"
                        aria-hidden="true"
                      />
                      Đang đăng ký...
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
            <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
