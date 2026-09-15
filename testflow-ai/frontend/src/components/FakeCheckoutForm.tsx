'use client';

import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/apiClient';
import { Button } from './Button';
import { formatUsd, OrderSummary, PaymentFailureBanner } from './CheckoutChrome';

interface FakeCheckoutFormProps {
  organisationId: string;
  organisationName: string;
  planType: 'monthly' | 'yearly';
  seatCount: number;
  amountCents: number;
  /** Which outcome to simulate — driven by the checkout page's `simulate` query param (E2E only). */
  outcome: 'succeeded' | 'failed';
  onPaymentSubmitted: () => void;
  onChoosePlanDifferently: () => void;
}

/**
 * E2E-only stand-in for CheckoutForm.tsx (Slice 1 E2E closure). Renders the exact
 * same approved chrome (failure banner, Order Summary, single Pay button with the
 * same label) as the real Paystack checkout, but calls the test-support simulate
 * endpoint instead of Paystack — no real Paystack script, no real payment credentials.
 * Only ever rendered when `NEXT_PUBLIC_E2E_FAKE_STRIPE=true` (see checkout/page.tsx);
 * never part of the production bundle's active path.
 */
export function FakeCheckoutForm({
  organisationId,
  organisationName,
  planType,
  seatCount,
  amountCents,
  outcome,
  onPaymentSubmitted,
  onChoosePlanDifferently,
}: FakeCheckoutFormProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (submitting) return; // prevents duplicate submission while processing

    setSubmitting(true);
    setError(null);

    try {
      const result = await apiClient.simulatePayment({ organisationId, planType, seatCount, amountCents, outcome });
      if (result.simulated === 'failed') {
        setError('Your card was declined (simulated for testing).');
        setSubmitting(false);
        return;
      }
      onPaymentSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Your payment could not be processed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div>
      {error && (
        <PaymentFailureBanner
          message={error}
          onRetry={() => void handleSubmit({ preventDefault: () => undefined } as React.FormEvent)}
          onChoosePlanDifferently={onChoosePlanDifferently}
          onDismiss={() => setError(null)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
          }}
        >
          <h2 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden>💳</span>
            Payment Method
          </h2>
          <p data-testid="fake-payment-element" style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
            Test mode — no real payment details are collected.
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Processing payment…' : `Pay ${formatUsd(amountCents)} & Activate Subscription`}
          </Button>
        </form>

        <OrderSummary organisationName={organisationName} planType={planType} seatCount={seatCount} amountCents={amountCents} />
      </div>
    </div>
  );
}
