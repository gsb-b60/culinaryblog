import { PrismaClient } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../../config-middleware/shared/errors/AppError.js';
import { cacheService } from '../../infrastructure/cache/RedisCacheService.js';
import { ICommandHandler } from '../command-bus.js';
import { ArchiveRecipeCommand } from '../commands/recipes/RecipeCommands.js';

export class ArchiveRecipeCommandHandler implements ICommandHandler<ArchiveRecipeCommand, void> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: Pick<typeof cacheService, 'delete' | 'deletePattern'> = cacheService,
  ) {}

  async execute(command: ArchiveRecipeCommand): Promise<void> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: command.recipeId, isDeleted: false },
    });
    if (!recipe) throw new NotFoundError('Recipe');
    if (!command.isAdmin && recipe.authorId !== command.authorId) {
      throw new ForbiddenError('You can only archive your own recipes');
    }

    // Repeating archive is safe; retain all content and publishedAt.
    if (recipe.status !== 'ARCHIVED') {
      await this.prisma.recipe.update({
        where: {
          id: recipe.id,
          isDeleted: false,
          ...(!command.isAdmin ? { authorId: command.authorId } : {}),
        },
        data: { status: 'ARCHIVED', version: { increment: 1 } },
      });
    }

    // Invalidate after persistence, including repeated requests after a retry.
    await Promise.all([
      this.cache.delete(`recipe:${recipe.id}`),
      this.cache.delete(`recipe:${recipe.slug}`),
      this.cache.deletePattern('recipe:*'),
      this.cache.deletePattern('recipes:*'),
      this.cache.deletePattern('categories:*'),
      this.cache.deletePattern('sitemap:*'),
    ]);
  }
}
