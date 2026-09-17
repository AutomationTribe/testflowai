'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient, ApiError, type QaPresetOrigin } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

/**
 * "Set up your QA process" screen (QA Operating Model Setup slice; visual
 * reference: the approved QA Setup screenshot). FR-QAOM-001 already
 * auto-published Standard QA the instant this organisation was created, so this
 * screen is never a hard gate (FR-QAOM-001's explicit "does not itself gate
 * project creation") — it's the opportunity to keep, change, or customize that
 * default (FR-QAOM-002), reached from Subscription Activated's "Continue to QA
 * Setup" action.
 *
 * Card content mirrors backend/src/modules/qaConfiguration/qaConfiguration.service.ts's
 * `materializePreset` exactly (FR-QAOM-004/005/006/007) — kept in the same shape
 * as pricing in PlanSelection so the pre-commit summary bar can update instantly
 * as the user browses cards, without a round-trip per click. Whatever is
 * ultimately published is still always exactly what the backend materializes,
 * never trusted from this static copy alone.
 *
 * This screen builds its own header/sidebar shell (rather than reusing
 * AppShell.tsx) to match the approved screenshot's full navigation list exactly.
 * Every destination other than "QA Operating Model" (this screen) is rendered
 * but not wired to a real route — those modules don't exist yet — matching the
 * same "visible but inert" pattern AppShell.tsx already uses for its own nav.
 */

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'requirements', label: 'Requirements', icon: '📄' },
  { key: 'test-suites', label: 'Test Suites', icon: '🗂' },
  { key: 'test-runs', label: 'Test Runs', icon: '▶' },
  { key: 'defects', label: 'Defects', icon: '🐞' },
  { key: 'reports', label: 'Reports', icon: '📊' },
  { key: 'readiness', label: 'Readiness', icon: '✅' },
  { key: 'qa-operating-model', label: 'QA Operating Model', icon: '⚙' },
] as const;

function initials(name: string | undefined): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

interface PresetCardDetail {
  presetOrigin: QaPresetOrigin;
  icon: string;
  name: string;
  description: string;
  recommended: boolean;
  bullets: string[];
  bestFor: string;
  workflowSummary: string;
  requiredArtifactsSummary: string;
  enabledGatesCount: number;
}

const PRESET_DETAILS: PresetCardDetail[] = [
  {
    presetOrigin: 'standard',
    icon: '🛡',
    name: 'Standard QA',
    description: 'A balanced QA process for most organisations — structured tracking without mandatory approval overhead.',
    recommended: true,
    bullets: [
      'Standard default Test Case, Test Report, and Regression Report templates',
      'Test cases: no approval required',
      'Test Report required for project readiness',
      'No quality gates enabled by default',
    ],
    bestFor: 'Best starting point for new QA teams.',
    workflowSummary: 'No Approval',
    requiredArtifactsSummary: 'Test Report required',
    enabledGatesCount: 0,
  },
  {
    presetOrigin: 'lightweight',
    icon: '🪶',
    name: 'Lightweight QA',
    description: 'Minimal governance overhead for small or fast-moving teams.',
    recommended: false,
    bullets: [
      'Standard default templates, unmodified',
      'No approval required (Test Case, Test Report, Regression Report)',
      'No artifacts marked required',
      'No quality gates enabled',
    ],
    bestFor: 'Best for small or fast-moving teams.',
    workflowSummary: 'No Approval',
    requiredArtifactsSummary: 'Nothing required',
    enabledGatesCount: 0,
  },
  {
    presetOrigin: 'controlled',
    icon: '🔒',
    name: 'Controlled QA',
    description: 'Stronger governance for teams that need formal review, approval, and quality gates.',
    recommended: false,
    bullets: [
      'Test Case: Review + Approval',
      'Test Report & Regression Report: Single Approval — both required',
      '3 of 6 quality gates enabled (artifacts, approvals, critical defects)',
      'Standard default templates as a starting point (customizable later)',
    ],
    bestFor: 'Best for teams that need formal QA governance.',
    workflowSummary: 'Review + Approval',
    requiredArtifactsSummary: 'Test Report + Regression Report required',
    enabledGatesCount: 3,
  },
  {
    presetOrigin: 'custom',
    icon: '🛠',
    name: 'Custom Setup',
    description: 'Configure each setting individually from the same governance catalogue the presets use.',
    recommended: false,
    bullets: [
      'Starts from an empty configuration — no preset defaults applied',
      'Choose workflow shape, required artifacts, and gates yourself',
      'Same bounded settings catalogue as every preset — nothing unbounded',
    ],
    bestFor: 'Best for teams with atypical QA requirements.',
    workflowSummary: 'Configured individually',
    requiredArtifactsSummary: 'Configured individually',
    enabledGatesCount: 0,
  },
];

