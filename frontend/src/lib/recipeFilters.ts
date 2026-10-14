import type { RecipeDifficulty, RecipeQuery } from '../types/recipes'

export const difficultyLabels: Record<RecipeDifficulty, string> = {
  EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó', EXPERT: 'Chuyên gia',
}

export function parseRecipeFilters(params: URLSearchParams) {
  const errors: Record<string, string> = {}
  const query: RecipeQuery = { page: 1, pageSize: 12 }
  for (const field of ['categoryId', 'difficulty', 'maxCookTime', 'minServings', 'page', 'pageSize']) {
    if (params.getAll(field).length > 1) errors[field] = 'Tham số chỉ được xuất hiện một lần.'
  }
  const categoryId = params.get('categoryId')
  if (categoryId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)) {
      errors.categoryId = 'Danh mục không hợp lệ.'
    } else query.categoryId = categoryId
  }
  const difficulty = params.get('difficulty')?.toUpperCase()
  if (difficulty) {
    if (!Object.hasOwn(difficultyLabels, difficulty)) errors.difficulty = 'Độ khó không hợp lệ.'
    else query.difficulty = difficulty as RecipeDifficulty
  }
  for (const field of ['maxCookTime', 'minServings', 'page', 'pageSize'] as const) {
    const raw = params.get(field)
    if (raw === null || raw === '') continue
    const value = Number(raw)
    const min = field === 'maxCookTime' ? 0 : 1
    const max = field === 'pageSize' ? 50 : 2147483647
    if (!/^\d+$/.test(raw.trim()) || !Number.isInteger(value) || value < min || value > max) {
      errors[field] = field === 'pageSize'
        ? 'Số công thức mỗi trang phải từ 1 đến 50.'
        : min === 0 ? 'Nhập số nguyên từ 0 đến 2147483647.' : 'Nhập số nguyên từ 1 đến 2147483647.'
    } else query[field] = value
  }
  return { query, errors }
}
