-- =============================================================================
-- TestFlow AI — DRAFT Physical Database Schema (PostgreSQL)
-- =============================================================================
-- STATUS: DESIGN REVIEW ONLY. Do not execute. No migrations have been created.
--
-- Source of truth: docs/technical/database.md (logical design),
--                  docs/technical/database-decisions.md (DBD-001..007),
--                  docs/technical/architecture.md / architecture-decisions.md (AD-001..013)
--
-- Naming conventions (see docs/technical/database.md §Naming Conventions):
--   tables:      snake_case, plural                (e.g. test_cases)
--   columns:     snake_case                         (e.g. created_at)
--   primary key: id (uuid)
--   foreign key: <singular_referenced_table>_id      (e.g. project_id)
--   PK constraint:  pk_<table>
--   FK constraint:  fk_<table>_<column>
--   unique constraint: uq_<table>_<column(s)>
--   check constraint:  ck_<table>_<description>
--   index:          idx_<table>_<column(s)>
--
-- Identifier strategy (DBD-007): UUID everywhere, generated via gen_random_uuid().
--
-- Deletion behaviour (applies uniformly, see docs/technical/database.md):
--   No approved requirement calls for hard-deleting any tenant-owning entity
--   (Organisation, User, Project, Requirement, Test Case, Test Run, etc.) —
--   archiving (status/record_status columns) is the approved mechanism instead
--   (PRD §10 Business Rules; PD-016/PD-034/PD-037). All foreign keys therefore
--   use ON DELETE RESTRICT: the database actively prevents a delete that would
--   orphan history, rather than silently cascading data away. This is a safety
--   net, not a supported delete workflow.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- =============================================================================
-- MODULE: Tenancy & Identity
-- =============================================================================

CREATE TABLE organisations (
    id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                            text NOT NULL,
    trial_used                      boolean NOT NULL DEFAULT false, -- PD-021: once true, must never be reset to false (app-enforced)
    preferred_scope_terminology     text, -- CHANGE-002/DBD-024/FR-QAOM-013: optional, descriptive-only label (e.g. 'Sprint', 'Phase'); NEVER read by any behavioural logic, only UI copy
    created_at                      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE organisations IS 'Top-level tenant. Every other table resolves to exactly one organisation, directly or indirectly (NFR-SEC-003).';
COMMENT ON COLUMN organisations.preferred_scope_terminology IS 'CHANGE-002/PD-064: descriptive-only. Not versioned with qa_configuration_versions (not a governance/publish event). Must never be branched on by application logic.';

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id uuid NOT NULL,
    email           text NOT NULL,
    name            text NOT NULL,
    role            text NOT NULL, -- 'admin' | 'qa_manager' | 'qa_tester' (PD-017)
    password_hash   text NOT NULL,
    status          text NOT NULL DEFAULT 'active', -- 'active' | 'removed'
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_users_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT uq_users_email UNIQUE (email), -- platform-wide unique login identifier
    CONSTRAINT ck_users_role CHECK (role IN ('admin', 'qa_manager', 'qa_tester')),
    CONSTRAINT ck_users_status CHECK (status IN ('active', 'removed'))
);
COMMENT ON TABLE users IS 'DBD-001: one user belongs to exactly one organisation. Role lives directly here (no separate membership table).';
COMMENT ON COLUMN users.status IS 'Removed users are retained (never hard-deleted) to preserve historical attribution of authored content (requirements, test cases, comments, approvals).';
-- NOTE: "an organisation must always retain >=1 active Admin" (PD-030/DBD-005) cannot be
-- expressed as a single-table CHECK constraint (it is an existence/aggregate rule across
-- rows). This must be enforced by application logic and/or a database trigger evaluated
-- at UPDATE/DELETE time on this table — flagged as an implementation-phase requirement,
-- not resolved by a declarative constraint here.

CREATE TABLE invitations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL,
    invited_email       text NOT NULL,
    proposed_role       text NOT NULL, -- 'admin' | 'qa_manager' | 'qa_tester'
    invited_by_user_id  uuid NOT NULL,
    status              text NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'expired'
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_invitations_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invitations_invited_by FOREIGN KEY (invited_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_invitations_proposed_role CHECK (proposed_role IN ('admin', 'qa_manager', 'qa_tester')),
    CONSTRAINT ck_invitations_status CHECK (status IN ('pending', 'accepted', 'expired'))
);

-- =============================================================================
-- MODULE: Project Structure
-- =============================================================================

CREATE TABLE projects (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id             uuid NOT NULL,
    name                        text NOT NULL,
    qa_configuration_version_id uuid NOT NULL, -- CHANGE-001/FR-QAOM-012/DBD-014: pinned at creation to the organisation's then-current published version; NEVER auto-updated when the organisation publishes a later version — explicit, efficiently retrievable, no "latest" lookup at request time
    created_by_user_id          uuid NOT NULL,
    status                      text NOT NULL DEFAULT 'active', -- 'active' | 'archived'
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_projects_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_projects_qa_configuration_version FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_projects_status CHECK (status IN ('active', 'archived'))
);

CREATE TABLE project_memberships (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              uuid NOT NULL,
    user_id                 uuid NOT NULL,
    granted_by_user_id      uuid NOT NULL,
    is_creator_grant        boolean NOT NULL DEFAULT false, -- FR-PRJ-007: removing the creator must only revoke this row, never others
    granted_at              timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_project_memberships_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_memberships_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_memberships_granted_by FOREIGN KEY (granted_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_project_memberships_project_user UNIQUE (project_id, user_id)
);
COMMENT ON TABLE project_memberships IS 'Many-to-many User<->Project (PD-017: access grant, not a role assignment). Admin/QA Manager organisation-wide visibility (FR-PRJ-004) is NOT modeled as rows here — it is derived from users.role at query time; see database.md Design Review for this reconciliation.';

-- Reverse-lookup index: "which projects does this user have access to" (the unique
-- constraint above indexes (project_id, user_id) — good for "who is on this project",
-- not for "which projects is this user on" without a leading project_id).
CREATE INDEX idx_project_memberships_user_id ON project_memberships (user_id);

-- =============================================================================
-- MODULE: Subscription & Billing
-- =============================================================================

CREATE TABLE subscriptions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id         uuid NOT NULL,
    plan_type               text NOT NULL, -- 'trial' | 'monthly' | 'yearly'
    status                  text NOT NULL, -- 'active' | 'grace_period' | 'blocked'
    started_at              timestamptz NOT NULL,
    trial_ends_at           timestamptz, -- required when plan_type = 'trial' (app-enforced)
    grace_period_ends_at    timestamptz, -- required when status = 'grace_period' (app-enforced)
    CONSTRAINT fk_subscriptions_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT uq_subscriptions_organisation UNIQUE (organisation_id), -- one current subscription per org
    CONSTRAINT ck_subscriptions_plan_type CHECK (plan_type IN ('trial', 'monthly', 'yearly')),
    CONSTRAINT ck_subscriptions_status CHECK (status IN ('active', 'grace_period', 'blocked'))
);

CREATE TABLE seat_batches (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id         uuid NOT NULL,
    seat_count              integer NOT NULL,
    plan_type_at_purchase   text NOT NULL, -- 'trial' | 'monthly' | 'yearly'
    purchased_at            timestamptz NOT NULL DEFAULT now(),
    renews_at               timestamptz, -- yearly batches only (PD-027 staggered renewal)
    amount_charged          numeric(10, 2) NOT NULL,
    CONSTRAINT fk_seat_batches_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT ck_seat_batches_seat_count_positive CHECK (seat_count > 0),
    CONSTRAINT ck_seat_batches_plan_type CHECK (plan_type_at_purchase IN ('trial', 'monthly', 'yearly')),
    CONSTRAINT ck_seat_batches_amount_non_negative CHECK (amount_charged >= 0)
);
COMMENT ON TABLE seat_batches IS 'PD-028: seat_count is set once at insert and never updated downward — no UPDATE path should reduce it. Total org seats = SUM(seat_count) across all rows for the organisation.';

