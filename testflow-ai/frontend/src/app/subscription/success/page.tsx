'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { MinimalHeader } from '@/components/MinimalHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30000;

type BillingHistory = Awaited<ReturnType<typeof apiClient.billingHistory>>;

const PLAN_LABEL: Record<string, string> = {
  trial: 'Trial',
  monthly: 'Monthly Plan',
  yearly: 'Yearly Plan',
};

/** Boxed label/value row (visual reference: subscription-activated.png's summary table). */
function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-6)',
        borderBottom: last ? 'none' : '1px solid var(--color-outline-variant)',
        fontSize: 14,
      }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

/**
 * "Subscription Activated" screen (§24; visual reference:
 * docs/design/approved/account-subscription/subscription-activated.png). For
 * Trial, access is already granted synchronously by the time this page loads.
 * For Monthly/Yearly, the browser's "payment submitted" moment is NOT activation
 * — this page polls the backend (which only reflects reality once Paystack's
 * webhook has reconciled the charge, NFR-REL-003) and shows "Payment Processing"
 * until the backend actually confirms access, never claiming success on the
 * client's own say-so. "View Billing Summary" is an inline expansion of the
 * already-approved billing history (FR-SUB-012) — not a new billing portal.
 *
 * Matches the reference's single bordered card (badge/heading/description,
 * summary table, confirmation banner, and the "All systems nominal"/actions row
 * all inside one container, centered on the page) — not separate floating
 * blocks. Confirmation banner uses the real signed-in user's email, not the
 * reference's fabricated one. The header's organisation chip shows the real
 * organisation name; "Sign In" is replaced with the real signed-in user's name
 * (showing "Sign In" while authenticated would be wrong, not a style choice) —
 * see MinimalHeader.tsx.
 */
function SuccessContent(): JSX.Element {
  const searchParams = useSearchParams();
  const planType = searchParams.get('plan') ?? 'trial';
  const { user, organisation, subscription, refresh } = useSession();
  const [timedOut, setTimedOut] = useState(false);
  const [billing, setBilling] = useState<BillingHistory['payments'][number] | null>(null);
  const [showBillingSummary, setShowBillingSummary] = useState(false);
  const [billingSummary, setBillingSummary] = useState<BillingHistory | null>(null);

  useEffect(() => {
    if (subscription?.hasAccess) return;

    // No "already started" ref guard here deliberately: under React 18 StrictMode's
    // dev-only double-invoke (mount → cleanup → mount, refs NOT reset in between),
    // a guard ref causes the second mount to see "already started" and skip
    // creating a new interval right after the first one was cleaned up — leaving
    // no active poll at all. Relying purely on the effect's own cleanup is correct
    // here: each run starts exactly one interval and clears exactly its own.
    const start = Date.now();
    const interval = setInterval(async () => {
      await refresh();
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        setTimedOut(true);
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [subscription?.hasAccess, refresh]);

  useEffect(() => {
    if (subscription?.hasAccess && organisation && planType !== 'trial') {
      apiClient
        .billingHistory(organisation.id)
        .then((history) => setBilling(history.payments[0] ?? null))
        .catch(() => undefined);
    }
  }, [subscription?.hasAccess, organisation, planType]);

  async function toggleBillingSummary(): Promise<void> {
    if (!organisation) return;
    if (!showBillingSummary && !billingSummary) {
      const history = await apiClient.billingHistory(organisation.id).catch(() => null);
      setBillingSummary(history);
    }
    setShowBillingSummary((value) => !value);
  }

  if (timedOut && !subscription?.hasAccess) {
    return (
      <ErrorState
        title="Still processing"
        message="Your payment is taking longer than expected to confirm. This page will update automatically once it's ready — you can also check back shortly."
      />
    );
  }

  if (!subscription?.hasAccess) {
    return (
      <div role="status" style={{ padding: 'var(--space-6)' }}>
        Payment Processing…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader organisationName={organisation?.name} userName={user?.name} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div style={{ maxWidth: 620, width: '100%' }}>
          <div
            style={{
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
              <Badge tone="info">● Activated</Badge>
              <h1 style={{ fontSize: 22, marginTop: 8, marginBottom: 4 }}>Subscription activated</h1>
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 14 }}>
                Your workspace is provisioned and ready for QA process configuration.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
              <SummaryRow label="Plan" value={PLAN_LABEL[subscription.planType ?? 'trial'] ?? 'Trial'} />
              <SummaryRow label="Capacity" value={`${subscription.seatsTotal} seats`} />
              {billing && <SummaryRow label="Amount Paid" value={`$${billing.amount}`} />}
              <SummaryRow label="Organization" value={organisation?.name ?? ''} last />
              {user?.email && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 'var(--space-3) var(--space-6)',
                    borderTop: '1px solid var(--color-outline-variant)',
                    background: 'var(--color-surface-low)',
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span aria-hidden>✉</span>
                  A confirmation receipt has been sent to {user.email}.
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                padding: 'var(--space-4) var(--space-6)',
                borderTop: '1px solid var(--color-outline-variant)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)' }}>
                <span aria-hidden style={{ color: '#2e8b57' }}>✓</span>
                All systems nominal
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Button variant="secondary" onClick={() => void toggleBillingSummary()}>
                  {showBillingSummary ? 'Hide Billing Summary' : 'View Billing Summary'}
                </Button>
                {/* QA Setup is a later slice — this links to the defined Slice 1 boundary, not QA Setup itself. */}
                <Link href="/app">
                  <Button>Continue to QA Setup →</Button>
                </Link>
              </div>
            </div>
          </div>

          {showBillingSummary && billingSummary && (
            <div
              style={{
                marginTop: 'var(--space-3)',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                fontSize: 13,
                background: 'var(--color-surface)',
              }}
            >
              <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Billing Summary</p>
              {billingSummary.seatBatches.length === 0 && billingSummary.payments.length === 0 && <p>No billing records yet.</p>}
              {billingSummary.seatBatches.map((batch) => (
                <p key={batch.id} style={{ margin: '0 0 4px' }}>
                  {batch.seatCount} seats ({batch.planTypeAtPurchase}) — ${batch.amountCharged}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '1px solid var(--color-outline-variant)',
          fontSize: 12,
          color: 'var(--color-text-muted)',
        }}
      >
        <span>© {new Date().getFullYear()} TestFlow. All rights reserved.</span>
        <span style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Contact Support</span>
        </span>
      </footer>
    </div>
  );
}

export default function SuccessPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <SuccessContent />
    </ProtectedRoute>
  );
}
