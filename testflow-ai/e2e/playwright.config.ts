import { defineConfig, devices } from '@playwright/test';
import { TESTER_STORAGE_STATE } from './storageStatePath';

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

/**
 * Developer/manual runs are HEADED by default (`headless: !!process.env.CI` below) —
 * GitHub Actions sets CI=true automatically, so CI stays headless with no extra flag,
 * and a developer running `npm run test:*` locally sees the browser without needing
 * `--headed`. Speed presets (slow/normal/fast — see package.json scripts) control
 * `slowMo` via PW_SPEED so a developer can watch a run step-by-step or blast through it.
 */
const SLOW_MO_MS: Record<string, number> = { extraslow: 8000, slow: 2000, normal: 200, fast: 0 };
const slowMo = SLOW_MO_MS[process.env.PW_SPEED ?? 'normal'] ?? 0;

// A journey with many steps (sign up -> subscribe -> QA Setup) accumulates slowMo
// across every single action, so the per-test timeout must scale with it too —
// otherwise a slow, deliberately-watchable run fails on its own timeout before a
// human ever gets to see the later steps. Scaled generously (not just slowMo x
// step count) since slowMo delays apply to many more granular actions than a
// test author sees in its own source.
const TEST_TIMEOUT_MS = 30_000 + slowMo * 30;

export default defineConfig({
  testDir: './tests',
  // Creates the dedicated tester once and saves their session — every test starts signed in as them
  // unless it explicitly opts out (see tests/helpers.ts NO_SESSION).
  globalSetup: './global-setup.ts',
  // Visual-regression specs (tests/visual/**) live under their own dedicated
  // config (playwright.visual.config.ts) — excluded here so this file's existing
  // functional suite, its CI job, and `npm run test:e2e` are completely
  // unaffected by adding visual regression capability (see docs/technical/testing.md).
  testIgnore: [/visual\//],
  timeout: TEST_TIMEOUT_MS,
  expect: { timeout: 10_000 },
  // Journeys share one backend/database for the whole run (see prepare-db.js) —
  // sequential execution keeps trial-once-per-organisation and similar stateful
  // rules from racing between tests, without needing a DB reset per test.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    storageState: TESTER_STORAGE_STATE,
    headless: !!process.env.CI,
    // Headed (developer) runs use the real browser window size so what you watch is what a user
    // sees at that window size; the device descriptor below would otherwise pin the page to
    // 1280x720 inside a bigger window. CI/headless keeps the fixed 1280x720 for determinism.
    launchOptions: { slowMo, args: process.env.CI ? [] : ['--start-maximized'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // Playwright rejects `deviceScaleFactor` together with a null viewport, so the real-window
      // (headed) mode drops that one option from the Desktop Chrome descriptor.
      use: process.env.CI
        ? { ...devices['Desktop Chrome'] }
        : (({ deviceScaleFactor: _scale, ...desktop }) => ({ ...desktop, viewport: null }))(devices['Desktop Chrome']),
    },
  ],
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
