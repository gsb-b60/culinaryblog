import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import request from 'supertest';

import { startIngredientIntegration } from './support/ingredientIntegration.js';

const backend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(backend, '..');
const frontend = resolve(root, 'frontend');
const evidence = resolve(root, 'docs/reports/huynh-thanh/evidence/issue-34-step-management');
const require = createRequire(resolve(frontend, 'package.json'));
const { chromium, expect: baseExpect } =
  require('@playwright/test') as typeof import('@playwright/test');
const expect = baseExpect.configure({ timeout: 30000 });

const startedAt = new Date().toISOString();
const apiResponses: Array<{ method: string; path: string; status: number }> = [];
const checks: string[] = [];
const pageErrors: string[] = [];
let fixture: Awaited<ReturnType<typeof startIngredientIntegration>> | undefined;
let api: ReturnType<Awaited<ReturnType<typeof startIngredientIntegration>>['app']['listen']> | undefined;
let web: ChildProcess | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let webOutput = '';

function call(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  token?: string,
) {
  const action = request(fixture!.app)[method](path);
  return token ? action.set('Authorization', `Bearer ${token}`) : action;
}

async function waitForWeb(url: string): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (web?.exitCode !== null && web?.exitCode !== undefined) {
      throw new Error(`Vite exited before it was ready:\n${webOutput}`);
    }
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    }
  }
  throw new Error(`Vite did not become ready:\n${webOutput}`);
}

async function closeChild(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise<void>((resolveWait) => child.once('exit', () => resolveWait())),
    new Promise<void>((resolveWait) => setTimeout(resolveWait, 5000)),
  ]);
}

