'use client';

/**
 * Shared Checkout "chrome" (§23; visual reference: checkout.png) — the failure
 * banner and Order Summary column are identical whether the payment column is
 * real Paystack popup (CheckoutForm.tsx) or the E2E-only fake payment form
 * (FakeCheckoutForm.tsx). Keeping them in one place means both paths render the
 * exact same approved layout, never two independently-drifting copies.
 */

export function formatUsd(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)}`;
}

export function PaymentFailureBanner({
  message,
  onRetry,
  onChoosePlanDifferently,
  onDismiss,
}: {
  message: string;
  onRetry: () => void;
  onChoosePlanDifferently: () => void;
  onDismiss: () => void;
}): JSX.Element {
  return (
    <div
      role="alert"
      style={{
        background: '#fdecec',
        border: '1px solid #f3c6c6',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
        <span aria-hidden style={{ color: '#a4262c', fontSize: 16, lineHeight: '20px' }}>⚠</span>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: '#a4262c' }}>Payment unsuccessful</p>
          <p style={{ margin: '4px 0 8px', fontSize: 13, color: '#a4262c' }}>{message}</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onRetry}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#a4262c',
                background: '#fff',
                border: '1px solid #f3c6c6',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onChoosePlanDifferently}
              style={{ background: 'none', border: 'none', color: '#a4262c', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              Choose Another Plan
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: '#a4262c', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
      >
        ✕
      </button>
    </div>
  );
}

const PLAN_ROW_LABEL: Record<'monthly' | 'yearly', string> = {
  monthly: 'Monthly Subscription',
  yearly: 'Yearly Subscription',
};
const BILLING_CYCLE_LABEL: Record<'monthly' | 'yearly', string> = {
  monthly: 'Monthly recurring',
  yearly: 'Annual recurring',
};

function unitPriceLabel(planType: 'monthly' | 'yearly', seatCount: number, amountCents: number): string {
  const perSeatCents = amountCents / seatCount;
  const perSeat = (perSeatCents / (planType === 'yearly' ? 12 : 1) / 100).toFixed(2);
  return `${seatCount} seats × $${perSeat} / seat / month`;
}

function SummaryLine({ label, value, bold = false }: { label: string; value: string; bold?: boolean }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: bold ? 15 : 14 }}>
      <span style={{ color: bold ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}

/**
 * Deliberately omits the reference's "Tax & VAT (0.00%)" line and "Next renewal
 * scheduled" date — neither is an approved concept (no tax model, no
 * auto-renewal approved) — see the standing rule against fabricating
 * business/product claims not backed by real requirements.
 */
export function OrderSummary({
  organisationName,
  planType,
  seatCount,
  amountCents,
}: {
  organisationName: string;
  planType: 'monthly' | 'yearly';
  seatCount: number;
  amountCents: number;
}): JSX.Element {
  return (
    <aside
      style={{
        border: '1px solid var(--color-outline-variant)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        height: 'fit-content',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>ORDER SUMMARY</p>
      <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>{organisationName}</p>

      <div style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
        <div style={{ padding: '10px 0', borderBottom: '1px solid var(--color-outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
            <span>{PLAN_ROW_LABEL[planType]}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatUsd(amountCents)}</span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{unitPriceLabel(planType, seatCount, amountCents)}</p>
        </div>
        <div style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
          <SummaryLine label="Seat count" value={`${seatCount} seats`} />
        </div>
        <div>
          <SummaryLine label="Billing Cycle" value={BILLING_CYCLE_LABEL[planType]} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-outline-variant)', marginTop: 4 }}>
        <SummaryLine label="Total Due Today" value={formatUsd(amountCents)} bold />
      </div>
    </aside>
  );
}
