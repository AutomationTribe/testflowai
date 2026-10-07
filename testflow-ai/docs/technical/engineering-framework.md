# TestFlow AI — Engineering Framework

This document is the project's AI Software Delivery Framework adoption, applied **forward-only**
(adopted 2026-10-07). It governs how future work is planned, built, reviewed, and released. It
does not retroactively redo completed work, redesign approved screens, or rewrite working code —
existing implementation adopts applicable standards progressively, when it is next touched by
approved work, a defect, or a security issue.

It does not replace `docs/product/`, `docs/technical/architecture-decisions.md`,
`docs/technical/database-decisions.md`, `docs/technical/api/openapi.yaml`, or
`docs/PROJECT_STATUS.md` — it sits alongside them and references them rather than duplicating
their content. CLAUDE.md remains the enforceable rule set; this document is where the full
reasoning and process detail lives.

## Project criticality profile

**DECIDED (Product Owner, 2026-10-07): TESTFLOW PROJECT CRITICALITY = `PRODUCTION`.**

One of: `PROTOTYPE` / `MVP` / `PRODUCTION` / `HIGH-CRITICALITY`. Selected: **PRODUCTION**. The
full Definition of Done applies broadly, with stronger security, observability, and rollback
expectations (table below). Where a section of this document says "re-calibrate once the
criticality decision is made", it is now made: apply PRODUCTION rigor. This does not by itself
authorize HIGH-CRITICALITY practices (formal SLOs, heavyweight reliability programmes) — those
remain out unless a requirement calls for them.

| Profile | What it changes |
|---|---|
| PROTOTYPE | Minimal documentation/testing/review; speed over rigor; not suitable for real user data. |
| MVP | Core flows tested and reviewed; documentation covers real decisions; moderate rigor. |
| PRODUCTION | Full Definition of Done applies broadly; stronger security/observability/rollback expectations. |
| HIGH-CRITICALITY | Maximum rigor — formal review, strong rollback/observability/SLO discipline, minimal risk tolerance. |

## Code readability profile

**DECIDED (Product Owner, 2026-10-07): TESTFLOW CODE READABILITY PROFILE = `MID-LEVEL`.**

One of: `MID-LEVEL` / `SENIOR`. Selected: **MID-LEVEL**. Also recorded in
`docs/technical/coding-standards.md`; `frontend`/`backend`/`reviewer` agents read that file and
apply this profile.

- **MID-LEVEL** — explicit, straightforward, easy to follow and debug, conservative with
  abstraction, understandable by a competent mid-level developer.
- **SENIOR** — may use stronger abstractions/patterns, but only when justified; readability and
  maintainability remain mandatory either way, and cleverness/unnecessary abstraction remain
  prohibited under both profiles.

## Independent Judgment — Evidence Over Agreement

Claude's job on this project is to be correct, not agreeable. Treat the Product Owner's
instructions as authoritative for *decisions* (what to build, priorities, acceptance) but never as
evidence for *facts* (what a screen contains, what a test result is, whether a gate passed, what
a document says).

- Verify claims against primary evidence before relying on them — the actual file, the actual
  screenshot, the actual test output, the actual API response. A statement in a prompt such as
  "the gate passes" or "you can see all three screens" is a hypothesis to check, not an input to
  assume.
