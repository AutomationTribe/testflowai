import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const refresh = vi.fn();
vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({ status: 'unauthenticated', user: null, organisation: null, subscription: null, refresh, logout: vi.fn() }),
}));

const signUp = vi.fn();
vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/apiClient')>('../src/lib/apiClient');
  return { ...actual, apiClient: { ...actual.apiClient, signUp: (...args: unknown[]) => signUp(...args) } };
});

import SignUpPage from '../src/app/signup/page';

describe('SignUpPage', () => {
  it('renders exactly the approved fields: name, email, password, role, organisation name', () => {
    render(<SignUpPage />);

    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^role$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organisation name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('offers only Admin and QA Manager as role options', () => {
    render(<SignUpPage />);
    const role = screen.getByLabelText(/^role$/i) as HTMLSelectElement;
    const options = Array.from(role.options).map((o) => o.value);
    expect(options).toEqual(['admin', 'qa_manager']);
  });

  it('submits the exact five fields and redirects to /subscription on success', async () => {
    signUp.mockResolvedValueOnce({ user: { id: '1' } });
    render(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Ada Admin' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'correct-horse-battery-staple' } });
    fireEvent.change(screen.getByLabelText(/organisation name/i), { target: { value: 'Acme QA' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(signUp).toHaveBeenCalledWith({
      name: 'Ada Admin',
      email: 'ada@example.com',
      password: 'correct-horse-battery-staple',
      role: 'admin',
      organisationName: 'Acme QA',
    }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/subscription'));
  });
});
