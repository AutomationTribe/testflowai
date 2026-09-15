# Deployment

**Status:** Staging/beta target defined (Render + Neon), not yet deployed. $0 hosting budget, no custom domain yet.

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

## Environment variables

See `render.yaml` for the full list per service. Values marked `sync: false` must be set manually in the Render dashboard (Neon connection string, Paystack/Resend keys, and the cross-referenced URLs from step 2 above) — never committed.

## Safety

- `E2E_FAKE_PAYMENTS` / `NEXT_PUBLIC_E2E_FAKE_PAYMENTS` are pinned to `false` in `render.yaml` and are also independently double-gated in code (`backend/src/app.ts` only mounts the test-support router when `env.e2eFakePayments && !isProduction` — `NODE_ENV=production` alone is enough to block it even if the flag were ever mistakenly set true).
- `backend/.env.example` / `frontend/.env.example` document every variable's purpose without real values.
