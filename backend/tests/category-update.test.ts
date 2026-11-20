import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { UpdateCategoryCommand } from '../src/application/commands/categories/CategoryCommands.js';
import { UpdateCategoryCommandHandler } from '../src/application/commands/categories/UpdateCategoryCommandHandler.js';
import { UserRole } from '../src/domain/enums/UserRole.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import categoryRoutes from '../src/presentation/routes/categoryRoutes.js';

class TestJwtStrategy extends passport.Strategy {
  authenticate(req: express.Request) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return this.fail({ message: 'Authentication required' }, 401);
    }
    const token = auth.slice(7);
    if (token === 'admin-token') {
      return this.success({
        id: 'admin-1',
        email: 'admin@lethimcook.com',
        roles: [UserRole.ADMIN],
      });
    }
    if (token === 'author-token') {
      return this.success({
        id: 'author-1',
        email: 'author@lethimcook.com',
        roles: [UserRole.AUTHOR],
      });
    }
    return this.fail({ message: 'Invalid token' }, 401);
  }
}

describe('Update Category Feature (Issue #18 — FR-CAT-004)', () => {
  let cache: { deletePattern: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    cache = { deletePattern: vi.fn().mockResolvedValue(undefined) };
  });

  describe('UpdateCategoryCommandHandler', () => {
    it('updates category name and description successfully (AC1)', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Món Bò',
        slug: 'mon-bo',
        description: 'Mô tả cũ',
        imageUrl: null,
        orderIndex: 5,
        isDeleted: false,
        createdAt: new Date('2026-10-01'),
        _count: { recipes: 3 },
      };

      const updatedCategory = {
        ...existingCategory,
        name: 'Món Bò Đặc Biệt',
        description: 'Mô tả mới',
        orderIndex: 2,
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(existingCategory),
          update: vi.fn().mockResolvedValue(updatedCategory),
        },
      } as any;

      const handler = new UpdateCategoryCommandHandler(prisma, cache);

      const result = await handler.execute(
        new UpdateCategoryCommand('cat-1', {
          name: 'Món Bò Đặc Biệt',
          description: 'Mô tả mới',
          orderIndex: 2,
        }),
      );

      expect(prisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cat-1' },
          data: {
            name: 'Món Bò Đặc Biệt',
            description: 'Mô tả mới',
            orderIndex: 2,
          },
        }),
      );
      expect(result.name).toBe('Món Bò Đặc Biệt');
      expect(result.description).toBe('Mô tả mới');
    });

    it('preserves existing slug unchanged when name changes (AC2)', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Món Bò',
        slug: 'mon-bo',
        description: 'Các món bò',
        imageUrl: null,
        orderIndex: 1,
        isDeleted: false,
        createdAt: new Date('2026-10-01'),
        _count: { recipes: 2 },
      };

      const updatedCategory = {
        ...existingCategory,
        name: 'Món Bò Thượng Hạng',
        // Slug strictly preserved to avoid breaking existing links
        slug: 'mon-bo',
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(existingCategory),
          update: vi.fn().mockResolvedValue(updatedCategory),
        },
      } as any;

      const handler = new UpdateCategoryCommandHandler(prisma, cache);
      const result = await handler.execute(
        new UpdateCategoryCommand('cat-1', {
          name: 'Món Bò Thượng Hạng',
        }),
      );

      // Slug must remain 'mon-bo'
      expect(result.slug).toBe('mon-bo');
      // Ensure update call did NOT pass slug in data payload
      const updateData = prisma.category.update.mock.calls[0][0].data;
      expect(updateData.slug).toBeUndefined();
    });

    it('throws 404 NotFoundError if category ID does not exist (AC4)', async () => {
      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as any;

      const handler = new UpdateCategoryCommandHandler(prisma, cache);

      await expect(
        handler.execute(
          new UpdateCategoryCommand('non-existent-id', {
            name: 'Món Mới',
          }),
        ),
      ).rejects.toThrow('Category not found');
    });

    it('invalidates categories:all cache after update (AC5)', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Món Lẩu',
        slug: 'mon-lau',
        description: null,
        imageUrl: null,
        orderIndex: 1,
        isDeleted: false,
        createdAt: new Date(),
        _count: { recipes: 0 },
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(existingCategory),
          update: vi.fn().mockResolvedValue({ ...existingCategory, name: 'Món Lẩu Cay' }),
        },
      } as any;

      const handler = new UpdateCategoryCommandHandler(prisma, cache);
      await handler.execute(
        new UpdateCategoryCommand('cat-1', { name: 'Món Lẩu Cay' }),
      );

      expect(cache.deletePattern).toHaveBeenCalledWith('categories:*');
    });

    it('maps unique constraint P2002 to 409 Conflict when name is duplicate', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Món Lẩu',
        slug: 'mon-lau',
        description: null,
        imageUrl: null,
        orderIndex: 1,
        isDeleted: false,
        createdAt: new Date(),
        _count: { recipes: 0 },
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(existingCategory),
          update: vi.fn().mockRejectedValue({ code: 'P2002' }),
        },
      } as any;

      const handler = new UpdateCategoryCommandHandler(prisma, cache);

      await expect(
        handler.execute(
          new UpdateCategoryCommand('cat-1', { name: 'Món Nướng' }),
        ),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CATEGORY_NAME_EXISTS',
      });
    });
  });

  describe('PUT /api/v1/categories/:id HTTP Endpoint', () => {
    let app: express.Express;

    beforeEach(() => {
      passport.use('jwt', new TestJwtStrategy());
      app = express();
      app.use(express.json());
      app.use(passport.initialize());
      app.use('/api/v1/categories', categoryRoutes);
      app.use(globalErrorHandler);
    });

    it('returns 200 OK when Admin updates a category (AC1)', async () => {
      vi.spyOn(commandBus, 'executeCommand').mockResolvedValueOnce({
        id: 'cat-1',
        name: 'Món Hải Sản Tươi',
        slug: 'mon-hai-san',
        description: 'Hải sản cao cấp',
        orderIndex: 3,
        recipeCount: 5,
        createdAt: new Date('2026-10-01'),
      } as any);

      const res = await request(app)
        .put('/api/v1/categories/cat-1')
        .set('Authorization', 'Bearer admin-token')
        .send({
          name: 'Món Hải Sản Tươi',
          description: 'Hải sản cao cấp',
          orderIndex: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Món Hải Sản Tươi');
      expect(res.body.slug).toBe('mon-hai-san');
      expect(res.body.message).toBe('Category updated successfully');
    });

    it('returns 403 Forbidden when non-admin user attempts update (AC3)', async () => {
      const res = await request(app)
        .put('/api/v1/categories/cat-1')
        .set('Authorization', 'Bearer author-token')
        .send({ name: 'Tên Mới' });

      expect(res.status).toBe(403);
    });

    it('returns 401 Unauthorized when no token is provided', async () => {
      const res = await request(app)
        .put('/api/v1/categories/cat-1')
        .send({ name: 'Tên Mới' });

      expect(res.status).toBe(401);
    });

    it('returns 422 when name is too short (< 2 chars)', async () => {
      const res = await request(app)
        .put('/api/v1/categories/cat-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'A' });

      expect(res.status).toBe(422);
    });

    it('returns 422 when name contains HTML tags', async () => {
      const res = await request(app)
        .put('/api/v1/categories/cat-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: '<script>alert("hack")</script>' });

      expect(res.status).toBe(422);
    });

    it('returns 422 when no mutable field is provided (PUT {})', async () => {
      const res = await request(app)
        .put('/api/v1/categories/cat-1')
        .set('Authorization', 'Bearer admin-token')
        .send({});

      expect(res.status).toBe(422);
    });

    it('returns 422 when name is whitespace only', async () => {
      const res = await request(app)
        .put('/api/v1/categories/cat-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: '     ' });

      expect(res.status).toBe(422);
    });
  });

  describe('Clearing description & Cache invalidation', () => {
    it('clears description when description is null or empty string (regression test)', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Món Bò',
        slug: 'mon-bo',
        description: 'Mô tả cũ',
        imageUrl: null,
        orderIndex: 5,
        isDeleted: false,
        createdAt: new Date('2026-10-01'),
        _count: { recipes: 3 },
      };

      const updatedCategory = {
        ...existingCategory,
        description: null,
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(existingCategory),
          update: vi.fn().mockResolvedValue(updatedCategory),
        },
      } as any;

      const handler = new UpdateCategoryCommandHandler(prisma, cache);
      const result = await handler.execute(
        new UpdateCategoryCommand('cat-1', {
          description: null,
        }),
      );

      expect(prisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cat-1' },
          data: expect.objectContaining({
            description: null,
          }),
        }),
      );
      expect(result.description).toBeUndefined();
    });

    it('invalidates categories cache with deletePattern if available', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Món Bò',
        slug: 'mon-bo',
        description: 'Mô tả cũ',
        imageUrl: null,
        orderIndex: 5,
        isDeleted: false,
        createdAt: new Date('2026-10-01'),
        _count: { recipes: 3 },
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(existingCategory),
          update: vi.fn().mockResolvedValue(existingCategory),
        },
      } as any;

      const mockCacheService = {
        deletePattern: vi.fn().mockResolvedValue(undefined),
      };

      const handler = new UpdateCategoryCommandHandler(prisma, mockCacheService as any);
      await handler.execute(
        new UpdateCategoryCommand('cat-1', { name: 'Món Bò Mới' }),
      );

      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('categories:*');
    });
  });
});
