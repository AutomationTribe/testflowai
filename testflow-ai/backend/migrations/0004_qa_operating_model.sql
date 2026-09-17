-- CHANGE-001/FR-QAOM: Organisation QA Operating Model — QA Setup slice.
--
-- Deliberately does NOT migrate the full docs/technical/schema.sql QAOM surface —
-- only what this slice needs (see migrate.ts's stated policy):
--   - qa_configuration_versions: the aggregate version row (FR-QAOM-009, DBD-012).
--   - workflow_definitions: Test Case/Test Report/Regression Report workflow shape
--     (FR-QAOM-010, FR-WF-002).
--   - qa_artifact_policies: which artifacts are required (FR-QAOM-010, FR-POL-001).
--   - quality_gate_definitions: which gates are enabled + their parameters
--     (FR-QAOM-010, FR-QG-002).
--
-- Explicitly deferred (not modelled here — see docs/technical/deployment.md's QA
-- Setup slice report for the full dependency rationale):
--   - qa_configuration_version_templates (module TPL — document_template_versions
--     doesn't exist yet; presets reference "standard templates" only descriptively
--     at this layer, FR-TPL-005 is out of scope for this slice).
--   - workflow_state_labels (FR-WF-003 — cosmetic display-label customization,
--     not required by any FR-QAOM-004/005/006 preset definition).
--   - project_artifact_policy_overrides / project_quality_gate_overrides / the
--     `projects` table itself (FR-QAOM-012 pinning — no projects exist yet to pin).

CREATE TABLE qa_configuration_versions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id  uuid NOT NULL,
    version_number    integer NOT NULL,
    status             text NOT NULL, -- 'draft' | 'published'
    preset_origin       text NOT NULL, -- provenance only (DBD-013) — never read at runtime to determine behaviour
    published_by         uuid,
    published_at          timestamptz,
    created_at             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_qa_config_versions_org FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_qa_config_versions_published_by FOREIGN KEY (published_by)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_qa_config_versions_org_version UNIQUE (organisation_id, version_number),
    CONSTRAINT ck_qa_config_versions_status CHECK (status IN ('draft', 'published')),
    CONSTRAINT ck_qa_config_versions_preset_origin CHECK (preset_origin IN ('standard', 'lightweight', 'controlled', 'custom')),
    CONSTRAINT ck_qa_config_versions_published_fields CHECK (
        (status = 'draft' AND published_by IS NULL AND published_at IS NULL) OR
        (status = 'published' AND published_by IS NOT NULL AND published_at IS NOT NULL)
    )
);
COMMENT ON TABLE qa_configuration_versions IS 'FR-QAOM-008/009, DBD-012: single aggregate version row per publish. Once status=''published'', a row and everything it references MUST NEVER be updated — only a new draft/publish creates a new version.';
CREATE UNIQUE INDEX uq_qa_config_versions_one_draft_per_org ON qa_configuration_versions (organisation_id) WHERE status = 'draft';
CREATE INDEX idx_qa_config_versions_org_published ON qa_configuration_versions (organisation_id, version_number DESC) WHERE status = 'published';

CREATE TABLE workflow_definitions (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_configuration_version_id uuid NOT NULL,
    document_type                text NOT NULL,
    shape                          text NOT NULL,
    approver_role                   text,
    reviewer_role                    text,
    CONSTRAINT fk_workflow_definitions_config FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_workflow_definitions_config_type UNIQUE (qa_configuration_version_id, document_type),
    CONSTRAINT ck_workflow_definitions_document_type CHECK (document_type IN ('test_case', 'test_report', 'regression_report')),
    CONSTRAINT ck_workflow_definitions_shape CHECK (shape IN ('no_approval', 'single_approval', 'review_approval')),
    CONSTRAINT ck_workflow_definitions_approver_role CHECK (approver_role IS NULL OR approver_role IN ('qa_manager', 'admin')),
    CONSTRAINT ck_workflow_definitions_reviewer_role CHECK (reviewer_role IS NULL OR reviewer_role IN ('qa_manager', 'admin')),
    CONSTRAINT ck_workflow_definitions_role_presence CHECK (
        (shape = 'no_approval' AND approver_role IS NULL AND reviewer_role IS NULL) OR
        (shape = 'single_approval' AND approver_role IS NOT NULL AND reviewer_role IS NULL) OR
        (shape = 'review_approval' AND approver_role IS NOT NULL AND reviewer_role IS NOT NULL)
    )
);
COMMENT ON TABLE workflow_definitions IS 'FR-WF-001/002/006. Immutable by virtue of belonging to an immutable qa_configuration_versions row once published.';

CREATE TABLE qa_artifact_policies (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_configuration_version_id uuid NOT NULL,
    artifact_type                 text NOT NULL,
    is_required                     boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_qa_artifact_policies_config FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_qa_artifact_policies_config_type UNIQUE (qa_configuration_version_id, artifact_type),
    CONSTRAINT ck_qa_artifact_policies_artifact_type CHECK (artifact_type IN ('requirements', 'test_cases', 'test_report', 'regression_report'))
);

CREATE TABLE quality_gate_definitions (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_configuration_version_id uuid NOT NULL,
    gate_type                     text NOT NULL,
    is_enabled                     boolean NOT NULL DEFAULT false,
    parameters                      jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT fk_quality_gate_definitions_config FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_quality_gate_definitions_config_type UNIQUE (qa_configuration_version_id, gate_type),
    CONSTRAINT ck_quality_gate_definitions_type CHECK (gate_type IN (
        'required_artifacts_completed', 'required_approvals_completed', 'min_requirement_coverage',
        'regression_activity_completed', 'no_unresolved_critical_defects', 'no_unresolved_release_blocking_defects'
    ))
);

CREATE INDEX idx_workflow_definitions_config_id ON workflow_definitions (qa_configuration_version_id);
CREATE INDEX idx_qa_artifact_policies_config_id ON qa_artifact_policies (qa_configuration_version_id);
CREATE INDEX idx_quality_gate_definitions_config_id ON quality_gate_definitions (qa_configuration_version_id);
