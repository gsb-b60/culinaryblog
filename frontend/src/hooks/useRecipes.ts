import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveRecipe,
  createRecipe,
  deleteRecipe,
  getRecipeBySlug,
  listRecipes,
  publishRecipe,
  searchRecipes,
  unpublishRecipe,
  updateRecipe,
} from '../lib/api'
import { queryKeys } from '../lib/queryClient'
import type { CreateRecipePayload, RecipeListQuery, UpdateRecipePayload } from '../types/recipe'

export function useRecipes(query: RecipeListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.recipes(query as Record<string, unknown>),
    queryFn: () => listRecipes(query),
  })
}

export function useRecipeDetail(slug: string, accessToken?: string) {
  return useQuery({
    queryKey: queryKeys.recipeDetail(slug),
    queryFn: () => getRecipeBySlug(slug, accessToken),
    enabled: slug.length > 0,
  })
}

export function useRecipeSearch(q: string, query: Omit<RecipeListQuery, 'searchQuery'> = {}) {
  return useQuery({
    queryKey: queryKeys.recipeSearch(q, query as Record<string, unknown>),
    queryFn: () => searchRecipes(q, query),
    enabled: q.length >= 2,
  })
}

export function useCreateRecipe(accessToken: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRecipePayload) => createRecipe(accessToken, payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useUpdateRecipe(accessToken: string, id: string, version?: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateRecipePayload) => updateRecipe(accessToken, id, payload, version),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function usePublishRecipe(accessToken: string, id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => publishRecipe(accessToken, id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useUnpublishRecipe(accessToken: string, id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => unpublishRecipe(accessToken, id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useArchiveRecipe(accessToken: string, id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => archiveRecipe(accessToken, id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useDeleteRecipe(accessToken: string, id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => deleteRecipe(accessToken, id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
