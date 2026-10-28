import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd();
const out = resolve(root, 'docs/reports/huynh-thanh/evidence/fr-rcp-006-verified');
mkdirSync(out, { recursive: true });
const results = {};
function run(project, name, command) {
  return new Promise(resolveRun => {
    const child = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
      cwd: resolve(root, project), windowsHide: true,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('error', error => { output += error.message; });
    child.on('close', code => {
      const key = project + '-' + name;
      writeFileSync(resolve(out, key + '.log'), output);
      results[key] = { command, exitCode: code };
      writeFileSync(resolve(out, 'checks.json'), JSON.stringify(results, null, 2));
      console.log(key + ': ' + code);
      resolveRun();
    });
  });
}
await Promise.all(['backend', 'frontend'].map(async project => {
  for (const [name, command] of [['test', 'pnpm test'], ['lint', 'pnpm lint'], ['build', 'pnpm build']]) {
    await run(project, name, command);
  }
}));
if (Object.values(results).some(result => result.exitCode !== 0)) process.exitCode = 1;
