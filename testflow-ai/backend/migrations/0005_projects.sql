-- Projects slice — Create Project (FR-PRJ-001) + Project visibility (FR-PRJ-004).
--
-- Migrates only what this slice needs, using the entity names/shapes already defined in
-- docs/technical/schema.sql so later slices extend these tables in place:
--   - projects                (FR-PRJ-001, FR-QAOM-012, DBD-014)
--   - project_memberships     (FR-PRJ-004, FR-PRJ-007 creator grant)
--
-- Additive only: two new tables, one new column on organisations, one new unique
-- constraint on qa_configuration_versions. No existing column is dropped, renamed, or
-- narrowed. Rollback: drop project_memberships, projects, the new constraint and column
-- (all new and empty in any environment before this slice ships).
--
-- Deviations from schema.sql (recorded in docs/technical/database-decisions.md, DBD-025):
--   - projects.project_code (PD-066) and projects.description (PD-067) are new columns.
--   - organisations.next_project_number backs the per-organisation sequential code.
--   - projects.qa_configuration_version_id is enforced to belong to the SAME organisation
--     by a composite foreign key, not just by application code (DBD-014 + tenant isolation).

-- Target of the composite foreign key below. (id is already unique; the pair is trivially
-- unique too — Postgres requires a unique constraint on exactly the referenced columns.)
ALTER TABLE qa_configuration_versions
    ADD CONSTRAINT uq_qa_config_versions_id_org UNIQUE (id, organisation_id);

-- Per-organisation sequential project code counter (PD-066). Incremented atomically in the
-- same transaction that inserts the project, so codes are gap-free per successful create
-- and never reused.
ALTER TABLE organisations
    ADD COLUMN next_project_number integer NOT NULL DEFAULT 1;

CREATE TABLE projects (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id             uuid NOT NULL,
    project_code                text NOT NULL,
    name                        text NOT NULL,
    description                 text,
    qa_configuration_version_id uuid NOT NULL,
    created_by_user_id          uuid NOT NULL,
    status                      text NOT NULL DEFAULT 'active',
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_projects_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_projects_qa_configuration_version FOREIGN KEY (qa_configuration_version_id, organisation_id)
        REFERENCES qa_configuration_versions (id, organisation_id) ON DELETE RESTRICT,
    CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uq_projects_org_code UNIQUE (organisation_id, project_code),
    CONSTRAINT ck_projects_status CHECK (status IN ('active', 'archived')),
    CONSTRAINT ck_projects_name CHECK (char_length(name) BETWEEN 1 AND 120 AND name = btrim(name)),
    CONSTRAINT ck_projects_description CHECK (description IS NULL OR char_length(description) <= 500)
);
COMMENT ON TABLE projects IS 'FR-PRJ-001. qa_configuration_version_id is pinned at creation to the organisation''s then-current published version and never auto-updated (FR-QAOM-012, DBD-014); the composite FK guarantees it belongs to the same organisation.';

CREATE INDEX idx_projects_org_created ON projects (organisation_id, created_at DESC, id DESC);

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
COMMENT ON TABLE project_memberships IS 'Many-to-many User<->Project (PD-017: access grant, not a role assignment). Admin/QA Manager organisation-wide visibility (FR-PRJ-004) is NOT modeled as rows here — it is derived from users.role at query time.';

-- "Which projects does this user have access to" (the unique constraint above indexes
-- (project_id, user_id), which serves "who is on this project").
CREATE INDEX idx_project_memberships_user_id ON project_memberships (user_id);
