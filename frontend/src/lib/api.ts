export interface AuthUser {
  id: string
  fullName: string
  userName: string
  email: string
  roles: string[]
  avatarUrl: string | null
}

export interface RegisterResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: AuthUser
}

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number

  readonly type: string

  readonly detail: string

  readonly errors?: Record<string, string[]>

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.status = problem.status
    this.type = problem.type
    this.detail = problem.detail ?? problem.title
    this.errors = problem.errors
  }
}

export interface RegisterInput {
  fullName: string
  email: string
  userName: string
  password: string
}

export function saveTokens(data: Pick<RegisterResponse, 'accessToken' | 'refreshToken'>): void {
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  let response: Response
  try {
    response = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new ApiError({
      type: 'NETWORK_ERROR',
      title: 'Network Error',
      status: 0,
      detail: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
    })
  }

  const body = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    throw new ApiError(
      (body as ProblemDetails | null) ?? {
        type: 'about:blank',
        title: 'Request failed',
        status: response.status,
        detail: 'Yêu cầu thất bại. Vui lòng thử lại.',
      },
    )
  }

  const result = body as RegisterResponse
  saveTokens(result)
  return result
}
