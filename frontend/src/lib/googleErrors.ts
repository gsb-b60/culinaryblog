import type { AuthResponse } from '../types/auth'

/**
 * Application error codes the API can return for a failed Google sign-in,
 * mapped to copy the user can act on. Keyed on the RFC 7807 `type`, which the
 * backend uses, so these do not depend on the server's message strings.
 */
export const GOOGLE_ERROR_MESSAGES: Record<string, { title: string; detail: string }> = {
  AUTH_ACCOUNT_NOT_REGISTERED: {
    title: 'Bạn chưa có tài khoản',
    detail:
      'Hãy đăng ký bằng email và mật khẩu trước, rồi quay lại đăng nhập bằng Google với đúng email đó.',
  },
  AUTH_ACCOUNT_DISABLED: {
    title: 'Tài khoản đã bị vô hiệu hóa',
    detail: 'Vui lòng liên hệ quản trị viên nếu cần trợ giúp.',
  },
  AUTH_ACCOUNT_LOCKED: {
    title: 'Tài khoản tạm thời bị khóa',
    detail: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.',
  },
  GOOGLE_AUTH_DENIED: {
    title: 'Đã hủy đăng nhập Google',
    detail: 'Bạn đã từ chối cho phép truy cập. Hãy thử lại nếu muốn đăng nhập bằng Google.',
  },
  AUTH_GOOGLE_INVALID_STATE: {
    title: 'Yêu cầu đăng nhập không hợp lệ',
    detail: 'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại từ đầu.',
  },
  AUTH_GOOGLE_CODE_EXCHANGE_FAILED: {
    title: 'Không hoàn tất được đăng nhập Google',
    detail: 'Không thể đổi mã ủy quyền. Vui lòng thử lại, hoặc đăng nhập bằng email và mật khẩu.',
  },
  AUTH_GOOGLE_MISSING_CODE: {
    title: 'Không nhận được mã ủy quyền',
    detail: 'Google không gửi mã ủy quyền. Vui lòng thử lại.',
  },
  AUTH_GOOGLE_INVALID_TOKEN: {
    title: 'Token Google không hợp lệ',
    detail: 'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.',
  },
  AUTH_GOOGLE_UNVERIFIED_EMAIL: {
    title: 'Email Google chưa được xác minh',
    detail: 'Hãy xác minh email trong tài khoản Google rồi thử lại.',
  },
  AUTH_GOOGLE_INVALID_PROFILE: {
    title: 'Thông tin Google không đầy đủ',
    detail: 'Tài khoản Google không cung cấp email. Vui lòng thử tài khoản khác.',
  },
  AUTH_GOOGLE_UNAVAILABLE: {
    title: 'Dịch vụ Google đang gặp sự cố',
    detail: 'Vui lòng thử lại sau hoặc đăng nhập bằng email và mật khẩu.',
  },
  AUTH_GOOGLE_NOT_CONFIGURED: {
    title: 'Đăng nhập Google chưa được cấu hình',
    detail: 'Vui lòng đăng nhập bằng email và mật khẩu.',
  },
}

const GENERIC = {
  title: 'Đăng nhập Google thất bại',
  detail: 'Không thể hoàn tất đăng nhập bằng Google. Vui lòng thử lại hoặc dùng email và mật khẩu.',
}

/** True when the user needs to register before they can sign in. */
export function requiresRegistration(code: string | null | undefined): boolean {
  return code === 'AUTH_ACCOUNT_NOT_REGISTERED'
}

export function describeGoogleErrorCode(code: string | null | undefined): {
  title: string
  detail: string
} {
  if (!code) {
    return GENERIC
  }
  return GOOGLE_ERROR_MESSAGES[code] ?? GENERIC
}

/**
 * Reads `?error=` from a URL and strips it, so a refresh does not replay the
 * banner and the code does not linger in the address bar.
 */
export function consumeGoogleErrorCode(): string | null {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('error')
  if (!code) {
    return null
  }
  params.delete('error')
  params.delete('status')
  const query = params.toString()
  const next = `${window.location.pathname}${query ? `?${query}` : ''}`
  window.history.replaceState(null, '', next)
  return code
}

/** Session shape produced by the OAuth callback fragment, re-exported for tests. */
export type GoogleCallbackSession = AuthResponse
