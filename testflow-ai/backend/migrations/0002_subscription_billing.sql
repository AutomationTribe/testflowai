-- Slice 1 — Account Access & Subscription
-- Adds the approved subscription/billing tables (schema.sql) verbatim, plus
-- implementation-level tables not part of the approved product schema:
-- login_attempts (NFR-SEC-001), idempotency_keys (APID-006),
-- processed_stripe_events (webhook idempotency), and jobs (AD-010 background queue).

CREATE TABLE subscriptions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id         uuid NOT NULL,
    plan_type               text NOT NULL, -- 'trial' | 'monthly' | 'yearly'
    status                  text NOT NULL, -- 'active' | 'grace_period' | 'blocked'
    started_at              timestamptz NOT NULL,
    trial_ends_at           timestamptz,
    grace_period_ends_at    timestamptz,
    CONSTRAINT fk_subscriptions_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT uq_subscriptions_organisation UNIQUE (organisation_id),
    CONSTRAINT ck_subscriptions_plan_type CHECK (plan_type IN ('trial', 'monthly', 'yearly')),
    CONSTRAINT ck_subscriptions_status CHECK (status IN ('active', 'grace_period', 'blocked'))
);

CREATE TABLE seat_batches (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id         uuid NOT NULL,
    seat_count              integer NOT NULL,
    plan_type_at_purchase   text NOT NULL,
    purchased_at            timestamptz NOT NULL DEFAULT now(),
    renews_at               timestamptz,
    amount_charged          numeric(10, 2) NOT NULL,
    CONSTRAINT fk_seat_batches_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisations (id) ON DELETE RESTRICT,
    CONSTRAINT ck_seat_batches_seat_count_positive CHECK (seat_count > 0),
    CONSTRAINT ck_seat_batches_plan_type CHECK (plan_type_at_purchase IN ('trial', 'monthly', 'yearly')),
    CONSTRAINT ck_seat_batches_amount_non_negative CHECK (amount_charged >= 0)
);
COMMENT ON TABLE seat_batches IS 'PD-028: seat_count is set once at insert and never updated downward. Total org seats = SUM(seat_count).';

CREATE TABLE payments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id uuid NOT NULL,
    seat_batch_id   uuid NOT NULL,
    amount          numeric(10, 2) NOT NULL,
    plan_type       text NOT NULL,
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
COMMENT ON TABLE payments IS 'Slice 1 interpretation (documented in requirements-change-log.md): a row is written only once a charge outcome is known and reconciled via webhook — a rejected/never-confirmed card entry never reaches this table (seat_batch_id NOT NULL makes a seatless "failed" row structurally awkward; failed attempts are logged, not persisted here, per NFR-REL-003s all-or-nothing framing). No schema change was made to accommodate this — it is a usage interpretation, not a redesign.';

-- Implementation-level tables (not part of the approved product schema; same
-- precedent as Slice 0's `sessions` table).

CREATE TABLE login_attempts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text NOT NULL,
    attempted_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE login_attempts IS 'NFR-SEC-001: records failed login attempts only. Window/threshold implemented in lib/bruteForce.ts (5 attempts / 15 minutes — 15-minute window is an implementation default; NFR-SEC-001 only specifies "a short window").';
CREATE INDEX idx_login_attempts_email_time ON login_attempts (email, attempted_at);

CREATE TABLE idempotency_keys (
    organisation_id uuid NOT NULL,
    endpoint        text NOT NULL,
    idempotency_key text NOT NULL,
    response_status integer NOT NULL,
    response_body   jsonb NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (organisation_id, endpoint, idempotency_key)
);
COMMENT ON TABLE idempotency_keys IS 'APID-006: replays the original response for a repeated Idempotency-Key on the same endpoint/organisation, instead of re-executing the action.';

CREATE TABLE processed_stripe_events (
    event_id    text PRIMARY KEY,
    processed_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE processed_stripe_events IS 'Webhook idempotency: a Stripe event ID is recorded before side effects run, so a redelivered event is a no-op.';

CREATE TABLE jobs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type        text NOT NULL,
    payload     jsonb NOT NULL,
    status      text NOT NULL DEFAULT 'pending', -- 'pending' | 'done' | 'failed'
    attempts    integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    run_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE jobs IS 'AD-010: database-backed simple job queue. Slice 1 uses it only for email sends (signup/payment confirmation).';
CREATE INDEX idx_jobs_status_run_at ON jobs (status, run_at);
