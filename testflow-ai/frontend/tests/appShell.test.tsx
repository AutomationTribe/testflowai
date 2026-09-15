import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({
    status: 'authenticated',
    user: { id: '1', email: 'ada@example.com', name: 'Ada Admin', role: 'admin' },
    organisation: { id: 'org-1', name: 'Acme QA' },
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

import { AppShell } from '../src/components/AppShell';

describe('AppShell', () => {
  it('renders the authenticated shell with user/organisation and a collapse control', () => {
    render(
      <AppShell>
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getByText('Ada Admin')).toBeInTheDocument();
    expect(screen.getByText('Acme QA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
