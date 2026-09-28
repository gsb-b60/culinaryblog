import type { AuthResponse, LoginPayload, ProblemDetails, RegisterPayload } from '../types/auth'

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'

/**
 * Entry point for the OAuth 2.0 redirect flow, used when the Google Identity
 * Services button cannot render (Firefox and other blocking browsers).
 */
export const GOOGLE_OAUTH_REDIRECT_URL = `${API_BASE}/auth/google/redirect`

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | null

  constructor(status: number, detail: string, problem: ProblemDetails | null) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Không thể kết nối máy chủ. Vui lòng thử lại.', null)
  }

  let body: unknown = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }

  if (!res.ok) {
    const problem = (body ?? null) as ProblemDetails | null
    const detail = problem?.detail ?? `Yêu cầu thất bại (HTTP ${res.status})`
    throw new ApiError(res.status, detail, problem)
  }

  return body as T
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function googleLogin(idToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
}
