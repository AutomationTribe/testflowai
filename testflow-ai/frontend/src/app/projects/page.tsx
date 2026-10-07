'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Icon } from '@/components/Icon';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CreateProjectModal, NEW_PROJECT_BUTTON_ID } from '@/components/projects/CreateProjectModal';
import { ProjectsEmptyState } from '@/components/projects/ProjectsEmptyState';
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
  // Set when only "Load more" failed; the rows already shown are still valid.
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const latestRequest = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const hasActiveFilters = statusFilter !== 'all' || debouncedSearch !== '' || qaConfigurationFilter !== '';

  useEffect(() => {
    if (!organisationId) return;
    const requestId = ++latestRequest.current;
    apiClient
      .listProjects(organisationId, {
        q: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        qaConfigurationVersionId: qaConfigurationFilter || undefined,
      })
      .then((response) => {
        // Ignore a slow response that a newer filter change has already replaced.
        if (requestId !== latestRequest.current) return;
        setData(response);
        setListError(null);
        setLoadMoreError(null);
      })
      .catch((error: unknown) => {
        if (requestId !== latestRequest.current) return;
        setListError(error instanceof Error ? error.message : 'Could not load projects.');
      });
  }, [organisationId, debouncedSearch, statusFilter, qaConfigurationFilter, reloadKey]);

  const clearFilters = useCallback((): void => {
    setStatusFilter('all');
    setSearchText('');
    setDebouncedSearch('');
    setQaConfigurationFilter('');
  }, []);

  async function loadMore(): Promise<void> {
    if (!organisationId || !data?.nextCursor || loadingMore) return;
    // Remember which list this page belongs to. If the filters change (or the list reloads)
    // while the request is in flight, `latestRequest` moves on and this result is discarded.
    const requestId = latestRequest.current;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const next = await apiClient.listProjects(organisationId, {
        q: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        qaConfigurationVersionId: qaConfigurationFilter || undefined,
        cursor: data.nextCursor,
      });
      if (requestId !== latestRequest.current) return;
      setData((previous) => (previous ? { ...next, items: [...previous.items, ...next.items] } : previous));
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setLoadMoreError(error instanceof Error ? error.message : 'Could not load more projects.');
    } finally {
      setLoadingMore(false);
    }
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
                onStatusFilterChange={setStatusFilter}
                searchText={searchText}
                onSearchTextChange={setSearchText}
                qaConfigurationFilter={qaConfigurationFilter}
                onQaConfigurationFilterChange={setQaConfigurationFilter}
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--color-surface-low)',
                        fontSize: 12.5,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <span aria-live="polite">
                        Showing {data.items.length} of {visibleTotal} {visibleTotal === 1 ? 'project' : 'projects'}
                      </span>
                      {data.nextCursor && (
                        <Button variant="secondary" onClick={() => void loadMore()} disabled={loadingMore}>
                          {loadingMore ? 'Loading…' : 'Load more'}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {loadMoreError && (
                <p role="alert" style={{ marginTop: 12, color: '#a4262c', fontSize: 13 }}>
                  {loadMoreError}
                </p>
              )}
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