CREATE TABLE payments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id uuid NOT NULL,
    seat_batch_id   uuid NOT NULL,
    amount          numeric(10, 2) NOT NULL,
    plan_type       text NOT NULL, -- 'monthly' | 'yearly'
    status          text NOT NULL, -- 'succeeded' | 'failed'
    charged_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_payments_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_seat_batch FOREIGN KEY (seat_batch_id)
        REFERENCES seat_batches (id) ON DELETE RESTRICT,
    CONSTRAINT ck_payments_plan_type CHECK (plan_type IN ('monthly', 'yearly')),
    CONSTRAINT ck_payments_status CHECK (status IN ('succeeded', 'failed')),
    CONSTRAINT ck_payments_amount_non_negative CHECK (amount >= 0)
);

-- =============================================================================
-- MODULE: Requirements & Test Authoring
-- =============================================================================

CREATE TABLE requirements (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL, -- denormalized from projects.organisation_id — see note below
    project_id          uuid NOT NULL,
    title               text NOT NULL,
    description         text NOT NULL,
    source_reference    text, -- optional, e.g. external ticket ID/URL (FR-REQ-001)
    author_user_id      uuid NOT NULL,
    status              text NOT NULL DEFAULT 'active', -- 'active' | 'archived'
    created_at          timestamptz NOT NULL DEFAULT now(),
    last_edited_at      timestamptz NOT NULL DEFAULT now(), -- DBD-004: substitutes for versioning; drives PD-033 re-review trigger
    CONSTRAINT fk_requirements_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_requirements_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_requirements_author FOREIGN KEY (author_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_requirements_status CHECK (status IN ('active', 'archived'))
);
-- NOTE ON DENORMALIZED organisation_id (recommended, NOT yet an approved product/database
-- decision — flagged for your confirmation): project-scoped tables below carry organisation_id
-- directly, redundant with project_id -> projects.organisation_id, specifically so that
-- (a) tenant-isolation checks and Row-Level Security policies can filter directly on
-- organisation_id without a join, satisfying "database-level protection where appropriate"
-- (NFR-SEC-003), and (b) every relevant index can lead with organisation_id. This value
-- must be set once at insert time (copied from the parent project) and never updated,
-- since a project's organisation never changes.

CREATE TABLE test_cases (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id             uuid NOT NULL, -- denormalized, see note above
    project_id                  uuid NOT NULL,
    requirement_id              uuid, -- optional (PD-005)
    document_template_version_id uuid NOT NULL, -- CHANGE-001/FR-TPL-009: the applicable published Test Case template version at creation; never changes afterward
    title                       text NOT NULL,
    steps                       jsonb NOT NULL, -- structured step content — protected system field; the template's "Step Table" field type renders THIS column, it is never dynamic content (DBD-009)
    expected_results            jsonb NOT NULL,
    priority_option_id          uuid, -- CHANGE-001/FR-TC-011: optional; FK into document_template_field_options for the Priority field on this test case's template — typed for query/filter performance (DBD-020), not stored in configurable_field_values
    configurable_field_values   jsonb NOT NULL DEFAULT '{}'::jsonb, -- CHANGE-001/DBD-010: organisation-configurable field values (all field types except Priority and system fields), keyed by document_template_fields.field_key, validated at write time against document_template_version_id's field definitions — NOT a free-form dumping ground, see database.md
    current_meta_state          text NOT NULL DEFAULT 'draft', -- CHANGE-001/DBD-017: denormalized copy of workflow_instances.current_meta_state for hot-path filtering; 'draft' | 'approved' | 'needs_review' under the No Approval shape (Standard QA default, unchanged from pre-pivot approval_status), or 'draft' | 'in_review' | 'submitted_for_approval' | 'approved' | 'needs_review' under a configured stronger shape (FR-WF-001/003) — authoritative current state lives in workflow_instances; this column must be kept in sync by application logic on every workflow transition, the same denormalization pattern already used for organisation_id above
    record_status               text NOT NULL DEFAULT 'active', -- 'active' | 'archived' (separate from workflow meta-state)
    is_ai_generated             boolean NOT NULL DEFAULT false,
    ai_generation_request_id    uuid, -- optional; set only if is_ai_generated
    created_by_user_id          uuid NOT NULL,
    current_version_number      integer NOT NULL DEFAULT 1, -- increments only on "significant" edits (DBD-003)
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_cases_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_cases_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_cases_requirement FOREIGN KEY (requirement_id)
        REFERENCES requirements (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_cases_template_version FOREIGN KEY (document_template_version_id)
        REFERENCES document_template_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_cases_priority_option FOREIGN KEY (priority_option_id)
        REFERENCES document_template_field_options (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_cases_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_cases_ai_generation_request FOREIGN KEY (ai_generation_request_id)
        REFERENCES ai_generation_requests (id) ON DELETE RESTRICT,
    CONSTRAINT ck_test_cases_current_meta_state CHECK (current_meta_state IN ('draft', 'in_review', 'submitted_for_approval', 'approved', 'needs_review')),
    CONSTRAINT ck_test_cases_record_status CHECK (record_status IN ('active', 'archived')),
    CONSTRAINT ck_test_cases_ai_flag_consistency CHECK (
        (is_ai_generated = false AND ai_generation_request_id IS NULL) OR (is_ai_generated = true)
    )
);
-- NOTE (CHANGE-001/DBD-017): the pre-pivot `approval_status` enum column is REMOVED, replaced by
-- `current_meta_state` above (denormalized from workflow_instances). See database-decisions.md DBD-017.
-- (ai_generation_requests is defined later in this file; Postgres requires either forward
-- declaration ordering or deferred FK addition. In the DRAFT below, ai_generation_requests
-- is created before test_cases in actual execution order — see the reordered CREATE TABLE
-- sequence note at the bottom of this file. This header comment documents intent; the
-- executable order later in the file avoids the forward reference.)

CREATE TABLE test_case_versions (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id                uuid NOT NULL,
    version_number              integer NOT NULL,
    document_template_version_id uuid NOT NULL, -- CHANGE-001: frozen copy of the template version applicable when this version was created
    steps                       jsonb NOT NULL, -- frozen; never modified after insert
    expected_results            jsonb NOT NULL, -- frozen; never modified after insert
    priority_option_id          uuid, -- CHANGE-001: frozen copy of test_cases.priority_option_id at the moment this version was created
    configurable_field_values   jsonb NOT NULL DEFAULT '{}'::jsonb, -- CHANGE-001: frozen copy of test_cases.configurable_field_values at the moment this version was created
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_case_versions_test_case FOREIGN KEY (test_case_id)
        REFERENCES test_cases (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_case_versions_template_version FOREIGN KEY (document_template_version_id)
        REFERENCES document_template_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_case_versions_priority_option FOREIGN KEY (priority_option_id)
        REFERENCES document_template_field_options (id) ON DELETE RESTRICT,
    CONSTRAINT uq_test_case_versions_test_case_version UNIQUE (test_case_id, version_number)
);
COMMENT ON TABLE test_case_versions IS 'DBD-003: created only for "significant" edits, defined as an edit that changes the entire test case (full content replacement). Rows are immutable once inserted (application must never UPDATE steps/expected_results here).';

CREATE TABLE test_case_comments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id        uuid NOT NULL,
    author_user_id      uuid NOT NULL,
    text                text NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_case_comments_test_case FOREIGN KEY (test_case_id)
        REFERENCES test_cases (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_case_comments_author FOREIGN KEY (author_user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

-- =============================================================================
-- MODULE: Organisation QA Operating Model (CHANGE-001)
-- =============================================================================
-- Supersedes the pre-pivot `test_case_templates`/`report_templates` (opaque
-- `default_structure` JSONB) — see database-decisions.md DBD-009 through DBD-023.
-- NOTE: created before test_cases/qa_documents in actual execution order (both
-- reference document_template_versions). See "Execution Order" note at end of file.

CREATE TABLE qa_configuration_versions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL,
    version_number      integer NOT NULL, -- monotonic per organisation, starting at 1
    status              text NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
    preset_origin       text NOT NULL, -- 'standard' | 'lightweight' | 'controlled' | 'custom' — PROVENANCE ONLY (DBD-013): never read at runtime to determine behaviour; behaviour is fully determined by the rows this version's children (workflow_definitions, qa_artifact_policies, quality_gate_definitions, qa_configuration_version_templates) materialize at publish time
    created_by_user_id  uuid NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    published_by_user_id uuid, -- set only when status = 'published'
    published_at        timestamptz, -- set only when status = 'published'
    CONSTRAINT fk_qa_config_versions_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_qa_config_versions_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_qa_config_versions_published_by FOREIGN KEY (published_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_qa_config_versions_org_version UNIQUE (organisation_id, version_number),
    CONSTRAINT ck_qa_config_versions_status CHECK (status IN ('draft', 'published')),
    CONSTRAINT ck_qa_config_versions_preset_origin CHECK (preset_origin IN ('standard', 'lightweight', 'controlled', 'custom')),
    CONSTRAINT ck_qa_config_versions_published_fields CHECK (
        (status = 'draft' AND published_by_user_id IS NULL AND published_at IS NULL) OR
        (status = 'published' AND published_by_user_id IS NOT NULL AND published_at IS NOT NULL)
    )
);
COMMENT ON TABLE qa_configuration_versions IS 'FR-QAOM-008/009, DBD-012: single aggregate version row per publish — no separate "configuration identity" table (organisation_id is the identity axis). Once status=''published'', a row and everything it references (via child FKs / the junction table below) MUST NEVER be updated — only a new draft/publish creates a new version (DBD-012, PD-057).';
CREATE UNIQUE INDEX uq_qa_config_versions_one_draft_per_org ON qa_configuration_versions (organisation_id) WHERE status = 'draft';
CREATE INDEX idx_qa_config_versions_org_published ON qa_configuration_versions (organisation_id, version_number DESC) WHERE status = 'published'; -- "current published version for this org"

CREATE TABLE document_templates (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL,
    document_type       text NOT NULL, -- 'test_case' | 'test_report' | 'regression_report' — TestFlow-controlled, bounded (FR-RPT-005, PD-051); never an arbitrary/organisation-defined type
    name                text NOT NULL,
    created_by_user_id  uuid NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_document_templates_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_templates_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_document_templates_document_type CHECK (document_type IN ('test_case', 'test_report', 'regression_report'))
);
COMMENT ON TABLE document_templates IS 'Template IDENTITY only (one row per template the organisation maintains). Structure/fields live on document_template_versions/document_template_fields below (DBD-009). One shared table across all three document types — reuse is appropriate here since template semantics (field definitions, versioning, publish) are genuinely identical across them (FR-TPL-001); this does NOT genericize Test Case itself, which remains a first-class table with real columns.';

CREATE TABLE document_template_versions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_template_id    uuid NOT NULL,
    version_number          integer NOT NULL,
    status                  text NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
    created_by_user_id      uuid NOT NULL,
    created_at              timestamptz NOT NULL DEFAULT now(),
    published_by_user_id    uuid,
    published_at            timestamptz,
    CONSTRAINT fk_document_template_versions_template FOREIGN KEY (document_template_id)
        REFERENCES document_templates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_template_versions_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_template_versions_published_by FOREIGN KEY (published_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_document_template_versions_template_version UNIQUE (document_template_id, version_number),
    CONSTRAINT ck_document_template_versions_status CHECK (status IN ('draft', 'published')),
    CONSTRAINT ck_document_template_versions_published_fields CHECK (
        (status = 'draft' AND published_by_user_id IS NULL AND published_at IS NULL) OR
        (status = 'published' AND published_by_user_id IS NOT NULL AND published_at IS NOT NULL)
    )
);
COMMENT ON TABLE document_template_versions IS 'FR-TPL-007: immutable once published — no field row beneath a published version may be inserted/updated/deleted; a change requires a new draft version (FR-TPL-006).';
CREATE UNIQUE INDEX uq_document_template_versions_one_draft ON document_template_versions (document_template_id) WHERE status = 'draft';

CREATE TABLE document_template_fields (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_template_version_id uuid NOT NULL,
    field_key                   text NOT NULL, -- stable identifier, e.g. 'priority', 'test_data' — referenced by configurable_field_values JSON keys
    label                       text NOT NULL,
    help_text                   text,
    field_type                  text NOT NULL, -- FR-TPL-003 bounded palette
    is_system_field             boolean NOT NULL DEFAULT false, -- DBD-011: TRUE only for the small TestFlow-controlled set (title, requirement link, etc. that map to REAL columns) — carries display/ordering metadata only, never authoritative data (see database.md)
    is_required                 boolean NOT NULL DEFAULT false,
    default_value                jsonb, -- shape depends on field_type; NOT used for system fields
    validation_config           jsonb NOT NULL DEFAULT '{}'::jsonb, -- DBD-010: bounded, field-type-specific (e.g. {"min":0,"max":100} for Number; empty for Attachment) — see database.md for the documented per-type schema; application layer validates against it, this is not a free-form dump
    display_order                integer NOT NULL,
    is_active                    boolean NOT NULL DEFAULT true, -- soft-deprecation (FR-TPL-004): deactivated fields are hidden from new authoring but historical values referencing them remain valid
    CONSTRAINT fk_document_template_fields_version FOREIGN KEY (document_template_version_id)
        REFERENCES document_template_versions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_document_template_fields_version_key UNIQUE (document_template_version_id, field_key),
    CONSTRAINT ck_document_template_fields_type CHECK (field_type IN (
        'short_text', 'long_text', 'rich_text', 'number', 'date', 'date_time', 'checkbox',
        'dropdown', 'multi_select', 'user', 'tags', 'attachment', 'url', 'entity_link',
        'step_table', 'section'
    )),
    CONSTRAINT ck_document_template_fields_protected_no_default CHECK (
        is_system_field = false OR default_value IS NULL
    )
);
COMMENT ON TABLE document_template_fields IS 'FR-TPL-001/003/004. is_system_field=true rows (DBD-011) exist ONLY for display positioning/labelling of protected fields (record identity, org/project, version, created by/at, updated at, archive state, required execution/traceability links) within the rendered template preview — the authoritative value for those fields is always the real typed column on the owning table (e.g. test_cases.requirement_id), never this row or configurable_field_values. Organisations may reposition but never delete or redefine these rows'' semantics (PD-054, enforced at application layer since "redefine semantics" is not a single-table-expressible constraint).';
CREATE INDEX idx_document_template_fields_version_order ON document_template_fields (document_template_version_id, display_order);

CREATE TABLE document_template_field_options (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_field_id   uuid NOT NULL,
    option_key           text NOT NULL, -- stable identifier (DBD-020) — referenced by test_cases.priority_option_id and by configurable_field_values for other Dropdown/Multi-select fields
    label                text NOT NULL,
    display_order        integer NOT NULL,
    is_active             boolean NOT NULL DEFAULT true, -- soft-deprecation: historical records referencing a deactivated option remain valid (FK never broken)
    CONSTRAINT fk_document_template_field_options_field FOREIGN KEY (template_field_id)
        REFERENCES document_template_fields (id) ON DELETE RESTRICT,
    CONSTRAINT uq_document_template_field_options_field_key UNIQUE (template_field_id, option_key)
);
COMMENT ON TABLE document_template_field_options IS 'Options for Dropdown/Multi-select fields, including Test Case Priority (FR-TC-011) — Priority is modelled as an ordinary Dropdown field on the Test Case template (DBD-020), with a dedicated typed FK column (test_cases.priority_option_id) for query/filter/gate performance rather than being buried in configurable_field_values.';

CREATE TABLE qa_configuration_version_templates (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_configuration_version_id uuid NOT NULL,
    document_type                text NOT NULL, -- 'test_case' | 'test_report' | 'regression_report'
    document_template_version_id uuid NOT NULL,
    CONSTRAINT fk_qa_config_version_templates_config FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_qa_config_version_templates_template_version FOREIGN KEY (document_template_version_id)
        REFERENCES document_template_versions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_qa_config_version_templates_config_type UNIQUE (qa_configuration_version_id, document_type),
    CONSTRAINT ck_qa_config_version_templates_document_type CHECK (document_type IN ('test_case', 'test_report', 'regression_report'))
);
COMMENT ON TABLE qa_configuration_version_templates IS 'FR-QAOM-009: the "references the specific immutable template... definitions in effect at that publish" mechanism — resolves "which Test Case template version is applicable to project X" via project -> qa_configuration_version -> this table -> document_template_versions, with no lookup of "latest" required (DBD-014).';

-- Workflow shapes (FR-WF-001/002) — one row per document type per configuration version.
CREATE TABLE workflow_definitions (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_configuration_version_id uuid NOT NULL,
    document_type                text NOT NULL, -- 'test_case' | 'test_report' | 'regression_report'
    shape                        text NOT NULL, -- 'no_approval' | 'single_approval' | 'review_approval' — FR-WF-001, bounded, no other shape
    approver_role                 text, -- 'qa_manager' | 'admin' — required unless shape = 'no_approval'
    reviewer_role                  text, -- 'qa_manager' | 'admin' — used only when shape = 'review_approval'
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
COMMENT ON TABLE workflow_definitions IS 'FR-WF-001/002/006. No independent publish lifecycle (DBD-015): immutable by virtue of belonging to an immutable qa_configuration_versions row — never updated once its parent is published.';

CREATE TABLE workflow_state_labels (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_configuration_version_id uuid NOT NULL,
    document_type                text NOT NULL,
    meta_state                   text NOT NULL, -- FR-WF-003: TestFlow-controlled stable meta-state this label maps to
    display_label                 text NOT NULL, -- organisation-configurable (e.g. 'Approved' -> 'Signed Off')
    CONSTRAINT fk_workflow_state_labels_config FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_workflow_state_labels_config_type_state UNIQUE (qa_configuration_version_id, document_type, meta_state),
    CONSTRAINT ck_workflow_state_labels_meta_state CHECK (meta_state IN ('draft', 'in_review', 'submitted_for_approval', 'approved', 'needs_review'))
);
COMMENT ON TABLE workflow_state_labels IS 'FR-WF-003: display label only — gate/report/AI/traceability logic must NEVER read display_label, only the stable meta_state stored on workflow_instances/test_cases.current_meta_state/qa_documents.current_meta_state.';

-- Current workflow state + history — shared across Test Case and QA Documents (DBD-015).
CREATE TABLE workflow_instances (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type             text NOT NULL, -- 'test_case' | 'qa_document' — polymorphic, same accepted trade-off as audit_log_entries/notifications
    subject_id                uuid NOT NULL,
    workflow_definition_id    uuid NOT NULL,
    current_meta_state         text NOT NULL DEFAULT 'draft',
    entered_current_state_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_workflow_instances_definition FOREIGN KEY (workflow_definition_id)
        REFERENCES workflow_definitions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_workflow_instances_subject UNIQUE (subject_type, subject_id),
    CONSTRAINT ck_workflow_instances_subject_type CHECK (subject_type IN ('test_case', 'qa_document')),
    CONSTRAINT ck_workflow_instances_meta_state CHECK (current_meta_state IN ('draft', 'in_review', 'submitted_for_approval', 'approved', 'needs_review'))
);
COMMENT ON TABLE workflow_instances IS 'FR-WF-001/004, FR-TC-005, FR-WF-005. Authoritative current state; test_cases.current_meta_state and qa_documents.current_meta_state are denormalized read copies kept in sync by application logic (DBD-017).';
CREATE INDEX idx_workflow_instances_subject ON workflow_instances (subject_type, subject_id);

CREATE TABLE workflow_transitions (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_instance_id         uuid NOT NULL,
    from_meta_state               text NOT NULL,
    to_meta_state                  text NOT NULL,
    performed_by_user_id           uuid NOT NULL,
    comment                         text,
    occurred_at                     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_workflow_transitions_instance FOREIGN KEY (workflow_instance_id)
        REFERENCES workflow_instances (id) ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_transitions_performed_by FOREIGN KEY (performed_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);
COMMENT ON TABLE workflow_transitions IS 'FR-WF-006/FR-AUD-005. Append-only history — no UPDATE/DELETE path should be exposed at any layer. Generalizes the pre-pivot report_approval_records concept (retained separately below for the distinct BA/PO link-based decision, PD-039/FR-RPT-003) to internal, role-based workflow approval across Test Case and QA Documents.';
CREATE INDEX idx_workflow_transitions_instance ON workflow_transitions (workflow_instance_id, occurred_at);

-- Required QA artifact policy (FR-POL-001) and its bounded project override.
CREATE TABLE qa_artifact_policies (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_configuration_version_id uuid NOT NULL,
    artifact_type                text NOT NULL, -- 'requirements' | 'test_cases' | 'test_report' | 'regression_report' — bounded (FR-POL-001)
    is_required                   boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_qa_artifact_policies_config FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_qa_artifact_policies_config_type UNIQUE (qa_configuration_version_id, artifact_type),
    CONSTRAINT ck_qa_artifact_policies_artifact_type CHECK (artifact_type IN ('requirements', 'test_cases', 'test_report', 'regression_report'))
);

CREATE TABLE project_artifact_policy_overrides (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id               uuid NOT NULL,
    artifact_type             text NOT NULL,
    is_required                boolean NOT NULL,
    overridden_by_user_id       uuid NOT NULL,
    overridden_at                timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_project_artifact_overrides_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_artifact_overrides_by FOREIGN KEY (overridden_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_project_artifact_overrides_project_type UNIQUE (project_id, artifact_type),
    CONSTRAINT ck_project_artifact_overrides_artifact_type CHECK (artifact_type IN ('requirements', 'test_cases', 'test_report', 'regression_report'))
);
COMMENT ON TABLE project_artifact_policy_overrides IS 'FR-POL-004: presence of a row = an override is in effect; absence = organisation value applies (FR-POL-002). A row may only be inserted for an artifact_type the organisation has marked overridable (application-layer check against qa_artifact_policies-adjacent overridability metadata — see database.md; not independently modelled as a table since the MVP overridable set is fixed to exactly artifact policy + gate config, FR-POL-003).';

-- Quality Gates (FR-QG-001/002) — bounded catalogue, typed parameters, and its bounded project override.
CREATE TABLE quality_gate_definitions (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_configuration_version_id uuid NOT NULL,
    gate_type                    text NOT NULL, -- FR-QG-001 bounded catalogue (6 values) — no other gate type permitted
    is_enabled                    boolean NOT NULL DEFAULT false,
    parameters                    jsonb NOT NULL DEFAULT '{}'::jsonb, -- type-specific, e.g. {"threshold_percent":80} for min_requirement_coverage; {"blocking_severities":["critical","high"]} for no_unresolved_release_blocking_defects (DBD-022) — bounded per gate_type, see database.md
    CONSTRAINT fk_quality_gate_definitions_config FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT uq_quality_gate_definitions_config_type UNIQUE (qa_configuration_version_id, gate_type),
    CONSTRAINT ck_quality_gate_definitions_type CHECK (gate_type IN (
        'required_artifacts_completed', 'required_approvals_completed', 'min_requirement_coverage',
        'regression_activity_completed', 'no_unresolved_critical_defects', 'no_unresolved_release_blocking_defects'
    ))
);

CREATE TABLE project_quality_gate_overrides (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id               uuid NOT NULL,
    gate_type                 text NOT NULL,
    is_enabled                 boolean NOT NULL,
    parameters                  jsonb NOT NULL DEFAULT '{}'::jsonb,
    overridden_by_user_id        uuid NOT NULL,
    overridden_at                 timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_project_gate_overrides_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_gate_overrides_by FOREIGN KEY (overridden_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_project_gate_overrides_project_type UNIQUE (project_id, gate_type),
    CONSTRAINT ck_project_gate_overrides_type CHECK (gate_type IN (
        'required_artifacts_completed', 'required_approvals_completed', 'min_requirement_coverage',
        'regression_activity_completed', 'no_unresolved_critical_defects', 'no_unresolved_release_blocking_defects'
    ))
);
COMMENT ON TABLE project_quality_gate_overrides IS 'FR-QG-002/POL-004. No quality_gate_results table exists (DBD-021): FR-QG-003 evaluates readiness on demand against current live data, not a persisted/cached snapshot, at MVP.';

-- Defect Severity (stable semantic + org label) and Defect Priority (org-configurable option set)
-- — Defect is NOT a templated document type (PD-051), so these live outside module TPL.
CREATE TABLE defect_severity_labels (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id      uuid NOT NULL,
    semantic_level         text NOT NULL, -- 'critical' | 'high' | 'medium' | 'low' — FR-DEF-007, fixed, never organisation-added/removed
    display_label          text NOT NULL,
    display_order            integer NOT NULL,
    CONSTRAINT fk_defect_severity_labels_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT uq_defect_severity_labels_org_level UNIQUE (organisation_id, semantic_level),
    CONSTRAINT ck_defect_severity_labels_level CHECK (semantic_level IN ('critical', 'high', 'medium', 'low'))
);
COMMENT ON TABLE defect_severity_labels IS 'FR-DEF-007/DBD-019. Every organisation has exactly 4 rows (one per semantic_level), seeded at organisation creation with default labels Critical/High/Medium/Low; organisations may edit display_label only — semantic_level itself is immutable and no 5th row may exist (enforced by the CHECK + app-layer seeding logic, since "exactly 4, one per level" is an aggregate rule not expressible as a single-row constraint).';

CREATE TABLE defect_priority_options (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id      uuid NOT NULL,
    option_key             text NOT NULL,
    label                    text NOT NULL,
    display_order              integer NOT NULL,
    is_active                    boolean NOT NULL DEFAULT true,
    CONSTRAINT fk_defect_priority_options_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT uq_defect_priority_options_org_key UNIQUE (organisation_id, option_key)
);
COMMENT ON TABLE defect_priority_options IS 'FR-DEF-008/DBD-020. Organisation-configurable, no TestFlow-mandated semantics (unlike defect_severity_labels) — default-seeded with Critical/High/Medium/Low options at organisation creation, then freely renamed/added/deactivated.';

-- =============================================================================
-- MODULE: Test Suites, Runs & Execution
-- =============================================================================

CREATE TABLE test_suites (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL,
    project_id          uuid NOT NULL,
    name                text NOT NULL,
    created_by_user_id  uuid NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_suites_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_suites_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_suites_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE test_suite_memberships (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_suite_id   uuid NOT NULL,
    test_case_id    uuid NOT NULL,
    added_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_suite_memberships_suite FOREIGN KEY (test_suite_id)
        REFERENCES test_suites (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_suite_memberships_test_case FOREIGN KEY (test_case_id)
        REFERENCES test_cases (id) ON DELETE RESTRICT,
    CONSTRAINT uq_test_suite_memberships_suite_case UNIQUE (test_suite_id, test_case_id)
);
-- Reverse-lookup index: "which suites is this test case in" (DBD-002 many-to-many).
CREATE INDEX idx_test_suite_memberships_test_case_id ON test_suite_memberships (test_case_id);

CREATE TABLE test_runs (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL,
    project_id          uuid NOT NULL,
    name                text NOT NULL,
    status              text NOT NULL DEFAULT 'open', -- 'open' | 'closed' | 'cancelled_archived'
    created_by_user_id  uuid NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    closed_at           timestamptz, -- set once; immutable thereafter (PD-037)
    CONSTRAINT fk_test_runs_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_runs_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_runs_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_test_runs_status CHECK (status IN ('open', 'closed', 'cancelled_archived'))
);
COMMENT ON COLUMN test_runs.status IS 'DBD-006: confirmed 3-value exception to the general 2-value active/archived pattern used elsewhere.';

CREATE TABLE test_run_test_cases (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_run_id             uuid NOT NULL,
    test_case_id            uuid NOT NULL,
    test_case_version_id    uuid, -- optional: may be null if no "significant" version existed at snapshot time (DBD-003)
    steps                   jsonb NOT NULL, -- frozen copy, always taken regardless of version_id presence (FR-TC-004)
    expected_results        jsonb NOT NULL, -- frozen copy
    priority_option_id      uuid, -- CHANGE-001: frozen copy of the test case's priority at snapshot time (historical fidelity, same principle as steps/expected_results)
    configurable_field_values jsonb NOT NULL DEFAULT '{}'::jsonb, -- CHANGE-001: frozen copy of configurable field values at snapshot time
    captured_at             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_run_test_cases_run FOREIGN KEY (test_run_id)
        REFERENCES test_runs (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_run_test_cases_test_case FOREIGN KEY (test_case_id)
        REFERENCES test_cases (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_run_test_cases_version FOREIGN KEY (test_case_version_id)
        REFERENCES test_case_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_run_test_cases_priority_option FOREIGN KEY (priority_option_id)
        REFERENCES document_template_field_options (id) ON DELETE RESTRICT,
    CONSTRAINT uq_test_run_test_cases_run_case UNIQUE (test_run_id, test_case_id)
);
COMMENT ON TABLE test_run_test_cases IS 'The historical-accuracy anchor: steps/expected_results are frozen at run creation and NEVER updated afterward, independent of the live test_cases row or any test_case_versions row (NFR-DI-001).';
CREATE INDEX idx_test_run_test_cases_test_case_id ON test_run_test_cases (test_case_id); -- "which runs has this test case appeared in"

CREATE TABLE execution_results (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_run_test_case_id   uuid NOT NULL,
    status                  text NOT NULL, -- 'pass' | 'fail' | 'blocked' | 'skipped'
    executed_by_user_id     uuid NOT NULL,
    executed_at             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_execution_results_snapshot FOREIGN KEY (test_run_test_case_id)
        REFERENCES test_run_test_cases (id) ON DELETE RESTRICT,
    CONSTRAINT fk_execution_results_executed_by FOREIGN KEY (executed_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_execution_results_snapshot UNIQUE (test_run_test_case_id), -- one result per snapshot
    CONSTRAINT ck_execution_results_status CHECK (status IN ('pass', 'fail', 'blocked', 'skipped'))
);
COMMENT ON TABLE execution_results IS 'PD-037/NFR-DI-003: application logic MUST reject any UPDATE/DELETE against a row whose parent test_run.status <> ''open''. This cannot be expressed as a single-table CHECK constraint (requires checking a joined table''s status) — enforce via a BEFORE UPDATE/DELETE trigger or application-layer guard, flagged as an implementation-phase requirement.';

CREATE TABLE evidence (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_result_id     uuid NOT NULL,
    file_reference          text NOT NULL, -- pointer into object storage, not the file content itself
    file_type               text NOT NULL, -- MIME type, validated against NFR-FILE-002 allowlist at application layer
    original_filename       text NOT NULL,
    file_size_bytes         bigint NOT NULL,
    uploaded_by_user_id     uuid NOT NULL,
    uploaded_at             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_evidence_execution_result FOREIGN KEY (execution_result_id)
        REFERENCES execution_results (id) ON DELETE RESTRICT,
    CONSTRAINT fk_evidence_uploaded_by FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_evidence_file_size_positive CHECK (file_size_bytes > 0),
    CONSTRAINT ck_evidence_file_size_limit CHECK (file_size_bytes <= 10485760) -- NFR-FILE-001: 10 MB cap
);

-- =============================================================================
-- MODULE: Defect Management
-- =============================================================================

CREATE TABLE defects (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_result_id         uuid NOT NULL,
    title                       text NOT NULL,
    description                 text NOT NULL,
    status                      text NOT NULL DEFAULT 'open', -- 'open' | 'pending' | 'closed' | 'removed' (DBD-008) — UNCHANGED, deliberately NOT made configurable under CHANGE-001 (DBD-018: Stage 2 requirements do not approve a configurable Defect lifecycle; Defect remains a first-class system entity with fixed status semantics)
    severity_semantic           text NOT NULL DEFAULT 'medium', -- CHANGE-001/FR-DEF-007: 'critical' | 'high' | 'medium' | 'low' — stable, TestFlow-controlled; display label resolved live via defect_severity_labels (DBD-019), never stored here
    priority_option_id          uuid, -- CHANGE-001/FR-DEF-008: optional FK into defect_priority_options (organisation-configurable, no fixed semantics)
    logged_by_user_id           uuid NOT NULL,
    assigned_via_access_link_id uuid, -- set on assignment (FR-DEF-002)
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_defects_execution_result FOREIGN KEY (execution_result_id)
        REFERENCES execution_results (id) ON DELETE RESTRICT,
    CONSTRAINT fk_defects_logged_by FOREIGN KEY (logged_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_defects_assigned_via FOREIGN KEY (assigned_via_access_link_id)
        REFERENCES access_links (id) ON DELETE RESTRICT,
    CONSTRAINT fk_defects_priority_option FOREIGN KEY (priority_option_id)
        REFERENCES defect_priority_options (id) ON DELETE RESTRICT,
    CONSTRAINT ck_defects_status CHECK (status IN ('open', 'pending', 'closed', 'removed')),
    CONSTRAINT ck_defects_severity_semantic CHECK (severity_semantic IN ('critical', 'high', 'medium', 'low'))
);

CREATE TABLE defect_history_entries (
    id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    defect_id                       uuid NOT NULL,
    change_description              text NOT NULL,
    performed_by_user_id            uuid, -- exactly one of these two must be set
    performed_via_access_link_id    uuid,
    occurred_at                     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_defect_history_defect FOREIGN KEY (defect_id)
        REFERENCES defects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_defect_history_user FOREIGN KEY (performed_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_defect_history_access_link FOREIGN KEY (performed_via_access_link_id)
        REFERENCES access_links (id) ON DELETE RESTRICT,
    CONSTRAINT ck_defect_history_performer CHECK (
        (performed_by_user_id IS NOT NULL AND performed_via_access_link_id IS NULL) OR
        (performed_by_user_id IS NULL AND performed_via_access_link_id IS NOT NULL)
    )
);
COMMENT ON TABLE defect_history_entries IS 'Append-only. No UPDATE or DELETE path should be exposed for this table at any layer.';

-- =============================================================================
-- MODULE: Reporting
-- =============================================================================

CREATE TABLE qa_documents (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id             uuid NOT NULL,
    project_id                  uuid NOT NULL,
    document_type               text NOT NULL, -- 'test_report' | 'regression_report' — CHANGE-001/DBD-016: generalizes the pre-pivot `reports` table (Test Report only) into a shared table across both built-in configurable document types (FR-RPT-005, PD-051)
    document_template_version_id uuid NOT NULL, -- FR-TPL-009: applicable published template version at generation time
    current_meta_state          text NOT NULL DEFAULT 'draft', -- CHANGE-001/DBD-017: denormalized from workflow_instances, same pattern as test_cases.current_meta_state
    configurable_field_values   jsonb NOT NULL DEFAULT '{}'::jsonb,
    generated_by_user_id        uuid NOT NULL,
    generated_at                timestamptz NOT NULL DEFAULT now(),
    content_snapshot            jsonb NOT NULL, -- compiled report data at generation time, including Post-Deployment section for document_type='test_report' (PD-038) — unchanged from pre-pivot `reports.content_snapshot`
    status                      text NOT NULL DEFAULT 'active', -- 'active' | 'archived'
    scope_value                 text, -- CHANGE-002/DBD-024/FR-RPT-006: optional, methodology-neutral free text (e.g. 'Sprint 17', 'System Testing'); document-instance metadata only, NOT part of qa_configuration_versions
    scope_start_date            date, -- CHANGE-002/DBD-024/FR-RPT-006: optional
    scope_end_date              date, -- CHANGE-002/DBD-024/FR-RPT-006: optional; app-enforced scope_end_date >= scope_start_date when both present
    CONSTRAINT fk_qa_documents_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_qa_documents_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_qa_documents_template_version FOREIGN KEY (document_template_version_id)
        REFERENCES document_template_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_qa_documents_generated_by FOREIGN KEY (generated_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_qa_documents_document_type CHECK (document_type IN ('test_report', 'regression_report')),
    CONSTRAINT ck_qa_documents_current_meta_state CHECK (current_meta_state IN ('draft', 'in_review', 'submitted_for_approval', 'approved', 'needs_review')),
    CONSTRAINT ck_qa_documents_status CHECK (status IN ('active', 'archived')),
    CONSTRAINT ck_qa_documents_scope_dates CHECK (scope_start_date IS NULL OR scope_end_date IS NULL OR scope_end_date >= scope_start_date)
);
COMMENT ON TABLE qa_documents IS 'CHANGE-001/DBD-016: RENAMES AND GENERALIZES the pre-pivot `reports` table. All pre-existing Test Report semantics (content_snapshot, generated_by, Post-Deployment section, PD-038) are preserved unchanged for document_type=''test_report''; document_type=''regression_report'' is new (FR-RPT-005). report_approval_records/report_comments/access_links below now reference qa_documents.id (their own semantics — PD-039/PD-040 — are unchanged). CHANGE-002/DBD-024: scope_value/scope_start_date/scope_end_date are optional, methodology-neutral document-instance metadata (FR-RPT-006) — never a Sprint/Cycle/Release foreign key.';

CREATE TABLE report_approval_records (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_document_id               uuid NOT NULL, -- CHANGE-001: renamed from report_id (references qa_documents, formerly reports)
    decision                    text NOT NULL, -- 'approved' | 'rejected'
    decided_via_access_link_id  uuid NOT NULL,
    decided_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_report_approval_qa_document FOREIGN KEY (qa_document_id)
        REFERENCES qa_documents (id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_approval_access_link FOREIGN KEY (decided_via_access_link_id)
        REFERENCES access_links (id) ON DELETE RESTRICT,
    CONSTRAINT ck_report_approval_decision CHECK (decision IN ('approved', 'rejected'))
);
COMMENT ON TABLE report_approval_records IS 'PD-039 (generalized by PD-050/FR-WF-005): record-keeping by default. This BA/PO link-based decision is DISTINCT from the internal workflow_instances state above — no trigger, job, or downstream workflow reads this table directly as a gate; only an explicitly configured quality_gate_definitions row (gate_type referencing report approval) may treat it as an input (FR-QG-001 condition 2).';

CREATE TABLE report_comments (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_document_id               uuid NOT NULL, -- CHANGE-001: renamed from report_id
    text                        text NOT NULL,
    commented_via_access_link_id uuid NOT NULL,
    visible_to_user_id          uuid NOT NULL, -- the QA Tester this comment is scoped to (PD-040)
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_report_comments_qa_document FOREIGN KEY (qa_document_id)
        REFERENCES qa_documents (id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_comments_access_link FOREIGN KEY (commented_via_access_link_id)
        REFERENCES access_links (id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_comments_visible_to FOREIGN KEY (visible_to_user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);
COMMENT ON TABLE report_comments IS 'PD-040: kept structurally separate from qa_documents.content_snapshot so the QA-Tester-only visibility rule is enforced by table/query design, not a conditional filter on shared data.';

-- =============================================================================
-- MODULE: Link-Based Access
-- =============================================================================

CREATE TABLE access_links (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- the id itself IS the unguessable token used in the URL
    scope_type          text NOT NULL, -- 'report_approval' | 'report_comment' | 'defect_status_update' | 'dashboard_view'
    qa_document_id      uuid, -- CHANGE-001: renamed from report_id (references qa_documents, formerly reports) — exactly one of qa_document_id / defect_id / project_id is set, matching scope_type
    defect_id           uuid,
    project_id          uuid,
    intended_role       text NOT NULL, -- 'ba_po' | 'developer' | 'stakeholder'
    named_recipient     text, -- optional (PD-044)
    generated_by_user_id uuid NOT NULL,
    expires_at          timestamptz NOT NULL, -- configurable; default of now() + 24h applied at application layer (PD-042)
    revoked             boolean NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_access_links_qa_document FOREIGN KEY (qa_document_id)
        REFERENCES qa_documents (id) ON DELETE RESTRICT,
    CONSTRAINT fk_access_links_defect FOREIGN KEY (defect_id)
        REFERENCES defects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_access_links_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_access_links_generated_by FOREIGN KEY (generated_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_access_links_scope_type CHECK (scope_type IN ('report_approval', 'report_comment', 'defect_status_update', 'dashboard_view')),
    CONSTRAINT ck_access_links_intended_role CHECK (intended_role IN ('ba_po', 'developer', 'stakeholder')),
    CONSTRAINT ck_access_links_exactly_one_scope CHECK (
        (CASE WHEN qa_document_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN defect_id IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN project_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);
COMMENT ON TABLE access_links IS 'Physical-design improvement over the logical model''s generic "scoped entity reference": explicit nullable FKs per possible scope target (report/defect/project) rather than a polymorphic reference, so the database itself enforces the scope target actually exists and belongs to a real row (NFR-SEC-005).';
CREATE INDEX idx_access_links_expires_at ON access_links (expires_at) WHERE revoked = false; -- supports validity checks and any future expired-link cleanup job

-- =============================================================================
-- MODULE: AI
-- =============================================================================
-- NOTE: created before test_cases in actual execution order (test_cases.ai_generation_request_id
-- references this table). This file lists modules in the same order as database.md for
-- readability; see "Execution Order" note at the end of this file for the real CREATE order.

CREATE TABLE ai_generation_requests (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id      uuid NOT NULL,
    project_id          uuid NOT NULL,
    qa_configuration_version_id uuid NOT NULL, -- CHANGE-001/NFR-CFG-004: the project's effective configuration version at generation time
    document_template_version_id uuid NOT NULL, -- CHANGE-001/FR-AI-001/006/NFR-AI-010: the applicable published Test Case template version generation was validated against
    triggered_by_user_id uuid NOT NULL,
    provider_used       text NOT NULL, -- 'platform' | 'project_key' (FR-AI-003/004) — NOT the specific provider/model name (no vendor selected)
    status               text NOT NULL DEFAULT 'requested', -- 'requested' | 'succeeded' | 'failed' | 'timed_out'
    requested_at        timestamptz NOT NULL DEFAULT now(),
    completed_at        timestamptz,
    CONSTRAINT fk_ai_generation_requirement FOREIGN KEY (requirement_id)
        REFERENCES requirements (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ai_generation_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ai_generation_config_version FOREIGN KEY (qa_configuration_version_id)
        REFERENCES qa_configuration_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ai_generation_template_version FOREIGN KEY (document_template_version_id)
        REFERENCES document_template_versions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ai_generation_triggered_by FOREIGN KEY (triggered_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_ai_generation_provider CHECK (provider_used IN ('platform', 'project_key')),
    CONSTRAINT ck_ai_generation_status CHECK (status IN ('requested', 'succeeded', 'failed', 'timed_out'))
);
COMMENT ON COLUMN ai_generation_requests.document_template_version_id IS 'FR-AI-006: validation happens against this version before candidates are offered for the mandatory human-review/save step (unchanged, NFR-AI-004) — this table still deliberately does NOT store generated candidate content or prompt text (NFR-AI-007, NFR-PRIV-001).';
COMMENT ON TABLE ai_generation_requests IS 'Deliberately does NOT store prompt text or full requirement content sent to the provider (NFR-AI-007, NFR-PRIV-001) — only metadata needed for traceability, monitoring, and linking to the requirement/resulting test cases.';

-- =============================================================================
-- MODULE: Audit & Notifications
-- =============================================================================

CREATE TABLE audit_log_entries (
    id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id                 uuid NOT NULL,
    action_type                     text NOT NULL,
    affected_entity_type            text NOT NULL, -- e.g. 'test_case', 'defect', 'user' — generic reference, see note below
    affected_entity_id              uuid NOT NULL,
    performed_by_user_id            uuid,
    performed_via_access_link_id    uuid,
    occurred_at                     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_audit_log_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_log_user FOREIGN KEY (performed_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_log_access_link FOREIGN KEY (performed_via_access_link_id)
        REFERENCES access_links (id) ON DELETE RESTRICT,
    CONSTRAINT ck_audit_log_performer CHECK (
        (performed_by_user_id IS NOT NULL AND performed_via_access_link_id IS NULL) OR
        (performed_by_user_id IS NULL AND performed_via_access_link_id IS NOT NULL)
    )
);
COMMENT ON TABLE audit_log_entries IS 'Append-only, immutable (NFR-DI-002): no UPDATE or DELETE should ever be exposed at any application layer, including for Admin. affected_entity_type/affected_entity_id is a generic (polymorphic) reference — cannot carry a real foreign key since it points to many different tables; this is a known, accepted trade-off (see database.md Design Review).';
CREATE INDEX idx_audit_log_organisation_occurred ON audit_log_entries (organisation_id, occurred_at DESC);

CREATE TABLE notifications (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id   uuid NOT NULL,
    type                text NOT NULL,
    related_entity_type text NOT NULL, -- generic reference, same trade-off as audit_log_entries
    related_entity_id   uuid NOT NULL,
    read                boolean NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);
CREATE INDEX idx_notifications_recipient_unread ON notifications (recipient_user_id, read); -- "show my unread notifications"

-- =============================================================================
-- Additional indexes (beyond those inlined above), organised by likely query pattern
-- =============================================================================

-- Tenant/organisation filtering — every project-scoped table gets a leading index on
-- organisation_id to support "show me everything in my organisation" and, later, Row-
-- Level Security policies (NFR-SEC-003).
CREATE INDEX idx_users_organisation_id ON users (organisation_id);
CREATE INDEX idx_projects_organisation_id ON projects (organisation_id);
CREATE INDEX idx_requirements_organisation_id ON requirements (organisation_id);
CREATE INDEX idx_test_cases_organisation_id ON test_cases (organisation_id);
CREATE INDEX idx_test_suites_organisation_id ON test_suites (organisation_id);
CREATE INDEX idx_test_runs_organisation_id ON test_runs (organisation_id);
CREATE INDEX idx_qa_documents_organisation_id ON qa_documents (organisation_id);
CREATE INDEX idx_document_templates_organisation_id ON document_templates (organisation_id);
CREATE INDEX idx_defect_severity_labels_organisation_id ON defect_severity_labels (organisation_id);
CREATE INDEX idx_defect_priority_options_organisation_id ON defect_priority_options (organisation_id);

-- Project filtering — "show me everything in this project" (dashboards, list views).
CREATE INDEX idx_requirements_project_id ON requirements (project_id);
CREATE INDEX idx_test_cases_project_id ON test_cases (project_id);
CREATE INDEX idx_test_suites_project_id ON test_suites (project_id);
CREATE INDEX idx_test_runs_project_id ON test_runs (project_id);
CREATE INDEX idx_qa_documents_project_id ON qa_documents (project_id);
CREATE INDEX idx_qa_documents_project_type ON qa_documents (project_id, document_type); -- FR-QG-001 conditions 1/4: "does this project have a Regression Report", etc.

-- CHANGE-001: Organisation QA Operating Model query patterns.
-- "Which test cases/qa_documents are in Needs Review / Draft / etc." (approval queues, dashboards) —
-- current_meta_state is denormalized specifically so this stays a single-table indexed query (DBD-017),
-- avoiding a join to workflow_instances on the hot list/filter path.
CREATE INDEX idx_test_cases_current_meta_state ON test_cases (project_id, current_meta_state);
CREATE INDEX idx_qa_documents_current_meta_state ON qa_documents (project_id, current_meta_state);
-- Test Case Priority filtering/reporting (FR-TC-011, NFR-DYN-002) — typed FK, cheap to index.
CREATE INDEX idx_test_cases_priority_option_id ON test_cases (priority_option_id);
-- Defect Severity/Priority filtering (FR-DEF-007/008, FR-QG-001 condition 5/6).
CREATE INDEX idx_defects_severity_semantic ON defects (severity_semantic);
CREATE INDEX idx_defects_priority_option_id ON defects (priority_option_id);
-- Template field lookups for rendering/validation (FR-TPL-009, NFR-DYN-001) — see idx_document_template_fields_version_order above.
CREATE INDEX idx_document_template_versions_template_id ON document_template_versions (document_template_id);
CREATE INDEX idx_document_template_field_options_field_id ON document_template_field_options (template_field_id);
-- "Which config version is currently published for this org / which template versions does it reference" — see
-- uq_qa_config_versions_one_draft_per_org and idx_qa_config_versions_org_published above.
CREATE INDEX idx_qa_config_version_templates_config_id ON qa_configuration_version_templates (qa_configuration_version_id);
CREATE INDEX idx_workflow_definitions_config_id ON workflow_definitions (qa_configuration_version_id);
CREATE INDEX idx_qa_artifact_policies_config_id ON qa_artifact_policies (qa_configuration_version_id);
CREATE INDEX idx_quality_gate_definitions_config_id ON quality_gate_definitions (qa_configuration_version_id);
-- Project override lookups (FR-POL-005 effective-configuration display) — PK-adjacent unique
-- constraints above already support "does this project have an override for X" efficiently;
-- no additional index needed beyond uq_project_artifact_overrides_project_type / uq_project_gate_overrides_project_type.

-- Requirement traceability (FR-TRACE-001/002): "show test cases linked to this requirement"
-- and "show untraced test cases" both benefit from an index on requirement_id (NULLs are
-- cheap to skip in a standard btree index for the "traced" query; the "untraced" query
-- (requirement_id IS NULL) is a full scan regardless of index and is expected to be rare/
-- reporting-only, not a hot path).
CREATE INDEX idx_test_cases_requirement_id ON test_cases (requirement_id);

-- Status filtering — run-status dashboards, defect boards. (Test case/qa_document approval-queue
-- filtering is now idx_test_cases_current_meta_state / idx_qa_documents_current_meta_state above.)
CREATE INDEX idx_test_runs_status ON test_runs (project_id, status);
CREATE INDEX idx_execution_results_status ON execution_results (status);
CREATE INDEX idx_defects_status ON defects (status);
CREATE INDEX idx_defects_execution_result_id ON defects (execution_result_id);

-- AI generation history — "show past generations for this requirement" (traceability,
-- NFR-AI-006) and provider/failure monitoring (NFR-OBS-002).
CREATE INDEX idx_ai_generation_requirement_id ON ai_generation_requests (requirement_id);
CREATE INDEX idx_ai_generation_status ON ai_generation_requests (status);

-- =============================================================================
-- EXECUTION ORDER NOTE (for whenever this draft is turned into real migrations):
-- Postgres requires referenced tables to exist before a foreign key can reference them.
-- The module-based ordering above is for readability; the actual dependency order
-- (CHANGE-001-updated) is:
--   organisations -> users -> invitations
--   -> qa_configuration_versions
--     -> document_templates -> document_template_versions -> document_template_fields
--        -> document_template_field_options
--     -> qa_configuration_version_templates
--     -> workflow_definitions -> workflow_state_labels
--     -> qa_artifact_policies
--     -> quality_gate_definitions
--   -> projects (references qa_configuration_versions) -> project_memberships
--   -> project_artifact_policy_overrides -> project_quality_gate_overrides
--   -> subscriptions -> seat_batches -> payments
--   -> defect_severity_labels -> defect_priority_options (organisation-scoped, no project dependency)
--   -> requirements -> ai_generation_requests (references qa_configuration_versions,
--      document_template_versions) -> test_cases (references document_template_versions,
--      document_template_field_options) -> test_case_versions -> test_case_comments
--   -> test_suites -> test_suite_memberships
--   -> test_runs -> test_run_test_cases (references document_template_field_options)
--      -> execution_results -> evidence
--   -> qa_documents (references document_template_versions) -> access_links
--      (references qa_documents, defects, projects)
--   -> defects (references access_links, defect_priority_options) -> defect_history_entries
--   -> report_approval_records -> report_comments (both reference qa_documents)
--   -> workflow_instances (references workflow_definitions) -> workflow_transitions
--   -> audit_log_entries -> notifications
-- (This file remains a DESIGN artifact, not an ordered migration script — CREATE TABLE
-- statements above are grouped by module for readability, not by this dependency order.)
-- =============================================================================
