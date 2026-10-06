import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import {
  AddRecipeStepCommandHandler,
  UpdateRecipeStepCommandHandler,
  DeleteRecipeStepCommandHandler,
} from '../src/application/handlers/RecipeStepCommandHandlers.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

vi.mock('passport', () => ({
  default: {
    authenticate:
      (_strategy: string, _options: unknown, callback: Function) =>
      (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        const token = req.headers.authorization;
        callback(
          null,
          token
            ? {
                id: token === 'admin' ? 'admin-user' : token,
                roles: [token === 'admin' ? 'ADMIN' : 'AUTHOR'],
              }
            : false,
        );
        void next;
      },
  },
}));

type Step = {
  id: string;
  recipeId: string;
  stepNumber: number;
  title: string;
  description: string;
  timerMinutes: number | null;
  imageUrl: string | null;
  isDeleted: boolean;
  version: number;
};
let steps: Step[];
let recipe: { id: string; authorId: string; isDeleted: boolean } | null;
let app: express.Express;
let failRenumber: boolean;

function step(id: string, stepNumber: number, recipeId = 'recipe-1'): Step {
  return {
    id,
    recipeId,
    stepNumber,
    title: 'Prepare',
    description: 'Chop vegetables',
    timerMinutes: null,
    imageUrl: null,
    isDeleted: false,
    version: 1,
  };
}
function matches(item: Step, where: Record<string, unknown>) {
  return Object.entries(where).every(([key, value]) => item[key as keyof Step] === value);
}
const tx = {
  $queryRaw: vi.fn().mockResolvedValue([]),
  recipe: {
    findUnique: vi.fn(async () => (recipe?.isDeleted ? null : recipe)),
    update: vi.fn(async () => recipe),
  },
  recipeStep: {
    aggregate: vi.fn(async ({ where }) => ({
      _max: {
        stepNumber: steps
          .filter((item) => matches(item, where))
          .reduce<number | null>((max, item) => Math.max(max ?? 0, item.stepNumber), null),
      },
    })),
    create: vi.fn(async ({ data }) => {
      if (
        steps.some((item) => item.recipeId === data.recipeId && item.stepNumber === data.stepNumber)
      ) {
        throw new Error('Duplicate step number');
      }
      const created = { ...step('new-step', data.stepNumber), ...data };
      steps.push(created);
      return created;
    }),
    findFirst: vi.fn(async ({ where }) => steps.find((item) => matches(item, where)) ?? null),
    findMany: vi.fn(async ({ where }) =>
      steps
        .filter((item) => matches(item, where))
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map((item) => ({ ...item })),
    ),
    delete: vi.fn(async ({ where }) => {
      steps = steps.filter((item) => item.id !== where.id);
    }),
    update: vi.fn(async ({ where, data }) => {
      const item = steps.find((item) => item.id === where.id)!;
      if (data.stepNumber !== undefined) {
        if (failRenumber) throw new Error('Simulated database failure');
        if (
          steps.some(
            (other) =>
              other.id !== item.id &&
              other.recipeId === item.recipeId &&
              other.stepNumber === data.stepNumber,
          )
        ) {
          throw new Error('Duplicate step number');
        }
      }
      const { version, ...fields } = data;
      Object.assign(item, fields);
      if (version) item.version += version.increment;
      return item;
    }),
  },
};
const prisma = {
  $transaction: async (callback: Function) => {
    const snapshot = structuredClone(steps);
    try {
      return await callback(tx);
    } catch (error) {
      steps = snapshot;
      throw error;
    }
  },
};
const body = { title: 'Cook', description: 'Simmer gently', timerMinutes: 0 };
const base = '/api/v1/recipes/recipe-1/steps';

beforeEach(() => {
  vi.clearAllMocks();
  recipe = { id: 'recipe-1', authorId: 'owner', isDeleted: false };
  steps = [step('step-1', 1), step('step-2', 2), step('step-3', 3)];
  failRenumber = false;
  commandBus.registerCommandHandler(
    'AddRecipeStepCommand',
    new AddRecipeStepCommandHandler(prisma as never),
  );
  commandBus.registerCommandHandler(
    'UpdateRecipeStepCommand',
    new UpdateRecipeStepCommandHandler(prisma as never),
  );
  commandBus.registerCommandHandler(
    'DeleteRecipeStepCommand',
    new DeleteRecipeStepCommandHandler(prisma as never),
  );
  app = express();
  app.use(express.json());
  app.use('/api/v1/recipes', recipeRoutes);
  app.use(globalErrorHandler);
});

