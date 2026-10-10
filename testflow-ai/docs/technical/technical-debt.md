# Technical Debt Register

A lightweight record of known, meaningful gaps in the current implementation — introduced as
part of the 2026-10-07 engineering-framework adoption (`docs/technical/engineering-framework.md`).
This is **not** a todo list to action immediately, and not a place for cosmetic nitpicks. Each
entry is only addressed when: it's touched by new work, it causes a real defect, it's a security
issue, it's a material architecture problem, or the user explicitly asks for it.

Entries recorded from a lightweight review of the existing repository at adoption time (no code
was changed to produce this list).

---

## TD-001 — `pool.ts` has no connection timeout configured

**Issue:** `backend/src/db/pool.ts` constructs `new Pool({ connectionString: env.databaseUrl })`
with no `connectionTimeoutMillis`. A `pg` `Pool` with no timeout will wait indefinitely for a
connection if the database is unreachable or slow to accept connections.

**Impact:** Low under normal operation (Neon/local Postgres are both reliably reachable). Directly
observed during this session, though: under severe local machine memory pressure, a locally-run
backend process hung indefinitely attempting to connect, with no timeout or error surfaced,
making the real cause (system resource exhaustion, not a code defect) much harder to diagnose
than it should have been.

**Priority/risk:** Low-medium. Not a correctness bug, but a diagnosability gap — a hung
connection attempt currently looks identical to a hung anything-else.

**Resolution (2026-10-09):** the intermittent backend failures seen during release-readiness (a signup answering an
empty-body `404`, a missing cookie `TypeError`, and unrelated assertions failing once each — roughly 5 of 28 full runs)
matched this signature. Every suite now shares one long-lived server per file through `startTestServer()` in
`tests/testUtils.ts`. Reliability evidence is recorded in `docs/PROJECT_STATUS.md`; the mechanism is still the most
likely explanation, not a proven one, so the assertion helpers report status and body on failure.

**When to address:** Next time `pool.ts` is touched for another reason, or if this becomes a
recurring diagnostic problem; add a `connectionTimeoutMillis` (e.g. 5–10s) so a real outage fails
fast with a clear error instead of hanging silently.

---

## TD-002 — Visual regression suite is local-only, not wired into CI

**Issue:** `e2e/playwright.visual.config.ts` is deliberately excluded from CI (documented in its
own comments and in `.claude/agents/design.md`) because baselines are machine/OS-sensitive (font
rendering differs across platforms).

**Impact:** Visual regressions are only caught when someone locally runs `npm run test:visual`;
they are not caught automatically on every PR/push.

**Priority/risk:** Low — this was a deliberate, documented decision, not an oversight, and the
functional E2E suite still gates deployment.

**When to address:** If/when the project invests in a consistent CI rendering environment
(already listed as a candidate "next task" in `docs/PROJECT_STATUS.md`); not before, and not
automatically as part of this framework adoption.

---

## TD-003 — QA Operating Model "Custom Setup" has no full per-setting configuration screen

**Issue:** The QA Setup screen's "Custom Setup" preset exists and is selectable, but the detailed
screen for configuring individual templates/workflows/policies/gates under Custom Setup has not
been built — this was explicitly deferred during the original QA Setup implementation.

**Impact:** Users can select "Custom Setup" but cannot yet actually customize anything through
the UI; the backend configuration model supports it, the frontend screen for it does not exist.

**Priority/risk:** Medium — this is a known, scoped gap in a shipped feature, not a hidden one.

**When to address:** Already tracked as a "next task" in `docs/PROJECT_STATUS.md`; build it as its
own vertical slice through the updated workflow in `docs/technical/engineering-framework.md`
when prioritized — not as part of this framework-adoption task.

---

## TD-004 — No application-level rate limiting beyond login brute-force lockout

**Issue:** `backend/src/lib/bruteForce.ts` protects login specifically (5 failed attempts / 15
minutes, NFR-SEC-001). There is no general-purpose rate limiting middleware across other
endpoints (e.g. signup, password-adjacent flows, AI-generation endpoints).

**Impact:** Low at current scale/traffic; a real exposure if the product grows public-facing
surface area that's cheap to abuse (e.g. repeated signups, repeated AI-generation calls).

**Priority/risk:** Low now; re-assess once the Project Criticality profile is selected — this is
exactly the kind of control that should scale up from PROTOTYPE/MVP to PRODUCTION/HIGH-CRITICALITY.

**When to address:** When a specific endpoint shows real abuse risk, or when the criticality
profile selection calls for broader rate limiting as part of its security expectations.

---

## TD-005 — Swagger UI defaults on outside production with no additional access control

