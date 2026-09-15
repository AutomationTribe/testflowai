'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/lib/SessionProvider';

/** Root route: send the user to the right place once session/subscription status is known. */
export default function RootPage(): JSX.Element | null {
  const { status, subscription } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated' && subscription) {
      router.replace(subscription.hasAccess ? '/app' : '/subscription-required');
    }
  }, [status, subscription, router]);

  return null;
}
