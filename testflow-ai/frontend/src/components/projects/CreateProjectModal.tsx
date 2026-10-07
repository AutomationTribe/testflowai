'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ApiError, apiClient, type Project, type QaConfigurationVersion } from '@/lib/apiClient';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { qaPresetLabel, qaVersionLabel } from './projectFormat';

/** The header "New Project" button — the fallback place to return focus when the opener no longer exists. */
export const NEW_PROJECT_BUTTON_ID = 'new-project-button';

const NAME_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;
const KNOWN_FIELDS = ['name', 'description', 'qaConfigurationVersionId'];

interface CreateProjectModalProps {
  organisationId: string;
  organisationName: string;
  /** "View configuration" opens QA Setup, which only Admin/QA Manager may use (FR-WF-006). */
  canViewConfiguration: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 8,
};

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

const hintStyle: React.CSSProperties = { fontSize: 12.5, color: 'var(--color-text-muted)', margin: '7px 0 0' };

const fieldBase: React.CSSProperties = {
  width: '100%',
  fontFamily: 'inherit',
  fontSize: 14,
  padding: '10px 12px',
  border: '1px solid var(--color-outline-variant)',
  borderRadius: 4,
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
};

function fieldStyle(hasError: boolean): React.CSSProperties {
  return hasError ? { ...fieldBase, borderColor: '#a4262c' } : fieldBase;
}

function FieldError({ id, message }: { id: string; message?: string }): JSX.Element | null {
  if (!message) return null;
  return (
    <p id={id} role="alert" style={{ margin: '6px 0 0', fontSize: 12.5, color: '#a4262c' }}>
      {message}
    </p>
  );
}

/**
 * "Projects — Create Project". The QA configuration shown is the organisation's current
 * published version — the only version a new project may be pinned to (FR-QAOM-012); the
 * server rejects any other.
 */
