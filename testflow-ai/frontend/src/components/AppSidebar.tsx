'use client';

import { useState } from 'react';
import { useSession } from '@/lib/SessionProvider';

/**
 * Shared primary navigation sidebar (visual reference: the approved QA Setup
 * screenshot's sidebar). Every destination other than the caller's own
 * `activeKey` is rendered but not wired to a real route — those modules don't
 * exist yet — matching the same "visible but inert" pattern this shell has
 * always used for destinations that aren't real yet (previously only "Home").
 * Both AppShell.tsx (/app) and the QA Setup screen use this same component so
 * neither the sidebar's color scheme nor its nav list can drift out of sync
 * between screens the user navigates between in one session.
 */
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'requirements', label: 'Requirements', icon: '📄' },
  { key: 'test-suites', label: 'Test Suites', icon: '🗂' },
  { key: 'test-runs', label: 'Test Runs', icon: '▶' },
  { key: 'defects', label: 'Defects', icon: '🐞' },
  { key: 'reports', label: 'Reports', icon: '📊' },
  { key: 'readiness', label: 'Readiness', icon: '✅' },
  { key: 'qa-operating-model', label: 'QA Operating Model', icon: '⚙' },
] as const;

export type NavItemKey = (typeof NAV_ITEMS)[number]['key'];

export function AppSidebar({ activeKey }: { activeKey: NavItemKey }): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const { user, organisation, logout } = useSession();

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
          padding: 'var(--space-4)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--color-primary)',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            borderRadius: 5,
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 12,
          }}
        >
          ✓
        </span>
        {!collapsed && 'TestFlow'}
      </div>

      <ul style={{ listStyle: 'none', margin: '0 var(--space-2)', padding: 0, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key} style={{ marginBottom: 2 }}>
              <div
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--color-text)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  cursor: active ? 'default' : 'not-allowed',
                }}
              >
                <span aria-hidden>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
            </li>
          );
        })}
      </ul>

      <div style={{ margin: '0 var(--space-2)', borderTop: '1px solid var(--color-outline-variant)', paddingTop: 'var(--space-2)' }}>
        {(['settings', 'support'] as const).map((key) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              fontSize: 13,
              color: 'var(--color-text-muted)',
              cursor: 'not-allowed',
            }}
          >
            <span aria-hidden>{key === 'settings' ? '⚙' : '❓'}</span>
            {!collapsed && <span>{key === 'settings' ? 'Settings' : 'Support'}</span>}
          </div>
        ))}
      </div>

      <button
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          background: 'none',
          border: 'none',
          borderTop: '1px solid var(--color-outline-variant)',
          color: 'var(--color-text-muted)',
          fontSize: 12,
          padding: 'var(--space-3) var(--space-4)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {collapsed ? '»' : '« Collapse'}
      </button>

      <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-outline-variant)' }}>
        {!collapsed && (
          <div style={{ fontSize: 13, marginBottom: 'var(--space-2)' }}>
            <div>{user?.name}</div>
            <div style={{ color: 'var(--color-text-muted)' }}>{organisation?.name}</div>
          </div>
        )}
        <button
          onClick={() => void logout()}
          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontSize: 13 }}
        >
          {collapsed ? '⏻' : 'Sign out'}
        </button>
      </div>
    </nav>
  );
}
