import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const out = resolve(root, 'docs/reports/huynh-thanh/evidence/fr-rcp-006-verified');
const fr = createRequire(resolve(root, 'frontend/package.json'));
const { chromium, expect } = fr('@playwright/test');
const result = {
  branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceState: 'working tree (uncommitted Archive Recipe changes)',
  startedAt: new Date().toISOString(), requests: [], checks: {},
};
let fixture, server, web, browser, cache;
const deadline = setTimeout(() => { console.error('Evidence timeout'); process.exit(1); }, 240000);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
async function poll(check, label) {
  for (let n = 0; n < 100; n++) {
    if (await check()) return;
    await new Promise(resolvePoll => setTimeout(resolvePoll, 300));
  }
  throw new Error('Timeout: ' + label);
}
try {
  const { startIngredientIntegration } = await import(pathToFileURL(resolve(root, 'backend/tests/support/ingredientIntegration.ts')).href);
  fixture = await startIngredientIntegration();
  const { getContainer } = await import(pathToFileURL(resolve(root, 'backend/src/presentation/di/container.ts')).href);
  cache = getContainer().cacheService;
  await cache.connect();
  const { default: categoryRoutes } = await import(pathToFileURL(resolve(root, 'backend/src/presentation/routes/categoryRoutes.ts')).href);
  const { globalErrorHandler } = await import(pathToFileURL(resolve(root, 'backend/src/presentation/middleware/GlobalErrorHandler.ts')).href);
  fixture.app.use('/api/v1/categories', categoryRoutes);
  fixture.app.use(globalErrorHandler);
  const target = fixture.recipes[13];
  const category = await fixture.prisma.category.findUniqueOrThrow({ where: { id: target.categoryId } });
  const title = 'Canh rau củ — Minh chứng lưu trữ';
  await fixture.prisma.user.update({ where: { id: fixture.owner.id }, data: { displayName: 'Huỳnh Thành', fullName: 'Huỳnh Thành' } });
  await fixture.prisma.category.update({ where: { id: category.id }, data: { name: 'Món canh' } });
  await fixture.prisma.recipe.update({ where: { id: target.id }, data: {
    title, description: 'Công thức kiểm thử FR-RCP-006: giữ nguyên nguyên liệu, các bước và hình ảnh sau khi lưu trữ.',
  } });
  await fixture.prisma.recipeStep.create({ data: { recipeId: target.id, stepNumber: 1, title: 'Nấu canh rau củ', description: 'Đun sôi nước, thêm rau củ và nấu chín trong 20 phút.', timerMinutes: 20 } });
  await fixture.prisma.recipeIngredient.createMany({ data: [
    { recipeId: target.id, name: 'Rau cải', quantity: 200, unit: 'g', orderIndex: 0 },
    { recipeId: target.id, name: 'Cà rốt', quantity: 1, unit: 'củ', orderIndex: 1 },
    { recipeId: target.id, name: 'Nước', quantity: 1, unit: 'lít', orderIndex: 2 },
  ] });
  await fixture.prisma.recipeImage.create({ data: { recipeId: target.id, originalUrl: 'https://example.invalid/archive-evidence.jpg', isPrimary: true } });
  server = fixture.app.listen(0, '127.0.0.1');
  await new Promise(resolveListen => server.once('listening', resolveListen));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const api = origin + '/api/v1';
  async function call(method, path, token) {
    const res = await fetch(api + path, { method, headers: token ? { Authorization: 'Bearer ' + token } : {} });
    const body = await res.json();
    result.requests.push({ method, path: '/api/v1' + path, status: res.status });
    return { status: res.status, body };
  }
  assert.equal((await call('PATCH', '/recipes/' + target.id + '/publish', fixture.ownerToken)).status, 200);
  const listPaths = ['/recipes?page=1&pageSize=12', '/recipes/search?q=canh&page=1&pageSize=12', '/categories/' + category.slug + '?page=1&pageSize=12'];
  for (const path of listPaths) {
    const before = await call('GET', path);
    assert.equal(before.status, 200);
    assert((before.body.recipes ?? before.body).items.some(item => item.id === target.id));
  }
  assert.equal((await call('GET', '/recipes?minCookTime=5&maxCookTime=60&page=1')).status, 200);
  assert.equal((await call('GET', '/recipes?page=abc')).status, 422);
  assert.equal((await call('PATCH', '/recipes/' + target.id + '/archive')).status, 401);
  assert.equal((await call('PATCH', '/recipes/' + target.id + '/archive', fixture.otherToken)).status, 403);
  assert.equal((await call('PATCH', '/recipes/' + randomUUID() + '/archive', fixture.ownerToken)).status, 404);
  const cacheKeys = ['recipes:evidence:' + target.id, 'categories:evidence:' + target.id];
  for (const key of cacheKeys) { await cache.set(key, { evidence: true }, 600); assert(await cache.get(key)); }
  const login = await fetch(api + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fixture.owner.email, password: 'Integration1!' }) });
  assert.equal(login.status, 200);
  const session = await login.json();
  web = spawn(process.execPath, [resolve(root, 'frontend/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5187', '--strictPort'], {
    cwd: resolve(root, 'frontend'), env: { ...process.env, VITE_API_BASE_URL: api }, windowsHide: true, stdio: 'ignore',
  });
  await poll(async () => { try { return (await fetch('http://127.0.0.1:5187')).ok; } catch { return false; } }, 'Vite');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  await context.addInitScript(value => localStorage.setItem('culinary_session', JSON.stringify(value)), session);
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5187/dashboard');
  const shortcut = page.getByRole('region', { name: 'Lưu trữ công thức', exact: true });
  await expect(shortcut).toBeVisible();
  await page.screenshot({ path: resolve(out, '00-dashboard-shortcut.png'), fullPage: false });
  await shortcut.getByRole('link', { name: 'Lưu trữ công thức', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5187/dashboard/recipes/archive');
  await expect(page.getByRole('heading', { level: 1, name: 'Lưu trữ công thức', exact: true })).toBeVisible();
  result.checks.dashboardShortcutOpensArchivePage = true;
  const article = page.getByRole('article', { name: title, exact: true });
  await expect(article).toBeVisible();
  await expect(article.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await page.screenshot({ path: resolve(out, '01-before-archive.png'), fullPage: false });
  const pending = page.waitForResponse(res => res.request().method() === 'PATCH' && res.url() === api + '/recipes/' + target.id + '/archive');
  await article.getByRole('button', { name: 'Lưu trữ', exact: true }).click();
  const archived = await pending;
  assert.equal(archived.status(), 200);
  result.archiveResponse = { status: archived.status(), body: await archived.json() };
  result.requests.push({ method: 'PATCH', path: '/api/v1/recipes/' + target.id + '/archive', status: 200, source: 'real UI interaction' });
  await expect(article.getByText('Đã lưu trữ', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Đã lưu trữ công thức.');
  await page.screenshot({ path: resolve(out, '02-archive-success.png'), fullPage: false });
  for (const key of cacheKeys) assert.equal(await cache.get(key), null);
  result.checks.redisRecipeAndCategoryCacheInvalidated = true;
  await page.reload();
  await expect(article.getByText('Đã lưu trữ', { exact: true })).toBeVisible();
  result.checks.statusSurvivesReload = true;
  await article.getByRole('link', { name: 'Xem chi tiết', exact: true }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('Đã lưu trữ', { exact: true })).toBeVisible();
  await expect(page.getByText('Rau cải', { exact: true })).toBeVisible();
  await page.screenshot({ path: resolve(out, '03-owner-archived-detail.png'), fullPage: true });
  const persisted = await fixture.prisma.recipe.findUniqueOrThrow({ where: { id: target.id }, include: { ingredients: true, steps: true, images: true } });
  assert.equal(persisted.status, 'ARCHIVED');
  assert.equal(persisted.isDeleted, false);
  assert.equal(persisted.ingredients.length, 3);
  assert.equal(persisted.steps.length, 1);
  assert.equal(persisted.images.length, 1);
  result.checks.databaseContentPreserved = { status: persisted.status, isDeleted: persisted.isDeleted, ingredients: 3, steps: 1, images: 1 };
  for (const path of listPaths) {
    const after = await call('GET', path);
    assert.equal(after.status, 200);
    assert(!(after.body.recipes ?? after.body).items.some(item => item.id === target.id));
    result.checks[path] = 'Archived recipe absent';
  }
  const repeated = await call('PATCH', '/recipes/' + target.id + '/archive', fixture.ownerToken);
  assert.equal(repeated.status, 200);
  assert.equal(repeated.body.version, persisted.version);
  result.checks.idempotentArchive = true;
  for (const [role, token, expected] of [['owner', fixture.ownerToken, 200], ['admin', fixture.adminToken, 200], ['other', fixture.otherToken, 403], ['guest', undefined, 403]]) {
    assert.equal((await call('GET', '/recipes/' + target.slug, token)).status, expected);
    result.checks['detail_' + role] = expected;
  }
  assert.equal((await call('PATCH', '/recipes/' + fixture.foreign.id + '/archive', fixture.adminToken)).status, 200);
  result.checks.adminArchivesOtherAuthorRecipe = true;
  const raw = await context.newPage();
  await raw.setExtraHTTPHeaders({ Authorization: 'Bearer ' + fixture.ownerToken });
  const actualResponse = await raw.goto(api + '/recipes/' + target.slug);
  assert.equal(actualResponse.status(), 200);
  // Preserve the actual HTTP body; style only its native browser JSON display.
  await raw.addStyleTag({ content: 'body{margin:28px;background:#f8fafc;color:#0f172a}pre{font:17px/1.65 Consolas,monospace;white-space:pre-wrap;word-break:break-word}' });
  await raw.screenshot({ path: resolve(out, '04-live-api-response.png'), fullPage: true });
  const report = await context.newPage();
  result.finishedAt = new Date().toISOString();
  result.status = 'PASS';
  writeFileSync(resolve(out, 'result.json'), JSON.stringify(result, null, 2));
  await report.setContent('<html><meta charset="utf-8"><body style="background:#0f172a;color:#e2e8f0;padding:32px;font:18px/1.55 Consolas,monospace"><h1>FR-RCP-006 — Actual integration results</h1><p>Real HTTP + Passport/JWT + PostgreSQL + Redis. No mocked API responses.</p><pre style="white-space:pre-wrap">' + escape(JSON.stringify({ status: result.status, sourceState: result.sourceState, requests: result.requests, checks: result.checks }, null, 2)) + '</pre></body></html>');
  await report.screenshot({ path: resolve(out, '05-http-database-cache-checks.png'), fullPage: true });
  await poll(async () => { try { return Object.keys(JSON.parse(readFileSync(resolve(out, 'checks.json'), 'utf8').replace(/^\uFEFF/, ''))).length === 6; } catch { return false; } }, 'six validation checks');
  const checks = JSON.parse(readFileSync(resolve(out, 'checks.json'), 'utf8').replace(/^\uFEFF/, ''));
  let html = '<html><meta charset="utf-8"><body style="background:#0f172a;color:#e2e8f0;padding:30px;font:17px/1.55 Consolas,monospace"><h1>FR-RCP-006 — Executed test / lint / build output</h1>';
  for (const [key, value] of Object.entries(checks)) {
    const text = readFileSync(resolve(out, key + '.log'), 'utf8').replace(/\u001b\[[0-9;]*m/g, '');
    const lines = text.split('\n');
    const excerpt = lines.filter((line, index) => /Test Files|Tests |Duration|problems|All files/.test(line) || index >= lines.length - 9).join('\n');
    html += '<h2>' + escape(key) + ' — exit ' + value.exitCode + '</h2><p>' + escape(value.command) + '</p><pre style="white-space:pre-wrap">' + escape(excerpt) + '</pre>';
  }
  await report.setContent(html + '</body></html>');
  await report.screenshot({ path: resolve(out, '06-tests-lint-build.png'), fullPage: true });
  await context.close();
  console.log(JSON.stringify({ status: result.status, screenshots: 7, checks: result.checks }, null, 2));
} catch (error) {
  result.error = String(error);
  writeFileSync(resolve(out, 'failure.json'), JSON.stringify(result, null, 2));
  console.error(error);
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  if (browser) await browser.close();
  if (web) { web.kill(); await new Promise(resolveStop => setTimeout(resolveStop, 500)); }
  if (server) await new Promise(resolveClose => server.close(resolveClose));
  if (fixture) await fixture.close();
}