function mutate(method: 'post' | 'put' | 'delete', user?: string, payload = body) {
  const req = request(app)[method](method === 'post' ? base : `${base}/step-2`);
  if (user) req.set('Authorization', user);
  return method === 'delete' ? req : req.send(payload);
}

describe('Recipe step API with real command handlers and simulated persistence', () => {
  it('adds at max + 1 rather than count + 1', async () => {
    steps = [step('step-1', 1), step('step-3', 3)];
    const res = await mutate('post', 'owner');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'new-step', stepNumber: 4, ...body });
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.recipe.update).toHaveBeenCalled();
  });
  it('starts an empty recipe at step 1', async () => {
    steps = [];
    expect((await mutate('post', 'owner')).body.stepNumber).toBe(1);
  });
  it('updates content while preserving step number', async () => {
    const res = await mutate('put', 'owner');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'step-2', stepNumber: 2, ...body });
  });
  it.each(['step-1', 'step-2', 'step-3'])('deletes %s and renumbers sequentially', async (id) => {
    const res = await request(app).delete(`${base}/${id}`).set('Authorization', 'owner');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(steps.map((item) => item.stepNumber)).toEqual([1, 2]);
    expect(steps.some((item) => item.id === id)).toBe(false);
    const added = await mutate('post', 'owner');
    expect(added.status).toBe(201);
    expect(added.body.stepNumber).toBe(3);
  });
  it('deletes the only step and can add again at 1', async () => {
    steps = [step('step-2', 1)];
    expect((await mutate('delete', 'owner')).status).toBe(204);
    expect(steps).toEqual([]);
    expect((await mutate('post', 'owner')).body.stepNumber).toBe(1);
  });
  it('renumbers pre-existing gaps and leaves other recipes untouched', async () => {
    steps = [step('step-1', 2), step('step-2', 4), step('step-3', 8), step('other', 7, 'recipe-2')];
    expect((await mutate('delete', 'owner')).status).toBe(204);
    expect(steps.map((item) => item.stepNumber)).toEqual([1, 2, 7]);
  });
  it('rolls back deletion when renumbering fails', async () => {
    failRenumber = true;
    expect((await mutate('delete', 'owner')).status).toBe(500);
    expect(steps.map((item) => item.stepNumber)).toEqual([1, 2, 3]);
  });
  for (const method of ['post', 'put', 'delete'] as const) {
    it(`${method}: permits Admin to modify another author's recipe`, async () => {
      expect((await mutate(method, 'admin')).status).toBe(
        method === 'post' ? 201 : method === 'put' ? 200 : 204,
      );
    });
    it(`${method}: rejects non-owner with 403`, async () => {
      expect((await mutate(method, 'other-author')).status).toBe(403);
      expect(steps).toHaveLength(3);
    });
    it(`${method}: requires authentication`, async () => {
      expect((await mutate(method)).status).toBe(401);
    });
    it(`${method}: returns 404 for missing recipe`, async () => {
      recipe = null;
      expect((await mutate(method, 'owner')).status).toBe(404);
    });
    it(`${method}: returns 404 for deleted recipe`, async () => {
      recipe!.isDeleted = true;
      expect((await mutate(method, 'owner')).status).toBe(404);
    });
  }
  for (const method of ['put', 'delete'] as const) {
    it(`${method}: returns 404 for missing step`, async () => {
      steps = [];
      expect((await mutate(method, 'owner')).status).toBe(404);
    });
    it(`${method}: rejects a step belonging to a different recipe`, async () => {
      steps[1]!.recipeId = 'recipe-2';
      expect((await mutate(method, 'owner')).status).toBe(404);
    });
    it(`${method}: returns 404 for a deleted step`, async () => {
      steps[1]!.isDeleted = true;
      expect((await mutate(method, 'owner')).status).toBe(404);
    });
  }
  for (const method of ['post', 'put'] as const) {
    it.each([
      {},
      { title: 'Cook' },
      { description: 'Simmer' },
      { ...body, title: '   ' },
      { ...body, description: '\n ' },
      { ...body, timerMinutes: -1 },
      { ...body, timerMinutes: 1.5 },
      { ...body, timerMinutes: '5' },
      { ...body, timerMinutes: 2147483648 },
      { ...body, imageUrl: 'invalid' },
      { ...body, stepNumber: 20 },
    ])(`${method}: validates payload %j with 422`, async (payload) => {
      const req = request(app)
        [method](method === 'post' ? base : `${base}/step-2`)
        .set('Authorization', 'owner')
        .send(payload);
      expect((await req).status).toBe(422);
      expect(steps).toHaveLength(3);
    });
  }
});
