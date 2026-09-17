import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const logout = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({
    status: 'authenticated',
    user: { id: '1', email: 'ada@example.com', name: 'Ada Admin', role: 'admin' },
    organisation: { id: 'org-1', name: 'Acme QA' },
    refresh: vi.fn(),
    logout,
  }),
}));

import { AppSidebar, NAV_ITEMS } from '../src/components/AppSidebar';

/**
 * AppSidebar is the single shared sidebar AppShell.tsx (/app) and the QA Setup
 * screen both render — this is the regression backstop for the defect found
 * during manual QA (the two screens had drifted to different sidebar color
 * schemes because QA Setup duplicated the sidebar instead of reusing this one).
 */
describe('AppSidebar', () => {
  it('renders every nav destination exactly once', () => {
    render(<AppSidebar activeKey="dashboard" />);
    for (const item of NAV_ITEMS) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it('marks only the given activeKey as active (bold/highlighted), matching whichever screen renders it', () => {
    render(<AppSidebar activeKey="qa-operating-model" />);

    const active = screen.getByText('QA Operating Model').closest('div')!;
    const inactive = screen.getByText('Dashboard').closest('div')!;

    // Asserts the active/inactive distinction rather than an exact weight, so
    // tuning the design's typography doesn't break this.
    expect(active).toHaveStyle({ fontWeight: '600' });
    expect(inactive).not.toHaveStyle({ fontWeight: '600' });
  });

  it('shows the signed-in user with their real role, and signs out on click', () => {
    render(<AppSidebar activeKey="dashboard" />);

    expect(screen.getByText('Ada Admin')).toBeInTheDocument();
    // The role shown is the session's real role, never an invented job title.
    expect(screen.getByRole('button', { name: /admin · sign out/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(logout).toHaveBeenCalled();
  });

  it('collapses to icon-only and back on toggle', () => {
    render(<AppSidebar activeKey="dashboard" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }));
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
