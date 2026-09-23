import { CategoryFilters } from '../../../domain/repositories/ICategoryRepository.js';
import { Query } from '../../command-bus.js';

export class GetCategoriesQuery extends Query<import('../../dtos/PagedResult.js').PagedResult<import('../../dtos/CategoryDto.js').CategoryDto>> {
  readonly type = 'GetCategoriesQuery';

  constructor(
    public readonly filters: CategoryFilters,
    public readonly page: number,
    public readonly pageSize: number
  ) {
    super();
  }
}

export class GetCategoryBySlugQuery extends Query<import('../../dtos/CategoryDto.js').CategoryDetailDto | null> {
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