import { loadSession, saveSession, clearSession } from './tokenStorage'
import type { AuthResponse, LoginPayload, ProblemDetails, RegisterPayload, UpdateProfilePayload, UserProfile } from '../types/auth'

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export interface RecipeSummary {
  id: string
  title: string
  slug: string
  description: string
  status: string
  createdAt: string
  categoryName?: string
  authorName?: string
}

export interface RecipeIngredient {
  id: string
  name: string
  quantity?: number
  unit?: string
  notes?: string
  orderIndex: number
}

export interface RecipeIngredientInput {
  name: string
  quantity?: number
  unit?: string
  notes?: string
  orderIndex?: number
}

export interface PagedResult<T> {
  items: T[]
  meta: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

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

export function getRecipes(page = 1, pageSize = 5): Promise<PagedResult<RecipeSummary>> {
  const query = new URLSearchParams({
    status: 'PUBLISHED',
    page: String(page),
    pageSize: String(pageSize),
  })
  return request<PagedResult<RecipeSummary>>(`/recipes?${query.toString()}`)
}

export function getManageableRecipes(
  accessToken: string,
  page = 1,
  pageSize = 50,
): Promise<PagedResult<RecipeSummary>> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  return request<PagedResult<RecipeSummary>>(`/recipes/manageable?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getRecipeIngredients(
  accessToken: string,
  recipeId: string,
): Promise<RecipeIngredient[]> {
  return request<RecipeIngredient[]>(`/recipes/${encodeURIComponent(recipeId)}/ingredients`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function addRecipeIngredient(
  accessToken: string,
  recipeId: string,
  input: RecipeIngredientInput,
): Promise<RecipeIngredient> {
  return request<RecipeIngredient>(`/recipes/${encodeURIComponent(recipeId)}/ingredients`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  })
}

export function updateRecipeIngredient(
  accessToken: string,
  recipeId: string,
  ingredientId: string,
  input: RecipeIngredientInput,
): Promise<RecipeIngredient> {
  return request<RecipeIngredient>(
    `/recipes/${encodeURIComponent(recipeId)}/ingredients/${encodeURIComponent(ingredientId)}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    },
  )
}

export function deleteRecipeIngredient(
  accessToken: string,
  recipeId: string,
  ingredientId: string,
): Promise<null> {
  return request<null>(
    `/recipes/${encodeURIComponent(recipeId)}/ingredients/${encodeURIComponent(ingredientId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )
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
