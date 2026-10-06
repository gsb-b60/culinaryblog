export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export interface ManagedRecipe {
  id: string
  title: string
  authorId: string
  status: RecipeStatus
}
export interface RecipeStep {
  id: string
  stepNumber: number
  title: string
  description: string
  timerMinutes?: number
  imageUrl?: string
}
export interface StepPayload {
  title: string
  description: string
  timerMinutes?: number
  imageUrl?: string
}
export interface RecipeSteps {
  recipe: ManagedRecipe
  steps: RecipeStep[]
}
