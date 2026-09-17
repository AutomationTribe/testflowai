'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient, ApiError, type QaPresetOrigin } from '@/lib/apiClient';
import { useSession } from '@/lib/SessionProvider';

/**
 * "Set up your QA process" screen (QA Operating Model Setup slice; visual
 * reference: the approved QA Setup design). FR-QAOM-001 already auto-published
 * Standard QA the instant this organisation was created, so this screen is
 * never a hard gate (FR-QAOM-001's explicit "does not itself gate project
 * creation") — it's the opportunity to keep, change, or customize that default
 * (FR-QAOM-002), reached from Subscription Activated's "Continue to QA Setup".
 *
 * Card content and the selected-process summary mirror
 * backend/src/modules/qaConfiguration/qaConfiguration.service.ts's
 * `materializePreset` (FR-QAOM-004/005/006/007) — kept client-side in the same
 * shape as pricing in PlanSelection so the summary updates instantly as the
 * user browses cards, without a round-trip per click. Whatever is ultimately
 * published is still always exactly what the backend materializes.
 */

type BulletTone = 'check' | 'cross';

interface SummaryColumn {
  label: string;
  value: string;
  caption: string;
}

interface PresetCardDetail {
  presetOrigin: QaPresetOrigin;
  name: string;
  tag: string | null;
  recommended: boolean;
  description: string;
  bullets: Array<{ tone: BulletTone; text: string }>;
  bestFor: string;
  /** Custom Setup's card shows a secondary action instead of publishing directly. */
  secondaryAction?: string;
  summary: { templates: SummaryColumn; workflows: SummaryColumn; policy: SummaryColumn; gates: SummaryColumn };
}

const PRESET_DETAILS: PresetCardDetail[] = [
  {
    presetOrigin: 'standard',
    name: 'Standard QA',
    tag: null,
    recommended: true,
    description: 'A balanced QA process for teams that want structured testing without mandatory approval overhead.',
    bullets: [
      { tone: 'check', text: 'Standard Test Case, Test Report and Regression Report templates' },
      { tone: 'check', text: 'No mandatory approvals' },
      { tone: 'check', text: 'Test Cases can be executed without approval' },
      { tone: 'check', text: 'Test Report required · Regression Report optional' },
      { tone: 'check', text: 'No Quality Gates enabled by default' },
    ],
    bestFor: 'Best starting point for most QA teams',
    summary: {
      templates: { label: 'Templates', value: '3 Standard templates', caption: 'Test Case, Test Report, Regression Report' },
      workflows: { label: 'Workflows', value: 'Draft → Ready', caption: 'No mandatory Test Case approval' },
      policy: { label: 'Project Policy', value: 'Test Report Required', caption: 'Regression Report optional' },
      gates: { label: 'Quality Gates', value: '0 of 6 Gates Active', caption: 'No gates enforced by default' },
    },
  },
  {
    presetOrigin: 'lightweight',
    name: 'Lightweight QA',
    tag: 'Fast Setup',
    recommended: false,
    description: 'Minimal governance for teams that want to start testing quickly without extra formal steps.',
    bullets: [
      { tone: 'check', text: 'Standard starter templates' },
      { tone: 'cross', text: 'No mandatory approvals' },
      { tone: 'cross', text: 'No mandatory Test Report' },
      { tone: 'cross', text: 'No mandatory Regression Report' },
      { tone: 'cross', text: 'No Quality Gates enabled by default' },
    ],
    bestFor: 'Best for small or fast-moving teams',
    summary: {
      templates: { label: 'Templates', value: '3 Standard templates', caption: 'Test Case, Test Report, Regression Report' },
      workflows: { label: 'Workflows', value: 'Draft → Ready', caption: 'No mandatory approvals' },
      policy: { label: 'Project Policy', value: 'No Required Artifacts', caption: 'Test Report and Regression optional' },
      gates: { label: 'Quality Gates', value: '0 of 6 Gates Active', caption: 'No gates enforced' },
    },
  },
  {
    presetOrigin: 'controlled',
    name: 'Controlled QA',
    tag: 'Governance',
    recommended: false,
    description: 'Stronger governance for teams requiring formal review, sign-off, and strict compliance.',
    bullets: [
      { tone: 'check', text: 'Test Case Review + Approval checkpoints' },
      { tone: 'check', text: 'Test Cases cannot be executed before required approval' },
      { tone: 'check', text: 'Test Report required with approval' },
      { tone: 'check', text: 'Regression Report required' },
      { tone: 'check', text: 'Selected Quality Gates enabled by default' },
    ],
    bestFor: 'Best for teams with formal QA governance',
    summary: {
      templates: { label: 'Templates', value: '3 Standard templates', caption: 'Test Case, Test Report, Regression Report' },
      workflows: { label: 'Workflows', value: 'Draft → Review → Approved', caption: 'Test Case approval required' },
      policy: { label: 'Project Policy', value: 'Test Report + Regression Required', caption: 'Approval required on both' },
      gates: { label: 'Quality Gates', value: '3 of 6 Gates Active', caption: 'Artifacts, approvals, critical defects' },
    },
  },
  {
    presetOrigin: 'custom',
    name: 'Custom Setup',
    tag: 'Flexible',
    recommended: false,
    description: 'Start with the supported TestFlow QA controls and configure each operational standard yourself.',
    bullets: [
      { tone: 'check', text: 'Choose supported templates' },
      { tone: 'check', text: 'Review and approval checkpoints' },
      { tone: 'check', text: 'Required QA artifacts & Quality Gates' },
      { tone: 'check', text: 'Permitted project exceptions' },
    ],
    bestFor: 'Best for custom enterprise workflows',
    secondaryAction: 'Configure in QA Operating Model',
    summary: {
      templates: { label: 'Templates', value: 'Chosen by you', caption: 'Selected in QA Operating Model' },
      workflows: { label: 'Workflows', value: 'Chosen by you', caption: 'Selected in QA Operating Model' },
      policy: { label: 'Project Policy', value: 'Chosen by you', caption: 'Selected in QA Operating Model' },
      gates: { label: 'Quality Gates', value: 'Chosen by you', caption: 'Selected in QA Operating Model' },
    },
  },
];

