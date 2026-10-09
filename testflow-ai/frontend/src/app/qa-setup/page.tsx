'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type JSX } from 'react';
import { AppSidebar, Tile } from '@/components/AppSidebar';
import { ErrorState } from '@/components/ErrorState';
import { Icon, type IconName } from '@/components/Icon';
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

interface SummaryBox {
  label: string;
  value: string;
  caption: string;
}

interface PresetCardDetail {
  presetOrigin: QaPresetOrigin;
  name: string;
  tag: string;
  recommended: boolean;
  description: string;
  bullets: Array<{ icon: IconName; text: string }>;
  footerIcon: IconName;
  bestFor: string;
  /** Custom Setup alone shows this box above its footer. */
  configureNote?: string;
  summary: { templates: SummaryBox; workflows: SummaryBox; policy: SummaryBox; gates: SummaryBox };
}

const PRESET_DETAILS: PresetCardDetail[] = [
  {
    presetOrigin: 'standard',
    name: 'Standard QA',
    tag: 'Recommended',
    recommended: true,
    description: 'A balanced QA process for teams that want structured testing without mandatory approval overhead.',
    bullets: [
      { icon: 'file-text', text: 'Standard Test Case, Test Report and Regression Report templates' },
      { icon: 'check-circle', text: 'Test Cases can be executed without approval' },
      { icon: 'check-square', text: 'Test Report required · Regression Report optional' },
      { icon: 'minus-circle', text: 'No Quality Gates enabled by default' },
    ],
    footerIcon: 'star',
    bestFor: 'Best starting point for most QA teams',
    summary: {
      templates: { label: 'Templates', value: '3 Standard templates', caption: 'Test Case v1, Test Report v1, Reg v1' },
      workflows: { label: 'Workflows', value: 'Draft → Ready', caption: 'No mandatory Test Case approval' },
      policy: { label: 'Project Policy', value: 'Test Report Required', caption: 'Regression Report optional' },
      gates: { label: 'Quality Gates', value: '0 of 6 Gates Active', caption: 'Optional execution threshold' },
    },
  },
  {
    presetOrigin: 'lightweight',
    name: 'Lightweight QA',
    tag: 'Fast Setup',
    recommended: false,
    description: 'Minimal governance for teams that want to start testing quickly without extra formal steps.',
    bullets: [
      { icon: 'file-text', text: 'Standard starter templates' },
      { icon: 'no-approval', text: 'No mandatory approvals' },
      { icon: 'no-report', text: 'No mandatory Test Report' },
      { icon: 'check-circle', text: 'No mandatory Regression Report' },
      { icon: 'minus-circle', text: 'No Quality Gates enabled by default' },
    ],
    footerIcon: 'zap',
    bestFor: 'Best for small or fast-moving teams',
    summary: {
      templates: { label: 'Templates', value: '3 Standard templates', caption: 'Test Case v1, Test Report v1, Reg v1' },
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
    description: 'Stronger governance for teams requiring formal review, multi-party sign-off, and strict compliance.',
    bullets: [
      { icon: 'user-check', text: 'Test Case Review + Approval checkpoints' },
      { icon: 'lock', text: 'Test Cases cannot be executed before required approval' },
      { icon: 'check-square', text: 'Test Report required with approval' },
      { icon: 'gear', text: 'Regression Report required' },
      { icon: 'shield', text: 'Selected Quality Gates enabled by default' },
    ],
    footerIcon: 'at-sign',
    bestFor: 'Best for teams with formal QA governance',
    summary: {
      templates: { label: 'Templates', value: '3 Standard templates', caption: 'Test Case v1, Test Report v1, Reg v1' },
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
      { icon: 'sliders', text: 'Choose supported templates' },
      { icon: 'layout', text: 'Review and approval checkpoints' },
      { icon: 'layout', text: 'Required QA artifacts & Quality Gates' },
      { icon: 'branch', text: 'Permitted project exceptions' },
    ],
    footerIcon: 'alert',
    bestFor: 'Best for custom enterprise workflows',
    configureNote: 'Configures in QA Operating Model',
    summary: {
      templates: { label: 'Templates', value: 'Chosen by you', caption: 'Selected in QA Operating Model' },
      workflows: { label: 'Workflows', value: 'Chosen by you', caption: 'Selected in QA Operating Model' },
      policy: { label: 'Project Policy', value: 'Chosen by you', caption: 'Selected in QA Operating Model' },
      gates: { label: 'Quality Gates', value: 'Chosen by you', caption: 'Selected in QA Operating Model' },
    },
  },
];

function Radio({ selected }: { selected: boolean }): JSX.Element {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 17,
        height: 17,
        borderRadius: '50%',
        border: selected ? '1.8px solid var(--color-primary)' : '1.5px solid var(--color-outline-variant)',
        background: '#fff',
        flexShrink: 0,
      }}
    >
      {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />}
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
        padding: 18,
        borderRadius: 8,
        border: selected ? '1.8px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
        background: selected ? '#f7fafd' : 'var(--color-surface)',
        flex: '1 1 0',
        minWidth: 225,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 22 }}>
        <Radio selected={selected} />
        {detail.recommended ? (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff',
              background: 'var(--color-primary)',
              borderRadius: 4,
              padding: '4px 8px',
            }}
          >
            {detail.tag}
          </span>
        ) : (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 500,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            {detail.tag}
          </span>
        )}
      </span>

      <h2 style={{ fontSize: 14.5, margin: '14px 0 8px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{detail.name}</h2>
      <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-text-muted)', margin: 0 }}>{detail.description}</p>

      <span aria-hidden style={{ display: 'block', height: 1, background: 'var(--color-outline-variant)', margin: '14px 0' }} />

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
        {detail.bullets.map((bullet) => (
          <li key={bullet.text} style={{ display: 'flex', gap: 10, fontSize: 12.5, lineHeight: 1.45 }}>
            <span style={{ color: 'var(--color-text-muted)', marginTop: 1 }}>
              <Icon name={bullet.icon} />
            </span>
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>

      {detail.configureNote && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: 'var(--color-surface-low)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 6,
            padding: '10px 12px',
            margin: '14px 0 0',
            fontSize: 12,
            color: 'var(--color-text)',
          }}
        >
          <Icon name="arrow-right" size={14} />
          {detail.configureNote}
        </span>
      )}

      <span aria-hidden style={{ display: 'block', height: 1, background: 'var(--color-outline-variant)', margin: '14px 0' }} />

      <span
        style={{
          display: 'flex',
          gap: 9,
          alignItems: 'flex-start',
          fontSize: 11.5,
          lineHeight: 1.4,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
        }}
      >
        <span style={{ marginTop: 1 }}>
          <Icon name={detail.footerIcon} size={13} />
        </span>
        {detail.bestFor}
      </span>
    </button>
  );
}

