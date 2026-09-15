import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

const startTrial = vi.fn();
vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/apiClient')>('../src/lib/apiClient');
  return { ...actual, apiClient: { ...actual.apiClient, startTrial: (...args: unknown[]) => startTrial(...args) } };
});

vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({
    status: 'authenticated',
    user: { id: '1', email: 'a@example.com', name: 'Ada', role: 'admin' },
    organisation: { id: 'org-1', name: 'Acme QA' },
    subscription: { hasAccess: false, planType: null, status: 'none', trialEndsAt: null, gracePeriodEndsAt: null, seatsTotal: 0 },
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

import PlanSelectionPage from '../src/app/subscription/page';

describe('Plan Selection', () => {
  it('presents Trial, Monthly, and Yearly with their approved terms', () => {
    render(<PlanSelectionPage />);

    expect(screen.getByRole('heading', { name: /choose your testflow plan/i })).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('14 days')).toBeInTheDocument();
    expect(screen.getByText('Up to 3 seats')).toBeInTheDocument();
    expect(screen.getByText('Available once per organisation')).toBeInTheDocument();
    expect(screen.getByText('No credit card required upfront.')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('per seat / month')).toBeInTheDocument();
    expect(screen.getByText('$9')).toBeInTheDocument();
    expect(screen.getByText('per seat / month (billed annually upfront)')).toBeInTheDocument();
  });

  it('gives Monthly and Yearly each their own independent seat-quantity control', () => {
    render(<PlanSelectionPage />);

    expect(screen.getByRole('spinbutton', { name: 'Monthly seats' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Yearly seats' })).toBeInTheDocument();
    // The Trial card has no seat selector at all — its seat count is fixed (3) by FR-SUB-001.
    expect(screen.queryByRole('spinbutton', { name: /trial/i })).not.toBeInTheDocument();
  });

  it("changing Monthly's seat quantity recalculates only the Monthly total", () => {
    render(<PlanSelectionPage />);

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Monthly seats' }), { target: { value: '5' } });

    expect(screen.getByText('$50.00')).toBeInTheDocument(); // 5 x $10 monthly
    expect(screen.getByText('$108.00')).toBeInTheDocument(); // yearly unchanged: 1 x $9 x 12
  });

  it("changing Yearly's seat quantity recalculates only the Yearly total", () => {
    render(<PlanSelectionPage />);

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Yearly seats' }), { target: { value: '5' } });

    expect(screen.getByText('$540.00')).toBeInTheDocument(); // 5 x $9 x 12 yearly
    expect(screen.getByText('$10.00')).toBeInTheDocument(); // monthly unchanged: 1 x $10
  });

  it('increments and decrements via the stepper buttons', () => {
    render(<PlanSelectionPage />);
    const monthlyInput = screen.getByRole('spinbutton', { name: 'Monthly seats' });
    expect(monthlyInput).toHaveValue(1);

    fireEvent.click(screen.getByRole('button', { name: 'Increase Monthly seats' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase Monthly seats' }));
    expect(monthlyInput).toHaveValue(3);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease Monthly seats' }));
    expect(monthlyInput).toHaveValue(2);
  });

  it('cannot be decremented below 1 seat (invalid quantities are clamped, not submitted)', () => {
    render(<PlanSelectionPage />);
    const monthlyInput = screen.getByRole('spinbutton', { name: 'Monthly seats' });

    fireEvent.click(screen.getByRole('button', { name: 'Decrease Monthly seats' }));
    expect(monthlyInput).toHaveValue(1);

    fireEvent.change(monthlyInput, { target: { value: '0' } });
    expect(monthlyInput).toHaveValue(1);

    fireEvent.change(monthlyInput, { target: { value: '-5' } });
    expect(monthlyInput).toHaveValue(1);
  });

  it('starts a trial with no seat selector (fixed 3-seat capacity) and navigates to the success screen', async () => {
    startTrial.mockResolvedValueOnce({ subscription: { planType: 'trial' } });
    render(<PlanSelectionPage />);

    fireEvent.click(screen.getByRole('button', { name: /start free trial/i }));

    await vi.waitFor(() => expect(startTrial).toHaveBeenCalledWith('org-1'));
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/subscription/success?plan=trial'));
  });

  it('navigates to checkout with the Monthly card’s own seat count', () => {
    render(<PlanSelectionPage />);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Monthly seats' }), { target: { value: '3' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Yearly seats' }), { target: { value: '7' } });

    fireEvent.click(screen.getAllByRole('button', { name: /continue to checkout/i })[0]!);

    expect(push).toHaveBeenCalledWith('/subscription/checkout?plan=monthly&seats=3');
  });

  it('navigates to checkout with the Yearly card’s own seat count', () => {
    render(<PlanSelectionPage />);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Monthly seats' }), { target: { value: '3' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Yearly seats' }), { target: { value: '7' } });

    fireEvent.click(screen.getAllByRole('button', { name: /continue to checkout/i })[1]!);

    expect(push).toHaveBeenCalledWith('/subscription/checkout?plan=yearly&seats=7');
  });
});
