import { expect, test } from '@playwright/test';
import { login, signOut, signUp, uniqueUser } from './helpers';

/**
 * FLOW E — LOGIN (FR-AUTH-002, FR-SUB-002).
 * Existing user → Sign In → backend resolves organisation/subscription state →
 * correct destination is selected based on that state — never inferred client-side.
 */
test('Flow E — login routes an unsubscribed user to Subscription Required', async ({ page }) => {
  const user = uniqueUser();
  await signUp(page, user);
  await page.goto('/app'); // land on the blocked screen so signOut() finds its button
  await signOut(page);

  await login(page, user);
  await page.waitForURL('**/subscription-required');
  await expect(page.getByRole('heading', { name: 'Subscription required' })).toBeVisible();
});

test('Flow E — login routes a subscribed user to the QA Setup boundary', async ({ page }) => {
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
