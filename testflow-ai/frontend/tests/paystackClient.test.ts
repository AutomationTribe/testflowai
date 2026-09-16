import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { payWithPaystack } from '../src/lib/paystackClient';

/**
 * payWithPaystack is always mocked in checkoutForm.test.tsx (necessarily — it
 * wraps a real third-party popup), so its own callback-wiring logic (success /
 * cancel / error resolution, and the "script failed to load" fallback) had zero
 * direct coverage. window.PaystackPop is stubbed directly here instead of
 * exercising the real script tag, since jsdom never actually loads it.
 */
describe('payWithPaystack', () => {
  afterEach(() => {
    delete (window as { PaystackPop?: unknown }).PaystackPop;
    vi.restoreAllMocks();
  });

  function stubPaystackPop(
    trigger: (options: { onSuccess: () => void; onCancel: () => void; onError?: (e: { message: string }) => void }) => void,
  ) {
    class FakePaystackPop {
      resumeTransaction(_accessCode: string, options: Parameters<typeof trigger>[0]) {
        trigger(options);
      }
    }
    (window as unknown as { PaystackPop: unknown }).PaystackPop = FakePaystackPop;
  }

  it('resolves success when Paystack reports onSuccess', async () => {
    stubPaystackPop((options) => options.onSuccess());

    const result = await payWithPaystack('access_code_1');
    expect(result).toEqual({ success: true });
  });

  it('resolves a cancelled-payment message when Paystack reports onCancel', async () => {
    stubPaystackPop((options) => options.onCancel());

    const result = await payWithPaystack('access_code_1');
    expect(result).toEqual({ success: false, message: 'Payment was cancelled.' });
  });

  it('resolves the provider error message when Paystack reports onError', async () => {
    stubPaystackPop((options) => options.onError?.({ message: 'Your card was declined.' }));

    const result = await payWithPaystack('access_code_1');
    expect(result).toEqual({ success: false, message: 'Your card was declined.' });
  });

  it('falls back to a generic message when onError fires without one', async () => {
    stubPaystackPop((options) => options.onError?.({ message: '' }));

    const result = await payWithPaystack('access_code_1');
    expect(result).toEqual({ success: false, message: 'Your payment could not be processed. Please try again.' });
  });

  // KNOWN DEFECT (reported separately, not fixed here — see QA baseline report):
  // when the Paystack script itself fails to load, `payWithPaystack` throws
  // instead of resolving `{ success: false, message }` like every other failure
  // path (cancel, provider onError). CheckoutForm.tsx's handlePay() has no
  // try/catch around `await payWithPaystack(...)`, so this becomes an unhandled
  // rejection in a React event handler — the user sees no PaymentFailureBanner at
  // all, unlike a declined card or a cancelled popup. This test documents the
  // CURRENT (defective) behaviour; it should be updated to assert a resolved
  // `{ success: false, ... }` once the underlying bug is fixed.
  it('[KNOWN DEFECT] currently REJECTS (does not resolve a friendly failure) if the Paystack script never loads', async () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      const script = node as HTMLScriptElement;
      queueMicrotask(() => script.onerror?.(new Event('error')));
      return node;
    });

    await expect(payWithPaystack('access_code_1')).rejects.toThrow('Could not load the payment provider. Please try again.');

    appendChildSpy.mockRestore();
  });
});
