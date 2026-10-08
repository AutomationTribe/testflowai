# TestFlow AI — Engineering Framework

> **Framework note (2026-10-08):** the canonical framework policy is now `docs/framework/POLICY.md`
> (AI Software Delivery Framework 1.1.0, pinned in `docs/framework/ADOPTION_RECORD.md`). This document is
> retained as TestFlow's earlier policy record and the home of the Product Owner's profile decisions below.
> Where it differs from the canonical policy, the canonical policy applies, except for project decisions.

This document is the project's AI Software Delivery Framework adoption, applied **forward-only**
(adopted 2026-10-07). It governs how future work is planned, built, reviewed, and released. It
does not retroactively redo completed work, redesign approved screens, or rewrite working code —
existing implementation adopts applicable standards progressively, when it is next touched by
approved work, a defect, or a security issue.

**Framework version: 1.1** (history, compatibility and this project's adoption record:
`docs/framework/VERSION.md`; adoption guide and reusable migration prompt:
`docs/framework/ADOPTING-1.1.md`). Version 1.1 adds three specialist review agents
(`database-architect`, `backend-reviewer`, `frontend-reviewer`), moves design conformance into the
frontend review, adds standard review reporting and severity rules, and makes all mandatory reviews
happen before commit.

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

AI agents must not agree with the user or with implementers by default. Every agent, and every
reviewer in particular, must:

1. **Independently evaluate** decisions and implementation.
2. **Prioritise correctness, evidence, requirements and engineering principles** over agreement.
3. **Raise concerns** when they are justified.
4. **Recommend better alternatives** where appropriate.
5. **Avoid inventing defects** or disagreeing merely to appear critical.
6. **Explain concerns concisely.**
7. **Respect the human's final decision authority.**

Reviewers must not rubber-stamp work. In practice:

- Verify claims against primary evidence before relying on them — the actual file, screenshot, test
  output or API response. A statement in a prompt such as "the gate passes" is a hypothesis to
  check, not an input to assume.
