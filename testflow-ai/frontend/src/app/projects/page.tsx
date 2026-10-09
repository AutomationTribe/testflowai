'use client';

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Icon } from '@/components/Icon';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CreateProjectModal, NEW_PROJECT_BUTTON_ID } from '@/components/projects/CreateProjectModal';
import { ProjectsEmptyState } from '@/components/projects/ProjectsEmptyState';
import { DEFAULT_PAGE_SIZE, ProjectsPagination } from '@/components/projects/ProjectsPagination';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { ProjectsToolbar, type StatusFilter } from '@/components/projects/ProjectsToolbar';
import { ProjectsTopBar } from '@/components/projects/ProjectsTopBar';
import { apiClient, type ProjectListResponse } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

const SEARCH_DEBOUNCE_MS = 300;

function ProjectsContent(): JSX.Element {
  const { user, organisation } = useSession();
  const organisationId = organisation?.id;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [qaConfigurationFilter, setQaConfigurationFilter] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<ProjectListResponse | null>(null);
  // Set when the list for the CURRENT filters could not be loaded; the previous (stale) rows are hidden meanwhile.
  const [listError, setListError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);
  // cursors[i] is the cursor that loads page i (page 0 has none). A cursor only ever comes from the
  // previous page's `nextCursor` (APID-002), so we keep the ones already used to allow "Previous".
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const [pageLoading, setPageLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const latestRequest = useRef(0);
  const appliedSearch = useRef('');

  /** Back to the first page. Called together with every change that makes the current page meaningless. */
  const resetPaging = useCallback((): void => {
    setPageIndex(0);
    // Keep the same array when already at the start, so an unchanged state does not trigger a reload.
    setCursors((previous) => (previous.length === 1 && previous[0] === undefined ? previous : [undefined]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchText.trim();
      // Only a real change of the search text restarts paging — otherwise this timer (which also
      // fires once after the page first loads) would throw away a page the user already navigated to.
      if (next === appliedSearch.current) return;
      appliedSearch.current = next;
      // Same tick: the new search text and "page 1" are applied together, so only ONE request is made.
      setDebouncedSearch(next);
      resetPaging();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText, resetPaging]);

  const hasActiveFilters = statusFilter !== 'all' || debouncedSearch !== '' || qaConfigurationFilter !== '';

  useEffect(() => {
    if (!organisationId) return;
    const requestId = ++latestRequest.current;
    setPageLoading(true);
    apiClient
      .listProjects(organisationId, {
        q: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        qaConfigurationVersionId: qaConfigurationFilter || undefined,
        limit: pageSize,
        cursor: cursors[pageIndex],
      })
      .then((response) => {
        // Ignore a slow response that a newer page/filter change has already replaced.
        if (requestId !== latestRequest.current) return;
        setData(response);
        setListError(null);
        setPageLoading(false);
      })
      .catch((error: unknown) => {
        if (requestId !== latestRequest.current) return;
        setListError(error instanceof Error ? error.message : 'Could not load projects.');
        setPageLoading(false);
      });
  }, [organisationId, debouncedSearch, statusFilter, qaConfigurationFilter, reloadKey, pageSize, pageIndex, cursors]);

  const clearFilters = useCallback((): void => {
    setStatusFilter('all');
    setSearchText('');
    setDebouncedSearch('');
    appliedSearch.current = '';
    setQaConfigurationFilter('');
    resetPaging();
  }, [resetPaging]);

  function changeStatusFilter(value: StatusFilter): void {
    setStatusFilter(value);
    resetPaging();
  }

  function changeQaConfigurationFilter(value: string): void {
    setQaConfigurationFilter(value);
    resetPaging();
  }

  function changePageSize(value: number): void {
    setPageSize(value);
    resetPaging();
  }

  function goToNextPage(): void {
    if (!data?.nextCursor || pageLoading) return;
    const nextCursor = data.nextCursor;
    setCursors((previous) => {
      const kept = previous.slice(0, pageIndex + 1);
      kept[pageIndex + 1] = nextCursor;
      return kept;
    });
    setPageIndex(pageIndex + 1);
  }

  function goToPreviousPage(): void {
    if (pageIndex === 0 || pageLoading) return;
    setPageIndex(pageIndex - 1);
  }

  function handleCreated(): void {
    // Show the new project: clear any filters that could hide it, then reload the list.
    setShowCreate(false);
    clearFilters();
    setReloadKey((key) => key + 1);
  }

  const canManageQaConfiguration = user?.role === 'admin' || user?.role === 'qa_manager';
  const isEmpty = data !== null && data.counts.total === 0 && !hasActiveFilters;
  const visibleTotal = data ? (statusFilter === 'all' ? data.counts.total : data.counts[statusFilter]) : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface)' }}>
      <AppSidebar activeKey="projects" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ProjectsTopBar organisationName={organisation?.name} userName={user?.name} />

        <main style={{ flex: 1, padding: '26px 30px 30px', background: 'var(--color-surface-low)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 20 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 23, margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: 10 }}>
                Projects
                {isEmpty && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--color-text-muted)',
                      background: 'var(--color-surface-low)',
                      border: '1px solid var(--color-outline-variant)',
                      padding: '2px 8px',
                    }}
                  >
                    0 TOTAL
                  </span>
                )}
              </h1>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', margin: 0 }}>
                Create and manage test automation projects for your organisation.
              </p>
            </div>
            <Button
              id={NEW_PROJECT_BUTTON_ID}
              onClick={() => setShowCreate(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Icon name="plus" size={14} /> New Project
            </Button>
          </div>

          {!organisationId && (
            <ErrorState
              title="No organisation found"
              message="Your account is not linked to an organisation, so projects cannot be loaded."
            />
          )}

          {organisationId && listError && !data && (
            <ErrorState
              title="Could not load projects"
              message={listError}
              action={{ label: 'Try again', onClick: () => setReloadKey((key) => key + 1) }}
            />
          )}

          {organisationId && !data && !listError && (
            <p role="status" style={{ color: 'var(--color-text-muted)' }}>
              Loading projects…
            </p>
          )}

          {data && (
            <>
              <ProjectsToolbar
                statusFilter={statusFilter}
                onStatusFilterChange={changeStatusFilter}
                searchText={searchText}
                onSearchTextChange={setSearchText}
                qaConfigurationFilter={qaConfigurationFilter}
                onQaConfigurationFilterChange={changeQaConfigurationFilter}
                qaConfigurations={data.qaConfigurations}
                counts={data.counts}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />

              <div style={{ marginTop: 16, border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface)' }}>
                {listError ? (
                  <div style={{ padding: 24 }}>
                    <ErrorState
                      title="Could not load projects"
                      message={listError}
                      action={{ label: 'Try again', onClick: () => setReloadKey((key) => key + 1) }}
                    />
                  </div>
                ) : isEmpty ? (
                  <ProjectsEmptyState
                    onNewProject={() => setShowCreate(true)}
                    canBrowseQaConfigurations={canManageQaConfiguration}
                  />
                ) : data.items.length === 0 ? (
                  <div role="status" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>No projects match your filters</h2>
                    <p style={{ fontSize: 13.5, color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
                      Try a different search or clear the filters.
                    </p>
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <ProjectsTable projects={data.items} />
                    </div>
                    <ProjectsPagination
                      pageIndex={pageIndex}
                      pageSize={pageSize}
                      rowsOnPage={data.items.length}
                      total={visibleTotal}
                      hasNext={data.nextCursor !== null}
                      busy={pageLoading}
                      onPrevious={goToPreviousPage}
                      onNext={goToNextPage}
                      onPageSizeChange={changePageSize}
                    />
                  </>
                )}
              </div>

            </>
          )}
        </main>
      </div>

      {showCreate && organisation && (
        <CreateProjectModal
          organisationId={organisation.id}
          organisationName={organisation.name}
          canViewConfiguration={canManageQaConfiguration}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

export default function ProjectsPage(): JSX.Element {
  return (
    <ProtectedRoute requireSubscription>
      <ProjectsContent />
    </ProtectedRoute>
  );
}
