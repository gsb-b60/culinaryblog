import { z } from 'zod'

import { firstErrors } from './register'

/**
 * Login intentionally has no password strength rules — those are enforced at
 * registration time (FR-AUTH-002). It also never trims the password, so
 * accounts whose password has meaningful leading/trailing spaces still work.
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email là bắt buộc')
    .pipe(z.email('Email không hợp lệ').max(256, 'Email tối đa 256 ký tự')),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .max(128, 'Mật khẩu tối đa 128 ký tự'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export type LoginFieldErrors = Partial<Record<keyof LoginFormValues, string>>

export { firstErrors }
