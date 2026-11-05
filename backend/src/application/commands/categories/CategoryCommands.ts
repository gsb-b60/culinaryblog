import { Command } from '../../command-bus.js';
import { CategoryDto, CreateCategoryInput, UpdateCategoryInput } from '../../dtos/CategoryDto.js';

export class CreateCategoryCommand extends Command<CategoryDto> {
  readonly type = 'CreateCategoryCommand';

  constructor(public readonly input: CreateCategoryInput) {
    super();
  }
}

export class UpdateCategoryCommand extends Command<void> {
  readonly type = 'UpdateCategoryCommand';

  constructor(
    public readonly categoryId: string,
    public readonly input: UpdateCategoryInput
  ) {
    super();
  }
}

export class DeleteCategoryCommand extends Command<void> {
  readonly type = 'DeleteCategoryCommand';

  constructor(public readonly categoryId: string) {
    super();
  }
}
