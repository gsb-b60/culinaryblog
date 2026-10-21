import { z } from 'zod';

import { RecipeDifficulty } from '../../domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../../domain/enums/RecipeStatus.js';

export const createRecipeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  timerMinutes: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().max(500).optional(),
});

export const createRecipeIngredientSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().positive().max(999999.999).optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  orderIndex: z.number().int().nonnegative().default(0),
});

export const createRecipeSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  categoryId: z.string().uuid(),
  prepTime: z.number().int().positive(),
  cookTime: z.number().int().nonnegative(),
  servings: z.number().int().positive(),
  difficulty: z.nativeEnum(RecipeDifficulty).default(RecipeDifficulty.EASY),
  instructions: z.string().max(10000).optional(),
  nutrition: z.object({
    calories: z.number().positive().max(999999.99).optional(),
    protein: z.number().positive().max(999999.99).optional(),
    carbohydrates: z.number().positive().max(999999.99).optional(),
    fat: z.number().positive().max(999999.99).optional(),
    fiber: z.number().positive().max(999999.99).optional(),
    sodium: z.number().positive().max(999999.99).optional(),
  }).optional(),
  steps: z.array(createRecipeStepSchema).min(1).optional(),
  ingredients: z.array(createRecipeIngredientSchema).min(1).optional(),
});

export const updateRecipeSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  categoryId: z.string().uuid().optional(),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().nonnegative().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.nativeEnum(RecipeDifficulty).optional(),
  instructions: z.string().max(10000).optional(),
  nutrition: z.object({
    calories: z.number().positive().max(999999.99).optional(),
    protein: z.number().positive().max(999999.99).optional(),
    carbohydrates: z.number().positive().max(999999.99).optional(),
    fat: z.number().positive().max(999999.99).optional(),
    fiber: z.number().positive().max(999999.99).optional(),
    sodium: z.number().positive().max(999999.99).optional(),
  }).optional(),
});

export const recipeFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  difficulty: z.nativeEnum(RecipeDifficulty).optional(),
  status: z.nativeEnum(RecipeStatus).optional(),
  authorId: z.string().uuid().optional(),
  minPrepTime: z.number().int().nonnegative().optional(),
  maxPrepTime: z.number().int().nonnegative().optional(),
  minCookTime: z.number().int().nonnegative().optional(),
  maxCookTime: z.number().int().nonnegative().optional(),
  searchQuery: z.string().min(2).optional(),
});

export const recipeSortSchema = z.object({
  field: z.enum(['createdAt', 'title', 'prepTime', 'cookTime', 'publishedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(12),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type RecipeFiltersInput = z.infer<typeof recipeFiltersSchema>;
export type RecipeSortInput = z.infer<typeof recipeSortSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;