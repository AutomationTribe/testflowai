# TestFlow AI

An AI-assisted test management platform.

**Status:** Slice 1 — Account Access & Subscription implemented, on top of the Slice 0
Walking Skeleton. Sign-up, login, brute-force protection, the mandatory subscription
gate (Trial/Monthly/Yearly, Paystack-backed), and their approved screens now work
end-to-end. No further business modules (QA Setup, Requirements, Test Cases, AI
generation, etc.) exist yet. See [TASKS.md](TASKS.md) and
`docs/product/requirements-change-log.md` for what's approved and what's still pending.

See [CLAUDE.md](CLAUDE.md) for the rules governing how this project is developed.

## Documentation

- [docs/product/](docs/product/) — product vision, requirements, and traceability
- [docs/technical/](docs/technical/) — architecture, database, security, API documentation
- [docs/design/](docs/design/) — design system, user flows, wireframes, components

## Stack (per `docs/technical/architecture-decisions.md`)

- **Backend:** Node.js + TypeScript, Express, plain `pg` (no ORM decided yet) — modular monolith (AD-001, AD-002).
- **Frontend:** React + Next.js (AD-003).
- **Database:** PostgreSQL (AD-005).
- **Auth:** Internally built, session-cookie based (AD-006) — not a third-party auth platform.
- **Payments:** Paystack (AD-028, Slice 1; supersedes Stripe/AD-027 — Stripe does not support payouts to Nigeria-based merchants) — transaction initialize + webhook confirmation. TestFlow never stores raw card data (NFR-SEC-012).

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for a local PostgreSQL instance) — or any PostgreSQL 16 instance you already have running
- A free [Paystack](https://dashboard.paystack.com/#/signup) account in **test mode** (only needed to exercise Monthly/Yearly checkout — Trial activation needs no Paystack credentials at all)

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with user/password/database all `testflow`.

### 2. Install dependencies

From the repository root (`testflow-ai/`):

```bash
npm install
```

This installs both `backend` and `frontend` via npm workspaces.

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

The defaults already match the `docker compose` setup above and use safe placeholder
Paystack keys — enough to sign up, log in, and start a Trial. To exercise Monthly/Yearly
checkout, replace the Paystack values with real **test-mode** credentials:

- `backend/.env`: `PAYSTACK_SECRET_KEY` from https://dashboard.paystack.com/#/settings/developer
- `frontend/.env.local`: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` from the same Paystack account

### 4. Run database migrations

```bash
npm run migrate
```

### 5. Start the backend

```bash
npm run dev:backend
```

The API is now running at `http://localhost:4000`. Verify with:

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

### 5b. (Optional, for real Monthly/Yearly payment testing) Receive Paystack webhooks

Paystack delivers webhooks to a URL configured in the dashboard, not via a local CLI
tunnel command — expose your local backend with a tunnel (e.g.
[ngrok](https://ngrok.com/)) and set `https://<your-tunnel>/v1/webhooks/payments` as the
webhook URL under https://dashboard.paystack.com/#/settings/developer.

Without this, Trial still works fully; Monthly/Yearly checkout will initialize a Paystack
transaction and let you pay with one of the [test cards Paystack
publishes](https://paystack.com/docs/payments/test-payments/) for test-mode transactions,
but the subscription won't actually activate until the webhook is delivered.

### 6. Start the frontend

In a second terminal:

```bash
npm run dev:frontend
```

The web app is now running at `http://localhost:3000`.

### 7. Try it

Open `http://localhost:3000/signup`, create an account (Name, Email, Password, Role,
Organisation Name), and you'll land on the Choose your TestFlow plan screen. Choose
**Start Free Trial** for the fastest path to the app (no Paystack needed), or Monthly/Yearly
to exercise the full Paystack checkout (needs step 3/5b's real test-mode credentials).
After activation, "Continue to QA Setup" takes you to `/app` — the Slice 1 boundary
placeholder (QA Setup itself is a later slice).

Visiting `/app` directly while unsubscribed redirects to `/subscription-required`,
enforced independently by the backend (`GET /v1/workspace` returns `403
subscription_required`) — not just the frontend route.

### Running tests

```bash
npm test
```

Backend tests apply migrations against the same local PostgreSQL instance (`DATABASE_URL`)
and truncate tables between tests — point `DATABASE_URL` at a disposable database if you
don't want test data mixed with your manual-testing data. Paystack itself is mocked in
backend tests (`tests/paystackMock.ts`) — no real Paystack test-mode credentials are
required to run the automated suite.

### End-to-end tests (Playwright)

```bash
npm run test:e2e
```

This exercises the critical Account & Subscription journeys (`e2e/tests/`) through a real
browser against real backend/frontend servers — no manual smoke testing required. It is
fully self-contained:

- Runs on dedicated ports (backend `4100`, frontend `3100`) and a dedicated database
  (`testflow_e2e`, created and migrated fresh by `e2e/prepare-db.js` before every run) —
  it never touches your normal dev servers, ports, or database.
- Uses **no real Paystack account or payment credentials**. `E2E_FAKE_PAYMENTS=true`
  (backend) / `NEXT_PUBLIC_E2E_FAKE_PAYMENTS=true` (frontend) swap the real Paystack call
  for a deterministic in-process fake (`backend/src/modules/testSupport`,
  `frontend/src/components/FakeCheckoutForm.tsx`) that runs the exact same domain
  reconciliation code a real Paystack webhook would trigger — only the transport differs.
  This path is compiled into the app but only ever activated by those two explicit,
  non-production env flags; the real Paystack integration (`CheckoutForm.tsx`,
  `lib/paystack.ts`) is what a real deployment always uses.
- First run only: `npx --prefix e2e playwright install --with-deps chromium` to download
  the browser binary.

First-time setup:

```bash
npx --prefix e2e playwright install --with-deps chromium
npm run test:e2e
```

Playwright starts and stops the backend/frontend servers itself for this run — you don't
need `dev:backend`/`dev:frontend` running first (though it's harmless if they are, since
different ports are used).

### Typecheck & lint

```bash
npm run typecheck
npm run lint
```

## CI

`.github/workflows/ci.yml` runs three jobs on every push/PR to `main`: `backend`
(typecheck, lint, migrate, unit/integration tests), `frontend` (typecheck, lint, unit
tests), and `e2e` (the full Playwright suite against a dedicated Postgres service
container, uploading the HTML report as a build artifact on failure).
