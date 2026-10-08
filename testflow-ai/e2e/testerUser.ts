/**
 * The DEDICATED E2E TESTER. Except where a test is explicitly about creating an account
 * (sign-up, trial, payment, login, QA-setup onboarding), every E2E test starts already signed in
 * as this user (see global-setup.ts and the default `storageState` in playwright.config.ts).
 *
 * These are throwaway credentials for the disposable `testflow_e2e` database only (it is dropped
 * and rebuilt before every run by prepare-db.js) — not a real account.
 */
export const TESTER = {
  name: 'Dedicated Tester',
  email: 'dedicated-tester@example.com',
  password: 'correct-horse-battery-staple',
  role: 'admin' as const,
  organisationName: 'Dedicated Tester Org',
};

export const BACKEND_URL = 'http://localhost:4100';
