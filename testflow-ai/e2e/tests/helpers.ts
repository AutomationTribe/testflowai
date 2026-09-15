import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';

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
