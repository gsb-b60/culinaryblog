import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startIngredientIntegration } from './support/ingredientIntegration.js';

const backend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(backend, '..');
const frontend = resolve(root, 'frontend');
const require = createRequire(resolve(frontend, 'package.json'));
const { chromium, expect: baseExpect } = require('@playwright/test') as typeof import('@playwright/test');
const expect = baseExpect.configure({ timeout: 15000 });
const output = resolve(root, 'docs/reports/huynh-thanh/evidence/fr-srch-002');
mkdirSync(output, { recursive: true });
const checks: string[] = [];
const startedAt = new Date().toISOString();
let fixture: Awaited<ReturnType<typeof startIngredientIntegration>> | undefined;
let api: ReturnType<Awaited<ReturnType<typeof startIngredientIntegration>>['app']['listen']> | undefined;
let web: ReturnType<typeof spawn> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let webLog = '';
try {
  fixture = await startIngredientIntegration();
  const { prisma, owner } = fixture;
  const category = await prisma.category.create({ data: { name: 'Filter Main', slug: 'filter-main' } });
  const second = await prisma.category.create({ data: { name: 'Filter Other', slug: 'filter-other' } });
  const rows: Awaited<ReturnType<typeof prisma.recipe.create>>[] = [];
  async function seed(title: string, extra: Record<string, unknown> = {}) {
    rows.push(await prisma.recipe.create({ data: {
      title, slug: title.toLowerCase().replaceAll(' ', '-'), description: 'Filter integration fixture',
      categoryId: category.id, authorId: owner.id, prepTime: 100, cookTime: 30,
      servings: 2, difficulty: 'EASY', status: 'PUBLISHED',
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, rows.length)), ...extra,
    } }));
  }
  for (let i = 1; i <= 13; i++) await seed('Match ' + String(i).padStart(2, '0'));
  await seed('Other category', { categoryId: second.id });
  await seed('Medium recipe', { difficulty: 'MEDIUM' });
  await seed('Hard recipe', { difficulty: 'HARD' });
  await seed('Expert recipe', { difficulty: 'EXPERT' });
  await seed('Too slow', { cookTime: 31 });
  await seed('Too few servings', { servings: 1 });
  await seed('Zero cook', { cookTime: 0, servings: 4 });
  await seed('Draft hidden', { status: 'DRAFT' });
  await seed('Archived hidden', { status: 'ARCHIVED' });
  await seed('Deleted hidden', { isDeleted: true });
  api = fixture.app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => api!.once('listening', resolve));
  const address = api.address();
  assert(address && typeof address !== 'string');
  const apiBase = 'http://127.0.0.1:' + address.port + '/api/v1';
  async function get(query: string, status = 200, path = '/recipes') {
    const response = await fetch(apiBase + path + '?' + query);
    assert.equal(response.status, status, query);
    const body = await response.json();
    if (status === 422) {
      assert.match(response.headers.get('content-type') ?? '', /application\/problem\+json/);
      assert.equal(body.status, 422);
      assert.ok(body.errors);
    }
    return body;
  }
  async function verify(query: string, predicate: (r: typeof rows[number]) => boolean) {
    const expected = rows.filter(r => !r.isDeleted && r.status === 'PUBLISHED' && predicate(r));
    const body = await get(query + '&pageSize=50');
    assert.deepEqual(body.items.map((r: { id: string }) => r.id).sort(), expected.map(r => r.id).sort(), query);
    assert.equal(body.meta.totalCount, expected.length, query);
    checks.push('API: ' + query);
  }
  await verify('', () => true);
  await verify('categoryId=' + category.id, r => r.categoryId === category.id);
  await verify('categoryId=00000000-0000-4000-8000-000000000000', () => false);
  for (const difficulty of ['Easy', 'Medium', 'Hard', 'Expert', 'EASY', 'MEDIUM', 'HARD', 'EXPERT']) {
    await verify('difficulty=' + difficulty, r => r.difficulty === difficulty.toUpperCase());
  }
  await verify('maxCookTime=30', r => r.cookTime <= 30);
  await verify('maxCookTime=0', r => r.cookTime === 0);
  await verify('minServings=2', r => r.servings >= 2);
  await verify('minServings=4', r => r.servings >= 4);
  const combined = 'categoryId=' + category.id + '&difficulty=Easy&maxCookTime=30&minServings=2';
  await verify(combined, r => r.categoryId === category.id && r.difficulty === 'EASY' && r.cookTime <= 30 && r.servings >= 2);
  // Each decoy fails exactly one predicate, detecting OR or omitted filters.
  const expected = rows.filter(r => r.title.startsWith('Match') || r.title === 'Zero cook');
  const first = await get(combined + '&page=1&pageSize=12');
  const last = await get(combined + '&page=2&pageSize=12');
  assert.equal(first.items.length, 12);
  assert.equal(last.items.length, 2);
  assert.equal(first.meta.totalCount, 14);
  assert.equal(last.meta.totalCount, 14);
  assert.equal(first.meta.totalPages, 2);
  assert.deepEqual([...first.items, ...last.items].map(r => r.id).sort(), expected.map(r => r.id).sort());
  const beyond = await get(combined + '&page=3&pageSize=12');
  assert.deepEqual(beyond.items, []);
  assert.equal(beyond.meta.totalCount, 14);
  checks.push('API: filtered count before pagination, disjoint pages, out-of-range page');
  await verify(combined + '&status=DRAFT', r => r.categoryId === category.id && r.difficulty === 'EASY' && r.cookTime <= 30 && r.servings >= 2);
  await verify('searchQuery=Match&minServings=3', () => false);
  const searched = await get(combined + '&q=Match', 200, '/recipes/search');
  assert.equal(searched.meta.totalCount, 13);
  assert.ok(searched.items.every((r: { title: string }) => r.title.startsWith('Match')));
  checks.push('API: private/deleted recipes excluded; keyword and search endpoint preserve filters');
  for (const query of [
    'difficulty=Impossible', 'difficulty=easy', 'difficulty=Easy&difficulty=Hard', 'categoryId=invalid',
    'maxCookTime=-1', 'maxCookTime=1.5', 'maxCookTime=abc', 'maxCookTime=', 'maxCookTime=2147483648',
    'minServings=0', 'minServings=-1', 'minServings=1.5', 'minServings=abc', 'minServings=',
    'minServings=2&minServings=3', 'minServings=2147483648',
  ]) await get(query, 422);
  checks.push('API: 16 malformed/unsupported queries return 422 Problem Details');
  web = spawn(process.execPath, [
    resolve(frontend, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5187', '--strictPort',
  ], { cwd: frontend, env: { ...process.env, VITE_API_BASE_URL: apiBase }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  web.stdout?.on('data', value => { webLog += String(value); });
  web.stderr?.on('data', value => { webLog += String(value); });
  await expect.poll(async () => {
    if (web?.exitCode !== null) throw new Error('Vite exited: ' + webLog);
    try { return (await fetch('http://127.0.0.1:5187')).ok; } catch { return false; }
  }, { timeout: 30000 }).toBe(true);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:5187/recipes');
  await page.getByRole('button', { name: 'Filter Main', exact: true }).click();
  await page.getByLabel('Độ khó', { exact: true }).selectOption('EASY');
  await page.getByLabel('Thời gian nấu tối đa (phút)', { exact: true }).fill('30');
  await page.getByLabel('Khẩu phần tối thiểu', { exact: true }).fill('2');
  const navigation = page.getByRole('navigation', { name: 'Phân trang công thức' });
  await expect(navigation).toContainText('14 công thức');
  const currentParams = new URL(page.url()).searchParams;
  assert.equal(currentParams.get('categoryId'), category.id);
  assert.equal(currentParams.get('difficulty'), 'EASY');
  assert.equal(currentParams.get('maxCookTime'), '30');
  assert.equal(currentParams.get('minServings'), '2');
  await expect(page.locator('main ul > li')).toHaveCount(12);
  await page.screenshot({ path: resolve(output, 'desktop.png'), fullPage: true });
  await navigation.getByRole('button', { name: 'Trang sau' }).click();
  await expect(navigation).toContainText('Trang 2/2');
  await expect(page.locator('main ul > li')).toHaveCount(2);
  await page.reload();
  await expect(navigation).toContainText('Trang 2/2');
  await expect(page.getByLabel('Khẩu phần tối thiểu', { exact: true })).toHaveValue('2');
  await page.getByLabel('Khẩu phần tối thiểu', { exact: true }).fill('4');
  await expect(navigation).toContainText('1 công thức');
  assert.equal(new URL(page.url()).searchParams.has('page'), false);
  await expect(page.getByRole('link', { name: 'Zero cook', exact: true })).toBeVisible();
  await page.goBack();
  await expect(navigation).toContainText('Trang 2/2');
  await page.goForward();
  await expect(navigation).toContainText('1 công thức');
  checks.push('Browser: combine four controls, URL state, pagination, reload, reset page, Back/Forward');
  await page.getByLabel('Khẩu phần tối thiểu', { exact: true }).fill('100');
  await expect(page.getByText('Không tìm thấy công thức', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(navigation).toContainText('20 công thức');
  assert.equal(new URL(page.url()).search, '');
  await page.goto('http://127.0.0.1:5187/recipes?minServings=-1');
  await expect(page.getByRole('alert')).toContainText('Bộ lọc không hợp lệ');
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(navigation).toContainText('20 công thức');
  checks.push('Browser: empty result, clear filters, invalid URL validation and recovery');
  await page.goto('http://127.0.0.1:5187/recipes?' + combined);
  await expect(navigation).toContainText('14 công thức');
  await page.getByLabel('Tìm công thức', { exact: true }).fill('Match');
  await expect(navigation).toContainText('13 công thức');
  await page.context().setOffline(true);
  await page.getByLabel('Tìm công thức', { exact: true }).fill('Zero');
  await expect(page.getByText('Không thể tải danh sách công thức. Vui lòng thử lại.', { exact: true })).toBeVisible();
  await page.context().setOffline(false);
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(navigation).toContainText('1 công thức');
  await page.getByLabel('Tìm công thức', { exact: true }).fill('');
  await expect(navigation).toContainText('14 công thức');
  checks.push('Browser: keyword combines with filters; network recovery');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('Thời gian nấu tối đa (phút)', { exact: true }).fill('0');
  await expect(navigation).toContainText('1 công thức');
  await expect(page.getByRole('link', { name: 'Zero cook', exact: true })).toBeVisible();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: resolve(output, 'mobile.png'), fullPage: true });
  checks.push('Browser: mobile 390px, zero-minute filter, no horizontal overflow');
  assert.deepEqual(pageErrors, []);
  writeFileSync(resolve(output, 'result.json'), JSON.stringify({
    feature: 'FR-SRCH-002', issue: 35, startedAt, finishedAt: new Date().toISOString(),
    result: 'passed', baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    workingTree: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }),
    services: 'Real PostgreSQL isolated schema + Express routes/CQRS/Prisma + Chromium + Vite. No mocked API responses.',
    checks, pageErrors,
  }, null, 2) + '\n');
  console.log('PASS FR-SRCH-002: ' + checks.length + ' checks; API and desktop/mobile browser.');
} catch (error) {
  writeFileSync(resolve(output, 'result.json'), JSON.stringify({
    feature: 'FR-SRCH-002', result: 'failed', startedAt, checks,
    error: error instanceof Error ? error.stack : String(error), webLog,
  }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
  if (web && web.exitCode === null) {
    web.kill();
    await new Promise<void>(resolve => web!.once('exit', () => resolve()));
  }
  if (api) await new Promise<void>((resolve, reject) => api!.close(error => error ? reject(error) : resolve()));
  if (fixture) await fixture.close();
}
