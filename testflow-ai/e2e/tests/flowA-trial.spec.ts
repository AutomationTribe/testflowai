import { expect, test } from '@playwright/test';
import { NO_SESSION, signUp } from './helpers';

// This flow is about creating/entering an account (or onboarding state), so it deliberately does NOT use the dedicated tester.
test.use(NO_SESSION);

/**
 * FLOW A — TRIAL (FR-SUB-001, FR-SUB-002, FR-AUTH-006, FR-QAOM-001/002).
 * Visitor → Sign Up → Organisation created → blocked at Subscription →
 * select Trial → Trial activates → QA Setup screen → confirm the (already
 * auto-published, FR-QAOM-001) Standard QA default → reaches the app boundary.
 */
test('Flow A — sign up, trial activation, QA Setup, and the app boundary', { tag: ['@critical', '@smoke'] }, async ({ page }) => {
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

  await page.getByRole('button', { name: 'Continue to QA Setup' }).click();
  await page.waitForURL('**/qa-setup');
  await expect(page.getByRole('heading', { name: 'Set up your QA process' })).toBeVisible();
  // Standard QA is the FR-QAOM-001 auto-published default — pre-selected and marked current.
  await expect(page.getByRole('heading', { name: 'Standard QA' })).toBeVisible();
  await expect(page.getByText('(currently in effect)')).toBeVisible();

  await page.getByRole('button', { name: /Use Standard QA/ }).click();
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
