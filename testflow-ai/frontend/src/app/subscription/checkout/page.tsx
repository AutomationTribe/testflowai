'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CheckoutForm } from '@/components/CheckoutForm';
import { ErrorState } from '@/components/ErrorState';
import { FakeCheckoutForm } from '@/components/FakeCheckoutForm';
import { MinimalHeader } from '@/components/MinimalHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient, ApiError } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

type PlanType = 'monthly' | 'yearly';

// E2E-only (Slice 1 E2E closure): when true, skip the real Paystack popup entirely
// and render FakeCheckoutForm instead — set only by the Playwright test environment
// (see e2e/playwright.config.ts), never in a real deployment.
const E2E_FAKE_PAYMENTS = process.env.NEXT_PUBLIC_E2E_FAKE_PAYMENTS === 'true';

function CheckoutContent(): JSX.Element {
  const { user, organisation } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planType = (searchParams.get('plan') as PlanType) ?? 'monthly';
  const seatCount = Number(searchParams.get('seats') ?? '1');
  // E2E-only: which outcome the fake payment form should simulate (Flow B vs Flow D).
  const simulateOutcome = searchParams.get('simulate') === 'fail' ? 'failed' : 'succeeded';

  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (!organisation || requested.current) return;
    requested.current = true; // guards against a double-invoke creating two Paystack transactions
    apiClient
      .subscribe(organisation.id, planType, seatCount)
      .then((res) => {
        setAccessCode(res.accessCode);
        setAmountCents(res.amountCents);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not start checkout.'));
  }, [organisation, planType, seatCount]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader breadcrumb="Billing System / Secure Checkout" userName={user?.name} />
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 'var(--space-6)',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 4px' }}>
            Choose Plan / <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>Checkout</span>
          </p>
          <Link
            href="/subscription"
            style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Back to plans
          </Link>
        </div>
        <h1 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Checkout</h1>
        <div style={{ borderTop: '1px solid var(--color-outline-variant)', marginBottom: 'var(--space-4)' }} />

        {error && <ErrorState title="Checkout unavailable" message={error} />}

        {!error && (!accessCode || amountCents === null) && (
          <div role="status" style={{ padding: 'var(--space-4) 0' }}>
            Preparing checkout…
          </div>
        )}

        {accessCode && amountCents !== null && organisation && (
          <>
            {E2E_FAKE_PAYMENTS ? (
              <FakeCheckoutForm
                organisationId={organisation.id}
                organisationName={organisation.name}
                planType={planType}
                seatCount={seatCount}
                amountCents={amountCents}
                outcome={simulateOutcome}
                onPaymentSubmitted={() => router.push(`/subscription/success?plan=${planType}`)}
                onChoosePlanDifferently={() => router.push('/subscription')}
              />
            ) : (
              <CheckoutForm
                planType={planType}
                seatCount={seatCount}
                amountCents={amountCents}
                accessCode={accessCode}
                organisationName={organisation.name}
                onPaymentSubmitted={() => router.push(`/subscription/success?plan=${planType}`)}
                onChoosePlanDifferently={() => router.push('/subscription')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
