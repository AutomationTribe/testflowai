'use client';

import { useState, type ReactNode } from 'react';
import { useSession } from '@/lib/SessionProvider';

/**
 * Minimal application shell (Step 6/7/8). Only proves the collapse/expand
 * architecture design-system.md §5 requires — full navigation destinations
 * (Requirements, Test Cases, ...) are added when those modules exist.
 */
const NAV_ITEMS = [{ key: 'home', label: 'Home', icon: '⌂' }] as const;

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const { user, organisation, logout } = useSession();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        aria-label="Primary"
        style={{
          width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)',
          background: 'var(--color-primary)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 150ms ease',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: 'var(--space-4)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {collapsed ? 'TF' : 'TestFlow'}
        </div>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <div
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-primary-container)',
                }}
              >
                <span aria-hidden>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            padding: 'var(--space-3) var(--space-4)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {collapsed ? '»' : '« Collapse'}
        </button>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {!collapsed && (
            <div style={{ fontSize: 13, marginBottom: 'var(--space-2)' }}>
              <div>{user?.name}</div>
              <div style={{ opacity: 0.75 }}>{organisation?.name}</div>
            </div>
          )}
          <button
            onClick={() => void logout()}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
          >
            {collapsed ? '⏻' : 'Sign out'}
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 'var(--space-6)' }}>{children}</main>
    </div>
  );
}
