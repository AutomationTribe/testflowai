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
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    trial_used      boolean NOT NULL DEFAULT false, -- PD-021: once true, must never be reset to false (app-enforced)
    created_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE organisations IS 'Top-level tenant. Every other table resolves to exactly one organisation, directly or indirectly (NFR-SEC-003).';

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
    created_by_user_id          uuid NOT NULL,
    status                      text NOT NULL DEFAULT 'active', -- 'active' | 'archived'
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_projects_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
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
    title                       text NOT NULL,
    steps                       jsonb NOT NULL, -- structured step content
    expected_results            jsonb NOT NULL,
    approval_status             text NOT NULL DEFAULT 'draft', -- 'draft' | 'approved' | 'needs_review' — self-service, no QA Manager gate (PD-048)
    record_status               text NOT NULL DEFAULT 'active', -- 'active' | 'archived' (separate from approval_status)
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
    CONSTRAINT fk_test_cases_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_cases_ai_generation_request FOREIGN KEY (ai_generation_request_id)
        REFERENCES ai_generation_requests (id) ON DELETE RESTRICT,
    CONSTRAINT ck_test_cases_approval_status CHECK (approval_status IN ('draft', 'approved', 'needs_review')),
    CONSTRAINT ck_test_cases_record_status CHECK (record_status IN ('active', 'archived')),
    CONSTRAINT ck_test_cases_ai_flag_consistency CHECK (
        (is_ai_generated = false AND ai_generation_request_id IS NULL) OR (is_ai_generated = true)
    )
);
-- (ai_generation_requests is defined later in this file; Postgres requires either forward
-- declaration ordering or deferred FK addition. In the DRAFT below, ai_generation_requests
-- is created before test_cases in actual execution order — see the reordered CREATE TABLE
-- sequence note at the bottom of this file. This header comment documents intent; the
-- executable order later in the file avoids the forward reference.)

CREATE TABLE test_case_versions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id        uuid NOT NULL,
    version_number      integer NOT NULL,
    steps               jsonb NOT NULL, -- frozen; never modified after insert
    expected_results    jsonb NOT NULL, -- frozen; never modified after insert
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_case_versions_test_case FOREIGN KEY (test_case_id)
        REFERENCES test_cases (id) ON DELETE RESTRICT,
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

