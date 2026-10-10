# Deployment

**Status:** Deployed to Render + Neon (public staging/beta). $0 hosting budget, no custom domain yet.

## Deployment gate

The normal path from requirements to a live deployment is defined once in
`docs/technical/engineering-framework.md` ("Engineering workflow", framework 1.1; CLAUDE.md rule 20).
The part that leads into deployment:

```
... → Implementation + Developer Tests → specialist reviews (database-architect / backend-reviewer /
frontend-reviewer incl. design conformance; reviewer if cross-cutting) → QA agent → Security agent
→ Definition of Done → Commit/Push → Human Acceptance → DevOps agent (after authorization)
→ Deployment → Production Smoke Verification → Monitoring
```

- **`design` agent** (`.claude/agents/design.md`) — when an approved design exists for the screen — produces an implementation handoff beforehand. Conformance with the approved design is verified by the **`frontend-reviewer`** before commit (`MATCH` / `MINOR` / `MATERIAL` / `PRODUCT CONFLICT`); it is not a separate gate.
- **Specialist reviewers** (`database-architect`, `backend-reviewer`, `frontend-reviewer`, and the general `reviewer` for cross-cutting concerns) independently review before commit; HIGH findings block, MEDIUM must be resolved or explicitly excepted by the human (see "Review standards").
- **Unit tests** run and are reported as part of the implementation itself (CLAUDE.md rule 19).
- **`qa` agent** (`.claude/agents/qa.md`) independently verifies the change — API/UI tests, regression coverage, critical-journey checks — ending in `QA STATUS: PASS | FAIL`.
- **`security` agent** (`.claude/agents/security.md`) reviews the change for security issues before anything is deployed, ending in `SECURITY STATUS: PASS | PASS WITH WARNINGS | FAIL`.
- **Human acceptance** — the user gives final sign-off before deployment proceeds.
- **`devops` agent** (`.claude/agents/devops.md`) only then handles readiness checks, build, migration, deploy, health checks, and smoke tests — see its own test-failure approval gate for what happens if something fails at that stage.

If Design, QA, or Security reports a failure, the agent explains exactly what failed, the deployment risk, and its recommendation — then explicitly asks the user whether to proceed anyway. No agent silently overrides a reported failure or resolves a design/requirement conflict unilaterally; the user is always the final decision-maker.

## Topology

- **Frontend** (`frontend/`) and **backend** (`backend/`) deploy as two separate Render web services, each built from the npm-workspace monorepo (`render.yaml`).
- **Database**: Neon PostgreSQL (external to Render — `DATABASE_URL` is a plain env var, not a Render-managed database).
- No custom domain: both services get Render's default `*.onrender.com` URL.

## Repo layout: the app lives in `testflow-ai/`, not the repo root

The GitHub repository's actual root contains only an unrelated stray `package.json` (no `workspaces` field) — the real application (`backend/`, `frontend/`, `e2e/`, and the npm workspace root `package.json`) lives one level down, in `testflow-ai/`. Render clones the repo root by default, so without pointing each service at the right subdirectory, `npm install --workspaces` runs against the stray root `package.json` and fails with `npm error No workspaces found!` — this happened on a real deploy attempt and is why both services in `render.yaml` set:

```yaml
rootDir: testflow-ai
```

`rootDir` makes Render treat that subdirectory as the service's working directory for `buildCommand`/`startCommand` (and scopes which file changes trigger a rebuild). Verified locally by reproducing the exact failure from the true repo root (`npm error No workspaces found!`, byte-for-byte matching Render's reported error) and confirming success from `testflow-ai/`.

## Why two separate origins matters

Because the frontend and backend have no shared custom domain, they are two different origins in production. The frontend calls the backend via cross-origin `fetch(..., { credentials: 'include' })` (`frontend/src/lib/apiClient.ts`), which requires the session cookie to be `SameSite=None; Secure` in production (`backend/src/lib/cookies.ts`) — `SameSite=Lax` is not sent on cross-site fetch/XHR requests by any modern browser and would silently break login. This is already handled (`sameSite: isProduction ? 'none' : 'lax'`), but it's the reason this project can't just use the same cookie config in dev and prod.

## First-deploy chicken-and-egg step

