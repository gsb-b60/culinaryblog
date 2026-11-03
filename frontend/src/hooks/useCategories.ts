import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createCategory, deleteCategory, getCategoryBySlug, listCategories, updateCategory } from '../lib/api'
import { queryKeys } from '../lib/queryClient'
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../types/category'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: listCategories,
    staleTime: 15 * 60 * 1000,
  })
}

export function useCategoryDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.categoryDetail(slug),
    queryFn: () => getCategoryBySlug(slug),
    enabled: slug.length > 0,
  })
}

export function useCreateCategory(accessToken: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(accessToken, payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.categories() })
    },
  })
}

export function useUpdateCategory(accessToken: string, id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCategoryPayload) => updateCategory(accessToken, id, payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.categories() })
    },
  })
}

export function useDeleteCategory(accessToken: string, id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => deleteCategory(accessToken, id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.categories() })
    },
  })
}