function CheckIcon(): JSX.Element {
  return (
    <span aria-hidden style={{ color: '#2e8b57' }}>
      ✓
    </span>
  );
}

function PresetCard({
  detail,
  selected,
  onSelect,
}: {
  detail: PresetCardDetail;
  selected: boolean;
  onSelect: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
        boxShadow: selected ? '0 0 0 3px rgba(37, 66, 133, 0.08)' : 'none',
        background: 'var(--color-surface)',
        flex: '1 1 0',
        minWidth: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
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
            fontSize: 14,
          }}
        >
          {detail.icon}
        </span>
        {detail.recommended && <Badge tone="info">Recommended</Badge>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>{detail.name}</h2>
        {selected && <CheckIcon />}
      </div>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>{detail.description}</p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {detail.bullets.map((bullet) => (
          <li key={bullet} style={{ display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--color-text)' }}>
            <CheckIcon />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>{detail.bestFor}</p>
    </button>
  );
}

function QaSetupHeader({ organisationName, userName }: { organisationName?: string; userName?: string }): JSX.Element {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-6)',
        borderBottom: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13, color: 'var(--color-text-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Organisation Setup</span>
          <span aria-hidden>›</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>QA Process</span>
        </span>
        <span aria-hidden style={{ width: 1, height: 16, background: 'var(--color-outline-variant)' }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Step 2 of 2</span>
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 13 }}>
        <span aria-hidden style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          🔍
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 12, fontStyle: 'italic' }}>
          <span aria-hidden>🛈</span>
          Deterministic Governance — projects inherit these settings
        </span>
        <span aria-hidden style={{ width: 1, height: 16, background: 'var(--color-outline-variant)' }} />
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 999,
            padding: '3px 10px',
            background: 'var(--color-surface-low)',
            fontWeight: 500,
          }}
        >
          <span aria-hidden>🏢</span>
          {organisationName ?? 'Organisation'}
        </span>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {initials(userName)}
        </span>
      </span>
    </header>
  );
}

function QaSetupSidebar({
  collapsed,
  onToggleCollapsed,
  userName,
  organisationName,
  onSignOut,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  userName?: string;
  organisationName?: string;
  onSignOut: () => void;
}): JSX.Element {
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
      <div style={{ padding: 'var(--space-4)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)' }}>
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
          const active = item.key === 'qa-operating-model';
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
        onClick={onToggleCollapsed}
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
            <div>{userName}</div>
            <div style={{ color: 'var(--color-text-muted)' }}>{organisationName}</div>
          </div>
        )}
        <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontSize: 13 }}>
          {collapsed ? '⏻' : 'Sign out'}
        </button>
      </div>
    </nav>
  );
}

