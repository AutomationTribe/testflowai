import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}));

let sessionRole: 'admin' | 'qa_manager' | 'qa_tester' = 'admin';
// The real SessionProvider keeps `organisation` in state, so its identity is stable across renders.
// A mock that returned a fresh object on every call would re-fire every effect that depends on it.
const stableOrganisation = vi.hoisted(() => ({ id: 'org-1', name: 'Acme QA' }));

vi.mock('@/lib/SessionProvider', () => ({
  useSession: () => ({
    status: 'authenticated',
    user: { id: 'u1', email: 'ada@example.com', name: 'Ada Admin', role: sessionRole },
    organisation: stableOrganisation,
    subscription: { hasAccess: true, planType: 'trial', status: 'trial_active', trialEndsAt: null, gracePeriodEndsAt: null, seatsTotal: 3 },
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

const listProjects = vi.fn();
const createProject = vi.fn();
const currentQaConfiguration = vi.fn();
vi.mock('@/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/apiClient')>('../src/lib/apiClient');
  return {
    ...actual,
    apiClient: {
      listProjects: (orgId: string, params: unknown) => listProjects(orgId, params),
      createProject: (orgId: string, input: unknown) => createProject(orgId, input),
      currentQaConfiguration: (orgId: string) => currentQaConfiguration(orgId),
    },
  };
});

import { ApiError } from '../src/lib/apiClient';
import ProjectsPage from '../src/app/projects/page';

const standardV1 = { versionId: 'v1', versionNumber: 1, presetOrigin: 'standard' as const };

function project(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    organisationId: 'org-1',
    projectCode: 'PRJ-001',
    name: 'Website Build',
    description: 'Main corporate website',
    status: 'active',
    createdAt: '2026-10-07T10:00:00.000000Z',
    createdBy: { userId: 'u1', name: 'Ada Admin' },
    qaConfiguration: standardV1,
    members: [{ userId: 'u1', name: 'Ada Admin' }],
    ...overrides,
  };
}

const emptyResponse = { items: [], nextCursor: null, counts: { total: 0, active: 0, archived: 0 }, qaConfigurations: [] };

function populatedResponse(items = [project()], counts = { total: items.length, active: items.length, archived: 0 }) {
  return { items, nextCursor: null, counts, qaConfigurations: [standardV1] };
}

const currentConfig = {
  id: 'v1',
  organisationId: 'org-1',
  versionNumber: 1,
  status: 'published',
  presetOrigin: 'standard',
  publishedBy: 'u1',
  publishedAt: '2026-10-01T00:00:00Z',
  settings: {},
};

async function renderPage(): Promise<void> {
  render(<ProjectsPage />);
  await waitFor(() => expect(listProjects).toHaveBeenCalled());
}

describe('Projects page', () => {
  beforeEach(() => {
    sessionRole = 'admin';
    currentQaConfiguration.mockResolvedValue(currentConfig);
  });

  afterEach(() => {
    listProjects.mockReset();
    createProject.mockReset();
    currentQaConfiguration.mockReset();
    vi.useRealTimers();
  });

  describe('Projects — Empty State', () => {
    it('shows the empty state when the caller has no accessible projects', async () => {
      listProjects.mockResolvedValue(emptyResponse);
      await renderPage();

      expect(await screen.findByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByText('0 TOTAL')).toBeInTheDocument();
      expect(screen.getByText(/create your first project to organise test cases/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /new project/i })).toHaveLength(2);
      expect(screen.getByRole('link', { name: /browse qa configurations/i })).toHaveAttribute('href', '/qa-setup');
    });

    it('does not render the design\'s invented telemetry, feature cards, or Sprint workspace label', async () => {
      listProjects.mockResolvedValue(emptyResponse);
      await renderPage();
      await screen.findByText('No projects yet');

      expect(screen.queryByText(/repository: connected/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ci\/cd/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/sprint 17/i)).not.toBeInTheDocument();
    });

    it('hides "Browse QA Configurations" from a QA Tester, who cannot open QA Setup', async () => {
      sessionRole = 'qa_tester';
      listProjects.mockResolvedValue(emptyResponse);
      await renderPage();
      await screen.findByText('No projects yet');

      expect(screen.queryByRole('link', { name: /browse qa configurations/i })).not.toBeInTheDocument();
    });
  });

  describe('Projects — List', () => {
    it('renders every returned project with its real data', async () => {
      listProjects.mockResolvedValue(
        populatedResponse([
          project(),
          project({
            id: 'p2',
            projectCode: 'PRJ-002',
            name: 'Mobile App',
            description: null,
            createdBy: { userId: 'u2', name: 'Sarah Lin' },
            members: [
              { userId: 'u2', name: 'Sarah Lin' },
              { userId: 'u3', name: 'Dave Chen' },
            ],
          }),
        ]),
      );
      await renderPage();

      const table = await screen.findByRole('table');
      expect(within(table).getByText('Website Build')).toBeInTheDocument();
      expect(within(table).getByText('PRJ-001')).toBeInTheDocument();
      expect(within(table).getByText('Main corporate website')).toBeInTheDocument();
      expect(within(table).getAllByText('Standard QA v1')).toHaveLength(2);
      expect(within(table).getAllByText('Active')).toHaveLength(2);
      // Once as the creator (Created By) and once as a member (screen-reader name of her chip).
      expect(within(table).getAllByText('Sarah Lin')).toHaveLength(2);
      expect(within(table).getByRole('cell', { name: 'Sarah Lin' })).toBeInTheDocument();
      expect(within(table).getAllByText('2026-10-07')).toHaveLength(2);
      expect(within(table).getByTitle('Dave Chen')).toHaveTextContent('DC');
      // A missing description is shown as a dash, never made up.
      expect(within(table).getByText('—')).toBeInTheDocument();
      expect(screen.queryByText('No projects yet')).not.toBeInTheDocument();
    });

    it('shows real status counts on the tabs and a real "showing" total', async () => {
      listProjects.mockResolvedValue(populatedResponse([project()], { total: 5, active: 4, archived: 1 }));
      await renderPage();

      expect(await screen.findByRole('button', { name: /all projects \(5\)/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /active \(4\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /archived \(1\)/i })).toBeInTheDocument();
      expect(screen.getByText('Showing 1–1 of 5 projects')).toBeInTheDocument();
    });

    it('marks archived projects with an Archived badge', async () => {
      listProjects.mockResolvedValue(populatedResponse([project({ status: 'archived' })], { total: 1, active: 0, archived: 1 }));
      await renderPage();

      const table = await screen.findByRole('table');
      expect(within(table).getByText('Archived')).toBeInTheDocument();
    });

    it('filters by status tab through the API', async () => {
      listProjects.mockResolvedValue(populatedResponse());
      await renderPage();
      await screen.findByRole('table');

      fireEvent.click(screen.getByRole('button', { name: /archived/i }));

      await waitFor(() =>
        expect(listProjects).toHaveBeenLastCalledWith('org-1', expect.objectContaining({ status: 'archived' })),
      );
    });

    it('filters by QA configuration through the API', async () => {
      listProjects.mockResolvedValue(populatedResponse());
      await renderPage();
      await screen.findByRole('table');

      fireEvent.change(screen.getByLabelText('Filter by QA configuration'), { target: { value: 'v1' } });

      await waitFor(() =>
        expect(listProjects).toHaveBeenLastCalledWith('org-1', expect.objectContaining({ qaConfigurationVersionId: 'v1' })),
      );
    });

    it('searches with a debounce, then calls the API once with the text', async () => {
      listProjects.mockResolvedValue(populatedResponse());
      await renderPage();
      await screen.findByRole('table');
      listProjects.mockClear();

      vi.useFakeTimers();
      const search = screen.getByLabelText('Search projects');
      fireEvent.change(search, { target: { value: 'm' } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      fireEvent.change(search, { target: { value: 'mob' } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(299);
      });
      // Typing again restarted the wait, and 299ms after the last keystroke nothing has been requested.
      expect(listProjects).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2);
      });

      // One request for the final text — the intermediate "m" was never sent.
      expect(listProjects).toHaveBeenCalledTimes(1);
      expect(listProjects).toHaveBeenCalledWith('org-1', expect.objectContaining({ q: 'mob' }));
    });

    it('shows a "no match" state with a Clear filters action when filters hide every project', async () => {
      listProjects.mockResolvedValue(populatedResponse());
      await renderPage();
      await screen.findByRole('table');

      listProjects.mockResolvedValue({ ...emptyResponse, counts: { total: 3, active: 3, archived: 0 } });
      fireEvent.click(screen.getByRole('button', { name: /archived/i }));

      expect(await screen.findByText('No projects match your filters')).toBeInTheDocument();
      expect(screen.queryByText('No projects yet')).not.toBeInTheDocument();

      listProjects.mockResolvedValue(populatedResponse());
      // Scope to the message block: the toolbar's icon button is also named "Clear filters".
      const noMatch = screen.getByText('No projects match your filters').parentElement!;
      fireEvent.click(within(noMatch).getByRole('button', { name: 'Clear filters' }));
      await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    });

    it('shows an error state with a retry when the list cannot be loaded', async () => {
      listProjects.mockRejectedValueOnce(new ApiError(500, 'internal_error', 'Boom'));
      await renderPage();

      expect(await screen.findByText('Could not load projects')).toBeInTheDocument();

      listProjects.mockResolvedValueOnce(populatedResponse());
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(await screen.findByRole('table')).toBeInTheDocument();
    });
  });

  describe('Projects — List: pagination', () => {
    function deferred<T>() {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((res) => (resolve = res));
      return { promise, resolve };
    }

    /** A page of `count` projects named "<prefix> 1..count". */
    function page(prefix: string, count: number, total: number, nextCursor: string | null) {
      return {
        items: Array.from({ length: count }, (_, index) => project({ id: `${prefix}-${index}`, name: `${prefix} ${index + 1}`, projectCode: `PRJ-${index + 1}` })),
        nextCursor,
        counts: { total, active: total, archived: 0 },
        qaConfigurations: [standardV1],
      };
    }

    it('shows the first page of 10 with "Page 1 of 3", Previous disabled and Next enabled', async () => {
      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      await renderPage();

      expect(await screen.findByText('Showing 1–10 of 25 projects')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
      expect(listProjects).toHaveBeenCalledWith('org-1', expect.objectContaining({ limit: 10, cursor: undefined }));
    });

    it('Next loads the following page with the server cursor, and Previous returns to the first page', async () => {
      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      await renderPage();
      await screen.findByText('A 1');

      listProjects.mockResolvedValueOnce(page('B', 10, 25, 'c2'));
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

      expect(await screen.findByText('B 1')).toBeInTheDocument();
      // Pages replace each other — rows are not appended.
      expect(screen.queryByText('A 1')).not.toBeInTheDocument();
      expect(listProjects).toHaveBeenLastCalledWith('org-1', expect.objectContaining({ limit: 10, cursor: 'c1' }));
      expect(screen.getByText('Showing 11–20 of 25 projects')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();

      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));

      expect(await screen.findByText('A 1')).toBeInTheDocument();
      expect(listProjects).toHaveBeenLastCalledWith('org-1', expect.objectContaining({ cursor: undefined }));
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('on the last page Next is disabled and the range is correct', async () => {
      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      await renderPage();
      await screen.findByText('A 1');
      listProjects.mockResolvedValueOnce(page('B', 10, 25, 'c2'));
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await screen.findByText('B 1');
      listProjects.mockResolvedValueOnce(page('C', 5, 25, null));
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

      expect(await screen.findByText('C 1')).toBeInTheDocument();
      expect(screen.getByText('Showing 21–25 of 25 projects')).toBeInTheDocument();
      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('changing rows per page restarts at page 1 with the new page size', async () => {
      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      await renderPage();
      await screen.findByText('A 1');
      listProjects.mockResolvedValueOnce(page('B', 10, 25, 'c2'));
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await screen.findByText('B 1');

      listProjects.mockResolvedValueOnce(page('Z', 25, 25, null));
      fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '25' } });

      expect(await screen.findByText('Z 1')).toBeInTheDocument();
      expect(listProjects).toHaveBeenLastCalledWith('org-1', expect.objectContaining({ limit: 25, cursor: undefined }));
      expect(screen.getByText('Showing 1–25 of 25 projects')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    it('a filter change returns to page 1 instead of asking for page 2 of the new filter', async () => {
      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      await renderPage();
      await screen.findByText('A 1');
      listProjects.mockResolvedValueOnce(page('B', 10, 25, 'c2'));
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await screen.findByText('B 1');

      listProjects.mockResolvedValueOnce(page('F', 3, 3, null));
      fireEvent.click(screen.getByRole('button', { name: /archived/i }));

      expect(await screen.findByText('F 1')).toBeInTheDocument();
      expect(listProjects).toHaveBeenLastCalledWith('org-1', expect.objectContaining({ status: 'archived', cursor: undefined }));
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    it('pauses Previous/Next while a page is loading, and ignores a slow page that a filter change replaced', async () => {
      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      await renderPage();
      await screen.findByText('A 1');

      const slowNext = deferred<ReturnType<typeof page>>();
      listProjects.mockReturnValueOnce(slowNext.promise);
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled());

      listProjects.mockResolvedValueOnce(page('F', 2, 2, null));
      fireEvent.click(screen.getByRole('button', { name: /archived/i }));
      await screen.findByText('F 1');

      await act(async () => slowNext.resolve(page('B', 10, 25, 'c2')));

      expect(screen.queryByText('B 1')).not.toBeInTheDocument();
      expect(screen.getByText('F 1')).toBeInTheDocument();
    });

    it('shows an error with Try again when a page cannot be loaded, and retrying loads that same page', async () => {
      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      await renderPage();
      await screen.findByText('A 1');

      listProjects.mockRejectedValueOnce(new ApiError(500, 'internal_error', 'Page failed'));
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(await screen.findByText('Page failed')).toBeInTheDocument();
      expect(screen.queryByText('A 1')).not.toBeInTheDocument();

      listProjects.mockResolvedValueOnce(page('B', 10, 25, 'c2'));
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByText('B 1')).toBeInTheDocument();
      expect(listProjects).toHaveBeenLastCalledWith('org-1', expect.objectContaining({ cursor: 'c1' }));
    });

    it('keeps the page the user moved to when the search debounce timer fires with unchanged search text', async () => {
      listProjects.mockResolvedValueOnce(page('A', 10, 25, 'c1'));
      await renderPage();
      await screen.findByText('A 1');

      listProjects.mockResolvedValueOnce(page('B', 10, 25, 'c2'));
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await screen.findByText('B 1');
      // Let well over the 300ms debounce elapse with no typing.
      await new Promise((resolve) => setTimeout(resolve, 450));

      expect(screen.getByText('B 1')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(listProjects).toHaveBeenCalledTimes(2);
    });

    it('does not fire a second, redundant request after the page first loads', async () => {
      vi.useFakeTimers();
      listProjects.mockResolvedValue(page('A', 3, 3, null));
      render(<ProjectsPage />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(listProjects).toHaveBeenCalledTimes(1);
    });
  });

  describe('Projects — List: stale responses and failures', () => {
    function deferred<T>() {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((res) => (resolve = res));
      return { promise, resolve };
    }

    it('ignores a slow response for an earlier filter when a newer filter has already answered', async () => {
      listProjects.mockResolvedValueOnce(populatedResponse());
      await renderPage();
      await screen.findByRole('table');

      const slowActive = deferred<ReturnType<typeof populatedResponse>>();
      listProjects.mockReturnValueOnce(slowActive.promise);
      fireEvent.click(screen.getByRole('button', { name: /^active/i }));
      listProjects.mockResolvedValueOnce(populatedResponse([project({ id: 'a1', name: 'Archived one', status: 'archived' })]));
      fireEvent.click(screen.getByRole('button', { name: /^archived/i }));
      await screen.findByText('Archived one');

      await act(async () => slowActive.resolve(populatedResponse([project({ name: 'Slow active result' })])));

      expect(screen.queryByText('Slow active result')).not.toBeInTheDocument();
      expect(screen.getByText('Archived one')).toBeInTheDocument();
    });

    it('hides the stale rows and shows an error with Try again when reloading for a new filter fails', async () => {
      listProjects.mockResolvedValueOnce(populatedResponse());
      await renderPage();
      await screen.findByRole('table');

      listProjects.mockRejectedValueOnce(new ApiError(500, 'internal_error', 'Server exploded'));
      fireEvent.click(screen.getByRole('button', { name: /archived/i }));

      expect(await screen.findByText('Could not load projects')).toBeInTheDocument();
      expect(screen.getByText('Server exploded')).toBeInTheDocument();
      // The Active rows must not stay visible under the Archived filter.
      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      listProjects.mockResolvedValueOnce(populatedResponse([project({ id: 'a1', name: 'Archived one', status: 'archived' })]));
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(await screen.findByText('Archived one')).toBeInTheDocument();
    });

  });

  describe('Projects — List: accessibility', () => {
    it('exposes full member names to assistive technology, names the table, and marks the active filter', async () => {
      listProjects.mockResolvedValue(
        populatedResponse([project({ members: [{ userId: 'u3', name: 'Dave Chen' }], description: 'A long description' })]),
      );
      await renderPage();

      const table = await screen.findByRole('table', { name: 'Projects' });
      expect(within(table).getByText('Dave Chen')).toBeInTheDocument();
      expect(within(table).getByTitle('A long description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /all projects/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /^active/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText(/showing 1–1 of 1 project/i)).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Projects — Create Project', () => {
    async function openDialog(): Promise<HTMLElement> {
      listProjects.mockResolvedValue(emptyResponse);
      await renderPage();
      fireEvent.click((await screen.findAllByRole('button', { name: /new project/i }))[0]!);
      return screen.findByRole('dialog', { name: 'Create Project' });
    }

    it('opens the modal with the approved fields, the real current QA configuration, and focuses the name', async () => {
      const dialog = await openDialog();

      expect(within(dialog).getByText(/create a project and choose the qa configuration/i)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/project name/i)).toHaveFocus();
      expect(within(dialog).getByLabelText(/description \(optional\)/i)).toBeInTheDocument();
      expect(await within(dialog).findByText('Standard QA')).toBeInTheDocument();
      expect(within(dialog).getByText('v1')).toBeInTheDocument();
      expect(within(dialog).getByText(/configuration suites and test policy standards are inherited/i)).toHaveTextContent('Acme QA');
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Create Project' })).toBeInTheDocument();
      expect(currentQaConfiguration).toHaveBeenCalledWith('org-1');
    });

    it('shows "View configuration" to an Admin/QA Manager but not to a QA Tester', async () => {
      let dialog = await openDialog();
      expect(within(dialog).getByRole('link', { name: /view configuration/i })).toHaveAttribute('href', '/qa-setup');
    });

    it('hides "View configuration" from a QA Tester', async () => {
      sessionRole = 'qa_tester';
      const dialog = await openDialog();
      expect(within(dialog).queryByRole('link', { name: /view configuration/i })).not.toBeInTheDocument();
    });

    it('requires a project name and does not call the API when it is blank', async () => {
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');

      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      expect(await within(dialog).findByText('Project name is required.')).toBeInTheDocument();
      expect(createProject).not.toHaveBeenCalled();
    });

    it('rejects an over-long name and description client-side', async () => {
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');
      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'x'.repeat(121) } });
      fireEvent.change(within(dialog).getByLabelText(/description/i), { target: { value: 'y'.repeat(501) } });

      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      expect(await within(dialog).findByText(/120 characters or fewer/)).toBeInTheDocument();
      expect(within(dialog).getByText(/500 characters or fewer/)).toBeInTheDocument();
      expect(createProject).not.toHaveBeenCalled();
    });

    it('creates the project with the trimmed values pinned to the shown QA configuration, then shows the populated list', async () => {
      const created = project({ id: 'new', name: 'Mobile Banking App', projectCode: 'PRJ-001' });
      createProject.mockResolvedValue(created);
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');

      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: '  Mobile Banking App  ' } });
      fireEvent.change(within(dialog).getByLabelText(/description/i), { target: { value: ' Retail app ' } });
      listProjects.mockResolvedValue(populatedResponse([created]));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      await waitFor(() =>
        expect(createProject).toHaveBeenCalledWith('org-1', {
          name: 'Mobile Banking App',
          description: 'Retail app',
          qaConfigurationVersionId: 'v1',
        }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      const table = await screen.findByRole('table');
      expect(within(table).getByText('Mobile Banking App')).toBeInTheDocument();
      expect(screen.queryByText('No projects yet')).not.toBeInTheDocument();
    });

    it('omits an empty description from the request', async () => {
      createProject.mockResolvedValue(project());
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');
      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'Only name' } });

      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      await waitFor(() => expect(createProject).toHaveBeenCalled());
      expect(createProject.mock.calls[0]![1]).not.toHaveProperty('description');
      // Let the post-create work (dialog closes, list reloads) finish inside the test. Otherwise it runs
      // after afterEach has reset the mocks and the reload calls a mock that returns undefined.
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await waitFor(() => expect(listProjects).toHaveBeenCalledTimes(2));
    });

    it('shows a server-side field error next to the field and keeps the dialog open', async () => {
      createProject.mockRejectedValue(
        new ApiError(422, 'validation_error', 'Invalid', { qaConfigurationVersionId: 'Select the current configuration.' }),
      );
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');
      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'Valid name' } });

      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      expect(await within(dialog).findByText('Select the current configuration.')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Create Project' })).toBeEnabled();
    });

    it('shows a subscription restriction message from the server and keeps the dialog open', async () => {
      createProject.mockRejectedValue(new ApiError(403, 'subscription_required', 'An active trial or subscription is required.'));
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');
      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'Blocked project' } });

      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      expect(await within(dialog).findByText('An active trial or subscription is required.')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('prevents a double submit while the request is in flight', async () => {
      let resolveCreate: (value: unknown) => void = () => undefined;
      createProject.mockReturnValue(new Promise((resolve) => (resolveCreate = resolve)));
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');
      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'Once only' } });

      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));
      const busyButton = await within(dialog).findByRole('button', { name: 'Creating…' });
      expect(busyButton).toBeDisabled();
      fireEvent.click(busyButton);
      expect(createProject).toHaveBeenCalledTimes(1);

      listProjects.mockResolvedValue(populatedResponse());
      await act(async () => resolveCreate(project()));
    });

    it('closes on Cancel, the close icon, and Escape without creating anything', async () => {
      let dialog = await openDialog();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      fireEvent.click((await screen.findAllByRole('button', { name: /new project/i }))[0]!);
      dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      fireEvent.click((await screen.findAllByRole('button', { name: /new project/i }))[0]!);
      dialog = await screen.findByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      expect(createProject).not.toHaveBeenCalled();
    });

    it('shows the QA configuration as a read-only group, not a control that looks changeable', async () => {
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');

      const group = within(dialog).getByRole('group', { name: /qa configuration/i });
      expect(within(group).getByText('(Organization default)')).toBeInTheDocument();
      expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('gives focus back to the button that opened the dialog when it closes', async () => {
      listProjects.mockResolvedValue(emptyResponse);
      await renderPage();
      const opener = (await screen.findAllByRole('button', { name: /new project/i }))[0]!;
      opener.focus();
      fireEvent.click(opener);
      const dialog = await screen.findByRole('dialog', { name: 'Create Project' });
      expect(within(dialog).getByLabelText(/project name/i)).toHaveFocus();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(opener).toHaveFocus();
    });

    it('keeps Tab and Shift+Tab inside the dialog', async () => {
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');
      const create = within(dialog).getByRole('button', { name: 'Create Project' });
      const close = within(dialog).getByRole('button', { name: 'Close' });

      create.focus();
      fireEvent.keyDown(create, { key: 'Tab' });
      // Focus wraps from the last control to the first one inside the dialog.
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).toBe(close);

      fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(create);
    });

    it('lets a QA Tester open the dialog and create a project', async () => {
      sessionRole = 'qa_tester';
      createProject.mockResolvedValue(project({ name: 'Tester project' }));
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');
      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'Tester project' } });
      listProjects.mockResolvedValue(populatedResponse([project({ name: 'Tester project' })]));

      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      await waitFor(() => expect(createProject).toHaveBeenCalledWith('org-1', expect.objectContaining({ name: 'Tester project' })));
      expect(await screen.findByRole('table')).toBeInTheDocument();
    });

    it('clears any active filters after a successful create so the new project is visible', async () => {
      listProjects.mockResolvedValue(populatedResponse());
      await renderPage();
      await screen.findByRole('table');
      fireEvent.click(screen.getByRole('button', { name: /archived/i }));
      await waitFor(() => expect(listProjects).toHaveBeenLastCalledWith('org-1', expect.objectContaining({ status: 'archived' })));

      createProject.mockResolvedValue(project({ id: 'new', name: 'Brand new' }));
      fireEvent.click(screen.getAllByRole('button', { name: /new project/i })[0]!);
      const dialog = await screen.findByRole('dialog', { name: 'Create Project' });
      await within(dialog).findByText('Standard QA');
      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'Brand new' } });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await waitFor(() => {
        const lastParams = listProjects.mock.calls[listProjects.mock.calls.length - 1]![1] as Record<string, unknown>;
        expect(lastParams.status).toBeUndefined();
      });
    });

    it('shows the server message when the error names a field this form does not have', async () => {
      createProject.mockRejectedValue(new ApiError(422, 'validation_error', 'The project could not be created.', { somethingElse: 'Nope' }));
      const dialog = await openDialog();
      await within(dialog).findByText('Standard QA');
      fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'Valid name' } });

      fireEvent.click(within(dialog).getByRole('button', { name: 'Create Project' }));

      expect(await within(dialog).findByText('The project could not be created.')).toBeInTheDocument();
    });

    it('disables Create Project and explains when the QA configuration cannot be loaded', async () => {
      currentQaConfiguration.mockRejectedValue(new ApiError(500, 'internal_error', 'x'));
      const dialog = await openDialog();

      expect(await within(dialog).findByText(/could not load the qa configuration/i)).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Create Project' })).toBeDisabled();
    });
  });
});
