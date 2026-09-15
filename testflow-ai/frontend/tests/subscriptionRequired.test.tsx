import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

const logout = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({
    status: 'authenticated',
    user: { id: '1', email: 'a@example.com', name: 'Ada', role: 'admin' },
    organisation: { id: 'org-1', name: 'Acme QA' },
    subscription: { hasAccess: false, planType: null, status: 'none', trialEndsAt: null, gracePeriodEndsAt: null, seatsTotal: 0 },
    refresh: vi.fn(),
    logout,
  }),
}));

import SubscriptionRequiredPage from '../src/app/subscription-required/page';

describe('Subscription Required', () => {
  it('shows the blocked state with organisation, no active plan, and the three permitted actions', () => {
    render(<SubscriptionRequiredPage />);

    expect(screen.getByRole('heading', { name: /subscription required/i })).toBeInTheDocument();
    expect(screen.getAllByText(/acme qa/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no active plan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose a plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start free trial/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('exposes no project/business functionality — only the three permitted actions render', () => {
    render(<SubscriptionRequiredPage />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('signs out from the blocked screen and returns to login', async () => {
    render(<SubscriptionRequiredPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await vi.waitFor(() => expect(logout).toHaveBeenCalled());
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });

  it('navigates to Choose a Plan', () => {
    render(<SubscriptionRequiredPage />);
    fireEvent.click(screen.getByRole('button', { name: /choose a plan/i }));
    expect(push).toHaveBeenCalledWith('/subscription');
  });
});
