import { loadSession, saveSession, clearSession } from './tokenStorage'
import type { AuthResponse, LoginPayload, ProblemDetails, RegisterPayload, UpdateProfilePayload, UserProfile } from '../types/auth'
import type {
  Category,
  CategoryDetail,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types/category'
import type {
  CreateIngredientPayload,
  CreateRecipePayload,
  CreateStepPayload,
  PagedRecipes,
  RecipeDetail,
  RecipeListQuery,
  UpdateRecipePayload,
} from '../types/recipe'
import { env } from '../config/env'

export const API_BASE: string = env.VITE_API_BASE_URL

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

export { request as apiRequest }

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

export function updateProfile(accessToken: string, payload: UpdateProfilePayload): Promise<UserProfile> {
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

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function listRecipes(query: RecipeListQuery = {}): Promise<PagedRecipes> {
  return request<PagedRecipes>(`/recipes${toQuery(query as Record<string, string | number | boolean | undefined>)}`)
}

export function searchRecipes(q: string, query: Omit<RecipeListQuery, 'searchQuery'> = {}): Promise<PagedRecipes> {
  return request<PagedRecipes>(`/recipes/search${toQuery({ q, ...query })}`)
}

export function getRecipeBySlug(slug: string, accessToken?: string): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/recipes/${encodeURIComponent(slug)}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  })
}

export function createRecipe(accessToken: string, payload: CreateRecipePayload): Promise<{ id: string }> {
  return request<{ id: string }>('/recipes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

export function updateRecipe(accessToken: string, id: string, payload: UpdateRecipePayload, version?: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/recipes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(version !== undefined ? { 'If-Match': String(version) } : {}),
    },
    body: JSON.stringify(payload),
  })
}

export function publishRecipe(accessToken: string, id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/recipes/${encodeURIComponent(id)}/publish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function unpublishRecipe(accessToken: string, id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/recipes/${encodeURIComponent(id)}/unpublish`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function archiveRecipe(accessToken: string, id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/recipes/${encodeURIComponent(id)}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function deleteRecipe(accessToken: string, id: string): Promise<null> {
  return request<null>(`/recipes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function addRecipeStep(accessToken: string, id: string, payload: CreateStepPayload): Promise<{ id: string }> {
  return request<{ id: string }>(`/recipes/${encodeURIComponent(id)}/steps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

export function addRecipeIngredient(accessToken: string, id: string, payload: CreateIngredientPayload): Promise<{ id: string }> {
  return request<{ id: string }>(`/recipes/${encodeURIComponent(id)}/ingredients`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

export function listCategories(): Promise<Category[]> {
  return request<Category[]>('/categories')
}

export function getCategoryBySlug(slug: string, page = 1, pageSize = 12): Promise<CategoryDetail> {
  return request<CategoryDetail>(`/categories/${encodeURIComponent(slug)}${toQuery({ page, pageSize })}`)
}

export function createCategory(accessToken: string, payload: CreateCategoryPayload): Promise<{ id: string }> {
  return request<{ id: string }>('/categories', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

export function updateCategory(accessToken: string, id: string, payload: UpdateCategoryPayload): Promise<{ message: string }> {
  return request<{ message: string }>(`/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

export function deleteCategory(accessToken: string, id: string): Promise<null> {
  return request<null>(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
