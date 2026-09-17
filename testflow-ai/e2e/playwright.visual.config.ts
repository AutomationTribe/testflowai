import { defineConfig, devices } from '@playwright/test';

/**
 * Visual-regression config — separate from playwright.config.ts (the functional
 * E2E suite) on purpose:
 *
 * 1. **Isolation.** Adding this capability must not change what the existing
 *    suite runs, how CI's `e2e` job behaves, or `npm run test:e2e`'s result.
 *    A screenshot assertion is a fundamentally different kind of check
 *    (pixel comparison against a stored baseline) from the functional suite's
 *    behavioural assertions, and mixing them into one config/project would mean
 *    a baseline mismatch could fail the same job that gates deployment.
 * 2. **Determinism requirements differ.** Visual tests need a fixed viewport,
 *    disabled animations, and (per spec/test) masking of any dynamic content —
 *    constraints the functional suite has no reason to impose globally.
 * 3. **Baselines are environment-sensitive.** Font rendering differs between
 *    operating systems (and sometimes between machines on the "same" OS).
 *    Baselines here are intended to be generated and reviewed locally by
 *    whoever owns visual conformance for a screen (see .claude/agents/design.md)
 *    — this config is deliberately NOT wired into CI yet (see
 *    docs/technical/testing.md's Visual Regression section for why, and what
 *    wiring it in later would require).
 *
 * Reuses the same dedicated E2E ports/database as playwright.config.ts —
 * the two configs are never intended to run concurrently.
 */
const BACKEND_PORT = 4100;
const FRONTEND_PORT = 3100;
const E2E_DATABASE_URL = 'postgres://testflow:testflow@localhost:5432/testflow_e2e';

export default defineConfig({
  testDir: './tests/visual',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // Disables CSS/web animations and the text caret before every screenshot —
      // the single biggest source of visual-test flakiness that has nothing to
      // do with an actual regression.
      animations: 'disabled',
      caret: 'hide',
      // Absolute pixel count, not a ratio: at this viewport (1440x900 = 1.3M
      // px), a 1% ratio tolerance (Playwright's own suggested default) is
      // enormous — ~13,000 px, easily large enough to hide a genuinely changed
      // heading. Verified directly: a one-word text change on the login page
      // passed silently under maxDiffPixelRatio: 0.01. 150px absolute is enough
      // slack for anti-aliasing/font-hinting noise on the same machine, not for
      // a real content or layout change. Widen only with a specific, documented
      // reason — and re-verify with a deliberate mutation, the way this value
      // itself was chosen.
      maxDiffPixels: 150,
    },
  },
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    headless: !!process.env.CI,
    // Fixed viewport — visual assertions must never depend on whatever size a
    // developer's window happens to be.
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    // 'only-on-failure' here is Playwright's own failure screenshot (for
    // debugging a crashed test), not the toHaveScreenshot() baseline — the two
    // are unrelated mechanisms.
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'visual', use: { ...devices['Desktop Chrome'] } }],
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
