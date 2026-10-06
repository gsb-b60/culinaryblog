import { PrismaClient } from '@prisma/client';

import { ForbiddenError, NotFoundError } from '../../config-middleware/shared/errors/AppError.js';
import { Query, type IQueryHandler } from '../command-bus.js';
import { type RecipeStepDto } from '../dtos/RecipeDto.js';

export interface ManagedRecipeDto {
  id: string;
  title: string;
  authorId: string;
  status: string;
}
export interface RecipeStepsDto {
  recipe: ManagedRecipeDto;
  steps: RecipeStepDto[];
}

export class GetManagedRecipesQuery extends Query<ManagedRecipeDto[]> {
  readonly type = 'GetManagedRecipesQuery';

  constructor(
    public readonly userId: string,
    public readonly isAdmin: boolean,
  ) {
    super();
  }
}
export class GetRecipeStepsQuery extends Query<RecipeStepsDto> {
  readonly type = 'GetRecipeStepsQuery';

  constructor(
    public readonly recipeId: string,
    public readonly userId: string,
    public readonly isAdmin: boolean,
  ) {
    super();
  }
}
export class GetManagedRecipesQueryHandler implements IQueryHandler<
  GetManagedRecipesQuery,
  ManagedRecipeDto[]
> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetManagedRecipesQuery): Promise<ManagedRecipeDto[]> {
    return this.prisma.recipe.findMany({
      where: { isDeleted: false, ...(query.isAdmin ? {} : { authorId: query.userId }) },
      select: { id: true, title: true, authorId: true, status: true },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
export class GetRecipeStepsQueryHandler implements IQueryHandler<
  GetRecipeStepsQuery,
  RecipeStepsDto
> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetRecipeStepsQuery): Promise<RecipeStepsDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: query.recipeId, isDeleted: false },
      select: {
        id: true,
        title: true,
        authorId: true,
        status: true,
        steps: {
          where: { isDeleted: false },
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
    if (!recipe) throw new NotFoundError('Recipe');
    if (!query.isAdmin && recipe.authorId !== query.userId)
      throw new ForbiddenError('You are not allowed to manage this recipe');
    return {
      recipe: {
        id: recipe.id,
        title: recipe.title,
        authorId: recipe.authorId,
        status: recipe.status,
      },
      steps: recipe.steps.map((step) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        title: step.title,
        description: step.description,
        timerMinutes: step.timerMinutes ?? undefined,
        imageUrl: step.imageUrl ?? undefined,
      })),
    };
  }
}
