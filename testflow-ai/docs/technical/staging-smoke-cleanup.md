# Staging smoke-test data cleanup — PROPOSAL (not executed)

**Status:** PROPOSED 2026-10-09. Nothing below has been run. It deletes data in the **staging** database (Neon), so it needs the Product
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
and `login_attempts` (by e-mail). `payments` and `seat_batches` should be empty (trial only; no payment was exercised). Dry-run counts below confirm this.

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
       (SELECT count(*) FROM seat_batches WHERE organisation_id IN (SELECT id FROM o))     AS seat_batches;         -- 0
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
     OR EXISTS (SELECT 1 FROM seat_batches WHERE organisation_id IN (SELECT id FROM smoke_orgs))
     THEN RAISE EXCEPTION 'unexpected payment rows'; END IF;
END $$;

DELETE FROM project_memberships WHERE project_id IN (SELECT id FROM projects WHERE organisation_id IN (SELECT id FROM smoke_orgs));
DELETE FROM projects                  WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM workflow_definitions      WHERE qa_configuration_version_id IN (SELECT id FROM qa_configuration_versions WHERE organisation_id IN (SELECT id FROM smoke_orgs));
DELETE FROM qa_artifact_policies      WHERE qa_configuration_version_id IN (SELECT id FROM qa_configuration_versions WHERE organisation_id IN (SELECT id FROM smoke_orgs));
DELETE FROM quality_gate_definitions  WHERE qa_configuration_version_id IN (SELECT id FROM qa_configuration_versions WHERE organisation_id IN (SELECT id FROM smoke_orgs));
DELETE FROM qa_configuration_versions WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM subscriptions             WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM idempotency_keys          WHERE organisation_id IN (SELECT id FROM smoke_orgs);
DELETE FROM sessions                  WHERE user_id IN (SELECT id FROM smoke_users);
DELETE FROM jobs                      WHERE payload::text LIKE ANY (SELECT '%' || email || '%' FROM smoke_emails);
DELETE FROM login_attempts            WHERE email IN (SELECT email FROM smoke_emails);
DELETE FROM users                     WHERE id IN (SELECT id FROM smoke_users);
DELETE FROM organisations             WHERE id IN (SELECT id FROM smoke_orgs);

-- verify before committing: all four must be 0
SELECT (SELECT count(*) FROM organisations WHERE name IN ('SMOKE TEST A 1791563212','SMOKE TEST B 1791563212','UI SMOKE A 1791564118292','UI SMOKE B 1791564118292')) AS orgs_left,
       (SELECT count(*) FROM users WHERE email IN (SELECT email FROM smoke_emails)) AS users_left,
       (SELECT count(*) FROM projects WHERE organisation_id IN (SELECT id FROM smoke_orgs)) AS projects_left,
       (SELECT count(*) FROM jobs WHERE payload::text LIKE ANY (SELECT '%' || email || '%' FROM smoke_emails)) AS jobs_left;
COMMIT;   -- or ROLLBACK; if anything above is not as expected
```
If a table name or column differs from the migrations (this was written from `backend/migrations/0001`-`0005`), the transaction fails and rolls back
without deleting anything. After the run, re-check `/health`, the live smoke tests' empty state and that other organisations still list their projects.

## Not affected
All other organisations, users and projects; the schema; `schema_migrations`; Render services and environment variables.