Neither service's real URL exists until it has deployed once, but each needs the other's URL:

1. Deploy both services once with `CORS_ORIGIN` / `NEXT_PUBLIC_API_BASE_URL` left as placeholders (or the Render-provided defaults).
2. Once both have real `*.onrender.com` URLs, set the backend's `CORS_ORIGIN` to the frontend's URL and the frontend's `NEXT_PUBLIC_API_BASE_URL` to the backend's URL.
3. Redeploy both — `NEXT_PUBLIC_*` values are baked in at **build** time, so the frontend must rebuild (not just restart) after this change.
4. Register `https://<backend-url>/v1/webhooks/payments` as the webhook URL in the Paystack dashboard.

## Migrations

Render's **free tier does not support `preDeployCommand`** (it's a paid-tier-only feature — deploying with one configured fails with "pre-deploy command is not supported for free tier services"). Since this project stays on Render Free, `render.yaml`'s backend service instead chains the migration into `startCommand`:

```
startCommand: npm run migrate --workspace backend && npm run start --workspace backend
```

This runs on **every boot** — every deploy, and every cold start after the free tier's idle-sleep — not just once per deploy. That's safe and intentional: the migration runner (`backend/src/db/migrate.ts`) tracks applied migrations in a `schema_migrations` table, so re-running it is a no-op once a migration has already been applied. The migration system itself is unchanged — this is purely a difference in *when* the same idempotent runner is invoked.

**Failure safety:** `migrate.ts` exits non-zero on failure (its `catch` block calls `process.exit(1)`), which short-circuits the `&&` — `npm run start` never runs, so the backend cannot come up against an unmigrated or partially-migrated database. Render observes the overall process exiting non-zero and marks the boot as failed rather than routing traffic to it. Verified directly: pointing `DATABASE_URL` at an unreachable database and running the exact chained command confirms `start` is never invoked and the process exits 1.

## devDependencies must install despite NODE_ENV=production

Both services set `NODE_ENV=production` as a runtime env var, but that same variable is visible to `npm install` during the build — and npm skips `devDependencies` when `NODE_ENV=production` unless told otherwise. That broke a real deploy: the backend build failed with dozens of `Cannot find name 'process'/'console'` TypeScript errors (missing `@types/node`, `@types/express`, `@types/pg`, `@types/bcryptjs`), and the frontend build failed with `Module not found: Can't resolve '@/components/...'` (missing `typescript`, needed for Next.js to resolve the `@/*` path alias from `tsconfig.json`).

Fix: both `render.yaml` build commands now run `npm install` with `NPM_CONFIG_PRODUCTION=false` prefixed, e.g.:

```
NPM_CONFIG_PRODUCTION=false npm install --workspaces --include-workspace-root && npm run build --workspace backend
```

This only overrides `npm install`'s dependency selection — `NODE_ENV=production` still applies at runtime for both Express and Next.js. Verified locally by reproducing both exact failures with `NODE_ENV=production npm install` (devDependencies missing, both builds fail identically to Render's logs), then confirming both builds succeed with `NPM_CONFIG_PRODUCTION=false` added.

## Environment variables

See `render.yaml` for the full list per service. Values marked `sync: false` must be set manually in the Render dashboard (Neon connection string, Paystack/Resend keys, and the cross-referenced URLs from step 2 above) — never committed.

## Safety

- `E2E_FAKE_PAYMENTS` / `NEXT_PUBLIC_E2E_FAKE_PAYMENTS` are pinned to `false` in `render.yaml` and are also independently double-gated in code (`backend/src/app.ts` only mounts the test-support router when `env.e2eFakePayments && !isProduction` — `NODE_ENV=production` alone is enough to block it even if the flag were ever mistakenly set true).
- `backend/.env.example` / `frontend/.env.example` document every variable's purpose without real values.

## Staging release checklist (manual deploy; Auto-Deploy is Off for both services)

Render auto-deploy is disabled (`autoDeployTrigger = off`, verified with the Render CLI on 2026-10-09), so merging to `main`
does not deploy. A deployment is a separate, explicitly approved action. Last deployed commit: `95da669` (staging, 2026-10-09;
previous `453f3ca`, kept as the rollback target). Deploy with `render deploys create <service-id> --commit <sha> --wait` (backend first).

