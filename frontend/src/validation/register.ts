import { z } from 'zod'

export const registerFormSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Họ tên là bắt buộc').max(100, 'Họ tên tối đa 100 ký tự'),
    email: z
      .string()
      .trim()
      .min(1, 'Email là bắt buộc')
      .pipe(z.email('Email không hợp lệ').max(256, 'Email tối đa 256 ký tự')),
    userName: z
      .string()
      .trim()
      .min(3, 'Tên người dùng tối thiểu 3 ký tự')
      .max(30, 'Tên người dùng tối đa 30 ký tự')
      .regex(/^[a-zA-Z0-9_]+$/, 'Tên người dùng chỉ chứa chữ cái, số và dấu gạch dưới'),
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .max(128, 'Mật khẩu tối đa 128 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu cần ít nhất 1 chữ hoa')
      .regex(/[0-9]/, 'Mật khẩu cần ít nhất 1 số')
      .regex(/[^A-Za-z0-9]/, 'Mật khẩu cần ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerFormSchema>

export type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>

export function firstErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in result)) {
      ;(result as Record<string, string>)[key] = issue.message
    }
  }
  return result
}
