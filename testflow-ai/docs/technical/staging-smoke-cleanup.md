# Staging smoke-test data cleanup — PROPOSAL (not executed)

**Status:** PROPOSED 2026-10-09; SQL VALIDATED 2026-10-09 against the real schema on a local throwaway database (never against staging). Nothing below has been run on staging.

**Validation result (local; no staging access, no credentials):** migrations 0001-0005 were applied to an empty local database, then six organisations were
created through the real app (the four below, a `CONTROL ORG`, and a near-miss decoy `SMOKE TEST A 1791563213`). The first draft of this script was
**wrong** and has been fixed: trial signups create one free trial `seat_batches` row each, which the draft both rejected in its guard and never deleted, so it
aborted on realistic data (safely, nothing changed). With the fix: the dry run returned 4/4/14/4/0/4; an extra, unexpected user in a smoke organisation made
the script abort with `unexpected users in the smoke organisations` and change nothing; the clean run deleted exactly the four organisations and their rows
(users, 14 projects, memberships, QA versions and children, trial subscriptions and seat batches, sessions, welcome-email jobs); the control organisation and
the decoy kept all their rows; re-running aborts with `expected 4 organisations`. `idempotency_keys` and `login_attempts` held no rows in the fixture, so those
two DELETEs were only checked for valid table and column names. Staging may differ (for example idempotency keys from QA publishes); the dry run and the
guards are there to reveal that.

**Original note:** nothing below has been run on staging. It deletes data in the **staging** database (Neon), so it needs the Product
Owner's explicit approval and a restore point first. The delete is limited to four throwaway organisations, selected by **exact name and exact
user e-mail**, never by pattern.

## Records created by the smoke tests (exactly)
| Run | Organisation name | User e-mail | Projects |
|---|---|---|---|
| API smoke (2026-10-09 16:26Z) | `SMOKE TEST A 1791563212` | `smoke-a-1791563212@example.com` | 2 (`Smoke Alpha` PRJ-001, `Smoke Beta` PRJ-002) |
| API smoke | `SMOKE TEST B 1791563212` | `smoke-b-1791563212@example.com` | 0 |
| Browser smoke (2026-10-09 16:41Z) | `UI SMOKE A 1791564118292` | `delivered+smoke-ui-a-1791564118292@resend.dev` | 12 (`Smoke Alpha`, `Smoke Beta`, `Smoke Filler 03`..`12`) |
| Browser smoke | `UI SMOKE B 1791564118292` | `delivered+smoke-ui-b-1791564118292@resend.dev` | 0 |

Dependent rows created by the app for those four organisations: 4 `users`, 4 `subscriptions` (trial), 4 auto-published `qa_configuration_versions`
(Standard QA v1) with their `workflow_definitions`, `qa_artifact_policies` and `quality_gate_definitions`, 14 `projects` with 14
`project_memberships` (creator grants), `sessions`, possibly `idempotency_keys`, `jobs` (welcome e-mail jobs whose payload contains the user e-mail)
and `login_attempts` (by e-mail). `payments` must be empty (trial only; no payment was exercised). Each trial signup also creates one trial `seat_batches` row (`plan_type_at_purchase = 'trial'`, `amount_charged = 0`): 4 expected, deleted by the script. The dry-run counts below confirm this.

## Safety preconditions
1. Product Owner approves the run, and who runs it (the connection string is a secret in Render; it must not be printed or committed).
2. Create a Neon restore point first (branch or snapshot of the staging database). Rollback = restore it.
3. Nothing else may be in these organisations: the guard block aborts (and the transaction rolls back) if any count differs.
4. Staging users are not using the app at that moment (smoke organisations only; no other organisation is touched either way).

## Step 1 — dry run (read-only; expected values in the comments)
```sql
WITH o AS (SELECT id FROM organisations WHERE name IN
  ('SMOKE TEST A 1791563212','SMOKE TEST B 1791563212','UI SMOKE A 1791564118292','UI SMOKE B 1791564118292'))
SELECT (SELECT count(*) FROM o)                                                            AS organisations,        -- 4
       (SELECT count(*) FROM users WHERE organisation_id IN (SELECT id FROM o))            AS users,                -- 4
       (SELECT count(*) FROM projects WHERE organisation_id IN (SELECT id FROM o))         AS projects,             -- 14
       (SELECT count(*) FROM subscriptions WHERE organisation_id IN (SELECT id FROM o))    AS subscriptions,        -- 4
       (SELECT count(*) FROM payments WHERE organisation_id IN (SELECT id FROM o))         AS payments,             -- 0
       (SELECT count(*) FROM seat_batches WHERE organisation_id IN (SELECT id FROM o))     AS seat_batches;         -- 4 (all trial, amount 0)
```

