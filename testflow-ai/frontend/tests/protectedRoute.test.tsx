import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const sessionState = vi.hoisted(() => ({
  status: 'unauthenticated' as string,
  subscription: null as { hasAccess: boolean } | null,
}));
vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({
    status: sessionState.status,
    user: null,
    organisation: null,
    subscription: sessionState.subscription,
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

import { ProtectedRoute } from '../src/components/ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects to /login when unauthenticated and renders nothing', () => {
    sessionState.status = 'unauthenticated';
    sessionState.subscription = null;
    const { container } = render(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>,
    );

    expect(replace).toHaveBeenCalledWith('/login');
    expect(container).not.toHaveTextContent('secret content');
  });

  it('renders children once authenticated (no subscription requirement)', () => {
    sessionState.status = 'authenticated';
    sessionState.subscription = null;
    render(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>,
    );

    expect(screen.getByText('secret content')).toBeInTheDocument();
  });

  it('redirects an authenticated-but-unsubscribed user to /subscription-required when subscription is required', () => {
    sessionState.status = 'authenticated';
    sessionState.subscription = { hasAccess: false };
    const { container } = render(
      <ProtectedRoute requireSubscription>
        <p>business content</p>
      </ProtectedRoute>,
    );

    expect(replace).toHaveBeenCalledWith('/subscription-required');
    expect(container).not.toHaveTextContent('business content');
  });

  it('renders children for an authenticated, subscribed user when subscription is required', () => {
    sessionState.status = 'authenticated';
    sessionState.subscription = { hasAccess: true };
    render(
      <ProtectedRoute requireSubscription>
        <p>business content</p>
      </ProtectedRoute>,
    );

    expect(screen.getByText('business content')).toBeInTheDocument();
  });
});
