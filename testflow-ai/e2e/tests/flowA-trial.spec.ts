import { expect, test } from '@playwright/test';
import { signUp } from './helpers';

/**
 * FLOW A — TRIAL (FR-SUB-001, FR-SUB-002, FR-AUTH-006).
 * Visitor → Sign Up → Organisation created → blocked at Subscription →
 * select Trial → Trial activates → reaches QA Setup boundary.
 */
test('Flow A — sign up, trial activation, and the QA Setup boundary', async ({ page }) => {
  await signUp(page);

  // FR-SUB-002: normal application access is unavailable before any trial/subscription exists.
  await page.goto('/app');
  await expect(page).toHaveURL(/subscription-required/);

  await page.goto('/subscription');
  await expect(page.getByRole('heading', { name: 'Choose your TestFlow plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Free Trial' }).click();

  await page.waitForURL('**/subscription/success**');
  await expect(page.getByRole('heading', { name: 'Subscription activated' })).toBeVisible();
  await expect(page.getByText('trial')).toBeVisible();

  // QA Setup itself is out of scope — this only reaches the Slice 1 boundary placeholder.
  await page.getByRole('button', { name: 'Continue to QA Setup' }).click();
  await page.waitForURL('**/app');
  await expect(page.getByRole('heading', { name: 'TestFlow' })).toBeVisible();
  await expect(page.getByText('System status: all systems operational.')).toBeVisible();
});

test('Flow A — a second trial attempt is rejected (once per organisation)', async ({ page }) => {
  await signUp(page);
  await page.goto('/subscription');
  await page.getByRole('button', { name: 'Start Free Trial' }).click();
  await page.waitForURL('**/subscription/success**');

  // Direct URL navigation back to the plan page; a repeat attempt must still be
  // blocked server-side (FR-SUB-001 — once per organisation, not merely hidden by the UI).
  await page.goto('/subscription');
  await page.getByRole('button', { name: 'Start Free Trial' }).click();
  await expect(page.getByText('Trial could not be started')).toBeVisible();
});