try {
  mkdirSync(evidence, { recursive: true });
  fixture = await startIngredientIntegration();
  api = fixture.app.listen(0, '127.0.0.1');
  await new Promise<void>((resolveWait) => api!.once('listening', resolveWait));
  const address = api.address();
  assert(address && typeof address !== 'string');
  const apiBase = `http://127.0.0.1:${address.port}/api/v1`;
  web = spawn(
    process.execPath,
    [
      resolve(frontend, 'node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '5187',
      '--strictPort',
    ],
    {
      cwd: frontend,
      env: { ...process.env, VITE_API_BASE_URL: apiBase },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  web.stdout?.on('data', (chunk) => {
    webOutput = (webOutput + chunk).slice(-6000);
  });
  web.stderr?.on('data', (chunk) => {
    webOutput = (webOutput + chunk).slice(-6000);
  });
  await waitForWeb('http://127.0.0.1:5187');

  const recipe = fixture.recipes[13]!;
  const recipePath = `/api/v1/recipes/${recipe.id}/steps`;
  const unauthenticated = await call('get', recipePath);
  assert.equal(unauthenticated.status, 401);
  const forbidden = await call('get', recipePath, fixture.otherToken);
  assert.equal(forbidden.status, 403);
  const invalid = await call('post', recipePath, fixture.ownerToken).send({
    title: ' ',
    description: 'No title',
  });
  assert.equal(invalid.status, 422);
  checks.push('API authentication, owner authorization and validation errors return 401/403/422.');

  browser = await chromium.launch({
    channel: process.env.E2E_BROWSER_CHANNEL || undefined,
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(
    (session) => localStorage.setItem('culinary_session', JSON.stringify(session)),
    fixture.session,
  );
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(apiBase)) {
      apiResponses.push({
        method: response.request().method(),
        path: new URL(response.url()).pathname,
        status: response.status(),
      });
    }
  });
  await page.goto(
    `http://127.0.0.1:5187/dashboard/steps?recipeId=${recipe.id}&page=1&pageSize=12`,
    { waitUntil: 'domcontentloaded', timeout: 120000 },
  );
  await expect(page.getByRole('heading', { name: 'Quản lý các bước nấu' })).toBeVisible();
  await expect(page.getByLabel('Chọn công thức', { exact: true })).toHaveValue(recipe.id);
  await expect(page.getByRole('button', { name: 'Thêm bước nấu' })).toBeEnabled();

  await page.getByLabel('Thêm - Tiêu đề bước').fill('Chuẩn bị nguyên liệu');
  await page.getByLabel('Thêm - Hướng dẫn').fill('Rửa và sơ chế toàn bộ nguyên liệu.');
  await page.getByLabel('Thêm - Thời gian').fill('3');
  await page.getByRole('button', { name: 'Thêm bước nấu' }).click();
  await expect(page.getByText('Bước 1: Chuẩn bị nguyên liệu')).toBeVisible();
  await page.screenshot({ path: resolve(evidence, 'desktop.png'), fullPage: true });

  await page.getByLabel('Thêm - Tiêu đề bước').fill('Nấu món ăn');
  await page.getByLabel('Thêm - Hướng dẫn').fill('Nấu chín các nguyên liệu.');
  await page.getByLabel('Thêm - Thời gian').fill('20');
  await page.getByRole('button', { name: 'Thêm bước nấu' }).click();
  await expect(page.getByText('Bước 2: Nấu món ăn')).toBeVisible();

  await page.getByLabel('Thêm - Tiêu đề bước').fill('Trình bày');
  await page.getByLabel('Thêm - Hướng dẫn').fill('Trình bày món ăn ra đĩa.');
  await page.getByLabel('Thêm - URL hình minh họa').fill('https://example.com/plating.jpg');
  await page.getByRole('button', { name: 'Thêm bước nấu' }).click();
  await expect(page.getByText('Bước 3: Trình bày')).toBeVisible();

  await page.getByRole('button', { name: 'Sửa bước 3' }).click();
  await page.getByLabel('Sửa - Tiêu đề bước').fill('Hoàn tất món ăn');
  await page.getByLabel('Thứ tự bước').fill('2');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText('Bước 2: Hoàn tất món ăn')).toBeVisible();
  await expect(page.getByText('Bước 3: Nấu món ăn')).toBeVisible();

  await page.getByRole('button', { name: 'Xóa bước 1' }).click();
  await page.getByRole('button', { name: 'Xác nhận xóa' }).click();
  await expect(page.getByText('Bước 1: Hoàn tất món ăn')).toBeVisible();
  await expect(page.getByText('Bước 2: Nấu món ăn')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('cập nhật lại thứ tự');
  checks.push('Real Chromium UI completed create, update/reorder and delete/renumber for recipe steps.');

  const persisted = await fixture.prisma.recipeStep.findMany({
    where: { recipeId: recipe.id, isDeleted: false },
    orderBy: { stepNumber: 'asc' },
  });
  assert.deepEqual(
    persisted.map((step) => [step.stepNumber, step.title]),
    [[1, 'Hoàn tất món ăn'], [2, 'Nấu món ăn']],
  );
  assert.equal(persisted[0]!.imageUrl, 'https://example.com/plating.jpg');
  checks.push('PostgreSQL persisted edited step content and sequential numbering after deletion.');

  const stepsRouteResponses = apiResponses.filter((response) =>
    response.path.endsWith(`/recipes/${recipe.id}/steps`) ||
    response.path.includes(`/recipes/${recipe.id}/steps/`),
  );
  assert(
    stepsRouteResponses.some((response) => response.method === 'GET' && response.status === 200),
  );
  assert(
    stepsRouteResponses.some((response) => response.method === 'POST' && response.status === 201),
  );
  assert(
    stepsRouteResponses.some((response) => response.method === 'PUT' && response.status === 200),
  );
  assert(
    stepsRouteResponses.some((response) => response.method === 'DELETE' && response.status === 204),
  );
  assert.deepEqual(pageErrors, []);
  checks.push('Desktop screenshot captured after adding the first step; browser reported no page errors.');

  const finishedAt = new Date().toISOString();
  rmSync(resolve(evidence, 'failure.txt'), { force: true });
  writeFileSync(
    resolve(evidence, 'result.json'),
    JSON.stringify(
      {
        feature: 'FR-RCP-010',
        issue: 34,
        result: 'passed',
        startedAt,
        finishedAt,
        services: 'Real isolated PostgreSQL schema, Express/CQRS/Prisma, Vite and Chromium; no API response mocking.',
        recipeId: recipe.id,
        checks,
        apiResponses,
        pageErrors,
        screenshots: ['desktop.png'],
      },
      null,
      2,
    ) + '\n',
  );
} catch (error) {
  writeFileSync(
    resolve(evidence, 'failure.txt'),
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n\nAPI responses:\n${JSON.stringify(apiResponses, null, 2)}\n\nBrowser errors:\n${JSON.stringify(pageErrors, null, 2)}\n\nVite output:\n${webOutput}`,
  );
  throw error;
} finally {
  await browser?.close();
  await closeChild(web);
  if (api) await new Promise<void>((resolveWait) => api!.close(() => resolveWait()));
  await fixture?.close();
}

console.log(`FR-RCP-010 E2E passed; evidence saved to ${evidence}`);
