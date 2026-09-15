import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const payWithPaystack = vi.fn();
vi.mock('@/lib/paystackClient', () => ({
  payWithPaystack: (accessCode: string) => payWithPaystack(accessCode),
}));

import { CheckoutForm } from '../src/components/CheckoutForm';

const baseProps = {
  planType: 'yearly' as const,
  seatCount: 5,
  amountCents: 54000,
  accessCode: 'access_test_123',
  organisationName: 'Acme QA',
  onPaymentSubmitted: vi.fn(),
  onChoosePlanDifferently: vi.fn(),
};

describe('CheckoutForm', () => {
  it('shows the order summary with organisation, plan, seats, billing cycle, and total due today', () => {
    render(<CheckoutForm {...baseProps} onPaymentSubmitted={vi.fn()} onChoosePlanDifferently={vi.fn()} />);

    expect(screen.getByText('Acme QA')).toBeInTheDocument();
    expect(screen.getByText('Yearly Subscription')).toBeInTheDocument();
    expect(screen.getByText('5 seats')).toBeInTheDocument();
    expect(screen.getByText('Annual recurring')).toBeInTheDocument();
    expect(screen.getByText('Total Due Today')).toBeInTheDocument();
    expect(screen.getAllByText('$540.00').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /pay \$540\.00 & activate subscription/i })).toBeInTheDocument();
  });

  it('shows a processing state and prevents duplicate submission while payment is in flight', async () => {
    let resolvePay: (value: unknown) => void = () => undefined;
    payWithPaystack.mockReturnValueOnce(new Promise((resolve) => (resolvePay = resolve)));
    const onPaymentSubmitted = vi.fn();

    render(<CheckoutForm {...baseProps} planType="monthly" amountCents={5000} onPaymentSubmitted={onPaymentSubmitted} onChoosePlanDifferently={vi.fn()} />);

    const payButton = screen.getByRole('button', { name: /pay \$50\.00/i });
    fireEvent.click(payButton);

    expect(await screen.findByRole('button', { name: /processing payment/i })).toBeDisabled();
    fireEvent.click(payButton); // a second click while processing must not trigger a second payWithPaystack call
    expect(payWithPaystack).toHaveBeenCalledTimes(1);

    resolvePay({ success: true });
    await waitFor(() => expect(onPaymentSubmitted).toHaveBeenCalledTimes(1));
  });

  it('shows a Payment unsuccessful banner with retry and Choose Another Plan on failure', async () => {
    payWithPaystack.mockResolvedValueOnce({ success: false, message: 'Your card was declined.' });
    const onPaymentSubmitted = vi.fn();
    const onChoosePlanDifferently = vi.fn();

    render(<CheckoutForm {...baseProps} planType="monthly" amountCents={5000} onPaymentSubmitted={onPaymentSubmitted} onChoosePlanDifferently={onChoosePlanDifferently} />);
    fireEvent.click(screen.getByRole('button', { name: /pay \$50\.00/i }));

    expect(await screen.findByText('Payment unsuccessful')).toBeInTheDocument();
    expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
    expect(onPaymentSubmitted).not.toHaveBeenCalled();

    // Retry (the Pay button itself) is available — not stuck in a permanently failed state.
    expect(screen.getByRole('button', { name: /pay \$50\.00/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /choose another plan/i }));
    expect(onChoosePlanDifferently).toHaveBeenCalled();
  });

  it('never renders a tax/VAT line or a next-renewal date (neither is an approved concept)', () => {
    render(<CheckoutForm {...baseProps} onPaymentSubmitted={vi.fn()} onChoosePlanDifferently={vi.fn()} />);
    expect(screen.queryByText(/tax/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bvat\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/renewal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next.*scheduled/i)).not.toBeInTheDocument();
  });
});
