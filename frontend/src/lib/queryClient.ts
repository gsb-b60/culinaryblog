import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

export const queryKeys = {
  recipes: (params?: Record<string, unknown>) => ['recipes', params ?? {}] as const,
  recipeDetail: (slug: string) => ['recipes', slug] as const,
  recipeSearch: (q: string, params?: Record<string, unknown>) => ['recipes', 'search', q, params ?? {}] as const,
  categories: () => ['categories'] as const,
  categoryDetail: (slug: string) => ['categories', slug] as const,
  currentUser: () => ['auth', 'me'] as const,
}
