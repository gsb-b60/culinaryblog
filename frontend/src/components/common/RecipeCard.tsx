import { ClockIcon, UsersIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader } from '../ui/card'
import { formatDate } from '../../lib/formatDate'
import type { RecipeDetail } from '../../types/recipe'

const DIFFICULTY_LABELS: Record<RecipeDetail['difficulty'], string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  EXPERT: 'Chuyên sâu',
}

/**
 * Recipe preview used by the public reading pages (landing page and list).
 * The heading level adapts to the section the card is rendered in.
 */
export function RecipeCard({
  recipe,
  headingLevel = 2,
}: {
  recipe: RecipeDetail
  headingLevel?: 2 | 3
}) {
  const totalMinutes = recipe.prepTime + recipe.cookTime
  const Heading = `h${headingLevel}` as 'h2' | 'h3'

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="bg-brand-50 text-brand-700 hover:bg-brand-100">
            {recipe.categoryName ?? 'Khác'}
          </Badge>
          {recipe.publishedAt && (
            <span className="text-xs text-surface-400">{formatDate(recipe.publishedAt)}</span>
          )}
        </div>
        <Heading className="text-lg font-semibold text-surface-900">
          <Link to={`/recipes/${recipe.slug}`} className="transition-colors hover:text-brand-700">
            {recipe.title}
          </Link>
        </Heading>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="line-clamp-3 text-sm text-surface-600">{recipe.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" aria-hidden="true" />
            {totalMinutes} phút
          </span>
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="size-3.5" aria-hidden="true" />
            {recipe.servings} người
          </span>
          <span>{DIFFICULTY_LABELS[recipe.difficulty]}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecipeCard
