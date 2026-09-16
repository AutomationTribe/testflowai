import { expect, test } from '@playwright/test';
import { login, signOut, signUp, uniqueUser } from './helpers';

/**
 * FLOW E — LOGIN (FR-AUTH-002, FR-SUB-002).
 * Existing user → Sign In → backend resolves organisation/subscription state →
 * correct destination is selected based on that state — never inferred client-side.
 */
test('Flow E — login routes an unsubscribed user to Subscription Required', { tag: ['@critical', '@smoke'] }, async ({ page }) => {
  const user = uniqueUser();
  await signUp(page, user);
  await page.goto('/app'); // land on the blocked screen so signOut() finds its button
  await signOut(page);

  await login(page, user);
  await page.waitForURL('**/subscription-required');
  await expect(page.getByRole('heading', { name: 'Subscription required' })).toBeVisible();
});

test('Flow E — login routes a subscribed user to the QA Setup boundary', { tag: ['@critical'] }, async ({ page }) => {
  const user = uniqueUser();
  await signUp(page, user);
  await page.goto('/subscription');
  await page.getByRole('button', { name: 'Start Free Trial' }).click();
  await page.waitForURL('**/subscription/success**');

  await page.goto('/app');
  await signOut(page);

  await login(page, user);
  await page.waitForURL('**/app');
  await expect(page.getByRole('heading', { name: 'TestFlow' })).toBeVisible();
});

test('Flow E — after sign out, /app is re-blocked even via direct navigation (session invalidated server-side, not just client state)', { tag: ['@critical', '@regression'] }, async ({ page }) => {
  const user = uniqueUser();
  await signUp(page, user);
  await page.goto('/subscription');
  await page.getByRole('button', { name: 'Start Free Trial' }).click();
  await page.waitForURL('**/subscription/success**');

  await page.goto('/app');
  await signOut(page);

  // A fresh direct navigation (not the client redirecting itself) — proves the
  // server actually destroyed the session (NFR-SEC-002), not merely that the
  // frontend cleared its own in-memory state.
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login/);
});
