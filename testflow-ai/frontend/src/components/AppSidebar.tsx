'use client';

import { useState } from 'react';
import { useSession } from '@/lib/SessionProvider';

/**
 * Shared primary navigation sidebar (visual reference: the approved QA Setup
 * design). Every destination other than the caller's own `activeKey` is
 * rendered but not wired to a real route — those modules don't exist yet.
 * Both AppShell.tsx (/app) and the QA Setup screen render this same component
 * so the sidebar can never drift between screens in one session.
 */
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'test-cases', label: 'Test Cases' },
  { key: 'test-suites', label: 'Test Suites' },
  { key: 'test-runs', label: 'Test Runs' },
  { key: 'defects', label: 'Defects' },
  { key: 'reports', label: 'Reports' },
  { key: 'readiness', label: 'Readiness' },
  { key: 'qa-operating-model', label: 'QA Operating Model' },
] as const;

export type NavItemKey = (typeof NAV_ITEMS)[number]['key'] | 'settings' | 'support';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  qa_manager: 'QA Manager',
  qa_tester: 'QA Tester',
};

/** Simple 16px line icons matching the design's monochrome icon set. */
function NavIcon({ name }: { name: NavItemKey }): JSX.Element {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    style: { flexShrink: 0 },
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      );
    case 'requirements':
      return (
        <svg {...common}>
          <path d="M3.5 2h6l3 3v9a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5V2.5a.5.5 0 0 1 .5-.5Z" />
          <path d="M9.5 2v3.5H13" />
          <path d="M5.5 8.5h5M5.5 11h3" />
        </svg>
      );
    case 'test-cases':
      return (
        <svg {...common}>
          <rect x="3" y="2.5" width="10" height="11.5" rx="1" />
          <path d="M6 2.5V1.5h4v1" />
          <path d="m5.5 7 1.2 1.2L9 5.9" />
          <path d="M5.5 11h5" />
        </svg>
      );
    case 'test-suites':
      return (
        <svg {...common}>
          <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.2l1.3 1.6h5.5A1.5 1.5 0 0 1 14 6.1v6.4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.5Z" />
        </svg>
      );
    case 'test-runs':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="M6.6 5.6 10.4 8l-3.8 2.4V5.6Z" />
        </svg>
      );
    case 'defects':
      return (
        <svg {...common}>
          <rect x="5" y="5.5" width="6" height="7.5" rx="3" />
          <path d="M6.2 5.5a1.8 1.8 0 0 1 3.6 0" />
          <path d="M5 7.5H2.8M11 7.5h2.2M5 10.5H3M11 10.5h2M6 13.4l-1 1.3M10 13.4l1 1.3" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...common}>
          <path d="M2.5 13.5h11" />
          <rect x="4" y="7" width="2.2" height="5" rx="0.5" />
          <rect x="7.4" y="4" width="2.2" height="8" rx="0.5" />
          <rect x="10.8" y="9" width="2.2" height="3" rx="0.5" />
        </svg>
      );
    case 'readiness':
      return (
        <svg {...common}>
          <path d="M8 1.8 13 4v4c0 3-2.1 5.4-5 6.2C5.1 13.4 3 11 3 8V4l5-2.2Z" />
          <path d="m5.9 7.9 1.5 1.5 2.8-2.8" />
        </svg>
      );
    case 'qa-operating-model':
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.1" />
          <path d="M12.9 9.7a1.1 1.1 0 0 0 .22 1.21l.04.04a1.33 1.33 0 1 1-1.88 1.88l-.04-.04a1.1 1.1 0 0 0-1.21-.22 1.1 1.1 0 0 0-.67 1v.11a1.33 1.33 0 1 1-2.66 0v-.06a1.1 1.1 0 0 0-.72-1 1.1 1.1 0 0 0-1.21.22l-.04.04a1.33 1.33 0 1 1-1.88-1.88l.04-.04a1.1 1.1 0 0 0 .22-1.21 1.1 1.1 0 0 0-1-.67h-.11a1.33 1.33 0 0 1 0-2.66h.06a1.1 1.1 0 0 0 1-.72 1.1 1.1 0 0 0-.22-1.21l-.04-.04a1.33 1.33 0 1 1 1.88-1.88l.04.04a1.1 1.1 0 0 0 1.21.22h.05a1.1 1.1 0 0 0 .67-1v-.11a1.33 1.33 0 1 1 2.66 0v.06a1.1 1.1 0 0 0 .67 1 1.1 1.1 0 0 0 1.21-.22l.04-.04a1.33 1.33 0 1 1 1.88 1.88l-.04.04a1.1 1.1 0 0 0-.22 1.21v.05a1.1 1.1 0 0 0 1 .67h.11a1.33 1.33 0 1 1 0 2.66h-.06a1.1 1.1 0 0 0-1 .67Z" />
        </svg>
      );
    case 'support':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="M6.2 6.2a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.9-1.9 1.9" />
          <path d="M8 11.6h.01" />
        </svg>
      );
  }
}

function initials(name: string | undefined): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export function AppSidebar({ activeKey }: { activeKey: NavItemKey }): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useSession();

  function row(key: NavItemKey, label: string): JSX.Element {
    const active = key === activeKey;
    return (
      <div
        title={collapsed ? label : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          borderRadius: 6,
          background: active ? 'var(--color-primary-container)' : 'transparent',
          color: active ? '#fff' : 'rgba(255,255,255,0.72)',
          fontWeight: active ? 600 : 400,
          fontSize: 13,
          cursor: active ? 'default' : 'not-allowed',
        }}
      >
        <NavIcon name={key} />
        {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
      </div>
    );
  }

  return (
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
      <div style={{ padding: '18px 14px 14px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: 5,
              background: '#fff',
              color: 'var(--color-primary)',
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            ✓
          </span>
          {!collapsed && 'TestFlow'}
        </span>
        {!collapsed && (
          <span
            style={{
              display: 'block',
              marginLeft: 28,
              marginTop: 2,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            Enterprise QA
          </span>
        )}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: '0 8px', flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <li key={item.key} style={{ marginBottom: 2 }}>
            {row(item.key, item.label)}
          </li>
        ))}
      </ul>

      <div style={{ padding: '0 8px', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 8 }}>
        {row('settings', 'Settings')}
        {row('support', 'Support')}
      </div>

      <button
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          background: 'none',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          marginTop: 8,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '12px 14px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {collapsed ? '»' : '« Collapse Sidebar'}
      </button>

      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--color-primary-container)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials(user?.name)}
        </span>
        {!collapsed && (
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </span>
            <button
              onClick={() => void logout()}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.55)',
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
      {collapsed && (
        <button
          onClick={() => void logout()}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: '0 0 12px 16px', fontSize: 11, textAlign: 'left' }}
        >
          Sign out
        </button>
      )}
    </nav>
  );
}