function IconButton({ name, label }: { name: IconName; label: string }): JSX.Element {
  return (
    <span
      role="img"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
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

function QaSetupHeader({ organisationName }: { organisationName?: string }): JSX.Element {
  const orgInitials = (organisationName ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '8px 22px',
        minHeight: 68,
        borderBottom: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface)',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12.5,
          color: 'var(--color-text-muted)',
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{organisationName}</span>
        <Icon name="chevron-right" size={13} />
        <span>Organization Setup</span>
        <Icon name="chevron-right" size={13} />
        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>QA Process</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            marginLeft: 6,
            background: 'var(--color-surface-low)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 999,
            padding: '5px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text)',
          }}
        >
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
          Step 3 of 3 · Final Step
        </span>
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <IconButton name="bell" label="Notifications" />
        <IconButton name="help-circle" label="Help" />
        <span aria-hidden style={{ width: 1, height: 22, background: 'var(--color-outline-variant)', margin: '0 4px' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
          <Tile size={26}>{orgInitials}</Tile>
          {organisationName}
          <span style={{ color: 'var(--color-text-muted)' }}>
            <Icon name="chevron-down" size={14} />
          </span>
        </span>
      </span>
    </header>
  );
}

function SummaryBoxBlock({ box, testId }: { box: SummaryBox; testId: string }): JSX.Element {
  return (
    <div
      data-testid={testId}
      style={{
        flex: '1 1 0',
        minWidth: 180,
        border: '1px solid var(--color-outline-variant)',
        borderRadius: 6,
        padding: '12px 14px',
        background: 'var(--color-surface)',
      }}
    >
      <p
        style={{
          margin: '0 0 7px',
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {box.label}
      </p>
      <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>{box.value}</p>
      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-muted)' }}>{box.caption}</p>
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface)' }}>
      <AppSidebar activeKey="qa-operating-model" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <QaSetupHeader organisationName={organisation?.name} />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 30px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 22 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 23, margin: '0 0 7px' }}>Set up your QA process</h1>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--color-text-muted)', margin: 0, maxWidth: 690 }}>
                Choose a starting QA process for your organization. You can customize supported settings later from QA Operating
                Model.
              </p>
            </div>
            <span
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 6,
                background: 'var(--color-surface)',
                padding: '12px 14px',
                fontSize: 12,
                lineHeight: 1.45,
                maxWidth: 370,
                minWidth: 0,
              }}
            >
              <span style={{ color: 'var(--color-primary)', marginTop: 1 }}>
                <Icon name="shield" />
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                <strong style={{ color: 'var(--color-text)' }}>Deterministic Governance:</strong> Projects inherit this model
                safely.
              </span>
            </span>
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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch', marginBottom: 20 }}>
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

          <div style={{ border: '1px solid var(--color-outline-variant)', borderRadius: 8, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5 }}>
                <span style={{ color: 'var(--color-primary)' }}>
                  <Icon name="shield-check" />
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>Selected QA Process:</span>
                <strong>{detail.name}</strong>
                {currentPresetOrigin === selected && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>(currently in effect)</span>
                )}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--color-text-muted)' }}>
                <Icon name="info" size={14} />
                You can customize supported QA settings later from QA Operating Model.
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16 }}>
              <SummaryBoxBlock box={detail.summary.templates} testId="qa-setup-summary-templates" />
              <SummaryBoxBlock box={detail.summary.workflows} testId="qa-setup-summary-workflow" />
              <SummaryBoxBlock box={detail.summary.policy} testId="qa-setup-summary-policy" />
              <SummaryBoxBlock box={detail.summary.gates} testId="qa-setup-summary-gates" />
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 24 }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              padding: '18px 0 22px',
              borderTop: '1px solid var(--color-outline-variant)',
            }}
          >
            <button
              onClick={() => router.back()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 6,
                padding: '10px 18px',
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
              }}
            >
              <Icon name="arrow-left" />
              Back
            </button>

            <span style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                Deterministic inheritance applied on confirm
              </span>
              <button
                onClick={() => void handleUsePreset()}
                disabled={submitting || customDraftStarted}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 9,
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '11px 20px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: 'var(--font-ui)',
                  cursor: submitting || customDraftStarted ? 'default' : 'pointer',
                  opacity: submitting || customDraftStarted ? 0.6 : 1,
                }}
              >
                {submitting ? 'Saving…' : selected === 'custom' ? 'Start Custom Setup' : `Use ${detail.name}`}
                <Icon name="arrow-right" />
              </button>
            </span>
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
