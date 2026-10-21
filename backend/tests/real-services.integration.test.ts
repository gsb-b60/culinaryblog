import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { Redis } from 'ioredis';
import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Every service connection in this suite is real; no mocks or substituted clients.
const runId = randomUUID().replaceAll('-', '');
const schema = `codex_test_${runId}`;
const prefix = `codex-test-${runId}`;
const local = dotenv.parse(readFileSync('.env'));
const baseUrl = new URL(process.env.INTEGRATION_DATABASE_URL ?? local.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname))
  throw new Error('Integration tests require local PostgreSQL.');
const testUrl = new URL(baseUrl);
testUrl.searchParams.set('schema', schema);
Object.assign(process.env, local, {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: testUrl.toString(),
  REDIS_URL: process.env.INTEGRATION_REDIS_URL ?? local.REDIS_URL ?? 'redis://localhost:6379',
  BULLMQ_PREFIX: prefix,
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '1025',
  SMTP_FROM: 'integration@example.invalid',
  SMTP_USER: '',
  SMTP_PASS: '',
  S3_BUCKET: prefix,
  RATE_LIMIT_AUTH: '10000',
  RATE_LIMIT_GENERAL: '10000',
});
for (const address of [process.env.REDIS_URL, process.env.S3_ENDPOINT]) {
  if (!address || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(address).hostname))
    throw new Error('Integration tests require local Redis and MinIO.');
}
const admin = new PrismaClient({ datasources: { db: { url: baseUrl.toString() } } });
let prisma: PrismaClient;
let container: any;
let redis: Redis;
let s3: S3Client;
let bucketCreated = false;
let schemaCreated = false;
let app: express.Express;
let modules: any;
let owner: any;
let other: any;
let category: any;
let recipe: any;
let token: string;
let otherToken: string;
let adminToken: string;
const mailIds = new Set<string>();
const objectKeys = new Set<string>();
const workers: any[] = [];
const queues: any[] = [];
async function waitForMail(recipient: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const response = await fetch(
      `http://127.0.0.1:8025/api/v2/search?kind=to&query=${encodeURIComponent(recipient)}`,
    );
    expect(response.ok).toBe(true);
    const body = (await response.json()) as {
      items: Array<{ ID: string; Content: { Body: string; Headers: Record<string, string[]> } }>;
    };
    if (body.items.length) {
      body.items.forEach((item) => mailIds.add(item.ID));
      return body.items;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('MailHog did not receive the integration message');
}
function bearer(value = token) {
  return `Bearer ${value}`;
}

beforeAll(async () => {
  await admin.$queryRaw`SELECT 1`;
  redis = new Redis(process.env.REDIS_URL!, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  await redis.connect();
  expect(await redis.ping()).toBe('PONG');
  expect((await fetch(`${process.env.S3_ENDPOINT}/minio/health/live`)).ok).toBe(true);
  expect((await fetch('http://127.0.0.1:8025/api/v2/messages')).ok).toBe(true);
  if (!/^codex_test_[0-9a-f]{32}$/.test(schema)) throw new Error('Invalid test schema');
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  const require = createRequire(import.meta.url);
  execFileSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate'],
    { env: process.env, stdio: 'pipe', timeout: 60000 },
  );
  s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
  await s3.send(new CreateBucketCommand({ Bucket: prefix }));
  bucketCreated = true;
  const di = await import('../src/presentation/di/container.js');
  container = di.createContainer();
  prisma = container.prisma;
  await container.cacheService.connect();
  const { configureJwtStrategy } =
    await import('../src/infrastructure/auth/strategies/JwtStrategy.js');
  configureJwtStrategy(passport);
  const { seedUsers } = await import('../src/infrastructure/persistence/seed/userSeeder.js');
  const { seedCategories } =
    await import('../src/infrastructure/persistence/seed/categorySeeder.js');
  const { seedRecipes } = await import('../src/infrastructure/persistence/seed/recipeSeeder.js');
  const users = await seedUsers(prisma);
  const categories = await seedCategories(prisma);
  await seedRecipes(prisma, users.slice(1), categories);
  expect(await prisma.recipe.count()).toBe(100);
  expect(await seedCategories(prisma)).toEqual(categories);
  owner = await prisma.user.findUniqueOrThrow({ where: { id: users[1] } });
  other = await prisma.user.findUniqueOrThrow({ where: { id: users[2] } });
  const adminUser = await prisma.user.findUniqueOrThrow({ where: { id: users[0] } });
  category = await prisma.category.findUniqueOrThrow({ where: { id: categories[0] } });
  recipe = await prisma.recipe.findFirstOrThrow({ where: { authorId: owner.id } });
  token = container.jwtService.generateAccessToken({
    userId: owner.id,
    email: owner.email,
    roles: ['AUTHOR'],
  });
  otherToken = container.jwtService.generateAccessToken({
    userId: other.id,
    email: other.email,
    roles: ['AUTHOR'],
  });
  adminToken = container.jwtService.generateAccessToken({
    userId: adminUser.id,
    email: adminUser.email,
    roles: ['ADMIN'],
  });
  modules = {
    di,
    ingredients: await import('../src/application/commands/recipes/RecipeCommands.js'),
    queries: await import('../src/application/queries/recipes/RecipeQueries.js'),
    auth: await import('../src/application/commands/auth/AuthCommands.js'),
  };
  const { welcomeEmailWorker } =
    await import('../src/infrastructure/jobs/workers/welcomeEmailWorker.js');
  const { imageResizeWorker } =
    await import('../src/infrastructure/jobs/workers/imageResizeWorker.js');
  const { sitemapWorker } = await import('../src/infrastructure/jobs/workers/sitemapWorker.js');
  workers.push(welcomeEmailWorker, imageResizeWorker, sitemapWorker);
  const { welcomeEmailQueue } =
    await import('../src/infrastructure/jobs/queues/welcomeEmailQueue.js');
  const { imageResizeQueue } =
    await import('../src/infrastructure/jobs/queues/imageResizeQueue.js');
  const { sitemapQueue } = await import('../src/infrastructure/jobs/queues/sitemapQueue.js');
  queues.push(welcomeEmailQueue, imageResizeQueue, sitemapQueue);
  const { default: authRoutes } = await import('../src/presentation/routes/authRoutes.js');
  const { default: recipeRoutes } = await import('../src/presentation/routes/recipeRoutes.js');
  const { default: categoryRoutes } = await import('../src/presentation/routes/categoryRoutes.js');
  const { globalErrorHandler } =
    await import('../src/presentation/middleware/GlobalErrorHandler.js');
  app = express();
  app.use(express.json());
  app.use(passport.initialize());
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/recipes', recipeRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use(globalErrorHandler);
}, 120000);

afterAll(async () => {
  // Remove only generated resources, never public-schema data or application jobs.
  const failures: unknown[] = [];
  async function clean(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (error) {
      failures.push(error);
    }
  }
  for (const worker of workers) await clean(() => worker.close());
  for (const queue of queues) {
    if (queue.opts.prefix !== prefix) {
      failures.push(new Error('Unexpected queue prefix'));
      continue;
    }
    await clean(() => queue.obliterate({ force: true }));
    await clean(() => queue.close());
  }
  if (container) {
    await clean(() => container.cacheService.deletePattern(`${prefix}:*`));
    const di = await import('../src/presentation/di/container.js');
    await clean(di.destroyContainer);
    const { disconnectPrisma } = await import('../src/config-middleware/shared/database/client.js');
    await clean(disconnectPrisma);
  }
  if (redis) await clean(() => redis.quit());
  for (const key of objectKeys)
    if (s3) await clean(() => s3.send(new DeleteObjectCommand({ Bucket: prefix, Key: key })));
  if (bucketCreated) await clean(() => s3.send(new DeleteBucketCommand({ Bucket: prefix })));
  s3?.destroy();
  for (const id of mailIds)
    await clean(async () => {
      if (
        !(
          await fetch(`http://127.0.0.1:8025/api/v1/messages/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
        ).ok
      )
        throw new Error('Could not remove test email');
    });
  if (schemaCreated && /^codex_test_[0-9a-f]{32}$/.test(schema))
    await clean(() => admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`));
  await clean(() => admin.$disconnect());
  expect(failures, 'Test resource cleanup failed').toEqual([]);
}, 60000);

describe('Real PostgreSQL repositories and seed data', () => {
  it('reads persisted recipe details and excludes missing records', async () => {
    const repo = container.recipeRepository;
    expect((await repo.findById(recipe.id)).title).toBe(recipe.title);
    expect((await repo.findBySlug(recipe.slug)).id).toBe(recipe.id);
    expect(await repo.findById(randomUUID())).toBeNull();
    expect(await repo.findBySlug(`missing-${runId}`)).toBeNull();
    expect(await repo.existsBySlug(recipe.slug)).toBe(true);
    expect(await repo.existsBySlug(`missing-${runId}`)).toBe(false);
  });
  it('filters category, difficulty, status, author, durations and text with real SQL', async () => {
    const filters = {
      categoryId: recipe.categoryId,
      difficulty: recipe.difficulty,
      status: recipe.status,
      authorId: owner.id,
      minPrepTime: recipe.prepTime,
      maxPrepTime: recipe.prepTime,
      minCookTime: recipe.cookTime,
      maxCookTime: recipe.cookTime,
      searchQuery: recipe.title,
    };
    const result = await container.recipeRepository.findMany(
      filters,
      { field: 'title', order: 'asc' },
      1,
      50,
    );
    expect(result.items.some((item: any) => item.id === recipe.id)).toBe(true);
    expect(result.meta.totalCount).toBe(await container.recipeRepository.count(filters));
    expect(
      (
        await container.recipeRepository.search(
          `absent-${runId}`,
          {},
          { field: 'cookTime', order: 'desc' },
          1,
          10,
        )
      ).items,
    ).toEqual([]);
    const matches = await container.recipeRepository.search(
      recipe.title,
      {},
      { field: 'createdAt', order: 'desc' },
      1,
      50,
    );
    expect(matches.items.some((item: any) => item.id === recipe.id)).toBe(true);
  });
  it('paginates published recipes within a category', async () => {
    const repo = container.recipeRepository;
    const result = await repo.findPublishedByCategory(recipe.categoryId, 1, 1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('PUBLISHED');
    const sorted = await repo.findPublishedByCategory(recipe.categoryId, 1, 50, {
      field: 'prepTime',
      order: 'asc',
    });
    expect(sorted.items.every((item: any) => item.categoryId === recipe.categoryId)).toBe(true);
    const times = sorted.items.map((item: any) => item.prepTime);
    expect(times).toEqual([...times].sort((a: number, b: number) => a - b));
  });
  it('saves, updates, soft deletes and hard deletes a category', async () => {
    const { Category } = await import('../src/domain/entities/Category.js');
    const repo = container.categoryRepository;
    const entity = Category.create({
      name: `Test ${runId}`,
      description: 'Integration category',
      imageUrl: 'https://example.invalid/image.png',
      orderIndex: 99,
    });
    const saved = await repo.save(entity);
    expect(saved.id).toBe(entity.id);
    expect(saved.description).toBe('Integration category');
    expect((await repo.findById(entity.id)).slug.getValue()).toBe(entity.slug.getValue());
    expect((await repo.findBySlug(entity.slug.getValue())).id).toBe(entity.id);
    expect(await repo.existsByName(entity.name)).toBe(true);
    expect(await repo.existsBySlug(entity.slug.getValue())).toBe(true);
    const page = await repo.findMany({ searchQuery: runId }, 1, 5);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].recipeCount).toBe(0);
    expect(await repo.count({ searchQuery: runId })).toBe(1);
    expect((await repo.findAll()).some((item: any) => item.id === entity.id)).toBe(true);
    saved.update({ description: 'Updated category' });
    await repo.save(saved);
    expect((await repo.findById(entity.id)).description).toBe('Updated category');
    saved.softDelete();
    await repo.save(saved);
    expect(await repo.findById(entity.id)).toBeNull();
    expect(await repo.findBySlug(entity.slug.getValue())).toBeNull();
    expect(await repo.existsByName(entity.name)).toBe(false);
    expect(await repo.existsBySlug(entity.slug.getValue())).toBe(false);
    await repo.delete(entity.id);
    expect(await prisma.category.findUnique({ where: { id: entity.id } })).toBeNull();
  });
  it('persists profile, email and Google ID through the user repository', async () => {
    const { User } = await import('../src/domain/entities/User.js');
    const { EmailAddress } = await import('../src/domain/value-objects/EmailAddress.js');
    const repo = container.userRepository;
    const entity = User.create({
      email: `${runId}@example.invalid`,
      displayName: 'Test chef',
      googleId: `google-${runId}`,
      bio: 'Chef bio',
      avatarUrl: 'https://example.invalid/avatar.png',
    });
    const saved = await repo.save(entity);
    expect(saved.id).toBe(entity.id);
    expect((await repo.findByEmail(EmailAddress.create(entity.email.getValue()))).id).toBe(
      entity.id,
    );
    expect((await repo.findByGoogleId(entity.googleId)).id).toBe(entity.id);
    expect(await repo.existsByEmail(entity.email)).toBe(true);
    expect(await repo.existsByGoogleId(entity.googleId)).toBe(true);
    expect(await repo.count()).toBeGreaterThan(6);
    saved.updateProfile({ bio: 'Updated bio' });
    await repo.save(saved);
    expect((await repo.findById(entity.id)).bio).toBe('Updated bio');
    saved.softDelete();
    await repo.save(saved);
    expect(await repo.findById(entity.id)).toBeNull();
    expect(await repo.findByEmail(entity.email)).toBeNull();
    expect(await repo.findByGoogleId(entity.googleId)).toBeNull();
    expect(await repo.existsByEmail(entity.email)).toBe(false);
    expect(await repo.existsByGoogleId(entity.googleId)).toBe(false);
    await repo.delete(entity.id);
  });
  it('persists recipe changes and cascade deletes nested steps', async () => {
    const { Recipe } = await import('../src/domain/entities/Recipe.js');
    const { RecipeDifficulty } = await import('../src/domain/enums/RecipeDifficulty.js');
    const entity = Recipe.create({
      title: `Recipe ${runId}`,
      description: 'A real recipe',
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      difficulty: RecipeDifficulty.EASY,
      categoryId: category.id,
      authorId: owner.id,
      nutrition: { calories: 120, protein: 5, carbohydrates: 10, fat: 3, fiber: 1, sodium: 10 },
    });
    const saved = await container.recipeRepository.save(entity);
    expect(saved.nutrition.calories).toBe(120);
    saved.update({ servings: 4 });
    await container.recipeRepository.save(saved);
    expect((await container.recipeRepository.findById(entity.id)).servings).toBe(4);
    await prisma.recipeStep.create({
      data: { recipeId: entity.id, stepNumber: 1, title: 'Wash', description: 'Wash well' },
    });
    await container.recipeRepository.delete(entity.id);
    expect(await prisma.recipeStep.count({ where: { recipeId: entity.id } })).toBe(0);
  });
  it('rolls back a real transaction when subsequent work fails', async () => {
    const { runInTransaction, prisma: audited } =
      await import('../src/config-middleware/shared/database/client.js');
    const slug = `rollback-${runId}`;
    await expect(
      runInTransaction(async (tx) => {
        await tx.category.create({ data: { name: slug, slug } });
        throw new Error('Deliberate rollback');
      }),
    ).rejects.toThrow('Deliberate rollback');
    expect(await audited.category.findFirst({ where: { slug } })).toBeNull();
  });
  it('sets audit fields and excludes soft-deleted data using real Prisma middleware', async () => {
    const { prisma: audited } = await import('../src/config-middleware/shared/database/client.js');
    const name = `audit-${runId}`;
    await audited.category.createMany({
      data: [
        { name, slug: name },
        { name: `${name}-deleted`, slug: `${name}-deleted`, isDeleted: true },
      ],
    });
    const result = await audited.category.findMany({ where: { slug: { startsWith: name } } });
    expect(result).toHaveLength(1);
    expect(result[0].version).toBe(1);
    const updated = await audited.category.update({
      where: { id: result[0].id },
      data: { description: 'Audited' },
    });
    expect(updated.version).toBe(2);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(result[0].updatedAt.getTime());
    await audited.category.updateMany({
      where: { slug: { startsWith: name } },
      data: { orderIndex: 4 },
    });
    expect((await audited.category.findUnique({ where: { id: result[0].id } }))?.version).toBe(3);
    expect(
      await audited.category.findFirst({ where: { slug: `${name}-deleted`, isDeleted: true } }),
    ).not.toBeNull();
  });
});

describe('Real HTTP, JWT and ingredient command handlers', () => {
  it('reads manageable recipes and enforces owner authorization', async () => {
    const list = await request(app)
      .get('/api/v1/recipes/manage?page=1&pageSize=2')
      .set('Authorization', bearer());
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(2);
    expect(list.body.items.every((item: any) => item.authorId === owner.id)).toBe(true);
    const all = await request(app)
      .get('/api/v1/recipes/manage')
      .set('Authorization', bearer(adminToken));
    expect(all.status).toBe(200);
    expect(all.body.meta.totalCount).toBe(100);
    expect(
      (
        await request(app)
          .get(`/api/v1/recipes/${recipe.id}/ingredients`)
          .set('Authorization', bearer(otherToken))
      ).status,
    ).toBe(403);
    expect((await request(app).get(`/api/v1/recipes/${recipe.id}/ingredients`)).status).toBe(401);
    expect(
      (await request(app).get('/api/v1/recipes/manage?page=0').set('Authorization', bearer()))
        .status,
    ).toBe(422);
  });
  it('adds, reads, updates and soft deletes an ingredient through HTTP and PostgreSQL', async () => {
    const path = `/api/v1/recipes/${recipe.id}/ingredients`;
    const created = await request(app).post(path).set('Authorization', bearer()).send({
      name: 'Integration rice',
      quantity: 2.5,
      unit: 'kg',
      notes: 'Fresh',
      orderIndex: 40,
    });
    expect(created.status).toBe(201);
    expect(created.body.quantity).toBe(2.5);
    const id = created.body.id;
    expect(
      Number((await prisma.recipeIngredient.findUniqueOrThrow({ where: { id } })).quantity),
    ).toBe(2.5);
    const read = await request(app).get(path).set('Authorization', bearer());
    expect(read.status).toBe(200);
    expect(read.body.some((item: any) => item.id === id)).toBe(true);
    const updated = await request(app)
      .put(`${path}/${id}`)
      .set('Authorization', bearer())
      .send({ name: 'Updated rice', quantity: 3, unit: 'g', notes: 'Washed', orderIndex: 41 });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id,
      name: 'Updated rice',
      quantity: 3,
      unit: 'g',
      notes: 'Washed',
      orderIndex: 41,
    });
    expect((await request(app).delete(`${path}/${id}`).set('Authorization', bearer())).status).toBe(
      204,
    );
    expect((await prisma.recipeIngredient.findUniqueOrThrow({ where: { id } })).isDeleted).toBe(
      true,
    );
    expect(
      (await request(app).get(path).set('Authorization', bearer())).body.some(
        (item: any) => item.id === id,
      ),
    ).toBe(false);
    expect(
      (
        await request(app)
          .put(`${path}/${id}`)
          .set('Authorization', bearer())
          .send({ name: 'Rice' })
      ).status,
    ).toBe(404);
  });
  it('allows Admin mutations and rejects invalid payloads', async () => {
    const path = `/api/v1/recipes/${recipe.id}/ingredients`;
    const created = await request(app)
      .post(path)
      .set('Authorization', bearer(adminToken))
      .send({ name: 'Salt' });
    expect(created.status).toBe(201);
    expect(created.body.orderIndex).toBe(0);
    expect(created.body.quantity).toBeUndefined();
    expect(
      (
        await request(app)
          .post(path)
          .set('Authorization', bearer())
          .send({ name: '', quantity: -1 })
      ).status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .put(`${path}/${created.body.id}`)
          .set('Authorization', bearer())
          .send({ quantity: -1 })
      ).status,
    ).toBe(422);
    expect(
      (await request(app).delete(`${path}/${randomUUID()}`).set('Authorization', bearer())).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get(`/api/v1/recipes/${randomUUID()}/ingredients`)
          .set('Authorization', bearer(adminToken))
      ).status,
    ).toBe(404);
  });
  it('rejects command ownership, missing recipes and invalid inputs before writes', async () => {
    const {
      AddRecipeIngredientCommand: Add,
      UpdateRecipeIngredientCommand: Update,
      DeleteRecipeIngredientCommand: Delete,
    } = modules.ingredients;
    const bus = container.commandBus;
    for (const cmd of [
      new Add(recipe.id, other.id, 'Rice'),
      new Update(recipe.id, other.id, randomUUID(), 'Rice'),
      new Delete(recipe.id, other.id, randomUUID()),
    ])
      await expect(bus.executeCommand(cmd)).rejects.toMatchObject({ statusCode: 403 });
    for (const cmd of [
      new Add(randomUUID(), owner.id, 'Rice'),
      new Update(randomUUID(), owner.id, randomUUID(), 'Rice'),
      new Delete(randomUUID(), owner.id, randomUUID()),
    ])
      await expect(bus.executeCommand(cmd)).rejects.toMatchObject({ statusCode: 404 });
    await expect(bus.executeCommand(new Add(recipe.id, owner.id, ' '))).rejects.toMatchObject({
      statusCode: 422,
    });
    await expect(
      bus.executeCommand(new Add(recipe.id, owner.id, 'Rice', Number.NaN)),
    ).rejects.toMatchObject({ statusCode: 422 });
    const created: any = await bus.executeCommand(new Add(recipe.id, owner.id, 'Pepper'));
    await expect(
      bus.executeCommand(new Update(recipe.id, owner.id, created.id, ' ')),
    ).rejects.toMatchObject({ statusCode: 422 });
    await expect(
      bus.executeCommand(new Update(recipe.id, owner.id, created.id, undefined, Number.NaN)),
    ).rejects.toMatchObject({ statusCode: 422 });
  });
  it('reads and updates a profile through genuine JWT authentication', async () => {
    const profile = await request(app).get('/api/v1/auth/me').set('Authorization', bearer());
    expect(profile.status).toBe(200);
    expect(profile.body.id).toBe(owner.id);
    const updated = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', bearer())
      .send({
        displayName: 'Integration chef',
        bio: 'Real DB profile',
        avatarUrl: 'https://example.invalid/photo.png',
      });
    expect(updated.status).toBe(200);
    expect(updated.body.bio).toBe('Real DB profile');
    expect((await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })).displayName).toBe(
      'Integration chef',
    );
    expect(
      (
        await request(app)
          .patch('/api/v1/auth/me')
          .set('Authorization', bearer())
          .send({ displayName: '' })
      ).status,
    ).toBe(422);
    expect(
      (await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid')).status,
    ).toBe(401);
    await expect(
      container.commandBus.executeCommand(
        new modules.auth.UpdateProfileCommand(randomUUID(), { bio: 'missing' }),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
    const { GetCurrentUserQuery } = await import('../src/application/queries/auth/AuthQueries.js');
    await expect(
      container.commandBus.executeQuery(new GetCurrentUserQuery(randomUUID())),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
  it('registers, logs in, rotates tokens, detects reuse and logs out with real persistence', async () => {
    const address = `register-${runId}@example.invalid`;
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Integration Author',
        email: address,
        userName: `it${runId.slice(0, 16)}`,
        password: 'Integration1!',
      });
    expect(registered.status).toBe(201);
    expect((await waitForMail(address))[0].Content.Body).toContain('Integration Author');
    const loggedIn = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: address, password: 'Integration1!' });
    expect(loggedIn.status).toBe(200);
    const rotated = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loggedIn.body.refreshToken });
    expect(rotated.status).toBe(200);
    expect(rotated.body.refreshToken).not.toBe(loggedIn.body.refreshToken);
    const reused = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loggedIn.body.refreshToken });
    expect(reused.status).toBe(401);
    expect(reused.body.type).toBe('AUTH_REFRESH_REUSED');
    expect(
      (
        await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: rotated.body.refreshToken })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', bearer(registered.body.accessToken))
          .send({ refreshToken: registered.body.refreshToken })
      ).status,
    ).toBe(204);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', bearer(registered.body.accessToken))
          .send({ refreshToken: registered.body.refreshToken })
      ).status,
    ).toBe(204);
    expect(
      (await request(app).post('/api/v1/auth/logout').set('Authorization', bearer()).send({}))
        .status,
    ).toBe(401);
  }, 30000);
  it('rejects expired, unknown and inactive-user refresh tokens', async () => {
    const service = container.jwtService;
    expect(
      (
        await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: 'missing-refresh-token' })
      ).status,
    ).toBe(401);
    const value = service.generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: other.id,
        tokenHash: service.hashRefreshToken(value),
        expiresAt: new Date(0),
      },
    });
    const expired = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: value });
    expect(expired.status).toBe(401);
    expect(expired.body.type).toBe('AUTH_REFRESH_EXPIRED');
    const inactive = await prisma.user.create({
      data: {
        email: `inactive-${runId}@example.invalid`,
        displayName: 'Inactive',
        isActive: false,
      },
    });
    const inactiveToken = service.generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: inactive.id,
        tokenHash: service.hashRefreshToken(inactiveToken),
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const result = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: inactiveToken });
    expect(result.status).toBe(401);
    expect(result.body.type).toBe('AUTH_REFRESH_USER_INACTIVE');
    expect(service.verifyAccessToken(token)?.userId).toBe(owner.id);
    expect(service.verifyAccessToken('invalid')).toBeNull();
    expect(service.decodeToken(token)?.userId).toBe(owner.id);
    expect(service.decodeToken('invalid')).toBeNull();
    expect(service.verifyRefreshToken(value)).toBe(service.hashRefreshToken(value));
  });
});

