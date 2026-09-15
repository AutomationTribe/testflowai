# TASKS.md

This file represents approved work only, not unapproved ideas. See [CLAUDE.md](CLAUDE.md) for the rules governing this project.

## Phases

- [x] Product Definition
- [x] Requirements
- [x] Technical Design
- [x] UX and Design (user flows + design system; visual design of new CHANGE-001 screens still pending)
- [ ] Development — in progress, one vertical slice at a time (see below)
- [ ] Testing
- [ ] Deployment

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

Not yet approved/started — do not begin without an explicit approved slice definition:

- [ ] Slice 2 — Organisation QA Setup / QA Operating Model foundation, then Project creation —
      per the Slice 1 final report's recommendation.
