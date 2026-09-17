import type { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import { HttpError } from '../../lib/httpError.js';

export type PresetOrigin = 'standard' | 'lightweight' | 'controlled' | 'custom';
export type DocumentType = 'test_case' | 'test_report' | 'regression_report';
export type WorkflowShape = 'no_approval' | 'single_approval' | 'review_approval';
export type ArtifactType = 'requirements' | 'test_cases' | 'test_report' | 'regression_report';
export type GateType =
  | 'required_artifacts_completed'
  | 'required_approvals_completed'
  | 'min_requirement_coverage'
  | 'regression_activity_completed'
  | 'no_unresolved_critical_defects'
  | 'no_unresolved_release_blocking_defects';

const ALL_DOCUMENT_TYPES: DocumentType[] = ['test_case', 'test_report', 'regression_report'];
const ALL_ARTIFACT_TYPES: ArtifactType[] = ['requirements', 'test_cases', 'test_report', 'regression_report'];
const ALL_GATE_TYPES: GateType[] = [
  'required_artifacts_completed',
  'required_approvals_completed',
  'min_requirement_coverage',
  'regression_activity_completed',
  'no_unresolved_critical_defects',
  'no_unresolved_release_blocking_defects',
];

interface WorkflowSetting {
  documentType: DocumentType;
  shape: WorkflowShape;
  approverRole: 'admin' | 'qa_manager' | null;
  reviewerRole: 'admin' | 'qa_manager' | null;
}
interface ArtifactSetting {
  artifactType: ArtifactType;
  isRequired: boolean;
}
interface GateSetting {
  gateType: GateType;
  isEnabled: boolean;
  parameters: Record<string, unknown>;
}
interface PresetMaterialization {
  workflows: WorkflowSetting[];
  artifactPolicies: ArtifactSetting[];
  qualityGates: GateSetting[];
}

/** No-approval workflow for every document type — shared by Standard and Lightweight. */
function allNoApproval(): WorkflowSetting[] {
  return ALL_DOCUMENT_TYPES.map((documentType) => ({ documentType, shape: 'no_approval', approverRole: null, reviewerRole: null }));
}

function allArtifacts(overrides: Partial<Record<ArtifactType, boolean>>): ArtifactSetting[] {
  return ALL_ARTIFACT_TYPES.map((artifactType) => ({ artifactType, isRequired: overrides[artifactType] ?? false }));
}

function allGates(overrides: Partial<Record<GateType, boolean>>): GateSetting[] {
  return ALL_GATE_TYPES.map((gateType) => ({ gateType, isEnabled: overrides[gateType] ?? false, parameters: {} }));
}

/**
 * Preset definitions (FR-QAOM-004/005/006). Role assignment for approval workflow
 * shapes is not specified per-preset in the approved FRs beyond "Single Approval" /
 * "Review + Approval" — this materializer's choice (documented here, not hidden):
 * single_approval -> approver is QA Manager; review_approval -> reviewer is QA
 * Manager, approver is Admin (a second, higher-authority sign-off). Both satisfy
 * ck_workflow_definitions_role_presence and the bounded role catalogue
 * (admin/qa_manager) — no other role is ever assignable here.
 */
function materializePreset(preset: PresetOrigin): PresetMaterialization {
  switch (preset) {
    case 'standard':
      // FR-QAOM-004: No Approval everywhere; Test Report required, Regression Report not; no gates.
      return {
        workflows: allNoApproval(),
        artifactPolicies: allArtifacts({ test_report: true }),
        qualityGates: allGates({}),
      };
    case 'lightweight':
      // FR-QAOM-005: No Approval everywhere; nothing required; no gates.
      return {
        workflows: allNoApproval(),
        artifactPolicies: allArtifacts({}),
        qualityGates: allGates({}),
      };
    case 'controlled':
      // FR-QAOM-006: Test Case = Review + Approval; Test Report/Regression Report =
      // Single Approval; both required; 3 of 6 gates enabled.
      return {
        workflows: [
          { documentType: 'test_case', shape: 'review_approval', approverRole: 'admin', reviewerRole: 'qa_manager' },
          { documentType: 'test_report', shape: 'single_approval', approverRole: 'qa_manager', reviewerRole: null },
          { documentType: 'regression_report', shape: 'single_approval', approverRole: 'qa_manager', reviewerRole: null },
        ],
        artifactPolicies: allArtifacts({ test_report: true, regression_report: true }),
        qualityGates: allGates({
          required_artifacts_completed: true,
          required_approvals_completed: true,
          no_unresolved_critical_defects: true,
        }),
      };
    case 'custom':
      // FR-QAOM-007: "starts from an empty/default-system-fields-only draft" — no
      // child rows at all. Full Custom Setup (per-setting editing across the bounded
      // catalogue) is a later slice's configuration screen; this slice only creates
      // the draft so it exists to be continued there (see the QA Setup report's
      // "deferred dependency" note).
      return { workflows: [], artifactPolicies: [], qualityGates: [] };
  }
}

export interface QaConfigurationSettingsSummary {
  /** Descriptive only (module TPL doesn't exist yet — see the deferred-dependency note above). */
  templatesNote: string;
  workflowShapes: Partial<Record<DocumentType, WorkflowShape>>;
  requiredArtifacts: ArtifactType[];
  enabledGatesCount: number;
  totalGatesCount: number;
}

export interface QaConfigurationVersionSummary {
  id: string;
  organisationId: string;
  versionNumber: number;
  status: 'draft' | 'published';
  presetOrigin: PresetOrigin;
  publishedBy: string | null;
  publishedAt: string | null;
  settings: QaConfigurationSettingsSummary;
}

/**
 * Computed strictly from this version's own persisted child rows — never
 * hardcoded per-preset copy, so it stays accurate even for a hand-edited Custom
 * draft. `templatesNote` is the one deliberately descriptive exception, since
 * module TPL isn't implemented yet (see this file's top-of-migration comment).
 */
async function getSettingsSummary(versionId: string): Promise<QaConfigurationSettingsSummary> {
  const [workflows, artifacts, gates] = await Promise.all([
    pool.query<{ document_type: DocumentType; shape: WorkflowShape }>(
      'SELECT document_type, shape FROM workflow_definitions WHERE qa_configuration_version_id = $1',
      [versionId],
    ),
    pool.query<{ artifact_type: ArtifactType; is_required: boolean }>(
      'SELECT artifact_type, is_required FROM qa_artifact_policies WHERE qa_configuration_version_id = $1',
      [versionId],
    ),
    pool.query<{ is_enabled: boolean }>('SELECT is_enabled FROM quality_gate_definitions WHERE qa_configuration_version_id = $1', [
      versionId,
    ]),
  ]);

  const workflowShapes: Partial<Record<DocumentType, WorkflowShape>> = {};
  for (const row of workflows.rows) workflowShapes[row.document_type] = row.shape;

  return {
    templatesNote: `${ALL_DOCUMENT_TYPES.length} standard templates (default, unmodified)`,
    workflowShapes,
    requiredArtifacts: artifacts.rows.filter((r) => r.is_required).map((r) => r.artifact_type),
    enabledGatesCount: gates.rows.filter((r) => r.is_enabled).length,
    totalGatesCount: ALL_GATE_TYPES.length,
  };
}

async function insertMaterializedChildren(client: PoolClient, versionId: string, material: PresetMaterialization): Promise<void> {
  for (const w of material.workflows) {
    await client.query(
      `INSERT INTO workflow_definitions (qa_configuration_version_id, document_type, shape, approver_role, reviewer_role)
       VALUES ($1, $2, $3, $4, $5)`,
      [versionId, w.documentType, w.shape, w.approverRole, w.reviewerRole],
    );
  }
  for (const a of material.artifactPolicies) {
    await client.query(
      `INSERT INTO qa_artifact_policies (qa_configuration_version_id, artifact_type, is_required) VALUES ($1, $2, $3)`,
      [versionId, a.artifactType, a.isRequired],
    );
  }
  for (const g of material.qualityGates) {
    await client.query(
      `INSERT INTO quality_gate_definitions (qa_configuration_version_id, gate_type, is_enabled, parameters) VALUES ($1, $2, $3, $4)`,
      [versionId, g.gateType, g.isEnabled, JSON.stringify(g.parameters)],
    );
  }
}

async function nextVersionNumber(client: PoolClient, organisationId: string): Promise<number> {
  const result = await client.query<{ max: number | null }>(
    'SELECT MAX(version_number) AS max FROM qa_configuration_versions WHERE organisation_id = $1',
    [organisationId],
  );
  return (result.rows[0]?.max ?? 0) + 1;
}

/**
 * FR-QAOM-001: immediately upon organisation creation, Standard QA is automatically
 * published as the organisation's QA Operating Model — no draft step, no user
 * action. Called from auth.service.ts's signUp() in the same transaction as the
 * organisation/user rows, so an organisation is never observed without a published
 * configuration (FR-QAOM-001's "always true" precondition for later endpoints).
 */
export async function autoPublishStandardQaOnSignup(client: PoolClient, organisationId: string, publishedByUserId: string): Promise<void> {
  const versionNumber = await nextVersionNumber(client, organisationId);
  const versionResult = await client.query<{ id: string }>(
    `INSERT INTO qa_configuration_versions (organisation_id, version_number, status, preset_origin, published_by, published_at)
     VALUES ($1, $2, 'published', 'standard', $3, now())
     RETURNING id`,
    [organisationId, versionNumber, publishedByUserId],
  );
  await insertMaterializedChildren(client, versionResult.rows[0]!.id, materializePreset('standard'));
}

export const PRESET_CATALOGUE: Array<{ presetOrigin: PresetOrigin; name: string; description: string; recommended: boolean }> = [
  {
    presetOrigin: 'standard',
    name: 'Standard QA',
    description: 'A balanced QA process for most organisations, with structured test case and report tracking without mandatory approval overhead.',
    recommended: true,
  },
  {
    presetOrigin: 'lightweight',
    name: 'Lightweight QA',
    description: 'Minimal governance for small or fast-moving teams — no mandatory reports or approvals.',
    recommended: false,
  },
  {
    presetOrigin: 'controlled',
    name: 'Controlled QA',
    description: 'Stronger governance for regulated or formal environments, requiring review, approval, and enabled quality gates.',
    recommended: false,
  },
  {
    presetOrigin: 'custom',
    name: 'Custom Setup',
    description: 'Start with an empty configuration and choose each setting individually from the same governance catalogue as the presets.',
    recommended: false,
  },
];

export async function toVersionSummary(row: {
  id: string;
  organisation_id: string;
  version_number: number;
  status: 'draft' | 'published';
  preset_origin: PresetOrigin;
  published_by: string | null;
  published_at: string | null;
}): Promise<QaConfigurationVersionSummary> {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    versionNumber: row.version_number,
    status: row.status,
    presetOrigin: row.preset_origin,
    publishedBy: row.published_by,
    publishedAt: row.published_at,
    settings: await getSettingsSummary(row.id),
  };
}

