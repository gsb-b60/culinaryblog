export interface PageMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PagedResult<T> {
  items: T[]
  meta: PageMeta
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface SortParams {
  field?: 'createdAt' | 'title' | 'prepTime' | 'cookTime' | 'publishedAt'
  order?: 'asc' | 'desc'
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}