function CheckMark(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="m3.5 8.4 3 3 6-6.8" stroke="#1e7a46" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossMark(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" stroke="var(--color-text-muted)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Radio({ selected }: { selected: boolean }): JSX.Element {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: selected ? '5px solid var(--color-primary)' : '1.5px solid var(--color-outline-variant)',
        background: '#fff',
        flexShrink: 0,
      }}
    />
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
        gap: 9,
        padding: 14,
        borderRadius: 8,
        border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
        flex: '1 1 0',
        minWidth: 215,
        minHeight: 360,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 20 }}>
        <Radio selected={selected} />
        {detail.recommended ? (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: '#fff',
              background: 'var(--color-primary)',
              borderRadius: 3,
              padding: '3px 7px',
            }}
          >
            Recommended
          </span>
        ) : (
          detail.tag && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
              }}
            >
              {detail.tag}
            </span>
          )
        )}
      </div>

      <h2 style={{ fontSize: 13, margin: 0, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{detail.name}</h2>
      <p style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--color-text-muted)', margin: 0 }}>{detail.description}</p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {detail.bullets.map((bullet) => (
          <li key={bullet.text} style={{ display: 'flex', gap: 7, fontSize: 11.5, lineHeight: 1.4, color: 'var(--color-text)' }}>
            {bullet.tone === 'check' ? <CheckMark /> : <CrossMark />}
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>

      {detail.secondaryAction && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 11.5,
            color: 'var(--color-text)',
          }}
        >
          {detail.secondaryAction}
          <span aria-hidden>→</span>
        </span>
      )}

      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, paddingTop: 4, borderTop: '1px solid var(--color-outline-variant)' }}>
        {detail.bestFor}
      </p>
    </button>
  );
}

function QaSetupHeader({ organisationName }: { organisationName?: string }): JSX.Element {
  const iconButton = (label: string, path: JSX.Element) => (
    <span aria-label={label} role="img" style={{ color: 'var(--color-text-muted)', display: 'inline-flex' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    </span>
  );

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 24px',
        borderBottom: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{organisationName}</span>
        <span aria-hidden>›</span>
        <span>Organisation Setup</span>
        <span aria-hidden>›</span>
        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>QA Process</span>
        <span aria-hidden style={{ width: 1, height: 14, background: 'var(--color-outline-variant)', margin: '0 4px', flexShrink: 0 }} />
        <span>Step 2 of 2</span>
        <span aria-hidden>·</span>
        <span>Final Step</span>
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 11 }}>
          {iconButton(
            'Deterministic governance',
            <>
              <path d="M8.5 1.5 3 9h4l-.5 5.5L13 7H9l-.5-5.5Z" />
            </>,
          )}
          Deterministic Governance: Projects inherit this model exactly
        </span>
        {iconButton(
          'Notifications',
          <>
            <path d="M12 6a4 4 0 1 0-8 0c0 3.2-1.2 4.2-1.2 4.2h10.4S12 9.2 12 6Z" />
            <path d="M9.2 12.8a1.4 1.4 0 0 1-2.4 0" />
          </>,
        )}
        {iconButton(
          'Help',
          <>
            <circle cx="8" cy="8" r="6" />
            <path d="M6.2 6.2a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.9-1.9 1.9" />
            <path d="M8 11.6h.01" />
          </>,
        )}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 999,
            padding: '4px 10px 4px 4px',
            fontWeight: 500,
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
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            {(organisationName ?? '')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]!.toUpperCase())
              .join('')}
          </span>
          {organisationName}
        </span>
      </span>
    </header>
  );
}

