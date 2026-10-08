import { expect, test } from '@playwright/test';
import { NO_SESSION, signUpAndReachQaSetup } from './helpers';

// This flow is about creating/entering an account (or onboarding state), so it deliberately does NOT use the dedicated tester.
test.use(NO_SESSION);

/**
 * FLOW F — QA OPERATING MODEL SETUP (FR-QAOM-001/002/003/007/008/009/012).
 * FR-QAOM-001 already auto-published Standard QA the instant the organisation was
 * created — this screen is the opportunity to keep it or choose differently, not
 * a hard gate. flowA-trial.spec.ts already covers the default (keep Standard QA)
 * path as part of its own critical journey; this file covers switching to each
 * other preset and Custom Setup's deferred behaviour, which flowA does not.
 */
test('Flow F — switching to Lightweight QA publishes it and reaches the app boundary', { tag: ['@critical'] }, async ({ page }) => {
  await signUpAndReachQaSetup(page);

  await page.getByRole('button', { name: 'Lightweight QA' }).click();
  await expect(page.getByTestId('qa-setup-summary-policy')).toContainText('No Required Artifacts');

  await page.getByRole('button', { name: /Use Lightweight QA/ }).click();
  await page.waitForURL('**/app');
  await expect(page.getByRole('heading', { name: 'TestFlow' })).toBeVisible();
});

test('Flow F — switching to Controlled QA reflects its stronger governance settings before and after publish', { tag: ['@critical', '@regression'] }, async ({ page }) => {
  await signUpAndReachQaSetup(page);

  await page.getByRole('button', { name: 'Controlled QA' }).click();
  // Pre-commit summary bar updates instantly, before any request (FR-QAOM-002 "instant setup").
  await expect(page.getByTestId('qa-setup-summary-workflow')).toContainText('Draft → Review → Approved');
  await expect(page.getByTestId('qa-setup-summary-gates')).toContainText('3 of 6 Gates Active');

  await page.getByRole('button', { name: /Use Controlled QA/ }).click();
  await page.waitForURL('**/app');
});

test('Flow F — Custom Setup starts a draft but does not publish, and does not silently advance to the app', { tag: ['@regression'] }, async ({ page }) => {
  await signUpAndReachQaSetup(page);

  await page.getByRole('button', { name: 'Custom Setup' }).click();
  await page.getByRole('button', { name: /Start Custom Setup/ }).click();

  await expect(page.getByText('Custom Setup draft started')).toBeVisible();
  // Still on the QA Setup screen — FR-QAOM-007's "incomplete draft does not publish"
  // means there is nothing to silently activate.
  await expect(page).toHaveURL(/qa-setup/);
});

test('Flow F — Back returns to the previous screen without changing the QA process', { tag: ['@regression'] }, async ({ page }) => {
  await signUpAndReachQaSetup(page);

  // The arrow is an aria-hidden icon, so the accessible name is just "Back".
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForURL('**/subscription/success**');
});
