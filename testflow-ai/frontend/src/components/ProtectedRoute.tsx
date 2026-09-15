'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/lib/SessionProvider';

/**
 * Server APIs remain independently protected regardless of what this component does
 * (middleware/auth.ts, middleware/subscriptionGate.ts) — this is UX convenience only
 * (§26/§7). Direct URL navigation still hits the same authoritative server checks.
 */
export function ProtectedRoute({
  children,
  requireSubscription = false,
}: {
  children: ReactNode;
  /** When true, an authenticated-but-unsubscribed user is redirected to /subscription-required. */
  requireSubscription?: boolean;
}): JSX.Element | null {
  const { status, subscription } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated' && requireSubscription && subscription && !subscription.hasAccess) {
      router.replace('/subscription-required');
    }
  }, [status, subscription, requireSubscription, router]);

  if (status === 'loading') {
    return (
      <div style={{ padding: 'var(--space-6)', color: 'var(--color-text-muted)' }} role="status">
        Loading…
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (requireSubscription && subscription && !subscription.hasAccess) {
    return null;
  }

  return <>{children}</>;
}
