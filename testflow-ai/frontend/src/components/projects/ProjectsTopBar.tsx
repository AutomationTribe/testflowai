'use client';

import { Icon, type IconName } from '../Icon';
import { Tile } from '../AppSidebar';
import { initialsOf } from './projectFormat';

function IconButton({ name, label }: { name: IconName; label: string }): JSX.Element {
  return (
    <span
      role="img"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 6,
        border: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-muted)',
      }}
    >
      <Icon name={name} />
    </span>
  );
}

/**
 * Top bar of the Projects screens. Shows only what is real: the signed-in organisation
 * and user. The design's workspace search, theme toggle, environment tag and
 * "Sprint 17 Workspace" crumb have no approved requirement behind them (and "Sprint" would
 * break the methodology-neutral model, PD-064), so they are intentionally not rendered.
 * The bell and help icons are decorative, as on the QA Setup header.
 */
export function ProjectsTopBar({ organisationName, userName }: { organisationName?: string; userName?: string }): JSX.Element {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 22px',
        minHeight: 68,
        borderBottom: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 13.5,
          fontWeight: 600,
          background: 'var(--color-surface)',
        }}
      >
        <Tile size={20}>{initialsOf(organisationName ?? '').slice(0, 1)}</Tile>
        {organisationName}
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <IconButton name="bell" label="Notifications" />
        <IconButton name="help-circle" label="Help" />
        <Tile size={32}>{initialsOf(userName ?? '')}</Tile>
      </span>
    </header>
  );
}