CREATE TABLE test_case_templates (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL,
    name                text NOT NULL,
    default_structure   jsonb NOT NULL, -- pre-population content; NOT a custom-field schema (none approved — see database.md §5/§Custom Fields)
    created_by_user_id  uuid NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_case_templates_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_case_templates_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE report_templates (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL,
    name                text NOT NULL,
    default_structure   jsonb NOT NULL,
    created_by_user_id  uuid NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_report_templates_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_templates_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

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
    captured_at             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_test_run_test_cases_run FOREIGN KEY (test_run_id)
        REFERENCES test_runs (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_run_test_cases_test_case FOREIGN KEY (test_case_id)
        REFERENCES test_cases (id) ON DELETE RESTRICT,
    CONSTRAINT fk_test_run_test_cases_version FOREIGN KEY (test_case_version_id)
        REFERENCES test_case_versions (id) ON DELETE RESTRICT,
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
    status                      text NOT NULL DEFAULT 'open', -- 'open' | 'pending' | 'closed' | 'removed' (DBD-008)
    logged_by_user_id           uuid NOT NULL,
    assigned_via_access_link_id uuid, -- set on assignment (FR-DEF-002)
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_defects_execution_result FOREIGN KEY (execution_result_id)
        REFERENCES execution_results (id) ON DELETE RESTRICT,
    CONSTRAINT fk_defects_logged_by FOREIGN KEY (logged_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_defects_assigned_via FOREIGN KEY (assigned_via_access_link_id)
        REFERENCES access_links (id) ON DELETE RESTRICT,
    CONSTRAINT ck_defects_status CHECK (status IN ('open', 'pending', 'closed', 'removed'))
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

CREATE TABLE reports (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id     uuid NOT NULL,
    project_id          uuid NOT NULL,
    generated_by_user_id uuid NOT NULL,
    generated_at        timestamptz NOT NULL DEFAULT now(),
    content_snapshot    jsonb NOT NULL, -- compiled report data at generation time, including Post-Deployment section (PD-038)
    status              text NOT NULL DEFAULT 'active', -- 'active' | 'archived'
    CONSTRAINT fk_reports_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reports_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reports_generated_by FOREIGN KEY (generated_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_reports_status CHECK (status IN ('active', 'archived'))
);

CREATE TABLE report_approval_records (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id                   uuid NOT NULL,
    decision                    text NOT NULL, -- 'approved' | 'rejected'
    decided_via_access_link_id  uuid NOT NULL,
    decided_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_report_approval_report FOREIGN KEY (report_id)
        REFERENCES reports (id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_approval_access_link FOREIGN KEY (decided_via_access_link_id)
        REFERENCES access_links (id) ON DELETE RESTRICT,
    CONSTRAINT ck_report_approval_decision CHECK (decision IN ('approved', 'rejected'))
);
COMMENT ON TABLE report_approval_records IS 'PD-039: record-keeping only. No trigger, job, or downstream workflow may read this table as a gate for any other action.';

CREATE TABLE report_comments (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id                   uuid NOT NULL,
    text                        text NOT NULL,
    commented_via_access_link_id uuid NOT NULL,
    visible_to_user_id          uuid NOT NULL, -- the QA Tester this comment is scoped to (PD-040)
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_report_comments_report FOREIGN KEY (report_id)
        REFERENCES reports (id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_comments_access_link FOREIGN KEY (commented_via_access_link_id)
        REFERENCES access_links (id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_comments_visible_to FOREIGN KEY (visible_to_user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);
COMMENT ON TABLE report_comments IS 'PD-040: kept structurally separate from reports.content_snapshot so the QA-Tester-only visibility rule is enforced by table/query design, not a conditional filter on shared data.';

-- =============================================================================
-- MODULE: Link-Based Access
-- =============================================================================

CREATE TABLE access_links (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- the id itself IS the unguessable token used in the URL
    scope_type          text NOT NULL, -- 'report_approval' | 'report_comment' | 'defect_status_update' | 'dashboard_view'
    report_id           uuid, -- exactly one of report_id / defect_id / project_id is set, matching scope_type
    defect_id           uuid,
    project_id          uuid,
    intended_role       text NOT NULL, -- 'ba_po' | 'developer' | 'stakeholder'
    named_recipient     text, -- optional (PD-044)
    generated_by_user_id uuid NOT NULL,
    expires_at          timestamptz NOT NULL, -- configurable; default of now() + 24h applied at application layer (PD-042)
    revoked             boolean NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_access_links_report FOREIGN KEY (report_id)
        REFERENCES reports (id) ON DELETE RESTRICT,
    CONSTRAINT fk_access_links_defect FOREIGN KEY (defect_id)
        REFERENCES defects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_access_links_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_access_links_generated_by FOREIGN KEY (generated_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_access_links_scope_type CHECK (scope_type IN ('report_approval', 'report_comment', 'defect_status_update', 'dashboard_view')),
    CONSTRAINT ck_access_links_intended_role CHECK (intended_role IN ('ba_po', 'developer', 'stakeholder')),
    CONSTRAINT ck_access_links_exactly_one_scope CHECK (
        (CASE WHEN report_id IS NOT NULL THEN 1 ELSE 0 END) +
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
    triggered_by_user_id uuid NOT NULL,
    provider_used       text NOT NULL, -- 'platform' | 'project_key' (FR-AI-003/004) — NOT the specific provider/model name (no vendor selected)
    status               text NOT NULL DEFAULT 'requested', -- 'requested' | 'succeeded' | 'failed' | 'timed_out'
    requested_at        timestamptz NOT NULL DEFAULT now(),
    completed_at        timestamptz,
    CONSTRAINT fk_ai_generation_requirement FOREIGN KEY (requirement_id)
        REFERENCES requirements (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ai_generation_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ai_generation_triggered_by FOREIGN KEY (triggered_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_ai_generation_provider CHECK (provider_used IN ('platform', 'project_key')),
    CONSTRAINT ck_ai_generation_status CHECK (status IN ('requested', 'succeeded', 'failed', 'timed_out'))
);
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
CREATE INDEX idx_reports_organisation_id ON reports (organisation_id);

-- Project filtering — "show me everything in this project" (dashboards, list views).
CREATE INDEX idx_requirements_project_id ON requirements (project_id);
CREATE INDEX idx_test_cases_project_id ON test_cases (project_id);
CREATE INDEX idx_test_suites_project_id ON test_suites (project_id);
CREATE INDEX idx_test_runs_project_id ON test_runs (project_id);
CREATE INDEX idx_reports_project_id ON reports (project_id);

-- Requirement traceability (FR-TRACE-001/002): "show test cases linked to this requirement"
-- and "show untraced test cases" both benefit from an index on requirement_id (NULLs are
-- cheap to skip in a standard btree index for the "traced" query; the "untraced" query
-- (requirement_id IS NULL) is a full scan regardless of index and is expected to be rare/
-- reporting-only, not a hot path).
CREATE INDEX idx_test_cases_requirement_id ON test_cases (requirement_id);

-- Status filtering — approval queues ("show me all Needs Review test cases"),
-- run-status dashboards, defect boards.
CREATE INDEX idx_test_cases_approval_status ON test_cases (project_id, approval_status);
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
-- The module-based ordering above is for readability; the actual dependency order is:
--   organisations -> users -> invitations -> projects -> project_memberships
--   -> subscriptions -> seat_batches -> payments
--   -> requirements -> ai_generation_requests -> test_cases -> test_case_versions
--   -> test_case_comments -> test_case_templates -> report_templates
--   -> test_suites -> test_suite_memberships
--   -> test_runs -> test_run_test_cases -> execution_results -> evidence
--   -> reports -> access_links -> defects -> defect_history_entries
--   -> report_approval_records -> report_comments
--   -> audit_log_entries -> notifications
-- (access_links must exist before defects, since defects.assigned_via_access_link_id
-- references it; reports must exist before access_links, since access_links.report_id
-- references it — this file is a DESIGN artifact, not an ordered migration script.)
-- =============================================================================
