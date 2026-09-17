'use client';

import { useState } from 'react';
import { Icon, type IconName } from './Icon';
import { useSession } from '@/lib/SessionProvider';

/**
 * Shared primary navigation sidebar (visual reference: the approved designs).
 * Every destination other than the caller's own `activeKey` is rendered but not
 * wired to a real route — those modules don't exist yet. Both AppShell.tsx
 * (/app) and the QA Setup screen render this same component so the sidebar can
 * never drift between screens in one session.
 */
export const NAV_ITEMS: ReadonlyArray<{ key: string; label: string; icon: IconName }> = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'requirements', label: 'Requirements', icon: 'list' },
  { key: 'test-cases', label: 'Test Cases', icon: 'check-square' },
  { key: 'test-suites', label: 'Test Suites', icon: 'folder' },
  { key: 'test-runs', label: 'Test Runs', icon: 'play-circle' },
  { key: 'defects', label: 'Defects', icon: 'bug' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart' },
  { key: 'readiness', label: 'Readiness', icon: 'target' },
  { key: 'qa-operating-model', label: 'QA Operating Model', icon: 'shield' },
];

const BOTTOM_ITEMS: ReadonlyArray<{ key: string; label: string; icon: IconName }> = [
  { key: 'settings', label: 'Settings', icon: 'gear' },
  { key: 'support', label: 'Support', icon: 'help-circle' },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  qa_manager: 'QA Manager',
  qa_tester: 'QA Tester',
};

function initials(name: string | undefined): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Dark navy rounded tile used for the brand mark and avatars. */
export function Tile({ children, size = 30 }: { children: string; size?: number }): JSX.Element {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 6,
        background: 'var(--color-primary)',
        color: '#fff',
        fontSize: size <= 24 ? 9 : 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

export function AppSidebar({ activeKey }: { activeKey: string }): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useSession();

  function navRow(item: { key: string; label: string; icon: IconName }): JSX.Element {
    const active = item.key === activeKey;
    return (
      <div
        title={collapsed ? item.label : undefined}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '9px 16px',
          background: active ? '#eef2f8' : 'transparent',
          color: active ? 'var(--color-primary)' : 'var(--color-text)',
          fontWeight: active ? 600 : 450,
          fontSize: 13.5,
          cursor: active ? 'default' : 'not-allowed',
        }}
      >
        {active && (
          <span
            aria-hidden
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--color-primary)' }}
          />
        )}
        <Icon name={item.icon} />
        {!collapsed && <span style={{ whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>}
        {active && !collapsed && (
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
        )}
      </div>
    );
  }

  return (
    <nav
      aria-label="Primary"
      style={{
        width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-outline-variant)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 150ms ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          borderBottom: '1px solid var(--color-outline-variant)',
          minHeight: 68,
        }}
      >
        <Tile>TF</Tile>
        {!collapsed && (
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>TestFlow</span>
              <span
                style={{
                  fontSize: 9.5,
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface-low)',
                  border: '1px solid var(--color-outline-variant)',
                  borderRadius: 3,
                  padding: '1px 4px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                v4.8.2
              </span>
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginTop: 1,
              }}
            >
              Enterprise QA
            </span>
          </span>
        )}
      </div>

      <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>{navRow(item)}</li>
        ))}
      </ul>

      <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: 6 }}>
        {BOTTOM_ITEMS.map((item) => (
          <div key={item.key}>{navRow(item)}</div>
        ))}
      </div>

      <button
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          borderTop: '1px solid var(--color-outline-variant)',
          marginTop: 6,
          color: 'var(--color-text-muted)',
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '11px 16px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {!collapsed && <span>[ Collapse Sidebar ]</span>}
        <Icon name={collapsed ? 'arrow-right' : 'chevron-left'} size={13} />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderTop: '1px solid var(--color-outline-variant)',
        }}
      >
        <Tile size={30}>{initials(user?.name)}</Tile>
        {!collapsed && (
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name}
            </span>
            <button
              onClick={() => void logout()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 11,
              }}
            >
              {ROLE_LABEL[user?.role ?? ''] ?? ''} · Sign out
            </button>
          </span>
        )}
      </div>
    </nav>
  );
}
