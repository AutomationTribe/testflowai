'use client';

import type { JSX } from 'react';
import type { ProjectQaConfiguration, ProjectStatus } from '@/lib/apiClient';
import { Icon } from '../Icon';
import { qaConfigurationLabel } from './projectFormat';

export type StatusFilter = 'all' | ProjectStatus;

interface ProjectsToolbarProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  qaConfigurationFilter: string;
  onQaConfigurationFilterChange: (value: string) => void;
  qaConfigurations: ProjectQaConfiguration[];
  counts: { total: number; active: number; archived: number };
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const TABS: ReadonlyArray<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All Projects' },
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
];

const controlStyle: React.CSSProperties = {
  fontSize: 13,
  height: 34,
  border: '1px solid var(--color-outline-variant)',
  borderRadius: 4,
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
};

/** Status tabs + search + QA configuration and status filters; all values come from real project data. */
export function ProjectsToolbar(props: ProjectsToolbarProps): JSX.Element {
  const { statusFilter, counts } = props;
  const countFor = (key: StatusFilter): number => (key === 'all' ? counts.total : counts[key]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '10px 16px',
        border: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
      }}
    >
      <div role="group" aria-label="Project status" style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {TABS.map((tab) => {
          const selected = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={selected}
              onClick={() => props.onStatusFilterChange(tab.key)}
              style={{
                background: selected ? '#dde7f8' : 'none',
                border: selected ? '1px solid #b4c6e8' : '1px solid transparent',
                borderRadius: 4,
                color: selected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: 13,
                fontWeight: selected ? 600 : 450,
                padding: '6px 11px',
                cursor: 'pointer',
              }}
            >
              {tab.label} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>({countFor(tab.key)})</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
        <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, color: 'var(--color-text-muted)', display: 'flex' }}>
            <Icon name="search" size={14} />
          </span>
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects…"
            value={props.searchText}
            onChange={(event) => props.onSearchTextChange(event.target.value)}
            style={{ ...controlStyle, width: 200, padding: '0 10px 0 32px' }}
          />
        </label>

        <select
          aria-label="Filter by QA configuration"
          value={props.qaConfigurationFilter}
          onChange={(event) => props.onQaConfigurationFilterChange(event.target.value)}
          style={{ ...controlStyle, padding: '0 8px', width: 168 }}
        >
          <option value="">All QA Configurations</option>
          {props.qaConfigurations.map((config) => (
            <option key={config.versionId} value={config.versionId}>
              {qaConfigurationLabel(config)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => props.onStatusFilterChange(event.target.value as StatusFilter)}
          style={{ ...controlStyle, padding: '0 8px', width: 124 }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>

        <button
          type="button"
          aria-label="Clear filters"
          title="Clear filters"
          disabled={!props.hasActiveFilters}
          onClick={props.onClearFilters}
          style={{
            ...controlStyle,
            width: 34,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: props.hasActiveFilters ? 'pointer' : 'not-allowed',
            opacity: props.hasActiveFilters ? 1 : 0.5,
          }}
        >
          <Icon name="filter" size={14} />
        </button>
      </div>
    </div>
  );
}
