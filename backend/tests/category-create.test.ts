import express from 'express';
import NodeCache from 'node-cache';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { CreateCategoryCommand } from '../src/application/commands/categories/CategoryCommands.js';
import { CreateCategoryCommandHandler } from '../src/application/commands/categories/CreateCategoryCommandHandler.js';
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

describe('Create Category Feature (Issue #17 — FR-CAT-003)', () => {
  let cache: NodeCache;

  beforeEach(() => {
    cache = new NodeCache();
  });

  describe('CreateCategoryCommandHandler', () => {
    it('creates category with auto-generated slug (lowercase, hyphenated, no diacritics) (AC1, AC2)', async () => {
      const createdCategory = {
        id: 'cat-new-1',
        name: 'Món Bò Xào',
        slug: 'mon-bo-xao',
        description: 'Các món bò xào thơm ngon',
        imageUrl: null,
        orderIndex: 1,
        createdAt: new Date('2026-11-03'),
      };

      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(createdCategory),
        },
      } as any;

      cache.set('categories:all', [{ id: 'old' }]);
      const handler = new CreateCategoryCommandHandler(prisma, cache);

      const result = await handler.execute(
        new CreateCategoryCommand({
          name: 'Món Bò Xào',
          description: 'Các món bò xào thơm ngon',
          orderIndex: 1,
        }),
      );

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'mon-bo-xao' },
      });
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Món Bò Xào',
          slug: 'mon-bo-xao',
          description: 'Các món bò xào thơm ngon',
          imageUrl: null,
          orderIndex: 1,
        },
      });
      expect(result).toMatchObject({
        id: 'cat-new-1',
        name: 'Món Bò Xào',
        slug: 'mon-bo-xao',
        description: 'Các món bò xào thơm ngon',
        orderIndex: 1,
        recipeCount: 0,
      });

      // Cache categories:all must be invalidated (AC7)
      expect(cache.get('categories:all')).toBeUndefined();
    });

    it('appends numeric suffix when slug collision occurs (-2, -3) (AC3)', async () => {
      const prisma = {
        category: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce({ id: 'existing-1', slug: 'mon-bo' })
            .mockResolvedValueOnce({ id: 'existing-2', slug: 'mon-bo-2' })
            .mockResolvedValueOnce(null),
          create: vi.fn().mockImplementation(({ data }) =>
            Promise.resolve({
              id: 'cat-new-3',
              name: data.name,
              slug: data.slug,
              description: data.description,
              imageUrl: null,
              orderIndex: 0,
              createdAt: new Date(),
            }),
          ),
        },
      } as any;

      const handler = new CreateCategoryCommandHandler(prisma, cache);
      const result = await handler.execute(
        new CreateCategoryCommand({ name: 'Món Bò' }),
      );

      expect(prisma.category.findUnique).toHaveBeenCalledTimes(3);
      expect(result.slug).toBe('mon-bo-3');
    });

    it('throws 409 Conflict if category name already exists (P2002)', async () => {
      const prisma = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockRejectedValue({ code: 'P2002', meta: { target: ['name'] } }),
        },
      } as any;

      const handler = new CreateCategoryCommandHandler(prisma, cache);
      await expect(
        handler.execute(new CreateCategoryCommand({ name: 'Món Bò' })),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CATEGORY_NAME_EXISTS',
      });
    });
  });

  describe('POST /api/v1/categories Endpoint Integration', () => {
    function buildTestApp() {
      passport.use('jwt', new TestJwtStrategy());

      const app = express();
      app.use(express.json());
      app.use(passport.initialize());
      app.use('/api/v1/categories', categoryRoutes);
      app.use(globalErrorHandler);
      return app;
    }

    it('returns 201 with Location header and CategoryDto for Admin (AC1)', async () => {
      commandBus.registerCommandHandler('CreateCategoryCommand', {
        execute: async () => ({
          id: 'cat-uuid-1',
          name: 'Món Lẩu',
          slug: 'mon-lau',
          description: 'Các món lẩu nghi ngút khói',
          orderIndex: 5,
          recipeCount: 0,
          createdAt: new Date('2026-11-03'),
        }),
      });

      const app = buildTestApp();
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'Món Lẩu', description: 'Các món lẩu nghi ngút khói', orderIndex: 5 });

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe('/api/v1/categories/mon-lau');
      expect(res.body).toMatchObject({
        id: 'cat-uuid-1',
        name: 'Món Lẩu',
        slug: 'mon-lau',
        orderIndex: 5,
      });
    });

    it('returns 401 when unauthenticated (AC4)', async () => {
      const app = buildTestApp();
      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Món Lẩu' });

      expect(res.status).toBe(401);
      expect(res.body.title).toBe('Unauthorized');
    });

    it('returns 403 Forbidden when user is not an Admin (AC4)', async () => {
      const app = buildTestApp();
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', 'Bearer author-token')
        .send({ name: 'Món Lẩu' });

      expect(res.status).toBe(403);
      expect(res.body.title).toBe('Forbidden');
    });

    it('returns 422 when name is shorter than 2 characters (AC5)', async () => {
      const app = buildTestApp();
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'A' });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 422 when name exceeds 50 characters (AC5)', async () => {
      const app = buildTestApp();
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'A'.repeat(51) });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 422 when name contains HTML tags (AC6)', async () => {
      const app = buildTestApp();
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: '<script>alert("hack")</script>' });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });
  });
});
