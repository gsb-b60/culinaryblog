const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../../../../..');
const output = __dirname;
const requireFrontend = createRequire(path.join(root, 'frontend/package.json'));
const { chromium } = requireFrontend('@playwright/test');
const capturedAt = new Date().toISOString();
const records = [];
function run(name, directory, binary, args) {
  const cwd = path.join(root, directory);
  const result = spawnSync(process.execPath, [path.join(cwd, binary), ...args], {
    cwd, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    encoding: 'utf8', windowsHide: true, timeout: 120000,
  });
  const transcript = '$ cd ' + directory + '\n$ node ' + binary + ' ' + args.join(' ') +
    '\n\n' + (result.stdout || '') + (result.stderr || '') + '\nExit code: ' + result.status + '\n';
  fs.writeFileSync(path.join(output, name + '.txt'), transcript);
  records.push({ name, exitCode: result.status });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, transcript);
  return transcript;
}
function escape(value) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
async function snapshot(page, file, title, content, dark = false) {
  await page.setContent('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:28px;background:' +
    (dark ? '#101827;color:#e2e8f0' : '#f8fafc;color:#0f172a') +
    ';font:16px Consolas,monospace}h1{font:600 23px Arial;margin:0 0 16px}pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55}small{color:#64748b}</style><h1>' +
    escape(title) + '</h1><small>Captured: ' + capturedAt + ' | Actual command output / HTTP response</small><pre>' +
    escape(content) + '</pre>');
  await page.screenshot({ path: path.join(output, file), fullPage: true });
}
(async () => {
  let browser;
  try {
    const tests = run('filter-validation', 'backend', 'node_modules/vitest/vitest.mjs', ['run', 'tests/recipe-filtering.test.ts']);
    const backendLint = run('backend-lint', 'backend', 'node_modules/eslint/bin/eslint.js', ['src', '--ext', '.ts']);
    const frontendLint = run('frontend-lint', 'frontend', 'node_modules/eslint/bin/eslint.js', ['.']);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await snapshot(page, 'tests.png', 'FR-SRCH-002 — Filter validation tests', tests, true);
    const lintExcerpt = backendLint.split('\n').slice(-8).join('\n');
    await snapshot(page, 'lint.png', 'FR-SRCH-002 — Lint results', 
      'Backend: final lines of actual output (full output in backend-lint.txt)\n\n' +
      lintExcerpt + '\n\nFrontend: complete output\n\n' + frontendLint, true);
    const apiBase = process.env.EVIDENCE_API_BASE || 'http://localhost:3000/api/v1';
    for (const [name, query, expectedStatus] of [
      ['api-200', 'difficulty=Easy&maxCookTime=30&minServings=2&page=1&pageSize=1', 200],
      ['api-422', 'difficulty=Invalid', 422],
    ]) {
      const url = apiBase + '/recipes?' + query;
      const response = await fetch(url);
      const body = await response.json();
      assert.equal(response.status, expectedStatus);
      if (expectedStatus === 200) {
        assert.ok(body.items.length > 0, 'Need at least one real matching recipe for screenshot');
        assert.ok(body.items.every(r => r.difficulty === 'EASY' && r.cookTime <= 30 && r.servings >= 2));
        assert.ok(body.meta.totalCount >= body.items.length);
      } else assert.equal(body.status, 422);
      const record = { capturedAt, method: 'GET', url, status: response.status, body };
      fs.writeFileSync(path.join(output, name + '.json'), JSON.stringify(record, null, 2) + '\n');
      await snapshot(page, name + '.png', 'FR-SRCH-002 — HTTP ' + response.status,
        'GET ' + url + '\nHTTP ' + response.status + '\nContent-Type: ' +
        response.headers.get('content-type') + '\n\n' + JSON.stringify(body, null, 2));
    }
    fs.writeFileSync(path.join(output, 'snapshot-manifest.json'), JSON.stringify({
      capturedAt, sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
      note: 'PNG snapshots render verbatim captured command logs and HTTP responses. They are evidence pages, not screenshots of an OS terminal or Scalar.',
      records,
    }, null, 2) + '\n');
    console.log('PASS: captured tests, lint, HTTP 200 and HTTP 422 screenshots.');
  } finally { if (browser) await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