- When evidence contradicts an instruction or an earlier statement (including Claude's own),
  say so plainly, show the evidence, and recommend a course of action. Do not quietly comply, and
  do not quietly substitute Claude's own preference either.
- Disagreement is reported, then the Product Owner decides. Claude does not override a decision it
  disagrees with, and does not defer silently to one the evidence says is wrong.
- Never soften, omit, or reword a failing result to fit what the reader expects: failing tests,
  skipped steps, unreadable designs, and unverifiable claims are reported as such.
- Agreement is earned by evidence. Do not praise, confirm, or "pass" work to be agreeable; the
  `reviewer`, `design`, `qa`, and `security` agents apply the same standard to each other's and
  the implementer's output.

## Definition of Ready

Before implementation begins on a feature or change, verify as applicable (depth scales with
change risk and project criticality — see below):

- the requirement is approved and sufficiently clear (never invent one — CLAUDE.md rule 3)
- relevant dependencies on other modules/features are understood
- affected approved product decisions are known (`docs/product/product-decisions.md`)
- a risk classification has been assigned (see Change-Risk Classification)
- relevant API/database impact is understood
- required design exists and is approved, where UI is involved
- the `design` agent handoff is complete, where UI is involved (CLAUDE.md rule 20)
- acceptance criteria are testable
- unresolved blockers are identified and surfaced, not silently worked around
- required technical decisions have been made (recorded as an ADR/RFC if significant — see below)

## Definition of Done

A feature or change is not complete merely because code was written. As applicable, completion
requires:

- implementation completed
- frontend/backend unit tests added where required (CLAUDE.md rule 19)
- unit tests **actually executed** and results recorded (pass/fail/count) — never "tests added"
  as a substitute for "tests run"
- independent `reviewer` agent review completed, with a PASS or PASS WITH CHANGES resolved
- approved-design conformance checked via the `design` agent, where UI is involved
- relevant API/integration tests completed
- relevant UI/E2E tests completed
- relevant regression tests completed
- accessibility checked, where frontend work is involved
- `security` agent review completed where required (see Change-Risk Classification)
- `docs/technical/api/openapi.yaml` updated when APIs change
- migrations reviewed/tested when applicable (see Migrations below)
- observability added where applicable
- documentation synchronized with the approved change
- Human Acceptance obtained where required — the user remains the final authority
- `docs/PROJECT_STATUS.md` updated (CLAUDE.md rule 22)

**Never mark untested implementation as complete.** Scale the exact depth of each item to the
change's risk level and the project's criticality profile — do not manufacture ceremony for
genuinely low-risk work, and do not skip a gate that a high-risk change actually needs.

## Change-risk classification

Every implementation/change is LOW, MEDIUM, or HIGH risk. Classify by considering:

- user/business impact
- data impact
- authentication/authorization impact
- tenant isolation impact
- financial/payment impact
- security impact
- migration impact
- backward compatibility
- external integrations
- architectural impact
- operational impact
- rollback difficulty

| Risk | Typical example in TestFlow | Review/testing depth |
|---|---|---|
| LOW | A copy change, a new non-destructive read-only endpoint, an internal refactor with full test coverage and no API/schema change | Standard `reviewer` pass; unit tests; no mandatory `security` pass unless something above still applies |
| MEDIUM | A new feature screen with backend support, a non-destructive migration, a new API endpoint affecting existing data | Full `reviewer` + `qa` pass; `security` review if auth/tenant/data boundaries are touched; migration reviewed per Migrations section |
| HIGH | Anything touching auth/sessions, tenant isolation, payments/webhooks, a destructive or hard-to-reverse migration, a new external integration, an architecture change | Full `reviewer` + `qa` + mandatory `security` review with lightweight threat modeling; explicit rollback plan; Human Acceptance required before deployment |

Do not add unnecessary ceremony to genuinely low-risk work — the point of classifying is to
right-size rigor, not to maximize it uniformly.

## Updated vertical-slice workflow

Each TestFlow feature follows (frontend/backend ordering may change when technically
appropriate; not every feature needs both; do not manufacture work just to satisfy the sequence):

```
Feature Selection
  → Requirements Checkpoint
  → Risk Classification
  → Definition of Ready
  → Approved Design
  → Design Agent Handoff
  → Backend Implementation + Unit Tests
  → Backend Review (reviewer agent)
  → Frontend Implementation + Unit Tests
  → Frontend Review (reviewer agent)
  → Design Conformance (design agent)
  → QA Agent
  → Security Agent
  → Human Acceptance
  → Definition of Done
```

## Release workflow

```
Implementation
  → Independent Review (reviewer agent)
  → QA Agent
  → Security Agent
  → Human Acceptance
  → DevOps Agent
  → Deployment
  → Production Smoke Verification
  → Monitoring
```

Existing Design Agent gates still apply to UI work ahead of this chain. The user remains the
final authority for acceptance and deployment (unchanged standing rule).

## Output review

Major technical outputs require independent review before being treated as final — architecture,
technology decisions, database/schema changes, API contracts, backend code, frontend code. The
`reviewer` agent performs this (see `.claude/agents/reviewer.md`); an implementing agent is never
the sole authority declaring its own work correct. Review checks correctness, maintainability,
unnecessary complexity, contradictions with existing approved decisions, security implications,
and performance implications.

## Agent responsibilities (summary)

See each agent's own file for full detail; this is a map of who owns what going forward.

| Agent | Owns |
|---|---|
| `design` | design handoff, visual-conformance review, visual regression (unchanged) |
| `frontend` | frontend implementation, frontend unit tests, accessibility, design-system adherence, frontend performance |
| `backend` | backend implementation, migrations, API implementation, backend unit tests, validation, transactions, error handling, backend observability |
| `reviewer` | independent review of architecture/technology/database/API/backend/frontend/tests/dependencies — PASS / PASS WITH CHANGES / BLOCKED |
| `qa` | API/integration testing, UI/E2E testing, smoke/critical-journey/regression testing (unchanged) |
| `security` | security review, lightweight threat modeling for higher-risk work (unchanged) |
| `devops` | deployment, deployment verification (unchanged) |

`frontend` and `backend` must never self-certify their own implementation as correct or complete
— that determination belongs to `reviewer`, `design` (for UI conformance), and `qa`.

## Technology decisions

Technology decisions are evidence-based, not adopted because a technology is popular or familiar.
Before introducing a new technology, evaluate as applicable: product requirements, platform
requirements, existing architecture, team capability, ecosystem maturity, scale, performance,
cost, deployment constraints, security, maintainability, and operational complexity.

Do not introduce, without a justified requirement and a recorded decision (see ADR/RFC below):
microservices, Kubernetes, message queues, caches, search engines, additional databases,
distributed-systems patterns, or additional language runtimes.

TestFlow's existing approved stack and architecture (Node.js/TypeScript modular monolith,
Next.js frontend, Postgres, plain SQL migrations — see `docs/technical/architecture-decisions.md`)
is preserved unless a future approved decision changes it.

