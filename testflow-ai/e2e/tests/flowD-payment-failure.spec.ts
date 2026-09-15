import { expect, test } from '@playwright/test';
import { signUp } from './helpers';

/**
 * FLOW D — PAYMENT FAILURE (FR-SUB-004 error condition, NFR-REL-003).
 * Visitor/user → chooses paid plan → Checkout → payment fails (deterministic
 * simulated behaviour) → Payment unsuccessful displayed → subscription remains
 * inactive → application access remains blocked → retry remains available.
 *
 * `simulate=fail` is an E2E-only query parameter FakeCheckoutForm reads (never
 * present in the real Paystack-backed CheckoutForm) to deterministically choose the
 * failure branch of the test-support endpoint — the Paystack-equivalent of using a
 * known decline test card, without a real Paystack account.
 */
test('Flow D — simulated payment failure keeps access blocked and allows retry', async ({ page }) => {
  await signUp(page);

  await page.goto('/subscription/checkout?plan=monthly&seats=3&simulate=fail');
  await page.waitForSelector('[data-testid="fake-payment-element"]');

  const payButton = page.getByRole('button', { name: /Pay \$30\.00 & Activate Subscription/ });
  await payButton.click();

  await expect(page.getByText('Payment unsuccessful')).toBeVisible();
  await expect(payButton).toBeEnabled(); // retry remains available, not stuck failed

  // Subscription remains inactive; normal application access remains blocked.
  await page.goto('/app');
  await expect(page).toHaveURL(/subscription-required/);

  // Retry: same checkout, simulate success this time, and it activates normally.
  await page.goto('/subscription/checkout?plan=monthly&seats=3');
  await page.waitForSelector('[data-testid="fake-payment-element"]');
  await page.getByRole('button', { name: /Pay \$30\.00 & Activate Subscription/ }).click();
  await page.waitForURL('**/subscription/success**');
  await expect(page.getByRole('heading', { name: 'Subscription activated' })).toBeVisible();
});
