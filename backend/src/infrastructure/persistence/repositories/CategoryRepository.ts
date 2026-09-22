import { PrismaClient, Category as PrismaCategory } from '@prisma/client';
import { ICategoryRepository, CategoryFilters } from '../../../domain/repositories/ICategoryRepository.js';
import { Category, CategoryProps } from '../../../domain/entities/Category.js';
import { PagedResult, createPagedResult } from '../../../application/dtos/PagedResult.js';

export class CategoryRepository implements ICategoryRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(prismaCategory: PrismaCategory & { _count?: { recipes: number } }): Category {
    const props: CategoryProps = {
      id: prismaCategory.id,
      name: prismaCategory.name,
      slug: prismaCategory.slug,
      description: prismaCategory.description ?? undefined,
      imageUrl: prismaCategory.imageUrl ?? undefined,
      orderIndex: prismaCategory.orderIndex,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
      isDeleted: prismaCategory.isDeleted,
      version: prismaCategory.version,
    };
    return Category.reconstruct(props);
  }

  private toDto(category: Category, recipeCount?: number) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug.getValue(),
      description: category.description,
      imageUrl: category.imageUrl,
      orderIndex: category.orderIndex,
      recipeCount,
      createdAt: category.createdAt,
    };
  }

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id, isDeleted: false },
    });
    return category ? this.toDomain(category) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug, isDeleted: false },
    });
    return category ? this.toDomain(category) : null;
  }

  async findMany(
    filters: CategoryFilters,
    page: number,
    pageSize: number
  ): Promise<PagedResult<Category>> {
    const where: any = { isDeleted: false };

    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { orderIndex: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: { recipes: { where: { status: 'PUBLISHED', isDeleted: false } } },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    const categories = items.map(c => this.toDomain(c));
    const dtos = categories.map((c, i) => this.toDto(c, items[i]._count?.recipes));
    
    return createPagedResult(dtos as any, page, pageSize, totalCount);
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { recipes: { where: { status: 'PUBLISHED', isDeleted: false } } },
        },
      },
    });
    return categories.map((c, i) => {
      const domain = this.toDomain(c);
      return domain; // Could add recipeCount if needed
    });
  }

  async save(category: Category): Promise<Category> {
    const props = category.toPersistence();
    
    const data: any = {
      id: props.id,
      name: props.name,
      slug: props.slug.getValue(),
      description: props.description,
      imageUrl: props.imageUrl,
      orderIndex: props.orderIndex,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      isDeleted: props.isDeleted,
      version: props.version,
    };

    const saved = await this.prisma.category.upsert({
      where: { id: props.id },
      create: data,
      update: data,
    });

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { name, isDeleted: false },
    });
    return count > 0;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { slug, isDeleted: false },
    });
    return count > 0;
  }

  async count(filters: CategoryFilters): Promise<number> {
    const where: any = { isDeleted: false };
    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }
    return this.prisma.category.count({ where });
  }
}