## Step 2 — delete, in one transaction, children before parents (all foreign keys are `ON DELETE RESTRICT` except `sessions`)
```sql
BEGIN;
CREATE TEMP TABLE smoke_orgs  ON COMMIT DROP AS SELECT id FROM organisations WHERE name IN
  ('SMOKE TEST A 1791563212','SMOKE TEST B 1791563212','UI SMOKE A 1791564118292','UI SMOKE B 1791564118292');
CREATE TEMP TABLE smoke_users ON COMMIT DROP AS SELECT id, email FROM users WHERE organisation_id IN (SELECT id FROM smoke_orgs);
CREATE TEMP TABLE smoke_emails (email text) ON COMMIT DROP;
INSERT INTO smoke_emails VALUES ('smoke-a-1791563212@example.com'),('smoke-b-1791563212@example.com'),
  ('delivered+smoke-ui-a-1791564118292@resend.dev'),('delivered+smoke-ui-b-1791564118292@resend.dev');

DO $$ BEGIN   -- abort (and roll back) unless exactly the expected records are selected
  IF (SELECT count(*) FROM smoke_orgs) <> 4 THEN RAISE EXCEPTION 'expected 4 organisations'; END IF;
  IF (SELECT count(*) FROM smoke_users) <> 4
     OR EXISTS (SELECT 1 FROM smoke_users WHERE email NOT IN (SELECT email FROM smoke_emails))
     THEN RAISE EXCEPTION 'unexpected users in the smoke organisations'; END IF;
  IF (SELECT count(*) FROM projects WHERE organisation_id IN (SELECT id FROM smoke_orgs)) <> 14
     THEN RAISE EXCEPTION 'expected 14 projects'; END IF;
  IF EXISTS (SELECT 1 FROM payments WHERE organisation_id IN (SELECT id FROM smoke_orgs))
     THEN RAISE EXCEPTION 'unexpected payment rows'; END IF;
  IF (SELECT count(*) FROM seat_batches WHERE organisation_id IN (SELECT id FROM smoke_orgs)) <> 4
     OR EXISTS (SELECT 1 FROM seat_batches WHERE organisation_id IN (SELECT id FROM smoke_orgs)
                AND (plan_type_at_purchase <> 'trial' OR amount_charged <> 0))
     THEN RAISE EXCEPTION 'expected exactly 4 free trial seat batches'; END IF;
END $$;

DELETE FROM project_memberships WHERE project_id IN (SELECT id FROM projects WHERE organisation_id IN (SELECT id FROM smoke_orgs));
DELETE FROM projects                  WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM workflow_definitions      WHERE qa_configuration_version_id IN (SELECT id FROM qa_configuration_versions WHERE organisation_id IN (SELECT id FROM smoke_orgs));
DELETE FROM qa_artifact_policies      WHERE qa_configuration_version_id IN (SELECT id FROM qa_configuration_versions WHERE organisation_id IN (SELECT id FROM smoke_orgs));
DELETE FROM quality_gate_definitions  WHERE qa_configuration_version_id IN (SELECT id FROM qa_configuration_versions WHERE organisation_id IN (SELECT id FROM smoke_orgs));
DELETE FROM qa_configuration_versions WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM seat_batches              WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM subscriptions             WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM idempotency_keys          WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM sessions                  WHERE user_id IN (SELECT id FROM smoke_users);
DELETE FROM jobs                      WHERE payload::text LIKE ANY (SELECT '%' || email || '%' FROM smoke_emails);
DELETE FROM login_attempts            WHERE email IN (SELECT email FROM smoke_emails);
DELETE FROM users                     WHERE id IN (SELECT id FROM smoke_users);
DELETE FROM organisations             WHERE id IN (SELECT id FROM smoke_orgs);

-- verify before committing: all five must be 0
SELECT (SELECT count(*) FROM organisations WHERE name IN ('SMOKE TEST A 1791563212','SMOKE TEST B 1791563212','UI SMOKE A 1791564118292','UI SMOKE B 1791564118292')) AS orgs_left,
       (SELECT count(*) FROM users WHERE email IN (SELECT email FROM smoke_emails)) AS users_left,
       (SELECT count(*) FROM projects WHERE organisation_id IN (SELECT id FROM smoke_orgs)) AS projects_left,
       (SELECT count(*) FROM seat_batches WHERE organisation_id IN (SELECT id FROM smoke_orgs)) AS seat_batches_left,
       (SELECT count(*) FROM jobs WHERE payload::text LIKE ANY (SELECT '%' || email || '%' FROM smoke_emails)) AS jobs_left;
COMMIT;   -- or ROLLBACK; if anything above is not as expected
```
If a table name or column differs from the migrations (this was written from `backend/migrations/0001`-`0005`), the transaction fails and rolls back
without deleting anything. After the run, re-check `/health`, the live smoke tests' empty state and that other organisations still list their projects.

## Not affected
All other organisations, users and projects; the schema; `schema_migrations`; Render services and environment variables.
