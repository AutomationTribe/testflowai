import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { BACKEND_URL } from '../testerUser';

export interface E2eUser {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'qa_manager';
  organisationName: string;
}

/** A fresh, unique user/organisation per test — avoids cross-test collisions on
 * the one shared database/server the whole suite runs against (see global-setup.ts). */
export function uniqueUser(): E2eUser {
  const id = randomUUID().slice(0, 8);
  return {
    name: 'E2E Tester',
    email: `e2e-${id}@example.com`,
    password: 'correct-horse-battery-staple',
    role: 'admin',
    organisationName: `E2E Org ${id}`,
  };
}

/** Signs up via the real UI (§20 approved fields) and returns the user it created. */
export async function signUp(page: Page, user: E2eUser = uniqueUser()): Promise<E2eUser> {
  await page.goto('/signup');
  await page.getByLabel('Name', { exact: true }).fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Role').selectOption(user.role);
  await page.getByLabel('Organisation Name').fill(user.organisationName);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('**/subscription');
  return user;
}

export async function login(page: Page, user: E2eUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await page.waitForURL('**/login');
}

/** Signs up, activates the trial, and lands on the QA Setup screen (FR-QAOM-002) — the shared starting point for every QA Setup journey test. */
export async function signUpAndReachQaSetup(page: Page, user: E2eUser = uniqueUser()): Promise<E2eUser> {
  await signUp(page, user);
  await page.goto('/subscription');
  await page.getByRole('button', { name: 'Start Free Trial' }).click();
  await page.waitForURL('**/subscription/success**');
  await page.getByRole('button', { name: 'Continue to QA Setup' }).click();
  await page.waitForURL('**/qa-setup');
  return user;
}

/**
 * Opt a file or describe block OUT of the default signed-in dedicated tester:
 * `test.use(NO_SESSION)`. Use it ONLY for tests that are about creating or entering an account
 * (sign-up, trial, payment, login, QA-setup onboarding) or that need a signed-out browser.
 */
export const NO_SESSION = { storageState: { cookies: [], origins: [] } };

/** Puts the signed-in dedicated tester's organisation back to "no projects, next code PRJ-001" (E2E-only endpoint). */
export async function resetTesterProjects(page: Page): Promise<void> {
  const res = await page.request.post(`${BACKEND_URL}/v1/test-support/reset-projects`);
  if (res.status() !== 204) throw new Error(`reset-projects failed with ${res.status()}`);
}

/** Creates projects directly through the API (fast data setup for the signed-in user — not what is under test). Returns them in creation order. */
export async function createProjectsViaApi(page: Page, names: string[]): Promise<Array<{ id: string; name: string }>> {
  const me = await (await page.request.get(`${BACKEND_URL}/v1/me`)).json();
  const orgId = me.organisation.id as string;
  const created: Array<{ id: string; name: string }> = [];
  for (const name of names) {
    const res = await page.request.post(`${BACKEND_URL}/v1/organisations/${orgId}/projects`, { data: { name } });
    if (res.status() !== 201) throw new Error(`create project "${name}" failed with ${res.status()}`);
    created.push({ id: (await res.json()).id as string, name });
  }
  return created;
}

/** E2E-only: puts one of the signed-in user's projects into Archived/Active (archiving itself is a later feature). */
export async function setProjectStatusViaApi(page: Page, projectId: string, status: 'active' | 'archived'): Promise<void> {
  const res = await page.request.post(`${BACKEND_URL}/v1/test-support/set-project-status`, { data: { projectId, status } });
  if (res.status() !== 204) throw new Error(`set-project-status failed with ${res.status()}`);
}

/** Publishes a new QA configuration version (via the real QA configuration API) for the signed-in user's organisation. */
export async function publishQaConfigurationViaApi(page: Page, presetOrigin: 'lightweight' | 'controlled'): Promise<void> {
  const me = await (await page.request.get(`${BACKEND_URL}/v1/me`)).json();
  const base = `${BACKEND_URL}/v1/organisations/${me.organisation.id as string}/qa-configuration`;
  const draft = await page.request.post(`${base}/draft`, { data: { presetOrigin } });
  if (draft.status() !== 201) throw new Error(`start draft failed with ${draft.status()}`);
  const published = await page.request.post(`${base}/draft/publish`, { headers: { 'Idempotency-Key': randomUUID() } });
  if (published.status() !== 200) throw new Error(`publish failed with ${published.status()}`);
}
