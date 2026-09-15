'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { MinimalHeader } from '@/components/MinimalHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient, ApiError } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

const MONTHLY_PRICE = 10;
const YEARLY_PRICE_PER_MONTH = 9;
const TRIAL_DAYS = 14; // FR-SUB-001 — the approved value; NOT the reference screenshot's "16 days".
const MIN_SEATS = 1;
const MAX_SEATS = 1000; // matches backend's validateSeatCount upper bound

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function clampSeats(value: number): number {
  if (!Number.isFinite(value)) return MIN_SEATS;
  return Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.trunc(value)));
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const planCardStyle: React.CSSProperties = {
  border: '1px solid var(--color-outline-variant)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
  background: 'var(--color-surface)',
  boxShadow: '0 1px 2px rgba(20, 24, 31, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

/** Small plan-descriptor pill (e.g. "Evaluation", "Flexible", "Annual Term") — decorative only, asserts no claim about product behavior. */
function PlanBadge({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        color: 'var(--color-primary)',
        background: 'var(--color-surface-low)',
        border: '1px solid var(--color-outline-variant)',
        borderRadius: 999,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/** Card header row: plan name (uppercase, per the approved design) + its descriptor badge, aligned on one line. */
function CardHeader({ title, badge }: { title: string; badge: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>{title}</h2>
      <PlanBadge>{badge}</PlanBadge>
    </div>
  );
}

/** Label/value row (e.g. "Duration ... 14 days") — label left, value right, matching the approved design's alignment. */
function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/** Shaded, bordered panel used for both "Seat Quantity" and "Calculation" blocks in the approved design. */
function LabeledPanel({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div
      style={{
        background: 'var(--color-surface-low)',
        border: '1px solid var(--color-outline-variant)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-3)',
      }}
    >
      <p style={{ ...eyebrowStyle, marginBottom: 6 }}>{label}</p>
      {children}
    </div>
  );
}

/**
 * Per-plan quantity stepper (visual reference: plan-selection.png — each paid
 * plan card has its OWN independent seat-quantity control, not one control
 * shared across cards). Keyboard-accessible: the −/+ buttons are natively
 * focusable/activatable, and the number field itself accepts direct typing.
 */
function SeatStepper({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <button
        type="button"
        aria-label={`Decrease ${label} seats`}
        onClick={() => onChange(clampSeats(value - 1))}
        style={{
          width: 28,
          height: 28,
          cursor: 'pointer',
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)',
        }}
      >
        −
      </button>
      <input
        aria-label={`${label} seats`}
        type="number"
        inputMode="numeric"
        min={MIN_SEATS}
        max={MAX_SEATS}
        value={value}
        onChange={(e) => onChange(clampSeats(Number(e.target.value)))}
        style={{ width: 56, textAlign: 'center', padding: 4, border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-sm)' }}
      />
      <button
        type="button"
        aria-label={`Increase ${label} seats`}
        onClick={() => onChange(clampSeats(value + 1))}
        style={{
          width: 28,
          height: 28,
          cursor: 'pointer',
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)',
        }}
      >
        +
      </button>
    </div>
  );
}

/**
 * "Choose your TestFlow plan" screen (§22; visual reference:
 * docs/design/approved/account-subscription/plan-selection.png).
 *
 * This closely matches the approved design's layout, chrome, and decorative
 * elements — uppercase card titles, plan badges on all three cards, side-by-side
 * detail rows, shaded "Seat Quantity"/"Calculation" panels, dividers, header
 * icon, and an organisation info band above the footer.
 *
 * Three specific reference elements are still NOT implemented, per this
 * project's own prior explicit instructions (not a new judgment call made
 * here) — see the Slice 1 design-conformance history:
 *   1. "Recurring billing — Monthly renewal on the 1st" / "Annual agreement —
 *      Immediate full-cycle activation": named verbatim as forbidden — no
 *      renewal/lifecycle behavior beyond the initial charge is approved.
 *   2. The footer band's fake organisation name ("Intello Technologies") and
 *      fake "ID: ORG-88294" — replaced with the actual signed-up organisation's
 *      real name, no fabricated ID.
 *   3. "Security Compliance" footer link — an unsupported compliance claim.
 * Everything else from the reference is implemented as shown.
 */
function PlanSelectionContent(): JSX.Element {
  const { user, organisation, refresh } = useSession();
  const router = useRouter();
  const [monthlySeats, setMonthlySeats] = useState(1);
  const [yearlySeats, setYearlySeats] = useState(1);
  const [startingTrial, setStartingTrial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthlyTotal = monthlySeats * MONTHLY_PRICE;
  const yearlyTotal = yearlySeats * YEARLY_PRICE_PER_MONTH * 12;

  async function handleStartTrial(): Promise<void> {
    if (!organisation) return;
    setError(null);
    setStartingTrial(true);
    try {
      // FR-SUB-001: trial seat capacity (3) is fixed and server-assigned — there is
      // no seat selector for Trial, matching the approved design (no stepper on
      // the Trial card) and the requirement itself (not a user choice).
      await apiClient.startTrial(organisation.id);
      await refresh();
      router.replace('/subscription/success?plan=trial');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start your trial. Please try again.');
    } finally {
      setStartingTrial(false);
    }
  }

  function goToCheckout(planType: 'monthly' | 'yearly'): void {
    const seats = planType === 'monthly' ? monthlySeats : yearlySeats;
    router.push(`/subscription/checkout?plan=${planType}&seats=${seats}`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader userName={user?.name} />
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: 'var(--space-6)',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <p style={{ ...eyebrowStyle, marginBottom: 4 }}>Step 3 of 3 · Organisation Setup</p>
        <h1 style={{ marginBottom: 4, marginTop: 0 }}>Choose your TestFlow plan</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-4)' }}>
          An active trial or subscription is required to access your QA workspace.
        </p>

        {error && <ErrorState title="Trial could not be started" message={error} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          <section style={{ ...planCardStyle, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <CardHeader title="Trial" badge="Evaluation" />
              <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Free</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <DetailRow label="Duration" value={`${TRIAL_DAYS} days`} />
                <DetailRow label="Capacity" value="Up to 3 seats" />
                <DetailRow label="Eligibility" value="Available once per organisation" />
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-outline-variant)', margin: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>No credit card required upfront.</p>
            </div>
            <Button onClick={handleStartTrial} disabled={startingTrial}>
              {startingTrial ? 'Starting trial…' : 'Start Free Trial →'}
            </Button>
          </section>

          <section style={{ ...planCardStyle, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <CardHeader title="Monthly" badge="Flexible" />
              <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
                $10 <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)' }}>per seat / month</span>
              </p>
              <LabeledPanel label="Seat Quantity">
                <SeatStepper label="Monthly" value={monthlySeats} onChange={setMonthlySeats} />
              </LabeledPanel>
              <LabeledPanel label="Calculation">
                <p style={{ fontSize: 13, margin: 0 }}>
                  {monthlySeats} seats × $10 = <strong>{formatUsd(monthlyTotal)}</strong> monthly, due today
                </p>
              </LabeledPanel>
            </div>
            <Button onClick={() => goToCheckout('monthly')}>Continue to Checkout →</Button>
          </section>

          <section style={{ ...planCardStyle, justifyContent: 'space-between', borderColor: 'var(--color-primary)', borderWidth: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <CardHeader title="Yearly" badge="Annual Term" />
              <p style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
                $9{' '}
                <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)' }}>
                  per seat / month (billed annually upfront)
                </span>
              </p>
              <LabeledPanel label="Seat Quantity">
                <SeatStepper label="Yearly" value={yearlySeats} onChange={setYearlySeats} />
              </LabeledPanel>
              <LabeledPanel label="Calculation">
                <p style={{ fontSize: 13, margin: 0 }}>
                  {yearlySeats} seats × $9 × 12 = <strong>{formatUsd(yearlyTotal)}</strong> billed annually, due today
                </p>
              </LabeledPanel>
            </div>
            <Button onClick={() => goToCheckout('yearly')}>Continue to Checkout →</Button>
          </section>
        </div>

        {organisation && (
          <div
            style={{
              marginTop: 'var(--space-4)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 13,
              color: 'var(--color-text-muted)',
            }}
          >
            Organisation: {organisation.name} · Subscription is mandatory before accessing your QA workspace.
          </div>
        )}
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
        <span>
          TestFlow · © {new Date().getFullYear()} TestFlow. All rights reserved.
        </span>
        <span style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Contact Support</span>
        </span>
      </footer>
    </div>
  );
}

export default function PlanSelectionPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <PlanSelectionContent />
    </ProtectedRoute>
  );
}