function QaSetupContent(): JSX.Element {
  const router = useRouter();
  const { organisation, user, logout } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<QaPresetOrigin>('standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPresetOrigin, setCurrentPresetOrigin] = useState<QaPresetOrigin | null>(null);
  const [customDraftStarted, setCustomDraftStarted] = useState(false);

  useEffect(() => {
    if (!organisation) return;
    apiClient
      .currentQaConfiguration(organisation.id)
      .then((current) => {
        setCurrentPresetOrigin(current.presetOrigin);
        setSelected(current.presetOrigin);
      })
      .catch(() => undefined);
  }, [organisation]);

  const detail = PRESET_DETAILS.find((d) => d.presetOrigin === selected)!;

  async function handleUsePreset(): Promise<void> {
    if (!organisation || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      if (selected === 'custom') {
        // FR-QAOM-007: Custom Setup walks through the full governance catalogue
        // (templates, workflow shapes, policy, gates) — that per-setting editor is
        // a later QA Operating Model configuration screen, not built in this
        // slice. This starts the draft (so it exists, ready to be continued
        // there) rather than publishing an empty, necessarily-invalid
        // configuration or silently building a placeholder editor.
        await apiClient.startQaConfigurationDraft(organisation.id, 'custom');
        setCustomDraftStarted(true);
        setSubmitting(false);
        return;
      }

      await apiClient.startQaConfigurationDraft(organisation.id, selected);
      await apiClient.publishQaConfigurationDraft(organisation.id);
      router.push('/app');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your QA process. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <QaSetupSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        userName={user?.name}
        organisationName={organisation?.name}
        onSignOut={() => void logout()}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <QaSetupHeader organisationName={organisation?.name} userName={user?.name} />

        <main style={{ flex: 1, padding: 'var(--space-6)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Set up your QA process</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Choose a starting QA process for your organisation. You can customize supported settings later from the QA
              Operating Model settings. New projects will use this configuration; existing projects are never changed by a
              later update (FR-QAOM-012).
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <ErrorState title="Could not save your QA process" message={error} />
            </div>
          )}

          {customDraftStarted && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <ErrorState
                title="Custom Setup draft started"
                message="Full per-setting configuration (templates, workflows, policy, and gates) is available from QA Operating Model settings, coming in a future update. Your previous QA process remains in effect until you publish there — nothing has changed yet."
                action={{ label: 'Continue to QA Setup boundary →', onClick: () => router.push('/app') }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            {PRESET_DETAILS.map((d) => (
              <PresetCard
                key={d.presetOrigin}
                detail={d}
                selected={selected === d.presetOrigin}
                onSelect={() => {
                  setSelected(d.presetOrigin);
                  setCustomDraftStarted(false);
                  setError(null);
                }}
              />
            ))}
          </div>

          <div
            style={{
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-low)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <p style={{ margin: 0, fontSize: 13 }}>
                <strong>Selected QA Process:</strong> {detail.name}
                {currentPresetOrigin === selected && (
                  <span style={{ color: 'var(--color-text-muted)' }}> (currently in effect)</span>
                )}
              </p>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                You can customize supported QA settings later from QA Operating Model.
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', fontSize: 12 }}>
              <span>
                <strong>Templates:</strong> 3 standard templates
              </span>
              <span data-testid="qa-setup-summary-workflow">
                <strong>Workflow:</strong> {detail.workflowSummary}
              </span>
              <span data-testid="qa-setup-summary-policy">
                <strong>Quality Policy:</strong> {detail.requiredArtifactsSummary}
              </span>
              <span data-testid="qa-setup-summary-gates">
                <strong>Quality Gates:</strong> {detail.enabledGatesCount} of 6 active
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Button variant="secondary" onClick={() => router.back()}>
                ← Back
              </Button>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Deterministic Governance applied on confirm
              </span>
              <Button onClick={() => void handleUsePreset()} disabled={submitting || customDraftStarted}>
                {submitting ? 'Saving…' : selected === 'custom' ? 'Start Custom Setup →' : `Use ${detail.name} →`}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function QaSetupPage(): JSX.Element {
  return (
    <ProtectedRoute requireSubscription>
      <QaSetupContent />
    </ProtectedRoute>
  );
}
