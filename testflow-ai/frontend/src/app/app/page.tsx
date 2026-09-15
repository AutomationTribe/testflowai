'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { ErrorState } from '@/components/ErrorState';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

/**
 * Minimal authenticated landing screen (Step 7) — the Slice 1 boundary ("reaches
 * the QA Setup boundary"). Deliberately NOT the real role-specific Dashboard, and
 * NOT QA Setup itself — those are later slices. Calling GET /v1/workspace (rather
 * than just /health) proves the server-side subscription gate actually protects
 * something, not merely that the frontend route guard hid the page.
 */
function LandingContent(): JSX.Element {
  const { user, organisation, subscription } = useSession();
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    apiClient
      .workspace()
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('error'));
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>TestFlow</h1>
      <p>
        Signed in as <strong>{user?.name}</strong> ({user?.email})
      </p>
      <p>
        Organization: <strong>{organisation?.name ?? 'Unknown'}</strong>
      </p>
      <p>
        Plan: <strong style={{ textTransform: 'capitalize' }}>{subscription?.planType}</strong>
      </p>

      {apiStatus === 'checking' && <p role="status">Checking system status…</p>}
      {apiStatus === 'ok' && <p style={{ color: 'green' }}>System status: all systems operational.</p>}
      {apiStatus === 'error' && (
        <ErrorState
          title="Backend unreachable"
          message="Could not reach the TestFlow API. Some information may be unavailable."
        />
      )}
    </div>
  );
}

export default function AppLandingPage(): JSX.Element {
  return (
    <ProtectedRoute requireSubscription>
      <AppShell>
        <LandingContent />
      </AppShell>
    </ProtectedRoute>
  );
}
