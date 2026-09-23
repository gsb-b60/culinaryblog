import { Query } from '../command-bus.js';
import { CategoryDto } from '../../dtos/CategoryDto.js';

export class GetCategoriesQuery extends Query<CategoryDto[]> {
  readonly type = 'GetCategoriesQuery';

  constructor() {
    super();
  }
}

export class GetCategoryBySlugQuery extends Query<import('../dtos/CategoryDto.js').CategoryDetailDto | null> {
  readonly type = 'GetCategoryBySlugQuery';

  constructor(
    public readonly slug: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 10,
    public readonly userId?: string,
    public readonly userRole?: string
  ) {
    super();
  }
}