export function CreateProjectModal({
  organisationId,
  organisationName,
  canViewConfiguration,
  onClose,
  onCreated,
}: CreateProjectModalProps): JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [configuration, setConfiguration] = useState<QaConfigurationVersion | null>(null);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Remember what had focus (the "New Project" button that opened this dialog), move focus
    // into the dialog, and give it back on close.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    nameInputRef.current?.focus();
    return () => {
      const target = opener && opener.isConnected ? opener : document.getElementById(NEW_PROJECT_BUTTON_ID);
      target?.focus();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .currentQaConfiguration(organisationId)
      .then((version) => {
        if (!cancelled) setConfiguration(version);
      })
      .catch(() => {
        if (!cancelled) setConfigurationError('Could not load the QA configuration. Close this dialog and try again.');
      });
    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape' && !submitting) {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    // Keep keyboard focus inside the dialog while it is open.
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, textarea, select, a[href]'),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (submitting || !configuration) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const errors: Record<string, string> = {};
    if (trimmedName.length === 0) errors.name = 'Project name is required.';
    else if (trimmedName.length > NAME_MAX_LENGTH) errors.name = `Project name must be ${NAME_MAX_LENGTH} characters or fewer.`;
    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
    }
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const project = await apiClient.createProject(organisationId, {
        name: trimmedName,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        qaConfigurationVersionId: configuration.id,
      });
      onCreated(project);
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = error.fields ?? {};
        setFieldErrors(fields);
        // Errors for a field this form shows appear next to it; anything else is shown once, here.
        const shownNextToAField = KNOWN_FIELDS.some((field) => field in fields);
        if (!shownNextToAField) setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 24, 31, 0.55)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '120px 16px 24px',
        overflowY: 'auto',
        zIndex: 50,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          maxWidth: 660,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-outline-variant)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        <form onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--color-outline-variant)', position: 'relative' }}>
            <h2 id="create-project-title" style={{ fontSize: 20, margin: '0 0 6px' }}>
              Create Project
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
              Create a project and choose the QA configuration it will start with.
            </p>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              disabled={submitting}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'none',
                border: 'none',
                color: 'var(--color-text)',
                cursor: 'pointer',
                display: 'flex',
                padding: 4,
              }}
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {formError && (
              <p
                role="alert"
                style={{
                  margin: '0 0 18px',
                  padding: '10px 12px',
                  fontSize: 13.5,
                  color: '#a4262c',
                  background: '#fdecec',
                  border: '1px solid #f3c6c6',
                  borderRadius: 4,
                }}
              >
                {formError}
              </p>
            )}

            <div style={{ marginBottom: 22 }}>
              <label htmlFor="project-name" style={labelStyle}>
                Project Name <span style={{ color: '#a4262c' }}>*</span>
              </label>
              <input
                id="project-name"
                ref={nameInputRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Mobile Banking App"
                maxLength={NAME_MAX_LENGTH + 20}
                className="tf-field"
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'project-name-error' : 'project-name-hint'}
                style={fieldStyle(Boolean(fieldErrors.name))}
              />
              <FieldError id="project-name-error" message={fieldErrors.name} />
              {!fieldErrors.name && (
                <p id="project-name-hint" style={hintStyle}>
                  Use a clear name that identifies the product or initiative being tested.
                </p>
              )}
            </div>

            <div style={{ marginBottom: 22 }}>
              <label htmlFor="project-description" style={labelStyle}>
                Description (optional)
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Briefly describe this project"
                rows={4}
                className="tf-field"
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? 'project-description-error' : undefined}
                style={{ ...fieldStyle(Boolean(fieldErrors.description)), resize: 'none' }}
              />
              <FieldError id="project-description-error" message={fieldErrors.description} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span id="project-qa-configuration-label" style={labelStyle}>
                  QA Configuration <span style={{ color: '#a4262c' }}>*</span>
                </span>
                {canViewConfiguration && (
                  <Link
                    href="/qa-setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      marginBottom: 8,
                    }}
                  >
                    View configuration <Icon name="external" size={12} />
                    <span style={visuallyHidden}>(opens in a new tab)</span>
                  </Link>
                )}
              </div>
              <div
                role="group"
                aria-labelledby="project-qa-configuration-label"
                aria-describedby={fieldErrors.qaConfigurationVersionId ? 'project-qa-configuration-error' : 'project-qa-configuration-hint'}
                style={{
                  ...fieldBase,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 46,
                  color: configuration ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}
              >
                {configuration ? (
                  <>
                    <span style={{ fontWeight: 600 }}>{qaPresetLabel(configuration.presetOrigin)}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        border: '1px solid var(--color-outline-variant)',
                        background: 'var(--color-surface-low)',
                        borderRadius: 3,
                        padding: '1px 6px',
                      }}
                    >
                      {qaVersionLabel(configuration.versionNumber)}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      (Organization default)
                    </span>
                  </>
                ) : (
                  <span role="status">{configurationError ?? 'Loading…'}</span>
                )}
                {/* Decorative: only the organisation's current published version can be chosen (FR-QAOM-012). */}
                <span aria-hidden style={{ marginLeft: 'auto', display: 'flex' }}>
                  <Icon name="chevron-down" size={14} />
                </span>
              </div>
              <FieldError id="project-qa-configuration-error" message={fieldErrors.qaConfigurationVersionId} />
              {!fieldErrors.qaConfigurationVersionId && (
                <p id="project-qa-configuration-hint" style={hintStyle}>
                  This project will start with this published QA configuration version.
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '12px 14px',
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface)',
                borderRadius: 4,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: 'var(--color-text-muted)',
              }}
            >
              <span style={{ marginTop: 2, display: 'flex' }}>
                <Icon name="info" size={15} />
              </span>
              <span>
                Configuration suites and test policy standards are inherited automatically from {organisationName} organization
                registry.
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              padding: '18px 28px 40px',
              borderTop: '1px solid var(--color-outline-variant)',
            }}
          >
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !configuration}>
              {submitting ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
