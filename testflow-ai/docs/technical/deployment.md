# Deployment

**Status:** Staging/beta target defined (Render + Neon), not yet deployed. $0 hosting budget, no custom domain yet.

## Topology

- **Frontend** (`frontend/`) and **backend** (`backend/`) deploy as two separate Render web services, each built from the monorepo root (`render.yaml`).
- **Database**: Neon PostgreSQL (external to Render — `DATABASE_URL` is a plain env var, not a Render-managed database).
- No custom domain: both services get Render's default `*.onrender.com` URL.

## Why two separate origins matters

Because the frontend and backend have no shared custom domain, they are two different origins in production. The frontend calls the backend via cross-origin `fetch(..., { credentials: 'include' })` (`frontend/src/lib/apiClient.ts`), which requires the session cookie to be `SameSite=None; Secure` in production (`backend/src/lib/cookies.ts`) — `SameSite=Lax` is not sent on cross-site fetch/XHR requests by any modern browser and would silently break login. This is already handled (`sameSite: isProduction ? 'none' : 'lax'`), but it's the reason this project can't just use the same cookie config in dev and prod.

## First-deploy chicken-and-egg step

Neither service's real URL exists until it has deployed once, but each needs the other's URL:

1. Deploy both services once with `CORS_ORIGIN` / `NEXT_PUBLIC_API_BASE_URL` left as placeholders (or the Render-provided defaults).
2. Once both have real `*.onrender.com` URLs, set the backend's `CORS_ORIGIN` to the frontend's URL and the frontend's `NEXT_PUBLIC_API_BASE_URL` to the backend's URL.
3. Redeploy both — `NEXT_PUBLIC_*` values are baked in at **build** time, so the frontend must rebuild (not just restart) after this change.
4. Register `https://<backend-url>/v1/webhooks/payments` as the webhook URL in the Paystack dashboard.

## Migrations

`render.yaml`'s backend service runs `npm run migrate --workspace backend` as its `preDeployCommand` — this runs before each new instance takes traffic. The migration runner (`backend/src/db/migrate.ts`) tracks applied migrations in a `schema_migrations` table, so re-running it on every deploy is a safe no-op once a migration has already been applied.

## Environment variables

See `render.yaml` for the full list per service. Values marked `sync: false` must be set manually in the Render dashboard (Neon connection string, Paystack/Resend keys, and the cross-referenced URLs from step 2 above) — never committed.

## Safety

- `E2E_FAKE_PAYMENTS` / `NEXT_PUBLIC_E2E_FAKE_PAYMENTS` are pinned to `false` in `render.yaml` and are also independently double-gated in code (`backend/src/app.ts` only mounts the test-support router when `env.e2eFakePayments && !isProduction` — `NODE_ENV=production` alone is enough to block it even if the flag were ever mistakenly set true).
- `backend/.env.example` / `frontend/.env.example` document every variable's purpose without real values.
