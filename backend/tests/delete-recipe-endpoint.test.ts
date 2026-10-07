import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/presentation/middleware/AuthMiddleware.js', () => ({
  authenticateJwt: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const identity = req.headers.authorization;
    if (!identity) {
      res.sendStatus(401);
      return;
    }
    req.user = { id: identity, roles: identity === 'admin' ? ['ADMIN'] : ['AUTHOR'] } as never;
    next();
  },
  authorizeOwnerOrAdmin:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

import { commandBus } from '../src/application/command-bus.js';
import { DeleteRecipeCommandHandler } from '../src/application/handlers/DeleteRecipeCommandHandler.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

const tx = {
  recipe: { findUnique: vi.fn(), delete: vi.fn() },
  fileCleanupTask: { createMany: vi.fn() },
};
const app = express();
app.use('/api/v1/recipes', recipeRoutes);
app.use(globalErrorHandler);

beforeEach(() => {
  vi.clearAllMocks();
  tx.recipe.findUnique.mockResolvedValue({ id: 'r', authorId: 'owner', images: [], steps: [] });
  tx.recipe.delete.mockResolvedValue({});
  commandBus.registerCommandHandler(
    'DeleteRecipeCommand',
    new DeleteRecipeCommandHandler(
      { $transaction: (run: (client: typeof tx) => unknown) => run(tx) } as never,
      async () => {},
    ),
  );
});
describe('DELETE /api/v1/recipes/:id', () => {
  it.each(['owner', 'admin'])('returns empty 204 for %s', async (user) => {
    const response = await request(app).delete('/api/v1/recipes/r').set('Authorization', user);
    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    expect(tx.recipe.delete).toHaveBeenCalledOnce();
  });
  it('requires authentication', async () => {
    expect((await request(app).delete('/api/v1/recipes/r')).status).toBe(401);
    expect(tx.recipe.findUnique).not.toHaveBeenCalled();
  });
  it('returns 403 for another author', async () => {
    expect(
      (await request(app).delete('/api/v1/recipes/r').set('Authorization', 'other')).status,
    ).toBe(403);
    expect(tx.recipe.delete).not.toHaveBeenCalled();
  });
  it.each(['owner', 'admin'])('returns 404 for missing recipe to %s', async (user) => {
    tx.recipe.findUnique.mockResolvedValue(null);
    expect((await request(app).delete('/api/v1/recipes/r').set('Authorization', user)).status).toBe(
      404,
    );
  });
});
