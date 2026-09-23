import { PagedResult } from '../../application/dtos/PagedResult.js';
import { Category } from '../entities/Category.js';

export interface CategoryFilters {
  searchQuery?: string;
}

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findMany(
    filters: CategoryFilters,
    page: number,
    pageSize: number
  ): Promise<PagedResult<Category>>;
  findAll(): Promise<Category[]>;
  save(category: Category): Promise<Category>;
  delete(id: string): Promise<void>;
  existsByName(name: string): Promise<boolean>;
  existsBySlug(slug: string): Promise<boolean>;
  count(filters: CategoryFilters): Promise<number>;
}