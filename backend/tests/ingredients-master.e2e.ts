import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startIngredientIntegration } from './support/ingredientIntegration.js';

const backend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(backend, '..');
const frontend = resolve(root, 'frontend');
const require = createRequire(resolve(frontend, 'package.json'));
const { chromium, expect: baseExpect } =
  require('@playwright/test') as typeof import('@playwright/test');
const expect = baseExpect.configure({ timeout: 30000 });
const output = resolve(root, 'docs/reports/huynh-thanh/evidence/ingredients-master');
mkdirSync(output, { recursive: true });
const responses: { method: string; path: string; status: number }[] = [];
let fixture: Awaited<ReturnType<typeof startIngredientIntegration>> | undefined;
let api:
  ReturnType<Awaited<ReturnType<typeof startIngredientIntegration>>['app']['listen']> | undefined;
let web: ReturnType<typeof spawn> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let webLog = '';
try {
  fixture = await startIngredientIntegration();
  api = fixture.app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => api!.once('listening', resolve));
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
    webLog = (webLog + chunk).slice(-5000);
  });
  web.stderr?.on('data', (chunk) => {
    webLog = (webLog + chunk).slice(-5000);
  });
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (web.exitCode !== null) throw new Error(`Vite exited: ${webLog}`);
    try {
      if ((await fetch('http://127.0.0.1:5187')).ok) {
        ready = true;
        break;
      }
    } catch {
      /* wait for the real server */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert(ready, 'Vite did not become ready');
  const loggedIn = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: fixture.owner.email, password: 'Integration1!' }),
  });
  assert.equal(loggedIn.status, 200);
  const session = await loggedIn.json();
  browser = await chromium.launch({
    channel: process.env.E2E_BROWSER_CHANNEL || undefined,
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(
    (value) => localStorage.setItem('culinary_session', JSON.stringify(value)),
    session,
  );
  const page = await context.newPage();
  page.on('response', (response) => {
    if (response.url().startsWith(apiBase))
      responses.push({
        method: response.request().method(),
        path: new URL(response.url()).pathname,
        status: response.status(),
      });
  });
  await page.goto('http://127.0.0.1:5187/dashboard/recipes', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await expect(
    page.getByRole('heading', { name: fixture.recipes[13]!.title, exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  const article = page.getByRole('article', { name: fixture.recipes[1]!.title, exact: true });
  await expect(article).toBeVisible();
  await article.getByRole('link', { name: 'Nguyên liệu', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Quản lý nguyên liệu', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Chọn công thức', { exact: true })).toHaveValue(
    fixture.recipes[1]!.id,
  );
  await expect(page.getByRole('button', { name: 'Thêm nguyên liệu', exact: true })).toBeEnabled();
  await expect(
    page
      .getByRole('navigation', { name: 'Dashboard menu' })
      .getByRole('link', { name: 'Nguyên liệu', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  assert.equal(await page.getByRole('navigation', { name: 'Dashboard menu' }).count(), 1);
  // Real browser navigation must preserve both the selected recipe and its page.
  await page.getByLabel('Chọn công thức', { exact: true }).selectOption(fixture.recipes[0]!.id);
  await expect(page).toHaveURL(new RegExp('recipeId=' + fixture.recipes[0]!.id));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await expect(page.getByLabel('Chọn công thức', { exact: true })).toHaveValue(
    fixture.recipes[0]!.id,
  );
  await expect(page.getByRole('button', { name: 'Thêm nguyên liệu', exact: true })).toBeEnabled();
  await page.getByLabel('Chọn công thức', { exact: true }).selectOption(fixture.recipes[1]!.id);
  await page.getByRole('button', { name: 'Trang trước', exact: true }).click();
  await expect(page).toHaveURL(/page=1(?:&|$)/);
  await expect(page.getByRole('button', { name: 'Thêm nguyên liệu', exact: true })).toBeEnabled();
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await expect(page.getByRole('navigation', { name: 'Phân trang chọn công thức' })).toContainText(
    'Trang 1/2',
  );
  await expect(page.getByRole('button', { name: 'Thêm nguyên liệu', exact: true })).toBeEnabled();

  // Disconnect real networking during a pending ingredient request; do not intercept APIs.
  const network = await context.newCDPSession(page);
  await network.send('Network.enable');
  const normalNetwork = {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  };
  await network.send('Network.emulateNetworkConditions', { ...normalNetwork, latency: 5000 });
  const pendingIngredients = page.waitForRequest(
    (request) => request.url().includes('/ingredients') && request.method() === 'GET',
  );
  await page.getByLabel('Chọn công thức', { exact: true }).selectOption(fixture.recipes[12]!.id);
  await pendingIngredients;
  await network.send('Network.emulateNetworkConditions', { ...normalNetwork, offline: true });
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tải lại', exact: true })).toBeEnabled();
  await network.send('Network.emulateNetworkConditions', normalNetwork);
  await network.detach();
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Thêm nguyên liệu', exact: true })).toBeEnabled();
  await expect(page.getByRole('navigation', { name: 'Phân trang chọn công thức' })).toContainText(
    'Trang 2/2',
  );
  await page.getByLabel('Chọn công thức', { exact: true }).selectOption(fixture.recipes[1]!.id);
  await expect(page.getByRole('button', { name: 'Thêm nguyên liệu', exact: true })).toBeEnabled();

  /** Capture the actual HTTP response without exposing authentication headers. */
  async function captureApiEvidence(
    response: Awaited<ReturnType<typeof page.waitForResponse>>,
    file: string,
  ) {
    const body = await response.text();
    const summary =
      response.request().method() +
      ' ' +
      new URL(response.url()).pathname +
      '\nHTTP ' +
      response.status() +
      '\n' +
      (body || '(empty response body)');
    await page.evaluate((text) => {
      const panel = document.createElement('pre');
      panel.id = 'api-evidence';
      panel.textContent = text;
      panel.style.cssText =
        'position:fixed;bottom:12px;left:12px;right:12px;z-index:99999;max-height:240px;overflow:auto;background:#111827;color:#f9fafb;padding:20px;white-space:pre-wrap;font:14px monospace;border:2px solid #22c55e';
      document.body.append(panel);
    }, summary);
    await page.screenshot({ path: resolve(output, file), fullPage: true });
    await page.locator('#api-evidence').evaluate((element) => element.remove());
  }
  await page.getByLabel('Thêm - Tên nguyên liệu', { exact: true }).fill('Gạo kiểm thử E2E');
  await page.getByLabel('Thêm - Số lượng', { exact: true }).fill('2.5');
  await page.getByLabel('Thêm - Đơn vị', { exact: true }).fill('kg');
  await page.getByLabel('Thêm - Ghi chú', { exact: true }).fill('Vo sạch');
  const postResponse = page.waitForResponse(
    (response) => response.url().includes('/ingredients') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Thêm nguyên liệu', exact: true }).click();
  await captureApiEvidence(await postResponse, 'api-post-201.png');
  await expect(page.getByRole('status')).toContainText('Đã thêm nguyên liệu.');
  await page.screenshot({ path: resolve(output, 'desktop-created.png'), fullPage: true });
  const stored = await fixture.prisma.recipeIngredient.findFirstOrThrow({
    where: { recipeId: fixture.recipes[1]!.id, name: 'Gạo kiểm thử E2E' },
  });
  assert.equal(Number(stored.quantity), 2.5);
  await page.getByRole('button', { name: 'Sửa Gạo kiểm thử E2E', exact: true }).click();
  await page.getByLabel('Sửa - Tên nguyên liệu', { exact: true }).fill('Gạo đã cập nhật');
  await page.getByLabel('Sửa - Số lượng', { exact: true }).fill('3');
  await page.getByLabel('Sửa - Đơn vị', { exact: true }).fill('g');
  await page.getByLabel('Sửa - Ghi chú', { exact: true }).fill('');
  const putResponse = page.waitForResponse(
    (response) => response.url().includes('/ingredients') && response.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await captureApiEvidence(await putResponse, 'api-put-200.png');
  await expect(page.getByRole('status')).toContainText('Đã cập nhật nguyên liệu.');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await expect(page.getByRole('heading', { name: 'Gạo đã cập nhật', exact: true })).toBeVisible();
  assert.equal(
    (await fixture.prisma.recipeIngredient.findUniqueOrThrow({ where: { id: stored.id } })).notes,
    '',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: 'Nguyên liệu', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: resolve(output, 'mobile-updated.png'), fullPage: true });
  await page.getByRole('button', { name: 'Xóa Gạo đã cập nhật', exact: true }).click();
  const deleteResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/ingredients') && response.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: 'Xác nhận xóa', exact: true }).click();
  await captureApiEvidence(await deleteResponse, 'api-delete-204.png');
  await expect(page.getByRole('status')).toContainText('Đã xóa nguyên liệu.');
  assert.equal(
    (await fixture.prisma.recipeIngredient.findUniqueOrThrow({ where: { id: stored.id } }))
      .isDeleted,
    true,
  );
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await expect(page.getByText('Chưa có nguyên liệu', { exact: true })).toBeVisible();
  assert(responses.some((item) => item.method === 'POST' && item.status === 201));
  assert(responses.some((item) => item.method === 'PUT' && item.status === 200));
  assert(responses.some((item) => item.method === 'DELETE' && item.status === 204));
  await context.close();
  // An expired access token must rotate without restarting list effects or losing the page.
  const refreshed = await browser.newContext();
  await refreshed.addInitScript(
    (value) =>
      localStorage.setItem(
        'culinary_session',
        JSON.stringify({ ...value, accessToken: 'expired-token' }),
      ),
    session,
  );
  const refreshPage = await refreshed.newPage();
  await refreshPage.goto('http://127.0.0.1:5187/dashboard/ingredients', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await expect(
    refreshPage.getByRole('button', { name: 'Thêm nguyên liệu', exact: true }),
  ).toBeEnabled();
  const rotated = await refreshPage.evaluate(
    () => JSON.parse(localStorage.getItem('culinary_session')!).accessToken,
  );
  assert.notEqual(rotated, 'expired-token');
  await refreshed.close();
  writeFileSync(
    resolve(output, 'result.json'),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        baseCommit: '1ed7022',
        feature: 'FR-RCP-009',
        result: 'passed',
        services: 'Real PostgreSQL + real HTTP/JWT + real browser; no API interception',
        checks: [
          'Dashboard integration',
          'Recipe link on page 2',
          'Selection and page survive browser reload',
          'Retry enabled after page change during offline ingredient loading',
          'Real HTTP response screenshots (POST/PUT/DELETE)',
          'Create 201',
          'Update 200',
          'Reload persistence',
          'Delete 204 and soft-delete persistence',
          'Mobile navigation',
          'Refresh token',
        ],
        responses,
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS: ingredient management on master, desktop/mobile CRUD, persistence and token refresh.',
  );
} finally {
  if (browser) await browser.close();
  if (web && web.exitCode === null) {
    web.kill();
    await new Promise((resolve) => web!.once('exit', resolve));
  }
  if (api)
    await new Promise<void>((resolve, reject) =>
      api!.close((error) => (error ? reject(error) : resolve())),
    );
  if (fixture) await fixture.close();
}
