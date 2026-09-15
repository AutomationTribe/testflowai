import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({
    status: 'unauthenticated',
    user: null,
    organisation: null,
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

import LoginPage from '../src/app/login/page';

describe('LoginPage', () => {
  it('renders the sign-in form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
