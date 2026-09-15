'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { MinimalHeader } from '@/components/MinimalHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient, ApiError } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

const TRIAL_DAYS = 14; // FR-SUB-001

/**
 * "Subscription Required" screen (§25; visual reference:
 * docs/design/approved/account-subscription/subscription-required.png). Exposes
 * only the minimum account/billing/session functionality FR-SUB-002 permits while
 * blocked — never usable project/business functionality (there is none reachable
 * from here). Deliberately omits the reference's "Historical data remains
 * securely retained." (unsupported data-retention claim) and "Contact Billing
 * Admin" (no such feature is approved).
 */
function SubscriptionRequiredContent(): JSX.Element {
  const { user, organisation, subscription, refresh, logout } = useSession();
  const router = useRouter();
  const [startingTrial, setStartingTrial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartTrial(): Promise<void> {
    if (!organisation) return;
    setError(null);
    setStartingTrial(true);
    try {
      await apiClient.startTrial(organisation.id);
      await refresh();
      router.replace('/subscription/success?plan=trial');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start your trial. Please try again.');
    } finally {
      setStartingTrial(false);
    }
  }

  const trialAlreadyUsed = subscription?.status === 'trial_expired' || subscription?.planType !== null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader organisationName={organisation?.name} userName={user?.name} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <h1 style={{ marginBottom: 4 }}>Subscription required</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>
            An active TestFlow subscription or trial is required to access your QA workspace.
          </p>

          <div
            style={{
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '0 0 var(--space-4)',
            }}
          >
            <span>Organisation: {organisation?.name}</span>
            <Badge tone="danger">No active plan</Badge>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Unavailable while inactive: Projects · Requirements · Test Cases · Test Runs · Reports
          </p>

          {error && <ErrorState title="Could not start trial" message={error} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button onClick={() => router.push('/subscription')}>Choose a Plan</Button>
            {!trialAlreadyUsed && (
              <Button variant="secondary" onClick={handleStartTrial} disabled={startingTrial}>
                {startingTrial ? 'Starting trial…' : `Start Free Trial (${TRIAL_DAYS} Days)`}
              </Button>
            )}
            <Button variant="secondary" onClick={() => void logout().then(() => router.replace('/login'))}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionRequiredPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <SubscriptionRequiredContent />
    </ProtectedRoute>
  );
}
