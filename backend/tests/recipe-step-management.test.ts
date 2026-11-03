import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import {
  AddRecipeStepCommand,
  DeleteRecipeStepCommand,
  UpdateRecipeStepCommand,
} from '../src/application/commands/recipes/RecipeCommands.js';
import {
  AddRecipeStepCommandHandler,
  DeleteRecipeStepCommandHandler,
  GetRecipeStepsQuery,
  GetRecipeStepsQueryHandler,
  UpdateRecipeStepCommandHandler,
} from '../src/application/handlers/RecipeStepCommandHandlers.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

type StoredStep = {
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

const state: { steps: StoredStep[] } = { steps: [] };
const cache = { deletePattern: vi.fn().mockResolvedValue(undefined) };
let prisma: any;
let app: express.Express;

function setupDatabase() {
  state.steps = [
    {
      id: 'step-1',
      recipeId: 'recipe-1',
      stepNumber: 1,
      title: 'Rửa rau',
      description: 'Rửa sạch rau củ.',
      timerMinutes: null,
      imageUrl: null,
      isDeleted: false,
      version: 1,
    },
    {
      id: 'step-2',
      recipeId: 'recipe-1',
      stepNumber: 2,
      title: 'Nấu canh',
      description: 'Đun sôi nước.',
      timerMinutes: 10,
      imageUrl: null,
      isDeleted: false,
      version: 1,
    },
  ];

  const tx = {
    recipe: {
      findFirst: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === 'recipe-1' ? { authorId: 'owner-1' } : null,
      ),
    },
    recipeStep: {
      findMany: vi.fn(async ({ where }: { where: { recipeId: string; isDeleted?: boolean } }) =>
        state.steps
          .filter(
            (step) =>
              step.recipeId === where.recipeId &&
              (where.isDeleted === undefined || step.isDeleted === where.isDeleted),
          )
          .sort((a, b) => a.stepNumber - b.stepNumber || a.id.localeCompare(b.id))
          .map(({ id, stepNumber, ...step }) => ({ id, stepNumber, ...step })),
      ),
      findFirst: vi.fn(async ({ where }: { where: { id: string; recipeId: string } }) =>
        state.steps.find(
          (step) =>
            step.id === where.id &&
            step.recipeId === where.recipeId &&
            !step.isDeleted,
        ) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Omit<StoredStep, 'id' | 'isDeleted' | 'version'> }) => {
        const step: StoredStep = {
          ...data,
          id: `step-${state.steps.length + 1}`,
          isDeleted: false,
          version: 1,
        };
        state.steps.push(step);
        return step;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
        const step = state.steps.find((item) => item.id === where.id)!;
        const stepNumber = data.stepNumber ?? step.stepNumber;
        if (
          state.steps.some(
            (item) =>
              item.id !== step.id &&
              item.recipeId === step.recipeId &&
              item.stepNumber === stepNumber,
          )
        ) {
          throw new Error('Unique recipe step number constraint violated');
        }
        const nextVersion =
          typeof data.version === 'object' ? step.version + data.version.increment : step.version;
        const { version: _version, ...updates } = data;
        Object.assign(step, updates, { version: nextVersion });
        return step;
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = state.steps.findIndex((step) => step.id === where.id);
        if (index >= 0) return state.steps.splice(index, 1)[0];
        return null;
      }),
    },
  };
  prisma = {
    recipe: tx.recipe,
    recipeStep: tx.recipeStep,
    $transaction: vi.fn(async (run: (transaction: typeof tx) => unknown) => run(tx)),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  setupDatabase();
  commandBus.registerQueryHandler(
    GetRecipeStepsQuery.name,
    new GetRecipeStepsQueryHandler(prisma),
  );
  commandBus.registerCommandHandler(
    AddRecipeStepCommand.name,
    new AddRecipeStepCommandHandler(prisma, cache),
  );
  commandBus.registerCommandHandler(
    UpdateRecipeStepCommand.name,
    new UpdateRecipeStepCommandHandler(prisma, cache),
  );
  commandBus.registerCommandHandler(
    DeleteRecipeStepCommand.name,
    new DeleteRecipeStepCommandHandler(prisma, cache),
  );
  vi.spyOn(passport, 'authenticate').mockImplementation(
    ((_strategy: unknown, _options: unknown, callback: (error: null, user: unknown) => void) =>
      (req: express.Request, _res: express.Response, _next: express.NextFunction) => {
        const token = req.headers.authorization;
        const user =
          token === 'owner'
            ? { id: 'owner-1', roles: ['AUTHOR'] }
            : token === 'admin'
              ? { id: 'admin-1', roles: ['ADMIN'] }
              : token === 'other'
                ? { id: 'other-1', roles: ['AUTHOR'] }
                : false;
        callback(null, user);
      }) as never,
  );
  app = express();
  app.use(express.json());
  app.use('/api/v1/recipes', recipeRoutes);
  app.use(globalErrorHandler);
});

function stepsPath(recipeId = 'recipe-1') {
  return `/api/v1/recipes/${recipeId}/steps`;
}

