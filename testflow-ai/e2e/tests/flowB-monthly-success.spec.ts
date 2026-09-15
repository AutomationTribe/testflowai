import { expect, test } from '@playwright/test';
import { signUp } from './helpers';

/**
 * FLOW B — PAID SUBSCRIPTION (FR-SUB-004, NFR-REL-003).
 * Visitor → Sign Up → Monthly plan → seat quantity → Checkout → successful
 * (simulated) Paystack test payment → Subscription Activated → QA Setup boundary.
 *
 * Payment success is simulated via the test-support endpoint (see
 * backend/src/modules/testSupport) rather than a real Paystack test card — no real
 * Paystack account exists in this environment. The endpoint runs the exact same
 * reconciliation code (`recordSuccessfulPayment`) the real Paystack webhook uses;
 * only the transport differs.
 */
test('Flow B — Monthly checkout with 5 seats, simulated payment success', async ({ page }) => {
  await signUp(page);
  await page.goto('/subscription');

  const monthlySeatsInput = page.getByRole('spinbutton', { name: 'Monthly seats' });
  await monthlySeatsInput.fill('5');
  await expect(page.getByText('5 seats × $10 = $50.00 monthly, due today')).toBeVisible();

  // Yearly's independent seat control is unaffected by the Monthly change.
  await expect(page.getByRole('spinbutton', { name: 'Yearly seats' })).toHaveValue('1');

  await page.getByRole('button', { name: 'Continue to Checkout' }).first().click();
  await page.waitForURL('**/subscription/checkout**');

  // The displayed amount corresponds to the selected seat quantity (5 x $10 = $50).
  const payButton = page.getByRole('button', { name: /Pay \$50\.00 & Activate Subscription/ });
  await expect(payButton).toBeVisible();
  await expect(page.locator('aside').getByText('$50.00').first()).toBeVisible();
  await payButton.click();

  await page.waitForURL('**/subscription/success**');
  await expect(page.getByRole('heading', { name: 'Subscription activated' })).toBeVisible();
  await expect(page.getByText('monthly')).toBeVisible();

  await page.getByRole('button', { name: 'Continue to QA Setup' }).click();
  await page.waitForURL('**/app');
  await expect(page.getByText(/Plan:\s*monthly/i)).toBeVisible();
});

test('Flow B — Yearly checkout with 5 seats via its own independent seat stepper', async ({ page }) => {
  await signUp(page);
  await page.goto('/subscription');

  const yearlySeatsInput = page.getByRole('spinbutton', { name: 'Yearly seats' });
  await page.getByRole('button', { name: 'Increase Yearly seats' }).click({ clickCount: 4 }); // 1 -> 5
  await expect(yearlySeatsInput).toHaveValue('5');
  await expect(page.getByText('5 seats × $9 × 12 = $540.00 billed annually, due today')).toBeVisible();

  // Monthly's independent seat control is unaffected by the Yearly change.
  await expect(page.getByRole('spinbutton', { name: 'Monthly seats' })).toHaveValue('1');

  await page.getByRole('button', { name: 'Continue to Checkout' }).nth(1).click();
  await page.waitForURL('**/subscription/checkout**');

  const payButton = page.getByRole('button', { name: /Pay \$540\.00 & Activate Subscription/ });
  await expect(payButton).toBeVisible();
  await payButton.click();

  await page.waitForURL('**/subscription/success**');
  await expect(page.getByRole('heading', { name: 'Subscription activated' })).toBeVisible();
  await expect(page.getByText('yearly')).toBeVisible();
});