## ADR / RFC process

See `docs/decisions/README.md` for the lightweight ADR/RFC process used for architecture,
technology, data-model, integration, and infrastructure decisions that are meaningful or hard to
reverse. This integrates with, and does not replace, the existing per-domain decision logs
(`docs/technical/architecture-decisions.md`, `docs/technical/database-decisions.md`,
`docs/technical/api-decisions.md`, `docs/product/product-decisions.md`) — an ADR records the
reasoning for a new cross-cutting decision; the domain log remains the durable record of what was
approved in that domain.

## Dependency governance

Before adding a meaningful new dependency, consider: why it's actually required, whether an
existing project capability already solves the problem, the dependency's maintenance health,
security risk, licensing (where relevant), bundle/runtime impact (where relevant), operational
impact, and long-term maintainability. Avoid unnecessary dependencies — this project already
deliberately avoids some common ones (e.g. a custom inline-SVG icon set instead of an icon
library, plain `pg` instead of an ORM) for exactly this reason; don't casually reverse a decision
like that without the same evaluation that produced it.

## Accessibility

A normal frontend quality concern, not a separate pass bolted on at the end. Where applicable,
verify: semantic HTML, keyboard usability, form labels, focus management, contrast, accessible
error states, screen-reader compatibility, and appropriate WCAG requirements for the feature.
Depth scales with the product and feature — a core user journey (signup, checkout, QA Setup)
deserves more scrutiny than a low-traffic internal settings toggle.

## Observability