describe('FR-RCP-010 recipe step management API', () => {
  it('lists active steps in ascending order for the owner and Admin', async () => {
    const owner = await request(app).get(stepsPath()).set('Authorization', 'owner');
    expect(owner.status).toBe(200);
    expect(owner.body).toEqual([
      { id: 'step-1', stepNumber: 1, title: 'Rửa rau', description: 'Rửa sạch rau củ.' },
      {
        id: 'step-2',
        stepNumber: 2,
        title: 'Nấu canh',
        description: 'Đun sôi nước.',
        timerMinutes: 10,
      },
    ]);
    expect((await request(app).get(stepsPath()).set('Authorization', 'admin')).status).toBe(200);
  });

  it('requires authentication and denies non-owner access for every operation', async () => {
    for (const [method, path, body] of [
      ['get', stepsPath(), undefined],
      ['post', stepsPath(), { title: 'Nêm', description: 'Nêm gia vị.' }],
      ['put', `${stepsPath()}/step-1`, { title: 'Đổi tên' }],
      ['delete', `${stepsPath()}/step-1`, undefined],
    ] as const) {
      expect((await request(app)[method](path).send(body)).status).toBe(401);
      expect(
        (await request(app)[method](path).set('Authorization', 'other').send(body)).status,
      ).toBe(403);
    }
  });

  it('assigns the next step number and persists optional fields', async () => {
    const response = await request(app)
      .post(stepsPath())
      .set('Authorization', 'owner')
      .send({
        title: '  Nêm nếm  ',
        description: '  Thêm gia vị vừa ăn.  ',
        timerMinutes: 2,
        imageUrl: 'https://example.com/seasoning.jpg',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: 'step-3', message: 'Step added successfully' });
    expect(state.steps[2]).toMatchObject({
      stepNumber: 3,
      title: 'Nêm nếm',
      description: 'Thêm gia vị vừa ăn.',
      timerMinutes: 2,
      imageUrl: 'https://example.com/seasoning.jpg',
    });
    expect(cache.deletePattern).toHaveBeenCalledWith('recipes:*');
  });

  it.each([
    {},
    { title: ' ', description: 'Có nội dung' },
    { title: 'Hợp lệ', description: '   ' },
    { title: 'Hợp lệ', description: 'Có nội dung', timerMinutes: -1 },
    { title: 'Hợp lệ', description: 'Có nội dung', imageUrl: 'not-a-url' },
  ])('rejects invalid step input without writing: %j', async (body) => {
    const before = state.steps.length;
    const response = await request(app)
      .post(stepsPath())
      .set('Authorization', 'owner')
      .send(body);
    expect(response.status).toBe(422);
    expect(state.steps).toHaveLength(before);
  });

  it('updates content, clears optional fields and moves steps without unique-number conflicts', async () => {
    const response = await request(app)
      .put(`${stepsPath()}/step-2`)
      .set('Authorization', 'owner')
      .send({
        stepNumber: 1,
        title: 'Nấu nước',
        description: 'Đun sôi nước sạch.',
        timerMinutes: null,
        imageUrl: null,
      });
    expect(response.status).toBe(200);
    expect([...state.steps].sort((a, b) => a.stepNumber - b.stepNumber).map(({ id, stepNumber }) => [id, stepNumber])).toEqual([
      ['step-2', 1],
      ['step-1', 2],
    ]);
    expect(state.steps.find((step) => step.id === 'step-2')).toMatchObject({
      title: 'Nấu nước',
      description: 'Đun sôi nước sạch.',
      timerMinutes: null,
      imageUrl: null,
    });
  });

  it('rejects an invalid position and empty update without changing stored data', async () => {
    const original = structuredClone(state.steps);
    for (const body of [{ stepNumber: 3 }, { title: ' ' }, {}]) {
      const result = await request(app)
        .put(`${stepsPath()}/step-1`)
        .set('Authorization', 'owner')
        .send(body);
      expect(result.status).toBe(422);
    }
    expect(state.steps).toEqual(original);
  });

  it('deletes a step and renumbers the remaining steps sequentially', async () => {
    const third = await request(app)
      .post(stepsPath())
      .set('Authorization', 'owner')
      .send({ title: 'Hoàn tất', description: 'Dọn món ăn.' });
    expect(third.status).toBe(201);

    const deleted = await request(app)
      .delete(`${stepsPath()}/step-2`)
      .set('Authorization', 'owner');
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');
    expect([...state.steps].sort((a, b) => a.stepNumber - b.stepNumber).map(({ id, stepNumber }) => [id, stepNumber])).toEqual([
      ['step-1', 1],
      ['step-3', 2],
    ]);
  });

  it('returns 404 for missing recipes and steps, including steps from another recipe', async () => {
    expect(
      (await request(app).get(stepsPath('missing')).set('Authorization', 'owner')).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`${stepsPath()}/missing`)
          .set('Authorization', 'owner')
          .send({ title: 'Không tồn tại' })
      ).status,
    ).toBe(404);
    expect(
      (await request(app).delete(`${stepsPath()}/step-1`).set('Authorization', 'admin')).status,
    ).toBe(204);
  });

  it('documents list, create, update and delete step endpoints in OpenAPI', async () => {
    const { openApiSpec } = await import('../src/presentation/docs/openapi.js');
    const path = openApiSpec.paths['/recipes/{id}/steps'];
    expect(path.get).toBeDefined();
    expect(path.post).toBeDefined();
    expect(openApiSpec.paths['/recipes/{id}/steps/{stepId}'].put).toBeDefined();
    expect(openApiSpec.paths['/recipes/{id}/steps/{stepId}'].delete).toBeDefined();
  });
});