export async function getCurrentPublished(organisationId: string): Promise<QaConfigurationVersionSummary | null> {
  const result = await pool.query(
    `SELECT * FROM qa_configuration_versions WHERE organisation_id = $1 AND status = 'published'
     ORDER BY version_number DESC LIMIT 1`,
    [organisationId],
  );
  const row = result.rows[0];
  return row ? toVersionSummary(row) : null;
}

export async function getOpenDraft(organisationId: string): Promise<QaConfigurationVersionSummary | null> {
  const result = await pool.query(
    `SELECT * FROM qa_configuration_versions WHERE organisation_id = $1 AND status = 'draft'`,
    [organisationId],
  );
  const row = result.rows[0];
  return row ? toVersionSummary(row) : null;
}

/** FR-QAOM-002/007/008: start a draft, materialized immediately from the chosen preset (DBD-013). */
export async function startDraft(organisationId: string, presetOrigin: PresetOrigin): Promise<QaConfigurationVersionSummary> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM qa_configuration_versions WHERE organisation_id = $1 AND status = $2', [
      organisationId,
      'draft',
    ]);
    if (existing.rows.length > 0) {
      // CONFIGURATION_DRAFT_ALREADY_EXISTS (docs/technical/api/qa-configuration.md) —
      // same top-level `conflict` error code as every other 409 in this API; the
      // client already knows which draft exists via GET .../draft.
      throw HttpError.conflict('A configuration draft already exists for this organisation.');
    }

    const versionNumber = await nextVersionNumber(client, organisationId);
    const versionResult = await client.query<{ id: string }>(
      `INSERT INTO qa_configuration_versions (organisation_id, version_number, status, preset_origin)
       VALUES ($1, $2, 'draft', $3)
       RETURNING id`,
      [organisationId, versionNumber, presetOrigin],
    );
    const versionId = versionResult.rows[0]!.id;
    await insertMaterializedChildren(client, versionId, materializePreset(presetOrigin));

    await client.query('COMMIT');

    const draft = await getOpenDraft(organisationId);
    return draft!;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface ValidationError {
  section: string;
  resource: string;
  code: string;
  message: string;
}

