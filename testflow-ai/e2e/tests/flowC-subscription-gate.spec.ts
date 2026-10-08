import { expect, test } from '@playwright/test';
import { NO_SESSION, signOut, signUp } from './helpers';

// This flow is about creating/entering an account (or onboarding state), so it deliberately does NOT use the dedicated tester.
test.use(NO_SESSION);

/**
 * FLOW C — SUBSCRIPTION GATE (FR-SUB-002).
 * Authenticated user with no active subscription → attempts normal application
 * access → Subscription Required displayed → normal functionality unavailable →
 * Sign Out remains available.
 */
test('Flow C — subscription gate blocks /app and exposes only the permitted actions', { tag: ['@critical', '@regression'] }, async ({ page }) => {
  await signUp(page);

  await page.goto('/app');
  await expect(page).toHaveURL(/subscription-required/);
  await expect(page.getByRole('heading', { name: 'Subscription required' })).toBeVisible();
  await expect(page.getByText('No active plan')).toBeVisible();

  // Only the three permitted actions are exposed — no project/business functionality.
  await expect(page.getByRole('button')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Choose a Plan' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Free Trial/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();

  // Direct navigation to /workspace-gated content is also blocked, not just this screen.
  await page.goto('/app');
  await expect(page).toHaveURL(/subscription-required/);

  await signOut(page);
  await expect(page).toHaveURL(/login/);
});
