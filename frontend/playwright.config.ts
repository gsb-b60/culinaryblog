import { defineConfig } from '@playwright/test'

const frontendPort = 5175
const backendPort = 5051
const browserChannel = process.env.E2E_BROWSER_CHANNEL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:' + frontendPort,
    ...(browserChannel ? { channel: browserChannel } : {}),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'pnpm exec tsx src/index.ts',
      cwd: '../backend',
      url: 'http://localhost:' + backendPort + '/health/live',
      reuseExistingServer: false,
      env: {
        PORT: String(backendPort),
        NODE_ENV: 'test',
        LOG_LEVEL: 'silent',
        RATE_LIMIT_GENERAL: '10000',
        CORS_ORIGINS: 'http://localhost:' + frontendPort,
      },
    },
    {
      command: 'pnpm exec vite --port ' + frontendPort,
      url: 'http://localhost:' + frontendPort,
      reuseExistingServer: false,
      env: { VITE_API_BASE_URL: 'http://localhost:' + backendPort + '/api/v1' },
    },
  ],
})
