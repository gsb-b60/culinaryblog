import express from 'express';
import NodeCache from 'node-cache';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { DeleteCategoryCommand } from '../src/application/commands/categories/CategoryCommands.js';
import { DeleteCategoryCommandHandler } from '../src/application/commands/categories/DeleteCategoryCommandHandler.js';
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

describe('Delete Category Feature (Issue #19 — FR-CAT-005)', () => {
  let cache: NodeCache;

  beforeEach(() => {
    cache = new NodeCache();
  });

  describe('DeleteCategoryCommandHandler', () => {
    it('deletes an empty category successfully and invalidates cache (AC1, AC5)', async () => {
      const existingCategory = {
        id: 'cat-empty',
        name: 'Món Chay Mới',
        slug: 'mon-chay-moi',
        isDeleted: false,
        _count: { recipes: 0 },
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(existingCategory),
          delete: vi.fn().mockResolvedValue(existingCategory),
        },
      } as any;

      cache.set('categories:all', [{ id: 'cat-empty' }]);
      expect(cache.get('categories:all')).toBeDefined();

      const handler = new DeleteCategoryCommandHandler(prisma, cache);
      await handler.execute(new DeleteCategoryCommand('cat-empty'));

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-empty' },
      });
      expect(cache.get('categories:all')).toBeUndefined();
    });

    it('throws 409 Conflict with recipe count in message when category contains recipes (AC2)', async () => {
      const existingCategory = {
        id: 'cat-with-recipes',
        name: 'Món chính',
        slug: 'mon-chinh',
        isDeleted: false,
        _count: { recipes: 6 },
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(existingCategory),
          delete: vi.fn(),
        },
      } as any;

      const handler = new DeleteCategoryCommandHandler(prisma, cache);

      await expect(
        handler.execute(new DeleteCategoryCommand('cat-with-recipes')),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringMatching(/6 recipe\(s\)/),
        code: 'CATEGORY_HAS_RECIPES',
      });

      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('throws 404 NotFoundError if category ID does not exist (AC4)', async () => {
      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null),
          delete: vi.fn(),
        },
      } as any;

      const handler = new DeleteCategoryCommandHandler(prisma, cache);

      await expect(
        handler.execute(new DeleteCategoryCommand('non-existent-id')),
      ).rejects.toThrow('Category not found');
    });

    it('throws 404 NotFoundError if category is already soft-deleted', async () => {
      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'deleted-cat',
            name: 'Món Xóa',
            isDeleted: true,
            _count: { recipes: 0 },
          }),
          delete: vi.fn(),
        },
      } as any;

      const handler = new DeleteCategoryCommandHandler(prisma, cache);

      await expect(
        handler.execute(new DeleteCategoryCommand('deleted-cat')),
      ).rejects.toThrow('Category not found');
    });
  });

  describe('DELETE /api/v1/categories/:id HTTP Endpoint', () => {
    let app: express.Express;

    beforeEach(() => {
      passport.use('jwt', new TestJwtStrategy());
      app = express();
      app.use(express.json());
      app.use(passport.initialize());
      app.use('/api/v1/categories', categoryRoutes);
      app.use(globalErrorHandler);
    });

    it('returns 204 No Content when Admin deletes an empty category (AC1)', async () => {
      vi.spyOn(commandBus, 'executeCommand').mockResolvedValueOnce(undefined as any);

      const res = await request(app)
        .delete('/api/v1/categories/cat-empty')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('returns 403 Forbidden when non-admin attempts deletion (AC3)', async () => {
      const res = await request(app)
        .delete('/api/v1/categories/cat-empty')
        .set('Authorization', 'Bearer author-token');

      expect(res.status).toBe(403);
    });

    it('returns 401 Unauthorized when no token is provided', async () => {
      const res = await request(app).delete('/api/v1/categories/cat-empty');

      expect(res.status).toBe(401);
    });
  });
});