**Before** (no step changes anything):
1. Confirm the commit to deploy is on `main` and its GitHub Actions run is green; note the commit SHA.
2. Read-only environment check in the Render dashboard (names only; never paste values): backend `NODE_ENV=production`,
   `DATABASE_URL`, `CORS_ORIGIN` (= the frontend URL), `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`,
   `E2E_FAKE_PAYMENTS=false`, `SWAGGER_UI_ENABLED` unset or false; frontend `NEXT_PUBLIC_API_BASE_URL` (= the backend URL),
   `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_E2E_FAKE_PAYMENTS=false`. `NEXT_PUBLIC_*` values are baked in at build time.
3. Migrations: the backend applies pending migrations itself when it starts (`npm run migrate` precedes `npm run start`), so a backend
   deploy that carries a new migration changes the database as soon as that backend boots; the frontend deploy never touches the database.
   Before triggering the backend deploy, run `git diff <live-sha>..<release-sha> -- testflow-ai/backend/migrations` (path is relative to the
   repository root, which contains `testflow-ai/`). If it is empty (true for `453f3ca`..`95da669`), no schema change will happen: after the
   deploy the backend log shows `[migrate] up to date` and no `applied ...` line. If it is not empty, stop and get approval first, and take a
   Neon snapshot/branch **before** the backend deploy is triggered; migrations are forward-only, so rolling the code back does not undo them.
4. Rollback target: note the live deploy ids/commits (`render deploys list <service-id>`); the previous live commit is the rollback.

**Deploy** (manual, with approval): backend first, wait for `/health`; then frontend (it must rebuild). Do not change variables during
the deploy.

**After** (smoke): backend `GET /health` -> `{"status":"ok"}`; frontend `/login` and `/signup` return 200; sign in as a test
organisation; **Projects:** create a project (name only, then with a description), see it in the list with its code, search by
name and by project code, status tabs/counts, QA-configuration filter, pagination (Next/Previous, rows per page), empty state in a
fresh organisation, and 404 (not 403) when opening another organisation's project URL. No console errors; no E2E fake-payment path
reachable (`POST /v1/test-support/simulate-payment` returns 404, not 401).

**Rollback:** in the Render dashboard redeploy the previous live commit for each service (frontend and backend independently), or
revert the merge commit on `main` via a new PR and deploy that. Migrations are forward-only: schema changes are not rolled back by
a code rollback (this release adds none). Verify `/health` and the smoke steps again afterwards.

## Paystack webhook: reconciliation (operators)

The backend logs one structured line per webhook delivery (`render logs --resources <backend-service-id> --start <time> -o text --confirm`, filter the output for `webhook_`). Never log bodies, signatures or e-mail addresses (and the handler does not).
| Log message | Meaning | Action |
|---|---|---|
| `webhook_processed` (`reference`, `organisationId`, `planType`, `seatCount`, `amountCents`) | Payment, seat batch and subscription committed | Match the `reference` to the Paystack dashboard transaction |
| `webhook_duplicate` (`reference`) | Redelivery of an already recorded event | None |
| `webhook_unattributable` (`reference`, `reason`: `missing_reference`, `invalid_metadata`, `unknown_organisation`) | A signed `charge.success` TestFlow cannot attribute (for example a charge made outside TestFlow); acknowledged, never retried | If it should have been a TestFlow payment, check the transaction's metadata and the organisation, then reconcile by hand |
| `webhook_ignored` (`event`) | Event type TestFlow does not handle | None |
| `payment_failed` | `charge.failed` seen; nothing is written by design | None |
| `webhook_email_failed` | Payment recorded, confirmation e-mail failed (best effort) | None for billing |
| `webhook_processing_failed` (HTTP 500) | Genuine failure, nothing committed, Paystack retries | Investigate if it repeats |
| `webhook_signature_invalid` | Bad signature (400) | Check `PAYSTACK_SECRET_KEY` matches the Paystack account if genuine events are rejected |
Render's retained backend logs went back about four days when last checked (2026-10-10); retention is not guaranteed, so a Paystack dashboard comparison is the long-term reconciliation. A "verify transaction" API call is not implemented (optional).

