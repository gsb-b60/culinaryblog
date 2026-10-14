import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository.js';
import { IQueryHandler } from '../command-bus.js';
import { CategoryDto } from '../dtos/CategoryDto.js';
import { PagedResult } from '../dtos/PagedResult.js';
import { GetCategoriesQuery } from '../queries/categories/CategoryQueries.js';

export class GetCategoriesQueryHandler
implements IQueryHandler<GetCategoriesQuery, PagedResult<CategoryDto>> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  execute(query: GetCategoriesQuery): Promise<PagedResult<CategoryDto>> {
    return this.categoryRepository.findMany(query.filters, query.page, query.pageSize);
  }
}