Introduced by design where appropriate, not bolted on after an incident. Consider: structured
logging (the project's existing `lib/logger.ts` JSON logger), metrics, traces, health checks
(`/health`, already present), audit events, dashboards, and alerts. Never log secrets or
sensitive data (passwords, tokens, full payment payloads, session tokens). Do not create fake
observability or unnecessary infrastructure (e.g. don't stand up a metrics stack for an MVP with
no current operational need) — right-size to the project criticality profile.

## Performance

Introduce review/budgets where the feature or product actually requires them: frontend
performance, API latency, database query performance, resource usage, concurrency, scalability.
Do not perform premature optimization — a feature with no demonstrated performance problem and no
specific requirement for one doesn't need a performance budget invented for it.

## Security / threat modeling

The existing `security` agent and security workflow (CLAUDE.md, `docs/technical/security.md`) are
preserved unchanged. For higher-risk functionality (see Change-Risk Classification), introduce
lightweight threat modeling before or during implementation, considering as applicable:
authentication, authorization, tenant isolation, sessions/cookies, validation, injection, XSS,
CSRF, CORS, secrets, sensitive data, dependencies, APIs, payments, webhooks, file handling,
configuration, and relevant OWASP risks. Depth scales with actual risk — not every change needs a
full threat model.

## Migrations / backward compatibility

For relevant database or API changes, explicitly consider: the forward migration itself,
rollback/recovery if it fails partway or needs reverting, effect on existing data, backward
compatibility with clients that haven't redeployed yet, deployment ordering (this project's
migration-on-boot pattern, `docs/technical/deployment.md`), and failure recovery. **Destructive
migrations (dropping/renaming a column or table, narrowing a type) require explicit review**
before merging — call this out explicitly when proposing one. Do not introduce an elaborate
migration-review process for trivial additive changes (e.g. a new nullable column).

## Feature flags

Support feature flags when they provide a real, specific benefit: controlled rollout, isolating a
risky feature, a gradual migration, or operational rollback. Do not introduce a feature flag
automatically for every feature — most TestFlow changes so far have shipped without one and that
remains the default; a flag is a deliberate choice for a specific risk, not a reflex.

## Reliability / SLIs / SLOs

For production-relevant capabilities, consider as appropriate: service health, failure handling,
retries, timeouts, graceful degradation, and — only where the product actually needs them — SLIs
and SLOs. Do not invent enterprise reliability requirements TestFlow's actual product/criticality
profile doesn't call for; re-evaluate this section once the Project Criticality decision is made.

## Technical debt register

See `docs/technical/technical-debt.md`. A lightweight register of meaningful existing gaps,
reviewed once at framework-adoption time and updated going forward when new debt is knowingly
incurred or existing debt is resolved. It is not a dumping ground for cosmetic nitpicks, and
finding something in it is not an instruction to fix it immediately — existing implementation is
only revisited when touched by new work, a defect, a security issue, a material architecture
problem, or an explicit user request.

## Production verification

After a deployment, verify as appropriate: application health, critical smoke journeys,
migrations having applied cleanly, integrations (payment provider, email provider), monitoring/
alerts if configured, and major user-facing functionality. Deployment succeeding (the process
exiting 0, the service coming up) is necessary but not sufficient for calling the release
successful — the `devops` agent's existing post-deploy smoke-test step already does this; this
section codifies why that step is mandatory, not optional.

## Incident / postmortem practices

For a production incident, the appropriate sequence is: **Stabilize → Determine impact →
Identify root cause → Fix → Verify → Document → Track follow-up actions.** Use blameless
postmortems where appropriate — the point is fixing the system and the process, not assigning
fault. A formal postmortem is not required for a trivial development-time issue (e.g. a local
test flake); it is appropriate for anything that affected real users or real data.

## Forward-only adoption — what this explicitly does not do

This framework adoption does not: restart TestFlow, repeat completed product stages, redo
existing architecture without cause, rewrite existing working code purely for style conformity,
redesign accepted screens, rewrite existing tests unnecessarily, refactor unrelated code, change
approved business rules, implement any deferred feature, or start the next product feature.
Existing code adopts applicable standards progressively, only when next touched by approved work,
a defect, a security issue, or an explicit user request.
