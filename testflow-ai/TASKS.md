# TASKS.md

This file represents approved work only, not unapproved ideas. See [CLAUDE.md](CLAUDE.md) for the rules governing this project.

## Phases

- [x] Product Definition
- [x] Requirements
- [x] Technical Design
- [x] UX and Design (user flows + design system; Stitch designs approved for the screens built so far; the QA Setup
      "Custom Setup" full configuration screen design is still pending — TD-003)
- [ ] Development — in progress, one vertical slice at a time (see below)
- [ ] Testing — ongoing per feature slice (developer tests, independent review, QA and E2E run for every slice; there
      is no separate end-of-project testing phase recorded)
- [ ] Deployment — staging/beta on Render + Neon exists (`docs/technical/deployment.md`). Verified 2026-10-08 from
      GitHub deployment records: the Projects slice is deployed to staging (first at `5e3f47a`); latest successful
      deployment `453f3ca`. The running build SHA itself is not independently confirmed. Render currently auto-deploys
      every push to `main`.

## Development Slices

Approved, completed:

- [x] **Slice 0 — Walking Skeleton.** End-to-end technical foundation only: backend/frontend
      bootstrap, PostgreSQL + migrations, internally-built session auth (AD-006), server-resolved
      organisation/tenant context, minimal login/authenticated-shell/landing UI, API client, error
      handling, structured logging, automated tests, CI. No business module (Requirements, Test
      Cases, AI, QA Operating Model, etc.) was implemented in this slice.

- [x] **Slice 1 — Account Access & Subscription.** Full approved sign-up (name/email/password/
      role/organisationName), login with brute-force protection (NFR-SEC-001), 30-minute
      sliding-session inactivity timeout (NFR-SEC-002), the server-side mandatory subscription
      gate (FR-SUB-002), Trial (FR-SUB-001), Monthly/Yearly subscription via Paystack (AD-028,
      supersedes Stripe/AD-027, FR-SUB-004/005), webhook-confirmed activation (NFR-REL-003), billing history (FR-SUB-012),
      and their approved screens (Create Workspace Account, Sign In, Choose your TestFlow plan,
      Checkout, Subscription Activated, Subscription Required). QA Setup itself is explicitly
      NOT implemented — Slice 1 ends at a placeholder boundary (`GET /v1/workspace`, `/app`).
      Design conformance reviewed against approved Stitch references. E2E foundation added
      (Playwright, `e2e/`) automating Flows A–E (Trial, Monthly paid subscription, subscription
      gate, payment failure, login routing) against a dedicated database/ports, with no real
      Paystack credentials (`E2E_FAKE_PAYMENTS`/`NEXT_PUBLIC_E2E_FAKE_PAYMENTS`, gated non-production).
      Slice 1 is now fully done per its Definition of Done, including automated E2E coverage.

- [x] **Slice 3 — Projects: Create Project + Project List.** FR-PRJ-001 (create), FR-PRJ-004 (visibility by role),
      FR-PRJ-008 (list search, filters, counts, pagination) and FR-QAOM-012 (project pins the published QA
      configuration). Migration `0005_projects.sql`. **Accepted by the Product Owner 2026-10-08.** Last recorded
      results (see `docs/PROJECT_STATUS.md`): backend 125/125, frontend 111/111, E2E 27/27; QA PASS WITH FINDINGS,
      security PASS WITH WARNINGS. Deployed to staging (first at `5e3f47a`, 2026-10-07; GitHub deployment records show
      `453f3ca` as the latest successful deployment, 2026-10-08). TD-008 and TD-010 fixed afterwards (`ab7d06d`).

- [x] **Security hardening — backend (APID-022, TD-011).** Origin allow-list for state-changing `/v1` requests, API security headers, `Cache-Control: no-store`.
      Merged (`9f7a910`) and deployed to staging 2026-10-09 (backend `dep-db4mnqrtqb8s7397hdp0`); verified 34/34 on the live backend and in a real browser (6/6).
      Independent reviews: backend-reviewer PASS, security PASS WITH WARNINGS, qa PASS. Frontend not part of this item.

- [x] **Security hardening — frontend headers and report-only CSP (AD-031, TD-014).** Merged to `main` (PR #7, `2e03894`, 2026-10-10); verified in production mode
      (headers on every route, zero CSP violations on the main journeys, Paystack script/popup loads under the policy). **Not yet deployed** (frontend still `95da669` on staging; a manual
      frontend deploy needs approval). The CSP stays report-only; enforcing it is a separate, later decision.

- [ ] **Paystack webhook safe handling (TD-015).** Implemented and reviewed (backend-reviewer PASS after re-review, security PASS WITH WARNINGS with findings fixed, qa PASS); **open as PR #10, not merged,
      not deployed.** Fixes a crash path for validly signed events without `data`/`reference`, a double-payment-on-retry risk and the staging `500` retry loop.

Implemented and E2E-verified; Product Owner acceptance not recorded:

- [x] **Slice 2 — Organisation QA Operating Model Setup.** "Set up your QA process" screen with four presets
      (Standard / Lightweight / Controlled / Custom), auto-published Standard QA at organisation creation, and
      draft/publish semantics (FR-QAOM-001/002/003/004–009, commit `c0239ef`; migration `0004`). E2E Flow F covers it.
      Deferred: the Custom Setup full configuration screen (TD-003). No Product Owner acceptance of this slice is
      recorded in `docs/PROJECT_STATUS.md`.

Not yet approved/started — do not begin without an explicit approved slice definition:

- **Proposed next slice (prepared, NOT approved): Projects — Update Project and Archive Project (FR-PRJ-002, FR-PRJ-003).** Requirements checkpoint, risk
  class (MEDIUM), Definition of Ready and four Product Owner decisions (D1-D4) are in `docs/product/checkpoints/projects-update-and-archive.md`. No implementation before the
  decisions are answered and the slice is approved here.
- (Other candidates, not approved: FR-PRJ-005/006/007 project membership — depends on the user-invitation flow that does not exist yet; the Custom Setup screen (TD-003); CSP enforcement
  prerequisites; deferred dependency upgrades.)

History (kept for the record): this section previously listed "Slice 2 — Organisation QA Setup / QA Operating Model
foundation, then Project creation — per the Slice 1 final report's recommendation." Both parts were subsequently
built (Slices 2 and 3 above).