**Issue:** Per CLAUDE.md rule 21, Swagger UI is served at `/docs` by default outside production
(`SWAGGER_UI_ENABLED` defaults `true` in non-production, `false` in production) — this is an
intentional, documented decision, not an oversight. It has no additional access control
(e.g. auth) in non-production environments.

**Impact:** None in production (correctly disabled by default). In a shared non-production
environment (e.g. a staging deploy accessible beyond the dev team), the API surface and schema
would be visible to anyone with the URL.

**Priority/risk:** Low today (no shared staging environment currently deployed beyond the
developer's own Render free-tier services, which are not treated as sensitive).

**When to address:** If a shared, more sensitive non-production environment is ever stood up;
not before.

---

## TD-006 — Project creation is logged, not written to an Audit Log Entry

**Where:** `backend/src/modules/projects/projects.service.ts` (`createProject`).

**What:** `docs/technical/api/projects.md` marks Create Project as audited, but the audit module
(`audit_log_entries`, FR-AUD-001/004, which also depends on `access_links`) has not been built
and is not migrated. Project creation is therefore recorded as a structured `project_created`
log line only. It is not on FR-AUD-001's minimum "key actions" list.

**Impact:** No queryable, immutable audit trail of who created which project.

**When to address:** When the audit module is implemented (it must then also back-fill or
accept that earlier creations are only in logs), or earlier if audit of project creation is
made a hard requirement.

---

## TD-007 — Existing backend suites use `request(app)`, which can flake under many requests — RESOLVED 2026-10-09 (pending Product Owner acceptance)

**Where:** `backend/tests/*.test.ts` other than `projects.test.ts`.

**What:** `supertest`'s `request(app)` starts and closes a server on a random port for every call.
With Node's keep-alive connection reuse, a file that makes hundreds of calls occasionally gets an
empty-body `404`, a missing cookie, or `socket hang up`. `projects.test.ts` showed this at roughly
1 run in 4 until it was switched to one long-lived server (0 failures in 12 runs afterwards). The
older suites make far fewer calls per file and have not been seen to flake, but share the pattern.
The mechanism is the most likely explanation, not a proven one.

**When to address:** if any other suite starts flaking, or when next touching those files — share
a small `startTestServer()` helper in `tests/testUtils.ts`.

---

## TD-008 — A malformed JSON request body returns 500 instead of a 4xx — RESOLVED 2026-10-08

**Where:** shared error handling (`backend/src/app.ts` / `middleware/errorHandler.ts`).

**What:** `POST` with a body like `{bad` returns `500 internal_error` on every JSON endpoint
(also `POST /v1/auth/login`), because the body-parser error is not mapped. Found during QA of the
Projects slice; pre-existing and not Projects-specific.

**Impact:** a client error is reported as a server error (noisy logs/alerts, wrong status).

**Resolved:** `middleware/errorHandler.ts` maps body-parser errors (bad JSON, body too large, unreadable
charset/encoding) to the approved "malformed/invalid request body" response — `422 validation_error` in the shared
envelope; regression tests in `tests/errorHandling.test.ts` (fail on the old code).

---

## TD-009 — No rate limiting or per-tenant quota on state-changing routes

**What:** There is no general-purpose rate limiter in the backend (only the login lockout), and no
cap on how many projects a tenant can create (any member of an active organisation, including a
QA Tester per PD-014, can create unlimited projects). Found in the Projects security review.

**Impact:** Storage growth and counter churn for one tenant; it does not starve other tenants (the
project-code counter locks only that organisation's row).

**When to address:** when a global rate limiter is introduced, add a per-user limit on
state-changing routes; a per-organisation project quota belongs with the plans/limits work.

---

## TD-010 — `requireAuth` / `requireActiveSubscription` are async with no error handling — RESOLVED 2026-10-08

**Where:** `backend/src/middleware/auth.ts`, `backend/src/middleware/subscriptionGate.ts`.

**What:** Express 4 does not catch a rejected promise from async middleware. A database error or a
pool timeout inside `resolveSession` / `resolveSubscriptionAccess` leaves the request without a
response and raises an unhandled rejection (which terminates the process on Node 15+; there is no
process-level handler). `connectionTimeoutMillis` (added in the Projects slice) makes a pool
timeout reachable as an error. Pre-existing; applies to every authenticated route.

**Impact:** a transient DB outage can crash the API or hang requests (availability).

**Resolved:** both middlewares now wrap their body in try/catch and call `next(error)`; regression tests in
`tests/asyncMiddlewareErrors.test.ts` (fail on the old code).

---

## TD-011 — No Origin check on state-changing requests (CSRF defence in depth) — RESOLVED 2026-10-09 (merged `9f7a910`; backend deployed to staging `dep-db4mnqrtqb8s7397hdp0`)

**What:** Production sessions use a `SameSite=None; Secure; HttpOnly` cookie (documented,
`docs/technical/security.md`) with no Origin/Referer allow-list or CSRF token. For the Projects
create route this is not exploitable in practice (JSON content type forces a CORS preflight that
fails for foreign origins; a form or `text/plain` post gives an empty body, which fails validation),
but any future state-changing endpoint that accepts an empty body would be forgeable.

**When to address:** add an Origin allow-list check on non-GET `/v1` routes before such an
endpoint exists.

**Update (2026-10-09, security agent plan, `docs/technical/security-remediation-plan.md`):** the text above understates the exposure. Routes
that accept an empty body already exist: `POST /v1/organisations/:orgId/subscription/trial` (verified on staging: succeeds with no body),
`POST /v1/auth/logout`, and (by code reading, not verified live) `POST .../qa-configuration/draft/publish`. A page on another site can
auto-submit a form or a `no-cors` request to them (no preflight) and the browser attaches the `SameSite=None` cookie, so the action runs
if the victim has an active session and the attacker knows the organisation id. Impact today is Low to Medium (trial activation, logout,
publishing an already-open draft); it grows with every new empty-body POST. Priority P0 in the plan.

---

## TD-012 — Known `npm audit` findings in runtime dependencies — PARTLY RESOLVED 2026-10-09

**What:** `npm audit --omit=dev` reports 6 findings (2 moderate, 2 high, 2 critical) in packages
this project already depended on: `next` (critical), `express`, `qs`, `proxy-addr` (critical,
transitive via express), and `postcss`/`source-map-js` (via next). The full audit reports 25
(5 moderate, 16 high, 4 critical); the other 19 are dev-only toolchain packages. None were
introduced by the Projects slice (no package.json change). Not mapped advisory-by-advisory to the
code paths in use.

**Update (2026-10-09):** `next` upgraded to 15.5.27 (AD-030), `proxy-addr` to 2.0.8, `source-map-js` to 1.2.2. No critical/high
finding is now on a production runtime path that is reachable (security agent: PASS WITH WARNINGS). Audit now: backend 2 critical /
10 high, frontend 2 critical / 13 high, e2e 0 — all dev/build tooling except a postcss 8.4.31 copy bundled in Next (build time,
first-party CSS). **Still open (need Product Owner approval):** vitest 5, `@typescript-eslint` 8, `eslint-config-next`, and
Next 16 for the bundled postcss.

**When to address:** a dedicated dependency-hygiene task: review each advisory against how the
package is used, upgrade `express`, `qs`, `proxy-addr` and `next`, re-run the full test suites.

---

## TD-013 — `project_memberships.user_id` is not constrained to the project's organisation

**What:** The foreign key is `user_id → users(id)` only. Today the sole writer is the creator
grant (same organisation by construction), so it is not exploitable. A future "add member" slice
(FR-PRJ-005/006) could grant a user from another organisation and expose their name through the
list's `members`.

**When to address:** in that slice — add a composite FK (project's organisation = user's
organisation) or enforce the check in the service, with a cross-tenant test.

---

## How to use this register

- Add a new entry when you knowingly accept debt to ship something (state the trade-off
  explicitly at the time, don't let it go unrecorded).
- Remove or mark resolved an entry once it's actually fixed — reference the commit/PR that
  resolved it.
- Do not add trivial cosmetic issues (naming nitpicks, minor formatting preferences) — this
  register is for things with a real, explainable impact and priority.

---

## TD-014 — Frontend CSP is report-only and allows `'unsafe-inline'`

**Where:** `frontend/security-headers.js` (AD-031).

**What:** The Content Security Policy is delivered as `Content-Security-Policy-Report-Only`, so it blocks nothing, and there is no report collector (new infrastructure
needs a decision), so violations are only seen in browser consoles and in the E2E sweep. Scripts and styles allow `'unsafe-inline'` because Next 15 emits inline hydration
scripts and the UI uses inline `style` props; a nonce-based policy needs middleware and dynamic rendering. The valid-card Paystack flow (test key), 3-D Secure and Apple/Google
Pay were not exercised against the policy.

**Also before enforcing (security review):** tighten the `*.paystack.*` wildcards to the exact observed hosts, decide `worker-src`/`child-src`, and add a build guard for
`NEXT_PUBLIC_API_BASE_URL` (see `frontend-security-headers.md`, exit criteria 3-4). The E2E CSP sweep runs on `next dev` only; a production-mode check is a possible CI addition.

**When to address:** after the headers are deployed to staging and the real Paystack test-key checkout and main journeys are exercised with zero violations: switch to the
enforcing header (one-line change, separate approved change). Nonces / removing `'unsafe-inline'` is a later, separately decided item.