/**
 * Bounded validation (§26 of the task) — not open-ended policy linting. This
 * slice's minimal rule: a workflow definition must exist for every document type.
 * Presets always satisfy this (see materializePreset); an empty Custom draft does
 * not, by design (FR-QAOM-007's "incomplete Custom Setup draft does not publish").
 */
export async function validateDraft(versionId: string): Promise<ValidationError[]> {
  const result = await pool.query<{ document_type: DocumentType }>(
    'SELECT document_type FROM workflow_definitions WHERE qa_configuration_version_id = $1',
    [versionId],
  );
  const present = new Set(result.rows.map((r) => r.document_type));
  const errors: ValidationError[] = [];
  for (const documentType of ALL_DOCUMENT_TYPES) {
    if (!present.has(documentType)) {
      errors.push({
        section: 'workflows',
        resource: documentType,
        code: 'CONFIGURATION_INCOMPLETE',
        message: `A workflow shape must be set for ${documentType} before publishing.`,
      });
    }
  }
  return errors;
}

/** FR-QAOM-008/009: publish the org's open draft, making it the current effective configuration. */
export async function publishDraft(organisationId: string, publishedByUserId: string): Promise<QaConfigurationVersionSummary> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const draftResult = await client.query<{ id: string; version_number: number }>(
      "SELECT id, version_number FROM qa_configuration_versions WHERE organisation_id = $1 AND status = 'draft' FOR UPDATE",
      [organisationId],
    );
    const draft = draftResult.rows[0];
    if (!draft) {
      throw HttpError.notFound('No configuration draft is open for this organisation.');
    }

    const errors = await validateDraft(draft.id);
    if (errors.length > 0) {
      throw new HttpError(422, 'validation_error', 'The configuration draft is incomplete and cannot be published.', undefined, errors);
    }

    await client.query(
      `UPDATE qa_configuration_versions SET status = 'published', published_by = $2, published_at = now() WHERE id = $1`,
      [draft.id, publishedByUserId],
    );

    await client.query('COMMIT');

    const published = await pool.query('SELECT * FROM qa_configuration_versions WHERE id = $1', [draft.id]);
    return await toVersionSummary(published.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
