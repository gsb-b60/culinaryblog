import type { ManagedRecipe, RecipeStep, RecipeSteps, StepPayload } from '../types/recipe'
import { loadSession, saveSession, clearSession } from './tokenStorage'
import type {
  AuthResponse,
  LoginPayload,
  ProblemDetails,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
} from '../types/auth'

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'

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

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  let res: Response
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }

  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers })
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

    if (res.status === 401 && 'Authorization' in headers && !retried && path !== '/auth/refresh') {
      const session = loadSession()
      if (session) {
        try {
          const rotated = await refresh(session.refreshToken)
          saveSession(rotated)
          headers.Authorization = `Bearer ${rotated.accessToken}`
          return request<T>(path, { ...init, headers }, true)
        } catch {
          clearSession()
        }
      }
    }

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

export function refresh(refreshToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export function getCurrentUser(accessToken: string): Promise<UserProfile> {
  return request<UserProfile>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function updateProfile(
  accessToken: string,
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  return request<UserProfile>('/auth/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

export function logout(accessToken: string, refreshToken: string): Promise<null> {
  return request<null>('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refreshToken }),
  })
}

export function getManagedRecipes(accessToken: string): Promise<ManagedRecipe[]> {
  return request('/recipes/managed', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
export function publishRecipe(accessToken: string, recipeId: string): Promise<{ message: string }> {
  return request(`/recipes/${encodeURIComponent(recipeId)}/publish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
export function unpublishRecipe(
  accessToken: string,
  recipeId: string,
): Promise<{ message: string }> {
  return request(`/recipes/${encodeURIComponent(recipeId)}/unpublish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
export function getRecipeSteps(accessToken: string, recipeId: string): Promise<RecipeSteps> {
  return request(`/recipes/${encodeURIComponent(recipeId)}/steps`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
export function addRecipeStep(
  accessToken: string,
  recipeId: string,
  payload: StepPayload,
): Promise<RecipeStep> {
  return request(`/recipes/${encodeURIComponent(recipeId)}/steps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}
export function updateRecipeStep(
  accessToken: string,
  recipeId: string,
  stepId: string,
  payload: StepPayload,
): Promise<RecipeStep> {
  return request(`/recipes/${encodeURIComponent(recipeId)}/steps/${encodeURIComponent(stepId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}
export function deleteRecipeStep(
  accessToken: string,
  recipeId: string,
  stepId: string,
): Promise<null> {
  return request(`/recipes/${encodeURIComponent(recipeId)}/steps/${encodeURIComponent(stepId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