- When evidence contradicts an instruction or an earlier statement (including the agent's own), say
  so plainly, show the evidence and recommend a course of action. Do not quietly comply, and do not
  quietly substitute the agent's own preference either.
- Disagreement is reported, then the human decides. An agent does not override a decision it
  disagrees with, and does not defer silently to one the evidence says is wrong.
- Never soften, omit or reword a failing result to fit what the reader expects: failing tests,
  skipped steps, unreadable designs and unverifiable claims are reported as such.
- Agreement is earned by evidence: do not praise, confirm or "pass" work to be agreeable. Reviewers
  apply the same standard to each other's and the implementer's output.

## Definition of Ready

Before implementation begins on a feature or change, verify as applicable (depth scales with
change risk and project criticality — see below):

- the requirement is approved and sufficiently clear (never invent one — CLAUDE.md rule 3)
- relevant dependencies on other modules/features are understood
- affected approved product decisions are known (`docs/product/product-decisions.md`)
- a risk classification has been assigned (see Change-Risk Classification)
- relevant API/database impact is understood; where the feature introduces or materially changes
  database structures, the proposed schema and migration plan are ready to go to the
  `database-architect` before any code is written
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
- every mandatory specialist review completed **before commit**, with no unresolved HIGH finding and
  no unresolved MEDIUM finding unless the authorised human explicitly accepted it as an exception
  (see Review standards): `database-architect` for material database changes, `backend-reviewer` for
  backend work, `frontend-reviewer` for frontend work (which includes design conformance against the
  approved designs), and the general `reviewer` for cross-cutting/integration concerns where needed
- corrections made and **re-reviewed** by the same specialist role; no implementation is declared
  complete while a blocking finding remains
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
| LOW | A copy change, a new non-destructive read-only endpoint, an internal refactor with full test coverage and no API/schema change | Standard specialist review (backend/frontend as applicable); unit tests; no mandatory `security` pass unless something above still applies |
| MEDIUM | A new feature screen with backend support, a non-destructive migration, a new API endpoint affecting existing data | Full specialist reviews + `qa` pass; `security` review if auth/tenant/data boundaries are touched; migration reviewed per Migrations section |
| HIGH | Anything touching auth/sessions, tenant isolation, payments/webhooks, a destructive or hard-to-reverse migration, a new external integration, an architecture change | Full specialist reviews + `qa` + mandatory `security` review with lightweight threat modeling; explicit rollback plan; Human Acceptance required before deployment |

Do not add unnecessary ceremony to genuinely low-risk work — the point of classifying is to
right-size rigor, not to maximize it uniformly.

## Engineering workflow (framework 1.1)

Each feature follows this vertical slice. **Do not invoke agents for layers a task does not touch**
(no database change → no `database-architect`; no backend change → no `backend-reviewer`; no UI →
no design handoff or `frontend-reviewer`). Frontend/backend ordering may change when technically
appropriate. Existing human approval gates and deployment controls are unchanged.

```
 1. Feature Selection
 2. Requirements Checkpoint
 3. Risk Classification
 4. Definition of Ready
 5. Approved UI/UX Design (when applicable)
 6. Design Handoff                       — `design` agent
 7. Database Architect Review            — `database-architect`, when database changes are required
 8. Backend Implementation + Developer Tests (when applicable)   — `backend` agent
 9. Backend Engineer Reviewer            — `backend-reviewer`
10. Frontend Implementation + Developer Tests (when applicable)  — `frontend` agent
11. Frontend Engineer Reviewer, including Design Conformance     — `frontend-reviewer`
12. Cross-Cutting / Integration Review (when necessary)          — `reviewer`
13. Independent QA                       — `qa`
14. Security Review (risk-based)         — `security`
15. Definition of Done
16. Commit / Push according to repository policy
17. Human / Product Owner Acceptance
18. DevOps / Deployment after authorization                      — `devops`
19. Production Smoke Verification
20. Monitoring
```

There is no separate, mandatory design-conformance gate: conformance with the approved designs is
verified inside step 11 by the `frontend-reviewer`. The `design` agent remains for design
consultation, interpretation and handoff (step 6).

### Review and correction loops

- **Backend:** Backend Engineer → Developer Tests → Backend Reviewer → Backend Corrections → Re-review.
- **Frontend:** Frontend Engineer → Developer Tests → Frontend Reviewer (Engineering + Design
  Conformance) → Frontend Corrections → Re-review. The Frontend Engineer fixes; the Frontend
  Reviewer independently verifies the corrections.
- **Database:** Proposed Schema/Migration → Database Architect → Approved Design → Implementation →
  Database Verification (re-review by the Database Architect when the implemented change is material
  or the first review identified risks).
- If a finding affects another layer, coordinate the necessary changes and **re-run the affected
  reviews and tests**. No implementation is declared complete while blocking findings remain
  unresolved, and **all mandatory reviews happen before the implementation is committed**.
- The general `reviewer` may handle cross-cutting or integration concerns (anything spanning layers,
  or not owned by a specialist) but must not duplicate the specialist reviews unnecessarily.

## Review standards

Applies to `database-architect`, `backend-reviewer` and `frontend-reviewer` (and is the recommended
format for the general `reviewer`). Their agent files carry the report skeleton; the rules below are
defined **only here**.

**Standard Review Report** — concise and identical in shape for every reviewer:

```
Review Scope:          what was reviewed
Verdict:               PASS | PASS WITH CHANGES | BLOCKED
Findings:              each with Severity (HIGH | MEDIUM | LOW), File and location, Issue, Impact,
                       Recommended correction
Verification:          what was inspected or tested, and what remains unverified
Final Recommendation:  Proceed | Fix and Re-review | Escalate
```

**Severity rules**

- **HIGH** — blocks progression and commit.
- **MEDIUM** — must be resolved before commit unless the authorised human explicitly accepts it as
  an exception (record the exception in `docs/PROJECT_STATUS.md`).
- **LOW** — may be fixed immediately or recorded as technical debt.

**Verdicts:** BLOCKED when any HIGH finding exists (or something essential could not be verified);
PASS WITH CHANGES when only MEDIUM/LOW findings exist; PASS when there is nothing to change.
**A PASS WITH CHANGES verdict does not automatically authorise a commit — the severity rules still
apply.**

**Reviewer conduct**

- Do not inflate severity, and do not confuse cosmetic preferences with functional defects.
- Do not certify tests you did not execute: say what you ran and the result; list the rest under
  Verification as unverified.
- Be independent — never the same invocation that implemented the change — and follow
  *Independent Judgment — Evidence Over Agreement*.
- Reviewer expertise is always senior-level, but review against the project's selected
  code-readability profile (e.g. MID-LEVEL favours straightforward, maintainable code; do not demand
  needless abstraction to show seniority). Preserve project-specific profiles and decisions.
- Reviewers never modify implementation code (or designs); the implementing agent corrects and the
  reviewer re-verifies.

## Release workflow

After commit and Human/Product Owner Acceptance (workflow steps 16–20):

```
Commit / Push
  → Human / Product Owner Acceptance
  → DevOps Agent (only after explicit authorization)
  → Deployment
  → Production Smoke Verification
  → Monitoring
```

The user remains the final authority for acceptance and deployment (unchanged standing rule).

## Output review

Major technical outputs require independent review before being treated as final — architecture,
technology decisions, database/schema changes, API contracts, backend code, frontend code. The
specialist reviewers perform this (`database-architect`, `backend-reviewer`, `frontend-reviewer`; the
general `reviewer` for cross-cutting concerns); an implementing agent is never the sole authority
declaring its own work correct. Review checks correctness, maintainability, unnecessary complexity,
contradictions with existing approved decisions, security implications and performance
implications, and is reported in the Standard Review Report (see Review standards).

## Agent responsibilities (agent registry)

See each agent's own file in `.claude/agents/` for full detail; this is the map of who owns what and
**when each is invoked**. Division of responsibility across the whole framework: ChatGPT is the
Process Orchestrator, Stitch is the primary UI/UX designer, Claude Code is the engineering
implementor, and the specialist agents provide independent review and verification.

| Agent | Owns | Invoked |
|---|---|---|
| `design` | design consultation, interpretation and handoff (and the visual-conformance *method* the frontend reviewer follows) | step 6, and on request |
| `database-architect` | independent review of proposed schema/migration designs: normalization, constraints, indexes, concurrency, tenant isolation, migration safety | step 7, **before** implementation, when the feature introduces or materially changes database structures; re-review after implementation if material or risks were flagged; never for tasks without meaningful database changes |
| `backend` | backend implementation, migrations, API implementation, backend developer tests | step 8 |
| `backend-reviewer` | independent review of backend output before commit — Standard Review Report | step 9 (and re-review after corrections) |
| `frontend` | frontend implementation, frontend developer tests, accessibility, design-system adherence | step 10 |
| `frontend-reviewer` | independent review of frontend output before commit: (A) engineering review and (B) **design conformance** against the approved designs — one report, results kept separate | step 11 (and re-review after corrections) |
| `reviewer` | cross-cutting / integration review; must not duplicate specialist reviews | step 12, when necessary |
| `qa` | API/integration/UI/E2E/smoke/critical-journey/regression testing (independent functional validation) | step 13 |
| `security` | security review and lightweight threat modeling, risk-based | step 14 |
| `devops` | deployment and deployment verification | step 18, after authorization |

Implementation agents (`backend`, `frontend`) never self-certify their work as correct or complete —
that determination belongs to the specialist reviewers (and `database-architect` for database
design), `qa`, and ultimately the human. QA and Security retain their own independent
responsibilities and are not replaced by any reviewer.

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

A feature that introduces or materially changes database structures has its proposed schema and
migration plan reviewed by the `database-architect` **before implementation** (workflow step 7).

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

## Adopting framework upgrades (forward-only)

Framework upgrades (the version history is in `docs/framework/VERSION.md`) are adopted
**forward-only** at the next safe task or feature boundary; work already in progress may finish
under the previously approved workflow unless the Product Owner explicitly authorises adoption mid-
task; completed work is never reopened or retroactively reviewed; project-specific agents, approval
gates, engineering profiles and architecture decisions are preserved. Full guidance and the reusable
migration prompt: `docs/framework/ADOPTING-1.1.md`.

## Forward-only adoption — what this explicitly does not do

This framework adoption does not: restart TestFlow, repeat completed product stages, redo
existing architecture without cause, rewrite existing working code purely for style conformity,
redesign accepted screens, rewrite existing tests unnecessarily, refactor unrelated code, change
approved business rules, implement any deferred feature, or start the next product feature.
Existing code adopts applicable standards progressively, only when next touched by approved work,
a defect, a security issue, or an explicit user request.
