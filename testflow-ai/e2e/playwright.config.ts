import { defineConfig, devices } from '@playwright/test';

/**
 * E2E foundation for Slice 1 (Account & Subscription). Runs against dedicated
 * ports (4100/3100) and a dedicated database (`testflow_e2e`) so this suite never
 * collides with — or depends on — a developer's normal local dev servers or
 * database. `E2E_FAKE_PAYMENTS`/`NEXT_PUBLIC_E2E_FAKE_PAYMENTS` swap out the real
 * Paystack integration for a deterministic in-process fake (see
 * backend/src/modules/testSupport and frontend/src/components/FakeCheckoutForm.tsx)
 * — no real Paystack account or payment credentials are used anywhere in this suite.
 *
 * Database preparation (`npm run test` → `prepare-db.js`) runs BEFORE this config
 * is even invoked, not as Playwright's own `globalSetup` — Playwright starts
 * `webServer` processes first and only runs `globalSetup` once they're already
 * healthy, which is too late for infrastructure (the database) the backend
 * `webServer` itself needs at boot to pass its own health check.
 */
const BACKEND_PORT = 4100;
const FRONTEND_PORT = 3100;
const E2E_DATABASE_URL = 'postgres://testflow:testflow@localhost:5432/testflow_e2e';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // Journeys share one backend/database for the whole run (see prepare-db.js) —
  // sequential execution keeps trial-once-per-organisation and similar stateful
  // rules from racing between tests, without needing a DB reset per test.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../backend',
      url: `http://localhost:${BACKEND_PORT}/health`,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'development',
        PORT: String(BACKEND_PORT),
        DATABASE_URL: E2E_DATABASE_URL,
        CORS_ORIGIN: `http://localhost:${FRONTEND_PORT}`,
        E2E_FAKE_PAYMENTS: 'true',
      },
    },
    {
      command: `npm run dev -- -p ${FRONTEND_PORT}`,
      cwd: '../frontend',
      url: `http://localhost:${FRONTEND_PORT}/login`,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_API_BASE_URL: `http://localhost:${BACKEND_PORT}`,
        NEXT_PUBLIC_E2E_FAKE_PAYMENTS: 'true',
        NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: 'pk_test_placeholder_not_a_real_key',
      },
    },
  ],
});
