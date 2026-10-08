import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('lists Projects right after Dashboard, and links only Dashboard and Projects', () => {
    render(<AppSidebar activeKey="projects" />);

    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels.slice(0, 2)).toEqual(['Dashboard', 'Projects']);
    // Dashboard is a real link; the active item (Projects) is the current page, so it is not a link.
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/app');
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
    // Destinations whose modules do not exist yet stay unlinked.
    expect(screen.queryByRole('link', { name: 'Requirements' })).not.toBeInTheDocument();
  });

  it('links to Projects from any other screen', () => {
    render(<AppSidebar activeKey="dashboard" />);
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
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

describe('AppSidebar — responsive auto-collapse', () => {
  type Listener = (event: { matches: boolean }) => void;

  function mockMatchMedia(matches: boolean): { change: (nextMatches: boolean) => void } {
    const listeners = new Set<Listener>();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
    })) as unknown as typeof window.matchMedia;
    return { change: (nextMatches) => listeners.forEach((listener) => listener({ matches: nextMatches })) };
  }

  afterEach(() => {
    // jsdom has no matchMedia; remove the mock so other tests see the plain environment.
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('starts collapsed to the icon rail on a narrow window', () => {
    mockMatchMedia(true);
    render(<AppSidebar activeKey="projects" />);

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it('starts expanded on a wide window', () => {
    mockMatchMedia(false);
    render(<AppSidebar activeKey="projects" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  });

  it('collapses when the window is resized below the breakpoint, and re-expands above it', () => {
    const media = mockMatchMedia(false);
    render(<AppSidebar activeKey="projects" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    act(() => media.change(true));
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    act(() => media.change(false));
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('can still be opened by hand on a narrow window', () => {
    mockMatchMedia(true);
    render(<AppSidebar activeKey="projects" />);

    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
