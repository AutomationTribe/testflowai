import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const back = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back, replace: vi.fn() }),
}));

// The real SessionProvider keeps `organisation` in state, so its identity is stable across renders.
// A mock that returned a fresh object on every call would re-fire every effect that depends on it.
const stableOrganisation = vi.hoisted(() => ({ id: 'org-1', name: 'Acme QA' }));

vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({
    status: 'authenticated',
    user: { id: 'u1', email: 'ada@example.com', name: 'Ada', role: 'admin' },
    organisation: stableOrganisation,
    subscription: { hasAccess: true, planType: 'trial', status: 'trial_active', trialEndsAt: null, gracePeriodEndsAt: null, seatsTotal: 3 },
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

const currentQaConfiguration = vi.fn();
const startQaConfigurationDraft = vi.fn();
const publishQaConfigurationDraft = vi.fn();
vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/apiClient')>('../src/lib/apiClient');
  return {
    ...actual,
    apiClient: {
      currentQaConfiguration: (orgId: string) => currentQaConfiguration(orgId),
      startQaConfigurationDraft: (orgId: string, preset: string) => startQaConfigurationDraft(orgId, preset),
      publishQaConfigurationDraft: (orgId: string) => publishQaConfigurationDraft(orgId),
    },
  };
});

import QaSetupPage from '../src/app/qa-setup/page';

const publishedStandard = {
  id: 'v1',
  organisationId: 'org-1',
  versionNumber: 1,
  status: 'published',
  presetOrigin: 'standard',
  publishedBy: 'u1',
  publishedAt: '2026-09-17T00:00:00Z',
  settings: {
    templatesNote: '3 standard templates (default, unmodified)',
    workflowShapes: { test_case: 'no_approval', test_report: 'no_approval', regression_report: 'no_approval' },
    requiredArtifacts: ['test_report'],
    enabledGatesCount: 0,
    totalGatesCount: 6,
  },
};

