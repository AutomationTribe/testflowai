'use client';

import Link from 'next/link';
import { Icon } from '../Icon';
import { Button } from '../Button';

/**
 * "Projects — Empty State" body. The design's repository/schema/engine status line and its
 * three feature cards (CLI & CI/CD pipelines, release-readiness automation, ...) are not
 * rendered: the status line is invented telemetry and the cards advertise capabilities no
 * approved requirement defines.
 */
export function ProjectsEmptyState({
  onNewProject,
  canBrowseQaConfigurations,
}: {
  onNewProject: () => void;
  /** QA Setup is Admin/QA Manager only (FR-WF-006); a QA Tester would only reach a forbidden page. */
  canBrowseQaConfigurations: boolean;
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px',
        minHeight: 420,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          border: '1px solid var(--color-outline-variant)',
          background: 'var(--color-surface-low)',
          color: 'var(--color-text-muted)',
          marginBottom: 20,
        }}
      >
        <Icon name="folder-off" size={22} />
      </span>
      <h2 style={{ fontSize: 17, margin: '0 0 8px' }}>No projects yet</h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-text-muted)', margin: '0 0 22px', maxWidth: 440 }}>
        Create your first project to organise test cases, suites and runs, and apply your QA configuration and workflows.
      </p>
      <span style={{ display: 'flex', gap: 12 }}>
        <Button onClick={onNewProject} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={14} /> New Project
        </Button>
        {canBrowseQaConfigurations && (
          <Link
            href="/qa-setup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-outline-variant)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              textDecoration: 'none',
            }}
          >
            <Icon name="sliders" size={14} /> Browse QA Configurations
          </Link>
        )}
      </span>
    </div>
  );
}
