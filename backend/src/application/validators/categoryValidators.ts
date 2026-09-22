import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().max(500).optional(),
  orderIndex: z.number().int().nonnegative().default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().max(500).optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const categoryFiltersSchema = z.object({
  searchQuery: z.string().min(2).optional(),
});

export const categoryPaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryFiltersInput = z.infer<typeof categoryFiltersSchema>;
export type CategoryPaginationInput = z.infer<typeof categoryPaginationSchema>;