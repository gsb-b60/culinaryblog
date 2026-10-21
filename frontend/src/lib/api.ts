import type { RecipeIngredient } from '../types/recipe'
import { loadSession, saveSession, clearSession } from './tokenStorage'
import type { Recipe, RecipePage } from '../types/recipe'
import type {
  AuthResponse,
  LoginPayload,
  ProblemDetails,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
} from '../types/auth'
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

  /** Retain the HTTP status and parsed problem details for API error handling. */
  constructor(status: number, detail: string, problem: ProblemDetails | null) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

/** Send JSON requests, translate problem responses and retry once after token refresh. */
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
        } catch {
          clearSession()
          throw new ApiError(res.status, detail, problem)
        }
        // A business error from the retried request must not clear a refreshed session.
        return request<T>(path, { ...init, headers }, true)
      }
    }

    throw new ApiError(res.status, detail, problem)
  }

  return body as T
}

/** Create an author account and return its initial session. */
export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Authenticate email and password and return an application session. */
export function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Exchange a Google identity token for an application session. */
export function googleLogin(idToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
}

/** Rotate the supplied refresh token and return replacement credentials. */
export function refresh(refreshToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

/** Fetch the authenticated account profile. */
export function getCurrentUser(accessToken: string): Promise<UserProfile> {
  return request<UserProfile>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/** Persist changes to the authenticated account profile. */
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

/** Load a cancellable page of recipes the account may manage, with 12 items per page. */
export function getManagedRecipes(
  accessToken: string,
  page = 1,
  signal?: AbortSignal,
): Promise<RecipePage> {
  return request<RecipePage>('/recipes/manage?page=' + page + '&pageSize=12', {
    headers: { Authorization: 'Bearer ' + accessToken },
    signal,
  })
}

/** Publish an authorized recipe after backend publication validation. */
export function publishRecipe(accessToken: string, id: string): Promise<Recipe> {
  return request<Recipe>('/recipes/' + encodeURIComponent(id) + '/publish', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + accessToken },
  })
}

/** Return an authorized published recipe to draft status. */
export function unpublishRecipe(accessToken: string, id: string): Promise<Recipe> {
  return request<Recipe>('/recipes/' + encodeURIComponent(id) + '/unpublish', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + accessToken },
  })
}

/** Invalidate the supplied refresh token for the authenticated session. */
export function logout(accessToken: string, refreshToken: string): Promise<null> {
  return request<null>('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refreshToken }),
  })
}

/** Encode defined nonempty filters and pagination values in a query string. */
function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/** Fetch public recipes with filters, sorting and pagination. */
export function listRecipes(query: RecipeListQuery = {}): Promise<PagedRecipes> {
  return request<PagedRecipes>(
    `/recipes${toQuery(query as Record<string, string | number | boolean | undefined>)}`,
  )
}

/** Search public recipes with the supplied filters and pagination. */
export function searchRecipes(
  q: string,
  query: Omit<RecipeListQuery, 'searchQuery'> = {},
): Promise<PagedRecipes> {
  return request<PagedRecipes>(`/recipes/search${toQuery({ q, ...query })}`)
}

/** Fetch recipe details by slug, optionally including account credentials. */
export function getRecipeBySlug(slug: string, accessToken?: string): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/recipes/${encodeURIComponent(slug)}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  })
}

/** Create a recipe owned by the authenticated author. */
export function createRecipe(
  accessToken: string,
  payload: CreateRecipePayload,
): Promise<{ id: string }> {
  return request<{ id: string }>('/recipes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

/** Persist editable recipe fields under backend ownership checks. */
export function updateRecipe(
  accessToken: string,
  id: string,
  payload: UpdateRecipePayload,
  version?: number,
): Promise<{ message: string }> {
  return request<{ message: string }>(`/recipes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(version !== undefined ? { 'If-Match': String(version) } : {}),
    },
    body: JSON.stringify(payload),
  })
}

/** Archive an authorized recipe through its lifecycle endpoint. */
export function archiveRecipe(accessToken: string, id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/recipes/${encodeURIComponent(id)}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/** Request soft deletion of an authorized recipe. */
export function deleteRecipe(accessToken: string, id: string): Promise<null> {
  return request<null>(`/recipes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/** Append a validated cooking step with backend-assigned numbering. */
export function addRecipeStep(
  accessToken: string,
  id: string,
  payload: CreateStepPayload,
): Promise<{ id: string }> {
  return request<{ id: string }>(`/recipes/${encodeURIComponent(id)}/steps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

/** Create an ingredient bound to the authorized recipe and return its saved DTO. */
export function addRecipeIngredient(
  accessToken: string,
  id: string,
  payload: CreateIngredientPayload,
): Promise<RecipeIngredient> {
  return request<RecipeIngredient>(`/recipes/${encodeURIComponent(id)}/ingredients`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

/** Fetch available categories for recipe browsing and editing. */
export function listCategories(): Promise<Category[]> {
  return request<Category[]>('/categories')
}

/** Fetch a category and its paginated public recipes by slug. */
export function getCategoryBySlug(slug: string, page = 1, pageSize = 12): Promise<CategoryDetail> {
  return request<CategoryDetail>(
    `/categories/${encodeURIComponent(slug)}${toQuery({ page, pageSize })}`,
  )
}

/** Create a category using administrator authorization. */
export function createCategory(
  accessToken: string,
  payload: CreateCategoryPayload,
): Promise<{ id: string }> {
  return request<{ id: string }>('/categories', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

/** Update category fields using administrator authorization. */
export function updateCategory(
  accessToken: string,
  id: string,
  payload: UpdateCategoryPayload,
): Promise<{ message: string }> {
  return request<{ message: string }>(`/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
}

/** Request category deletion using administrator authorization. */
export function deleteCategory(accessToken: string, id: string): Promise<null> {
  return request<null>(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/** Fetch active ingredients for an authorized recipe, allowing request cancellation. */
export function getRecipeIngredients(
  accessToken: string,
  recipeId: string,
  signal?: AbortSignal,
): Promise<RecipeIngredient[]> {
  return request(`/recipes/${encodeURIComponent(recipeId)}/ingredients`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  })
}

/** Persist edited fields of an ingredient bound to its authorized recipe. */
export function updateRecipeIngredient(
  accessToken: string,
  recipeId: string,
  ingredientId: string,
  payload: Partial<CreateIngredientPayload>,
): Promise<RecipeIngredient> {
  return request(
    `/recipes/${encodeURIComponent(recipeId)}/ingredients/${encodeURIComponent(ingredientId)}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    },
  )
}

/** Delete an ingredient bound to its authorized recipe; success has no response body. */
export function deleteRecipeIngredient(
  accessToken: string,
  recipeId: string,
  ingredientId: string,
): Promise<null> {
  return request(
    `/recipes/${encodeURIComponent(recipeId)}/ingredients/${encodeURIComponent(ingredientId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )
}