function SummaryColumnBlock({ column, testId }: { column: SummaryColumn; testId: string }): JSX.Element {
  return (
    <div data-testid={testId} style={{ flex: '1 1 0', minWidth: 160 }}>
      <p
        style={{
          margin: '0 0 5px',
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {column.label}
      </p>
      <p style={{ margin: '0 0 2px', fontSize: 12.5, fontWeight: 600 }}>{column.value}</p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>{column.caption}</p>
    </div>
  );
}

function QaSetupContent(): JSX.Element {
  const router = useRouter();
  const { organisation } = useSession();
  const [selected, setSelected] = useState<QaPresetOrigin>('standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPresetOrigin, setCurrentPresetOrigin] = useState<QaPresetOrigin | null>(null);
  const [customDraftStarted, setCustomDraftStarted] = useState(false);
  // Guards against a real race: if the initial GET .../qa-configuration/current
  // resolves AFTER the user has already clicked a different card, the fetch must
  // not silently overwrite their choice back to the published default.
  const userHasSelectedRef = useRef(false);

  useEffect(() => {
    if (!organisation) return;
    apiClient
      .currentQaConfiguration(organisation.id)
      .then((current) => {
        setCurrentPresetOrigin(current.presetOrigin);
        if (!userHasSelectedRef.current) {
          setSelected(current.presetOrigin);
        }
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
        // (templates, workflow shapes, policy, gates) — that per-setting editor
        // is a later QA Operating Model screen, not built in this slice. This
        // starts the draft (so it exists, ready to be continued there) rather
        // than publishing an empty, necessarily-invalid configuration.
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface-low)' }}>
      <AppSidebar activeKey="qa-operating-model" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <QaSetupHeader organisationName={organisation?.name} />

        <main style={{ flex: 1, padding: '18px 20px 20px' }}>
          <div style={{ marginBottom: 14 }}>
            <h1 style={{ fontSize: 19, margin: '0 0 4px' }}>Set up your QA process</h1>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, maxWidth: 900 }}>
              Choose a starting QA process for your organization. You can customize supported settings later from QA Operating
              Model.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 16 }}>
              <ErrorState title="Could not save your QA process" message={error} />
            </div>
          )}

          {customDraftStarted && (
            <div style={{ marginBottom: 16 }}>
              <ErrorState
                title="Custom Setup draft started"
                message="Full per-setting configuration (templates, workflows, policy, and gates) is available from QA Operating Model settings, coming in a future update. Your previous QA process remains in effect until you publish there — nothing has changed yet."
                action={{ label: 'Continue →', onClick: () => router.push('/app') }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'stretch', marginBottom: 12 }}>
            {PRESET_DETAILS.map((d) => (
              <PresetCard
                key={d.presetOrigin}
                detail={d}
                selected={selected === d.presetOrigin}
                onSelect={() => {
                  userHasSelectedRef.current = true;
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
              borderRadius: 8,
              background: 'var(--color-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                padding: '12px 16px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
                <CheckMark />
                Selected QA Process: <strong>{detail.name}</strong>
                {currentPresetOrigin === selected && <span style={{ color: 'var(--color-text-muted)' }}>(currently in effect)</span>}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                ⓘ You can customize supported settings later from QA Operating Model.
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                padding: '14px 16px',
                borderTop: '1px solid var(--color-outline-variant)',
              }}
            >
              <SummaryColumnBlock column={detail.summary.templates} testId="qa-setup-summary-templates" />
              <SummaryColumnBlock column={detail.summary.workflows} testId="qa-setup-summary-workflow" />
              <SummaryColumnBlock column={detail.summary.policy} testId="qa-setup-summary-policy" />
              <SummaryColumnBlock column={detail.summary.gates} testId="qa-setup-summary-gates" />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                padding: '12px 16px',
                borderTop: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface-low)',
                borderRadius: '0 0 8px 8px',
              }}
            >
              <Button variant="secondary" onClick={() => router.back()}>
                ← Back
              </Button>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Deterministic inheritance applies on confirm</span>
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
