-- Slice 0 — Walking Skeleton
-- Only the tables needed for auth + organisation/tenant context (users, organisations)
-- plus a server-side session store for AD-006's internally-built authentication.
-- Column shapes match docs/technical/schema.sql exactly so later slices extend these
-- tables in place rather than renaming/reshaping them.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organisations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    trial_used      boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE organisations IS 'Top-level tenant (database.md). Slice 0 subset: full CHANGE-002 preferred_scope_terminology column added in a later slice when that module is implemented.';

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
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('admin', 'qa_manager', 'qa_tester')),
    CONSTRAINT ck_users_status CHECK (status IN ('active', 'removed'))
);
COMMENT ON TABLE users IS 'Organisation membership is expressed directly on this table (organisation_id + role) — no separate membership table, matching DBD-001 (fixed at creation, not reassignable).';

CREATE INDEX idx_users_organisation ON users (organisation_id);

-- Server-side session store (AD-006: internally built, standard credential-handling
-- practices, not a third-party auth platform). Not part of the approved product schema —
-- an implementation-level table for Slice 0's session-based login (api-spec.md).
CREATE TABLE sessions (
    token           text PRIMARY KEY, -- opaque, high-entropy random token (see lib/session.ts)
    user_id         uuid NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NOT NULL,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);
COMMENT ON TABLE sessions IS 'CASCADE here (not RESTRICT) is deliberate and local to this implementation-level table only: removing a user must not leave orphaned session rows. This does not set precedent for product-entity foreign keys, which remain ON DELETE RESTRICT per schema.sql.';

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
