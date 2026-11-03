import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { openApiSpec, setupOpenAPI } from '../src/presentation/docs/openapi.js';

function buildDocsApp() {
  const app = express();
  setupOpenAPI(app);
  return app;
}

describe('OpenAPI docs and versioning', () => {
  it('serves a valid OpenAPI 3.0 spec with all modules', async () => {
    const app = buildDocsApp();
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\.0\./);
    expect(res.body.info.title).toBe('LetHimCook API');
    expect(res.body.servers[0].url).toBe('/api/v1');

    const paths = Object.keys(res.body.paths);
    // auth
    expect(paths).toContain('/auth/register');
    expect(paths).toContain('/auth/login');
    expect(paths).toContain('/auth/refresh');
    expect(paths).toContain('/auth/me');
    // categories
    expect(paths).toContain('/categories');
    expect(paths).toContain('/categories/{slug}');
    // recipes
    expect(paths).toContain('/recipes');
    expect(paths).toContain('/recipes/search');
    expect(paths).toContain('/recipes/{slug}');
    expect(paths).toContain('/recipes/{id}');
    expect(paths).toContain('/recipes/{id}/publish');
    expect(paths).toContain('/recipes/{id}/ingredients');
  });

  it('keeps /api-docs alias and /scalar reference UI', async () => {
    const app = buildDocsApp();
    const json = await request(app).get('/api-docs');
    expect(json.status).toBe(200);
    expect(json.body.openapi).toMatch(/^3\.0\./);

    const scalar = await request(app).get('/scalar');
    expect(scalar.status).toBe(200);
    expect(scalar.text).toContain('/api-docs.json');
  });

  it('exports the same spec object used by the route', () => {
    expect(openApiSpec.paths['/auth/login']).toBeDefined();
    expect(openApiSpec.components.securitySchemes).toHaveProperty('bearerAuth');
    expect(openApiSpec.components.schemas).toHaveProperty('ProblemDetails');
  });
});