describe('Real Redis, MinIO, MailHog and job queues', () => {
  it('stores JSON with TTL and deletes only the test namespace', async () => {
    const cache = container.cacheService;
    await cache.connect();
    expect(cache.isReady()).toBe(true);
    await cache.set(`${prefix}:one`, { count: 2 }, 60);
    expect(await cache.get(`${prefix}:one`)).toEqual({ count: 2 });
    expect(await cache.exists(`${prefix}:one`)).toBe(true);
    expect(await redis.ttl(`${prefix}:one`)).toBeGreaterThan(0);
    await redis.set(`${prefix}:bad-json`, '{');
    expect(await cache.get(`${prefix}:bad-json`)).toBeNull();
    await cache.delete(`${prefix}:one`);
    expect(await cache.exists(`${prefix}:one`)).toBe(false);
    await cache.deletePattern(`${prefix}:*`);
    expect(await cache.get(`${prefix}:bad-json`)).toBeNull();
    await cache.deletePattern(`${prefix}:*`);
  });
  it('uses genuine cache hits and invalidates the result after a command', async () => {
    const pipeline = await import('../src/application/pipelines/pipelineMiddleware.js');
    const query = {
      type: 'IntegrationQuery',
      getCacheKey: () => `${prefix}:pipeline`,
      getCacheTtl: () => 60,
    };
    let calls = 0;
    const next = async () => ({ call: ++calls });
    expect(await pipeline.cachingMiddleware(query as never, next)).toEqual({ call: 1 });
    expect(await pipeline.cachingMiddleware(query as never, next)).toEqual({ call: 1 });
    expect(calls).toBe(1);
    const cmd = {
      type: 'IntegrationCommand',
      getCacheKeysToInvalidate: () => [`${prefix}:pipeline`],
    };
    expect(await pipeline.cacheInvalidationMiddleware(cmd as never, async () => 'saved')).toBe(
      'saved',
    );
    expect(await container.cacheService.get(`${prefix}:pipeline`)).toBeNull();
    expect(await pipeline.cachingMiddleware({ type: 'PlainQuery' } as never, next)).toEqual({
      call: 2,
    });
    expect(
      await pipeline.cacheInvalidationMiddleware(
        { type: 'PlainCommand' } as never,
        async () => 'plain',
      ),
    ).toBe('plain');
    expect(await pipeline.loggingMiddleware(query as never, async () => 'logged')).toBe('logged');
    expect(await pipeline.validationMiddleware(query as never, async () => 'valid')).toBe('valid');
  });
  it('uploads to MinIO, downloads a real signed URL and deletes the object', async () => {
    const service = container.fileStorageService;
    const key = `integration/${runId}.png`;
    objectKeys.add(key);
    const bytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG1kAAAAASUVORK5CYII=',
      'base64',
    );
    expect(await service.uploadFile(key, bytes, 'image/png')).toContain(`/${prefix}/${key}`);
    const metadata = await s3.send(new HeadObjectCommand({ Bucket: prefix, Key: key }));
    expect(metadata.ContentType).toBe('image/png');
    expect(metadata.ContentLength).toBe(bytes.length);
    const downloaded = await fetch(await service.generatePresignedUrl(key, 60));
    expect(downloaded.ok).toBe(true);
    expect(Buffer.from(await downloaded.arrayBuffer())).toEqual(bytes);
    expect(await service.generatePresignedUrl(key)).toContain('X-Amz-Expires=3600');
    await service.deleteFile(key);
    await expect(
      s3.send(new HeadObjectCommand({ Bucket: prefix, Key: key })),
    ).rejects.toMatchObject({ $metadata: { httpStatusCode: 404 } });
    await service.deleteFile(key);
  });
  it('delivers actual welcome, reset and verification emails into MailHog', async () => {
    const address = `mail-${runId}@example.invalid`;
    await container.emailService.sendWelcomeEmail(address, 'Integration cook');
    await container.emailService.sendPasswordResetEmail(address, `reset-${runId}`);
    await container.emailService.sendEmailVerificationEmail(address, `verify-${runId}`);
    const items = await waitForMail(address);
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.Content.Headers.Subject[0])).toEqual(
      expect.arrayContaining([
        'Reset Your Password - Culinary Blog',
        'Verify Your Email - Culinary Blog',
      ]),
    );
    expect(items.some((item) => item.Content.Body.includes(`reset-${runId}`))).toBe(true);
    expect(items.some((item) => item.Content.Body.includes(`verify-${runId}`))).toBe(true);
  });
  it('processes isolated Redis jobs and schedules sitemap generation', async () => {
    const images = await import('../src/infrastructure/jobs/queues/imageResizeQueue.js');
    const sitemap = await import('../src/infrastructure/jobs/queues/sitemapQueue.js');
    const { QueueEvents } = await import('bullmq');
    const events = new QueueEvents('image-resize', {
      prefix,
      connection: { host: '127.0.0.1', port: Number(new URL(process.env.REDIS_URL!).port || 6379) },
    });
    await events.waitUntilReady();
    try {
      await images.addImageResizeJob({
        recipeId: recipe.id,
        imageId: 'integration-image',
        originalUrl: 'https://example.invalid/test.png',
      });
      const jobs = await images.imageResizeQueue.getJobs(['waiting', 'active', 'completed']);
      expect(jobs).toHaveLength(1);
      await jobs[0].waitUntilFinished(events, 15000);
      expect(await jobs[0].getState()).toBe('completed');
      await sitemap.addSitemapJob();
      await sitemap.addSitemapJob({ trigger: 'scheduled' });
      await sitemap.scheduleSitemapJob();
      expect(await sitemap.sitemapQueue.getRepeatableJobs()).toHaveLength(1);
    } finally {
      await events.close();
    }
  }, 20000);
  it('checks live database and Redis health and reports disconnection', async () => {
    const health = container.healthCheckService;
    expect((await health.checkAll()).status).toBe('healthy');
    expect(await health.checkLiveness()).toEqual({ status: 'alive' });
    expect((await health.checkReadiness()).status).toBe('healthy');
    await container.cacheService.disconnect();
    expect((await health.checkAll()).status).toBe('degraded');
    expect(container.cacheService.isReady()).toBe(false);
    expect(await container.cacheService.get('disconnected')).toBeNull();
    expect(await container.cacheService.exists('disconnected')).toBe(false);
    await container.cacheService.set(`${prefix}:disconnected`, {}, 60);
    await container.cacheService.delete(`${prefix}:disconnected`);
    await container.cacheService.deletePattern(`${prefix}:*`);
    await container.cacheService.connect();
    expect((await health.checkAll()).status).toBe('healthy');
  });
  it('hashes and verifies passwords with actual argon2 and bcrypt', async () => {
    const { PasswordService } = await import('../src/infrastructure/auth/PasswordService.js');
    const { default: bcrypt } = await import('bcryptjs');
    const hash = await PasswordService.hash('Integration1!');
    expect(await PasswordService.verify('Integration1!', hash)).toBe(true);
    expect(await PasswordService.verify('wrong', hash)).toBe(false);
    expect(await PasswordService.needsRehash(hash)).toBe(false);
    const legacy = await bcrypt.hash('Integration1!', 4);
    expect(await PasswordService.verify('Integration1!', legacy)).toBe(true);
    expect(await PasswordService.needsRehash(legacy)).toBe(true);
    expect(await PasswordService.verify('wrong', 'invalid-hash')).toBe(false);
  }, 10000);
});
