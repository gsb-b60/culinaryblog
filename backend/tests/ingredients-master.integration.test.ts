import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startIngredientIntegration } from './support/ingredientIntegration.js';

let fixture: Awaited<ReturnType<typeof startIngredientIntegration>>;
beforeAll(async () => {
  fixture = await startIngredientIntegration();
}, 120000);
afterAll(async () => {
  if (fixture) await fixture.close();
}, 30000);
function call(method: 'get' | 'post' | 'put' | 'delete', path: string, token = fixture.ownerToken) {
  return request(fixture.app)[method](path).set('Authorization', `Bearer ${token}`);
}
function path() {
  return `/api/v1/recipes/${fixture.recipes[13]!.id}/ingredients`;
}

describe('FR-RCP-009 on latest master: real PostgreSQL, Passport, routes and Command Bus', () => {
  it('uses the master /manage contract and paginates owner recipes', async () => {
    const first = await call('get', '/api/v1/recipes/manage?page=1&pageSize=12');
    expect(first.status).toBe(200);
    expect(first.body.items).toHaveLength(12);
    expect(first.body.meta.totalCount).toBe(14);
    expect(
      first.body.items.every((item: { authorId: string }) => item.authorId === fixture.owner.id),
    ).toBe(true);
    const second = await call('get', '/api/v1/recipes/manage?page=2&pageSize=12');
    expect(second.status).toBe(200);
    expect(second.body.items).toHaveLength(2);
    expect(second.body.meta.page).toBe(2);
    const admin = await call('get', '/api/v1/recipes/manage', fixture.adminToken);
    expect(admin.body.meta.totalCount).toBe(15);
  });
  it('persists ingredient CRUD, excludes deleted rows and allows Admin', async () => {
    const added = await call('post', path()).send({
      name: '  Gạo  ',
      quantity: 2.5,
      unit: 'kg',
      notes: 'Vo sạch',
      orderIndex: 3,
    });
    expect(added.status).toBe(201);
    expect(added.body).toMatchObject({ name: 'Gạo', quantity: 2.5 });
    const id: string = added.body.id;
    expect(
      Number((await fixture.prisma.recipeIngredient.findUniqueOrThrow({ where: { id } })).quantity),
    ).toBe(2.5);
    const read = await call('get', path());
    expect(read.status).toBe(200);
    expect(read.body).toHaveLength(1);
    const updated = await call('put', `${path()}/${id}`, fixture.adminToken).send({
      name: 'Gạo mới',
      quantity: 3,
      unit: 'g',
      notes: '',
      orderIndex: 1,
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id,
      name: 'Gạo mới',
      quantity: 3,
      unit: 'g',
      notes: '',
      orderIndex: 1,
    });
    const deleted = await call('delete', `${path()}/${id}`);
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');
    expect(
      (await fixture.prisma.recipeIngredient.findUniqueOrThrow({ where: { id } })).isDeleted,
    ).toBe(true);
    expect((await call('get', path())).body).toEqual([]);
    expect((await call('put', `${path()}/${id}`).send({ name: 'Missing' })).status).toBe(404);
  });
  it('returns 401 without JWT and 403 for non-owners for every ingredient method', async () => {
    for (const method of ['get', 'post', 'put', 'delete'] as const) {
      const url = ['put', 'delete'].includes(method) ? `${path()}/${randomUUID()}` : path();
      expect(
        (
          await request(fixture.app)
            [method](url)
            .send(method === 'post' || method === 'put' ? { name: 'Salt' } : undefined)
        ).status,
      ).toBe(401);
      expect(
        (
          await call(method, url, fixture.otherToken).send(
            method === 'post' || method === 'put' ? { name: 'Salt' } : undefined,
          )
        ).status,
      ).toBe(403);
    }
  });
  it('returns 404 for missing recipes, missing ingredients and ingredients in another recipe', async () => {
    const missing = `/api/v1/recipes/${randomUUID()}/ingredients`;
    for (const method of ['get', 'post', 'put', 'delete'] as const) {
      const url = ['put', 'delete'].includes(method) ? `${missing}/${randomUUID()}` : missing;
      expect(
        (
          await call(method, url).send(
            method === 'post' || method === 'put' ? { name: 'Salt' } : undefined,
          )
        ).status,
      ).toBe(404);
    }
    const foreign = await fixture.prisma.recipeIngredient.create({
      data: { recipeId: fixture.foreign.id, name: 'Other recipe ingredient' },
    });
    expect(
      (await call('put', `${path()}/${foreign.id}`).send({ name: 'Wrong recipe' })).status,
    ).toBe(404);
    expect((await call('delete', `${path()}/${foreign.id}`)).status).toBe(404);
    expect(
      (await fixture.prisma.recipeIngredient.findUniqueOrThrow({ where: { id: foreign.id } }))
        .isDeleted,
    ).toBe(false);
  });
  it('returns 422 without writes for invalid names, quantity and ordering', async () => {
    const before = await fixture.prisma.recipeIngredient.count();
    for (const body of [
      {},
      { name: '   ' },
      { name: 'Salt', quantity: 0 },
      { name: 'Salt', quantity: -1 },
      { name: 'Salt', quantity: 1000000 },
      { name: 'Salt', orderIndex: -1 },
    ]) {
      expect((await call('post', path()).send(body)).status).toBe(422);
    }
    expect(await fixture.prisma.recipeIngredient.count()).toBe(before);
  });
  it('orders ingredients and preserves optional values in the read DTO', async () => {
    const lower = await call('post', path()).send({ name: 'Muối', orderIndex: 0 });
    const higher = await call('post', path()).send({ name: 'Tiêu', orderIndex: 9 });
    expect(lower.status).toBe(201);
    expect(higher.status).toBe(201);
    const result = await call('get', path());
    expect(result.body.map((item: { id: string }) => item.id)).toEqual([
      lower.body.id,
      higher.body.id,
    ]);
    expect(result.body[0].quantity).toBeUndefined();
  });
  it('advertises the new GET endpoint in Scalar/OpenAPI', async () => {
    const spec = await request(fixture.app).get('/api-docs.json');
    expect(spec.status).toBe(200);
    expect(spec.body.paths['/recipes/{id}/ingredients'].get.responses['200']).toBeDefined();
    expect((await request(fixture.app).get('/scalar')).status).toBe(200);
  });
});
