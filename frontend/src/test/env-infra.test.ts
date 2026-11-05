import { describe, expect, it } from 'vitest'

import { env } from '../config/env'
import { cn } from '../lib/cn'
import { queryKeys, queryClient } from '../lib/queryClient'
import { formatDate, formatRelative } from '../lib/formatDate'

describe('frontend environment', () => {
  it('provides a versioned API base URL', () => {
    expect(env.VITE_API_BASE_URL).toMatch(/\/api\/v1$/)
  })
})

describe('cn utility', () => {
  it('merges conflicting tailwind classes', () => {
    const activeClass = (active: boolean): string => cn('text-red-500', active && 'font-bold')
    expect(cn('px-2 px-4')).toBe('px-4')
    expect(activeClass(true)).toContain('font-bold')
    expect(activeClass(false)).not.toContain('font-bold')
  })
})

describe('query client', () => {
  it('uses 5min stale time and exposes stable keys', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000)
    expect(queryKeys.recipes({ page: 1 })[0]).toBe('recipes')
    expect(queryKeys.recipeDetail('pho-bo')).toEqual(['recipes', 'pho-bo'])
    expect(queryKeys.categories()).toEqual(['categories'])
  })
})

describe('date formatting', () => {
  it('formats ISO dates', () => {
    expect(formatDate(new Date(2026, 0, 2, 12).toISOString(), 'yyyy-MM-dd')).toBe('2026-01-02')
    expect(formatRelative('2026-01-01T00:00:00.000Z')).toMatch(/ago|trước|ngày|day|year/i)
  })
})
