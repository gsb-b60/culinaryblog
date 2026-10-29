import assert from 'node:assert/strict';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { startIngredientIntegration } from './support/ingredientIntegration.js';
const root = resolve(process.cwd(), '..');
const frontend = resolve(root, 'frontend');
const require = createRequire(resolve(frontend, 'package.json'));
const { chromium, expect: baseExpect } =
  require('@playwright/test') as typeof import('@playwright/test');
const expect = baseExpect.configure({ timeout: 20000 });
const output = resolve(root, 'docs/reports/huynh-thanh/evidence/fr-srch-003');
mkdirSync(output, { recursive: true });
const checks: string[] = [];
const startedAt = new Date().toISOString();
const fixture = await startIngredientIntegration();
const server = fixture.app.listen(0, '127.0.0.1');
let web: ReturnType<typeof spawn> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let webLog = '';
try {
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const apiBase = 'http://127.0.0.1:' + address.port + '/api/v1';
  const category = await fixture.prisma.category.create({
    data: { name: 'Sorting Demo', slug: 'sorting-demo' },
  });
  for (let i = 1; i <= 14; i++)
    await fixture.prisma.recipe.create({
      data: {
        title: 'Soup ' + String(i).padStart(2, '0'),
        slug: 'soup-' + i,
        description: 'Sorting evidence: recipe ' + i + ', cooking time ' + i * 5 + ' minutes.',
        authorId: fixture.owner.id,
        categoryId: category.id,
        prepTime: 10,
        cookTime: i * 5,
        servings: 2,
        status: 'PUBLISHED',
        createdAt: new Date(Date.UTC(2026, 0, i)),
      },
    });
  const apiEvidence: { query: string; status: number; body: unknown }[] = [];
  for (const [query, status] of [
    ['sort=title&pageSize=4', 200],
    ['sort=-cookTime&pageSize=4', 200],
    ['sort=invalid', 422],
  ] as const) {
    const response = await fetch(apiBase + '/recipes?' + query);
    assert.equal(response.status, status);
    const body = await response.json();
    apiEvidence.push({ query, status, body });
    writeFileSync(
      resolve(
        output,
        status === 422
          ? 'api-422.json'
          : query.startsWith('sort=title')
            ? 'api-title.json'
            : 'api-cook-time.json',
      ),
      JSON.stringify({ query, status, body }, null, 2),
    );
  }
  checks.push('Real HTTP 200 for title and descending cookTime; invalid sort returns 422');
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
  web.stdout?.on('data', (value) => {
    webLog += String(value);
  });
  web.stderr?.on('data', (value) => {
    webLog += String(value);
  });
  await expect
    .poll(
      async () => {
        if (web?.exitCode !== null) throw new Error('Vite exited: ' + webLog);
        try {
          return (await fetch('http://127.0.0.1:5187')).ok;
        } catch {
          return false;
        }
      },
      { timeout: 45000 },
    )
    .toBe(true);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5187/recipes');
  const select = page.locator('#recipe-sort');
  const cards = page.locator('main ul > li h2');
  await expect(select).toHaveValue('-createdAt');
  await expect(cards).toHaveCount(12);
  await expect(cards.first()).toHaveText('Soup 14');
  checks.push('Default newest first in real browser');
  await select.selectOption('title');
  await expect(cards.first()).toHaveText('Soup 01');
  assert.equal(new URL(page.url()).searchParams.get('sort'), 'title');
  await page.screenshot({ path: resolve(output, 'desktop-title.png'), fullPage: true });
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toHaveText('Soup 13');
  await select.selectOption('-cookTime');
  await expect(cards).toHaveCount(12);
  await expect(cards.first()).toHaveText('Soup 14');
  assert.equal(new URL(page.url()).searchParams.has('page'), false);
  await page.screenshot({ path: resolve(output, 'desktop-cook-time.png'), fullPage: true });
  checks.push('Title A-Z; descending cookTime; changing sort from page 2 resets to page 1');
  await page.reload();
  await expect(select).toHaveValue('-cookTime');
  await expect(cards.first()).toHaveText('Soup 14');
  await page.goBack();
  await expect(select).toHaveValue('title');
  await expect(cards.first()).toHaveText('Soup 13');
  await page.goForward();
  await expect(select).toHaveValue('-cookTime');
  await expect(cards.first()).toHaveText('Soup 14');
  checks.push('Reload and browser Back/Forward restore URL sort and page');
  await page.locator('#recipe-max-time').fill('30');
  await expect(cards).toHaveCount(6);
  await expect(cards.first()).toHaveText('Soup 06');
  checks.push('Desktop: cookTime <=30 with descending sort');
  assert.deepEqual(errors, []);
  // Evidence pages display captured response/log text; no simulated terminal or Scalar UI.
  const evidencePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  async function snapshot(name: string, title: string, content: string) {
    await evidencePage.setContent(
      '<html><body style="margin:0;padding:36px;background:#101827;color:#e5edf8;font:18px/1.5 monospace"><h1 style="font:28px sans-serif"></h1><p style="color:#a8b8cc">Captured evidence text (HTTP response / command output)</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></body></html>',
    );
    await evidencePage.locator('h1').textContent();
    await evidencePage.locator('h1').evaluate((node, value) => {
      node.textContent = value;
    }, title);
    await evidencePage.locator('pre').evaluate((node, value) => {
      node.textContent = value;
    }, content);
    await evidencePage.screenshot({ path: resolve(output, name + '.png'), fullPage: true });
  }
  for (const record of apiEvidence) {
    const name =
      record.status === 422
        ? 'api-422'
        : record.query.startsWith('sort=title')
          ? 'api-title'
          : 'api-cook-time';
    const body = record.body as {
      items?: { title: string; cookTime: number; createdAt: string }[];
      meta?: unknown;
    };
    const shown =
      record.status === 422
        ? body
        : {
            items: body.items?.map(({ title, cookTime, createdAt }) => ({
              title,
              cookTime,
              createdAt,
            })),
            meta: body.meta,
          };
    await snapshot(
      name,
      'GET /api/v1/recipes?' + record.query + ' - HTTP ' + record.status,
      JSON.stringify(shown, null, 2),
    );
  }
  const records = [];
  for (const [name, cwd, cli, args] of [
    [
      'backend-tests',
      resolve(root, 'backend'),
      resolve(root, 'backend/node_modules/vitest/vitest.mjs'),
      ['run', 'tests/recipe-sorting.test.ts', 'tests/recipe-filtering.test.ts'],
    ],
    [
      'frontend-tests',
      frontend,
      resolve(frontend, 'node_modules/vitest/vitest.mjs'),
      ['run', 'src/test/static-blog.test.tsx'],
    ],
    [
      'backend-lint',
      resolve(root, 'backend'),
      resolve(root, 'backend/node_modules/eslint/bin/eslint.js'),
      ['src', '--ext', '.ts'],
    ],
    ['frontend-lint', frontend, resolve(frontend, 'node_modules/eslint/bin/eslint.js'), ['.']],
  ] as const) {
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 180000,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    const log = String(result.stdout ?? '') + String(result.stderr ?? '');
    records.push({ name, exitCode: result.status });
    assert.equal(result.status, 0, name + ': ' + log.slice(-2000));
    const excerpt = name === 'backend-lint' ? log.trim().split('\n').slice(-22).join('\n') : log;
    await snapshot(
      name,
      name + ' - exit code ' + result.status,
      (name === 'backend-lint' ? 'Last 22 lines of captured command output\n\n' : '') +
        (excerpt || '(No warnings or errors)'),
    );
    checks.push(name + ': exit 0');
  }
  writeFileSync(
    resolve(output, 'result.json'),
    JSON.stringify(
      {
        feature: 'FR-SRCH-003',
        issue: 36,
        result: 'passed',
        startedAt,
        finishedAt: new Date().toISOString(),
        sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
          cwd: root,
          encoding: 'utf8',
        }).trim(),
        services:
          'Real PostgreSQL isolated schema, Express/CQRS/Prisma, Chromium and Vite. No mocked API.',
        checks,
        records,
        pageErrors: errors,
        note: 'Desktop PNGs are real browser screenshots. API/test/lint PNGs render captured HTTP/output text; not OS terminal or Scalar screenshots. API images project title/cookTime/createdAt/meta; JSON files preserve complete responses.',
      },
      null,
      2,
    ),
  );
  console.log('PASS sorting evidence: ' + checks.length + ' checks; snapshots in ' + output);
} catch (error) {
  writeFileSync(
    resolve(output, 'failure.json'),
    JSON.stringify({ checks, error: String(error), webLog }, null, 2),
  );
  throw error;
} finally {
  if (browser) await browser.close();
  if (web && web.exitCode === null) {
    web.kill();
    await new Promise<void>((resolve) => web!.once('exit', () => resolve()));
  }
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await fixture.close();
}
