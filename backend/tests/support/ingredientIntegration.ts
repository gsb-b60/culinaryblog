import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';

/** Isolated schema on the running PostgreSQL service. No mocked auth or persistence. */
export async function startIngredientIntegration(
  options: { beforeRecipeRequest?: express.RequestHandler } = {},
) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const envPath = resolve(root, '.env');
  const configured = existsSync(envPath) ? dotenv.parse(readFileSync(envPath)) : {};
  const baseUrl = new URL(
    process.env.INTEGRATION_DATABASE_URL ?? configured.DATABASE_URL ?? process.env.DATABASE_URL!,
  );
  if (!['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname))
    throw new Error('Integration tests require local PostgreSQL.');
  const schema = `ingredient_test_${randomUUID().replaceAll('-', '')}`;
  const testUrl = new URL(baseUrl);
  testUrl.searchParams.set('schema', schema);
  Object.assign(process.env, configured, {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: testUrl.toString(),
    RATE_LIMIT_AUTH: '10000',
    RATE_LIMIT_GENERAL: '10000',
  });
  const admin = new PrismaClient({ datasources: { db: { url: baseUrl.toString() } } });
  let schemaCreated = false;
  let stopContainer: (() => Promise<void>) | undefined;
  let closeQueue: (() => Promise<void>) | undefined;
  async function close() {
    const errors: unknown[] = [];
    async function clean(action: () => Promise<unknown>) {
      try {
        await action();
      } catch (error) {
        errors.push(error);
      }
    }
    if (stopContainer) await clean(stopContainer);
    if (closeQueue) await clean(closeQueue);
    if (schemaCreated && /^ingredient_test_[0-9a-f]{32}$/.test(schema)) {
      await clean(() => admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`));
    }
    await clean(() => admin.$disconnect());
    if (errors.length) throw new AggregateError(errors, 'Integration cleanup failed');
  }
  try {
    await admin.$queryRaw`SELECT 1`;
    if (!/^ingredient_test_[0-9a-f]{32}$/.test(schema)) throw new Error('Invalid test schema');
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    const require = createRequire(import.meta.url);
    execFileSync(
      process.execPath,
      [require.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate'],
      { cwd: root, env: process.env, stdio: 'pipe', timeout: 60000 },
    );
    const { createContainer, destroyContainer } =
      await import('../../src/presentation/di/container.js');
    stopContainer = destroyContainer;
    const { welcomeEmailQueue } =
      await import('../../src/infrastructure/jobs/queues/welcomeEmailQueue.js');
    closeQueue = () => welcomeEmailQueue.close();
    const container = createContainer();
    const prisma = container.prisma;
    const passwordHash = await bcrypt.hash('Integration1!', 4);
    const run = randomUUID();
    const owner = await prisma.user.create({
      data: {
        email: `owner-${run}@example.invalid`,
        displayName: 'Integration owner',
        fullName: 'Integration owner',
        userName: `it${run.slice(0, 8)}`,
        passwordHash,
        role: 'AUTHOR',
      },
    });
    const other = await prisma.user.create({
      data: { email: `other-${run}@example.invalid`, displayName: 'Other author', role: 'AUTHOR' },
    });
    const administrator = await prisma.user.create({
      data: { email: `admin-${run}@example.invalid`, displayName: 'Admin', role: 'ADMIN' },
    });
    const category = await prisma.category.create({
      data: { name: `Ingredient test ${run}`, slug: `ingredient-test-${run}` },
    });
    const recipes = [];
    for (let index = 0; index < 14; index++) {
      recipes.push(
        await prisma.recipe.create({
          data: {
            title: `Công thức kiểm thử ${index + 1}`,
            slug: `ingredients-${run}-${index}`,
            description: 'Công thức thật trong schema kiểm thử riêng.',
            prepTime: 10,
            cookTime: 20,
            servings: 2,
            categoryId: category.id,
            authorId: owner.id,
            createdAt: new Date(Date.now() + index * 1000),
          },
        }),
      );
    }
    const foreign = await prisma.recipe.create({
      data: {
        title: 'Other author recipe',
        slug: `foreign-${run}`,
        description: 'Private recipe',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        categoryId: category.id,
        authorId: other.id,
      },
    });
    const { configureJwtStrategy } =
      await import('../../src/infrastructure/auth/strategies/JwtStrategy.js');
    configureJwtStrategy(passport);
    const { default: recipeRoutes } = await import('../../src/presentation/routes/recipeRoutes.js');
    const { default: authRoutes } = await import('../../src/presentation/routes/authRoutes.js');
    const { setupOpenAPI } = await import('../../src/presentation/docs/openapi.js');
    const { globalErrorHandler } =
      await import('../../src/presentation/middleware/GlobalErrorHandler.js');
    const app = express();
    app.use(cors({ origin: ['http://127.0.0.1:5187', 'http://localhost:5187'] }));
    app.use(express.json());
    app.use(passport.initialize());
    if (options.beforeRecipeRequest) app.use('/api/v1/recipes', options.beforeRecipeRequest);
    app.use('/api/v1/recipes', recipeRoutes);
    app.use('/api/v1/auth', authRoutes);
    setupOpenAPI(app);
    app.use(globalErrorHandler);
    function accessToken(user: typeof owner) {
      return container.jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        roles: [user.role],
      });
    }
    const session = {
      accessToken: accessToken(owner),
      refreshToken: '',
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      user: {
        id: owner.id,
        email: owner.email,
        fullName: owner.displayName,
        userName: owner.userName ?? '',
        roles: [owner.role],
      },
    };
    return {
      app,
      prisma,
      recipes,
      foreign,
      owner,
      other,
      administrator,
      session,
      ownerToken: session.accessToken,
      otherToken: accessToken(other),
      adminToken: accessToken(administrator),
      close,
      schema,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
