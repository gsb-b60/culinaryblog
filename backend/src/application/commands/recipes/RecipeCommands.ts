import { Command } from '../../command-bus.js';
import { CreateRecipeInput, RecipeSummaryDto, UpdateRecipeInput } from '../../dtos/RecipeDto.js';

export class CreateRecipeCommand extends Command<string> {
  readonly type = 'CreateRecipeCommand';

  constructor(
    public readonly authorId: string,
    public readonly input: CreateRecipeInput,
  ) {
    super();
  }
}

export class UpdateRecipeCommand extends Command<void> {
  readonly type = 'UpdateRecipeCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
    public readonly input: UpdateRecipeInput,
    public readonly expectedVersion: number,
  ) {
    super();
  }
}

export class PublishRecipeCommand extends Command<RecipeSummaryDto> {
  readonly type = 'PublishRecipeCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
  ) {
    super();
  }
}

export class UnpublishRecipeCommand extends Command<RecipeSummaryDto> {
  readonly type = 'UnpublishRecipeCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
  ) {
    super();
  }
}

export class ArchiveRecipeCommand extends Command<void> {
  readonly type = 'ArchiveRecipeCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
  ) {
    super();
  }
}

export class DeleteRecipeCommand extends Command<void> {
  readonly type = 'DeleteRecipeCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
  ) {
    super();
  }
}

export class AddRecipeStepCommand extends Command<string> {
  readonly type = 'AddRecipeStepCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly timerMinutes?: number,
    public readonly imageUrl?: string,
  ) {
    super();
  }
}

export class UpdateRecipeStepCommand extends Command<void> {
  readonly type = 'UpdateRecipeStepCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
    public readonly stepId: string,
    public readonly stepNumber?: number,
    public readonly title?: string,
    public readonly description?: string,
    public readonly timerMinutes?: number,
    public readonly imageUrl?: string,
  ) {
    super();
  }
}

export class DeleteRecipeStepCommand extends Command<void> {
  readonly type = 'DeleteRecipeStepCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
    public readonly stepId: string,
  ) {
    super();
  }
}

export class AddRecipeIngredientCommand extends Command<string> {
  readonly type = 'AddRecipeIngredientCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
    public readonly name: string,
    public readonly quantity?: number,
    public readonly unit?: string,
    public readonly notes?: string,
    public readonly orderIndex: number = 0,
  ) {
    super();
  }
}

export class UpdateRecipeIngredientCommand extends Command<void> {
  readonly type = 'UpdateRecipeIngredientCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
    public readonly ingredientId: string,
    public readonly name?: string,
    public readonly quantity?: number,
    public readonly unit?: string,
    public readonly notes?: string,
    public readonly orderIndex?: number,
  ) {
    super();
  }
}

export class DeleteRecipeIngredientCommand extends Command<void> {
  readonly type = 'DeleteRecipeIngredientCommand';

  constructor(
    public readonly recipeId: string,
    public readonly authorId: string,
    public readonly ingredientId: string,
  ) {
    super();
  }
}
