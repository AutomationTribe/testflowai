'use client';

import { useState } from 'react';
import { payWithPaystack } from '@/lib/paystackClient';
import { Button } from './Button';
import { formatUsd, OrderSummary, PaymentFailureBanner } from './CheckoutChrome';

interface CheckoutFormProps {
  planType: 'monthly' | 'yearly';
  seatCount: number;
  amountCents: number;
  accessCode: string;
  organisationName: string;
  onPaymentSubmitted: () => void;
  onChoosePlanDifferently: () => void;
}

/**
 * "Checkout" screen's Payment column (§23; visual reference:
 * docs/design/approved/account-subscription/checkout.png). Uses Paystack's own
 * secure Inline popup (AD-028) — card details go directly to Paystack, never
 * through TestFlow's servers (NFR-SEC-012). `onPaymentSubmitted` fires once
 * Paystack reports success client-side; the actual subscription activation only
 * happens once the backend's webhook reconciles the charge (see
 * subscription/success/page.tsx). Deliberately omits the reference's "Tax & VAT"
 * line and "Next renewal scheduled" date — neither is an approved concept (no tax
 * model, no auto-renewal approved).
 *
 * The reference mocks up an inline card-number/expiry/CVC/country/zip form, but
 * that's Paystack's own popup UI (AD-028) — those fields don't exist in
 * TestFlow's own DOM at all, so rendering fake inputs here would imply a payment
 * form that doesn't function. The card container/icon/network badges are matched;
 * the actual field collection is truthfully described as happening in the popup.
 */
export function CheckoutForm({
  planType,
  seatCount,
  amountCents,
  accessCode,
  organisationName,
  onPaymentSubmitted,
  onChoosePlanDifferently,
}: CheckoutFormProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(): Promise<void> {
    if (submitting) return; // prevents duplicate submission while processing

    setSubmitting(true);
    setError(null);

    const result = await payWithPaystack(accessCode);

    if (!result.success) {
      setError(result.message ?? 'Your payment could not be processed. Please try again.');
      setSubmitting(false);
      return;
    }

    onPaymentSubmitted();
  }

  return (
    <div>
      {error && (
        <PaymentFailureBanner
          message={error}
          onRetry={() => void handlePay()}
          onChoosePlanDifferently={onChoosePlanDifferently}
          onDismiss={() => setError(null)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
        <div
          style={{
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden>💳</span>
              Payment Method
            </h2>
            <span style={{ display: 'flex', gap: 6 }}>
              {['VISA', 'MC', 'AMEX'].map((network) => (
                <span
                  key={network}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 3,
                    padding: '2px 6px',
                  }}
                >
                  {network}
                </span>
              ))}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            Card details are entered securely in Paystack&rsquo;s own payment window — TestFlow&rsquo;s servers never see or store
            them (NFR-SEC-012).
          </p>

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden>🔒</span>
            Secure payment powered by Paystack.
          </p>

          <Button onClick={() => void handlePay()} disabled={submitting}>
            {submitting ? 'Processing payment…' : `🔒 Pay ${formatUsd(amountCents)} & Activate Subscription`}
          </Button>
        </div>

        <OrderSummary organisationName={organisationName} planType={planType} seatCount={seatCount} amountCents={amountCents} />
      </div>
    </div>
  );
}
