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

  // By design, payWithPaystack still REJECTS (rather than resolving
  // { success: false, message }) when the Paystack script itself fails to load —
  // unlike its onCancel/onError paths, which resolve because Paystack's own popup
  // reported them. A script-load failure has no popup instance to report through,
  // so it surfaces as a thrown error instead. This is safe: CheckoutForm.tsx's
  // handlePay() now wraps the call in try/catch and shows the same
  // PaymentFailureBanner as any other failure (see checkoutForm.test.tsx's
  // "payWithPaystack REJECTS" case) — the fix lives at the call site, not by
  // changing this function's contract.
  it('rejects (rather than resolving a friendly failure) if the Paystack script never loads — handled by the caller', async () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      const script = node as HTMLScriptElement;
      queueMicrotask(() => script.onerror?.(new Event('error')));
      return node;
    });

    await expect(payWithPaystack('access_code_1')).rejects.toThrow('Could not load the payment provider. Please try again.');

    appendChildSpy.mockRestore();
  });
});