describe('QA Setup — Set up your QA process', () => {
  afterEach(() => {
    push.mockClear();
    back.mockClear();
    currentQaConfiguration.mockReset();
    startQaConfigurationDraft.mockReset();
    publishQaConfigurationDraft.mockReset();
  });

  it('pre-selects Standard QA (the auto-published default) and marks it Recommended', async () => {
    currentQaConfiguration.mockResolvedValue(publishedStandard);
    render(<QaSetupPage />);

    expect(await screen.findByRole('heading', { name: /set up your qa process/i })).toBeInTheDocument();
    expect(screen.getAllByText('Recommended').length).toBe(1);
    await waitFor(() => expect(screen.getByText(/currently in effect/i)).toBeInTheDocument());
  });

  it('does not clobber a manual card selection if GET .../qa-configuration/current resolves late (race condition regression)', async () => {
    // Deliberately resolve the "current published config" fetch AFTER the user
    // has already clicked a different card — this reproduces the real bug found
    // during manual QA: the fetch would previously always win, silently
    // reverting the user's click back to Standard QA.
    let resolveCurrent: (value: typeof publishedStandard) => void = () => undefined;
    currentQaConfiguration.mockReturnValue(new Promise((resolve) => (resolveCurrent = resolve)));

    render(<QaSetupPage />);
    await screen.findByRole('heading', { name: 'Standard QA' }); // page has rendered; fetch still pending

    fireEvent.click(screen.getByRole('button', { name: /controlled qa/i }));
    expect(screen.getByTestId('qa-setup-summary-workflow')).toHaveTextContent('Draft → Review → Approved');

    // Now the slow fetch finally resolves — to Standard, a DIFFERENT preset than
    // what the user already clicked. Flush the resulting state update fully.
    await act(async () => {
      resolveCurrent(publishedStandard);
      await Promise.resolve();
      await Promise.resolve();
    });

    // The user's Controlled QA selection must still be in effect — not reverted
    // to Standard just because the fetch resolved afterwards.
    expect(screen.getByTestId('qa-setup-summary-workflow')).toHaveTextContent('Draft → Review → Approved');
    // "(currently in effect)" must NOT appear — the org's real published preset
    // (standard) differs from what's selected on screen (controlled).
    expect(screen.queryByText(/currently in effect/i)).not.toBeInTheDocument();
  });

  it('renders all four presets with their approved settings summaries', async () => {
    currentQaConfiguration.mockResolvedValue(publishedStandard);
    render(<QaSetupPage />);

    expect(await screen.findByRole('heading', { name: 'Standard QA' })).toBeInTheDocument();
    expect(screen.getByText('Lightweight QA')).toBeInTheDocument();
    expect(screen.getByText('Controlled QA')).toBeInTheDocument();
    expect(screen.getByText('Custom Setup')).toBeInTheDocument();
  });

  it('updates the summary bar instantly when a different card is selected, before any API call', async () => {
    currentQaConfiguration.mockResolvedValue(publishedStandard);
    render(<QaSetupPage />);
    await screen.findByRole('heading', { name: 'Standard QA' });

    fireEvent.click(screen.getByRole('button', { name: /controlled qa/i }));

    // Scoped by test id — the Controlled QA card's own bullets mention review and
    // approval too, so a bare text query would be ambiguous once that card shows.
    expect(screen.getByTestId('qa-setup-summary-workflow')).toHaveTextContent('Draft → Review → Approved');
    expect(screen.getByTestId('qa-setup-summary-gates')).toHaveTextContent('3 of 6 Gates Active');
    expect(screen.getByTestId('qa-setup-summary-policy')).toHaveTextContent('Test Report + Regression Required');
    expect(startQaConfigurationDraft).not.toHaveBeenCalled();
  });

  it('publishing the selected preset creates a draft, publishes it, and routes to /app', async () => {
    currentQaConfiguration.mockResolvedValue(publishedStandard);
    startQaConfigurationDraft.mockResolvedValue({ ...publishedStandard, status: 'draft', versionNumber: 2 });
    publishQaConfigurationDraft.mockResolvedValue({ ...publishedStandard, versionNumber: 2 });

    render(<QaSetupPage />);
    await screen.findByRole('heading', { name: 'Standard QA' });

    fireEvent.click(screen.getByRole('button', { name: /use standard qa/i }));

    await waitFor(() => expect(startQaConfigurationDraft).toHaveBeenCalledWith('org-1', 'standard'));
    await waitFor(() => expect(publishQaConfigurationDraft).toHaveBeenCalledWith('org-1'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/app'));
  });

  it('selecting Controlled QA and confirming publishes Controlled, not the pre-selected default', async () => {
    currentQaConfiguration.mockResolvedValue(publishedStandard);
    startQaConfigurationDraft.mockResolvedValue({ ...publishedStandard, presetOrigin: 'controlled', status: 'draft', versionNumber: 2 });
    publishQaConfigurationDraft.mockResolvedValue({ ...publishedStandard, presetOrigin: 'controlled', versionNumber: 2 });

    render(<QaSetupPage />);
    await screen.findByRole('heading', { name: 'Standard QA' });
    fireEvent.click(screen.getByRole('button', { name: /controlled qa/i }));

    fireEvent.click(screen.getByRole('button', { name: /use controlled qa/i }));

    await waitFor(() => expect(startQaConfigurationDraft).toHaveBeenCalledWith('org-1', 'controlled'));
  });

  it('Custom Setup starts a draft but does NOT publish, and explains full configuration is a later screen', async () => {
    currentQaConfiguration.mockResolvedValue(publishedStandard);
    startQaConfigurationDraft.mockResolvedValue({ ...publishedStandard, presetOrigin: 'custom', status: 'draft', versionNumber: 2 });

    render(<QaSetupPage />);
    await screen.findByRole('heading', { name: 'Standard QA' });
    fireEvent.click(screen.getByRole('button', { name: /custom setup/i }));

    fireEvent.click(screen.getByRole('button', { name: /start custom setup/i }));

    await waitFor(() => expect(startQaConfigurationDraft).toHaveBeenCalledWith('org-1', 'custom'));
    expect(publishQaConfigurationDraft).not.toHaveBeenCalled();
    expect(await screen.findByText(/custom setup draft started/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalledWith('/app');
  });

  it('shows an error state (not a crash) if publishing fails', async () => {
    currentQaConfiguration.mockResolvedValue(publishedStandard);
    const { ApiError } = await import('../src/lib/apiClient');
    startQaConfigurationDraft.mockRejectedValue(new ApiError(409, 'conflict', 'A configuration draft already exists for this organisation.'));

    render(<QaSetupPage />);
    await screen.findByRole('heading', { name: 'Standard QA' });
    fireEvent.click(screen.getByRole('button', { name: /use standard qa/i }));

    expect(await screen.findByText('A configuration draft already exists for this organisation.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalledWith('/app');
  });

  it('Back button navigates back rather than forward', async () => {
    currentQaConfiguration.mockResolvedValue(publishedStandard);
    render(<QaSetupPage />);
    await screen.findByRole('heading', { name: 'Standard QA' });

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(back).toHaveBeenCalled();
  });
});
