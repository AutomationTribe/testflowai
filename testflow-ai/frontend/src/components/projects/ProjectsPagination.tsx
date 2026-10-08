'use client';

import { Icon } from '../Icon';

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

interface ProjectsPaginationProps {
  pageIndex: number;
  pageSize: number;
  /** How many rows are on the page being shown. */
  rowsOnPage: number;
  /** Total projects for the current search/filters. */
  total: number;
  hasNext: boolean;
  /** True while another page is being fetched — navigation is paused so clicks cannot pile up. */
  busy: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageSizeChange: (pageSize: number) => void;
}

const navButton: React.CSSProperties = {
  width: 30,
  height: 30,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--color-outline-variant)',
  borderRadius: 4,
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
};

/**
 * The list footer: "Showing a–b of N projects", rows per page, and Previous/Next with "Page X of Y".
 * Paging is cursor-based (APID-002): the server only hands out a cursor for the NEXT page, so the
 * page remembers the cursors it has used to let you step back.
 */
export function ProjectsPagination(props: ProjectsPaginationProps): JSX.Element {
  const { pageIndex, pageSize, rowsOnPage, total, hasNext, busy } = props;
  const first = rowsOnPage === 0 ? 0 : pageIndex * pageSize + 1;
  const last = rowsOnPage === 0 ? 0 : first + rowsOnPage - 1;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canGoBack = pageIndex > 0 && !busy;
  const canGoForward = hasNext && !busy;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 16px',
        background: 'var(--color-surface-low)',
        fontSize: 12.5,
        color: 'var(--color-text-muted)',
      }}
    >
      <span aria-live="polite">
        Showing {first}–{last} of {total} {total === 1 ? 'project' : 'projects'}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Rows per page
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) => props.onPageSizeChange(Number(event.target.value))}
            style={{
              height: 28,
              padding: '0 6px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 4,
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <span style={{ fontFamily: 'var(--font-mono)' }}>
          Page {pageIndex + 1} of {pageCount}
        </span>

        <span style={{ display: 'inline-flex', gap: 6 }}>
          <button
            type="button"
            aria-label="Previous page"
            disabled={!canGoBack}
            onClick={props.onPrevious}
            style={{ ...navButton, cursor: canGoBack ? 'pointer' : 'not-allowed', opacity: canGoBack ? 1 : 0.45 }}
          >
            <Icon name="chevron-left" size={14} />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={!canGoForward}
            onClick={props.onNext}
            style={{ ...navButton, cursor: canGoForward ? 'pointer' : 'not-allowed', opacity: canGoForward ? 1 : 0.45 }}
          >
            <Icon name="chevron-right" size={14} />
          </button>
        </span>
      </div>
    </div>
  );
}
