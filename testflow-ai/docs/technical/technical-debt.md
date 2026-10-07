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

## How to use this register

- Add a new entry when you knowingly accept debt to ship something (state the trade-off
  explicitly at the time, don't let it go unrecorded).
- Remove or mark resolved an entry once it's actually fixed — reference the commit/PR that
  resolved it.
- Do not add trivial cosmetic issues (naming nitpicks, minor formatting preferences) — this
  register is for things with a real, explainable impact and priority.
