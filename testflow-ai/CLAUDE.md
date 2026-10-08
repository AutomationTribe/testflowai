# CLAUDE.md

Rules for AI-assisted work on the TestFlow AI project.

1. This is a large AI-assisted software project.
2. Product requirements are the source of truth for what the system should do.
3. Never invent product requirements.
4. Before implementing a feature, read the relevant product and technical documentation.
5. Do not implement a new or changed requirement immediately.
6. New or changed requirements must undergo impact analysis before implementation.
7. Impact analysis should consider database, APIs, backend, web, mobile, security, permissions, tests and documentation.
8. Keep documentation synchronized with approved implementation changes.
9. Do not make major architectural or technology decisions without documenting the reasoning.
10. TASKS.md should represent approved work, not unapproved ideas.
11. All API paths are prefixed /v1/ (APID-001). Every endpoint uses the shared error envelope
    (error/message/fields, APID-007) and cursor-based pagination (APID-002) defined in
    docs/technical/api-spec.md. Do not introduce a different error shape or pagination style
    without recording a decision in docs/technical/api-decisions.md.
12. Test Case and Requirement edits require optimistic-concurrency version checking
    (APID-003) — never implement a silent last-write-wins PATCH for these two resources.
13. AI-generated test cases must only ever be created via the save step in ai.md
    (POST /ai-generations/{id}/test-cases) — never persist draft AI output as a Test Case
    row through any other path.
14. Tenant isolation (organisation scoping) and object-level authorization must be checked on
    every API request, including bare-resource-ID endpoints — never rely on a valid session
    alone. A resource belonging to another organisation returns 404, not 403.
15. The backend is a modular monolith (Node.js/TypeScript), organized around the functional
    modules defined in functional-requirements.md. Do not introduce microservices, a second
    backend language/runtime, or a separate deployable service for a module without first
    recording an approved decision in docs/technical/architecture-decisions.md.
16. AI-generated test cases must never be persisted as saved Test Case records before a human
    completes the mandatory review step and explicitly saves them (NFR-AI-004, AD-009). Do not
    introduce a "draft AI output" table or shortcut that stores unreviewed AI candidates as
    real product data.
17. The requirement archive cascade (requirement → test cases → reports → active test runs) must
    execute as a single atomic database transaction, not as a background job or multi-step
    asynchronous process (AD-013).
18. Do not add a new architecture component (e.g., caching layer, search engine, managed queue
    service, mobile app) without first recording an approved decision in
    docs/technical/architecture-decisions.md.
19. Every frontend or backend implementation, change, or bug fix must include appropriate unit
    tests — this applies to all new functionality, to existing functionality when modified, and
    to bug fixes (a bug fix's test must be one that would have caught the original bug, not just
    a happy-path check that the fix works). An implementation is not complete until its unit
    tests have been run and the results reported — "I added tests" is not sufficient; report
    pass/fail/count. See docs/technical/testing.md for the full testing strategy.
20. The normal path from requirements to deployment is: Feature Selection → Requirements
    Checkpoint → Risk Classification → Definition of Ready → Approved Design → Design agent
    Handoff → Backend Implementation + Unit Tests → Backend Review (reviewer agent) → Frontend
    Implementation + Unit Tests → Frontend Review (reviewer agent) → Design agent Conformance
    Review → QA agent → Security agent → Human Acceptance → Definition of Done → DevOps agent →
    Deployment → Production Smoke Verification → Monitoring. Frontend/backend ordering may change
    when technically appropriate, and not every change needs both. When an approved design (e.g. a
    Stitch screenshot) exists for a screen, Claude should invoke the Design agent for a handoff
    before implementing it, and for a conformance review after implementing it — before QA. Claude
    should invoke the Reviewer agent after a Frontend or Backend agent implementation (the reviewer
    must be independent of the implementer), the QA agent after completing an implementation or
    fix, before considering the work complete, and the Security agent before any deployment. If
    Design, Reviewer, QA, or Security reports a failure — a MATERIAL DIFFERENCE/PRODUCT CONFLICT, a
    BLOCKED review, a failed test, or a security finding — explain exactly what failed, the risk,
    and a recommendation, then explicitly ask the user whether to proceed anyway. Never silently
    skip a gate, auto-override a reported failure, or let an agent silently resolve a
    design/requirement conflict in either direction; the user is always the final decision-maker,
    including final acceptance before deployment. See docs/technical/testing.md,
    docs/technical/security.md, docs/technical/design-handoff.md, and
    docs/technical/engineering-framework.md (Definition of Ready/Done, change-risk classification,
    release workflow, full framework detail).
21. Every TestFlow API must have a maintained OpenAPI contract at
    docs/technical/api/openapi.yaml, kept in sync with the actual implementation whenever an
    endpoint is added or changed (request/response shapes, auth requirements). Swagger UI is
    served at `/docs` outside production by default and is never exposed in a production
    deployment unless explicitly enabled (`SWAGGER_UI_ENABLED=true`) — do not change this default
    without recording the decision.
22. docs/PROJECT_STATUS.md must be updated after every coding task — date, branch/commit,
    completed work, tests actually run and their results, deployment/demo link, blockers, and
    the next three tasks. Never mark work "complete" there unless its tests were actually run
    in that session and passed; report untested work as untested. A Stop hook enforces this by
    blocking when the repo changed without this file being part of that change — do not weaken
    or bypass that hook instead of actually updating the file. PROJECT_STATUS.md is the concise
    handoff/state record — it does not replace product requirements, architecture docs, ADRs,
    API specs, database docs, or product decisions; consult those alongside it before planning
    new work.
23. Frontend and Backend implementation agents (.claude/agents/frontend.md,
    .claude/agents/backend.md) must never self-certify their own work as correct or complete —
    that determination belongs to the Reviewer agent (.claude/agents/reviewer.md, independent of
    the implementer), the Design agent for UI conformance, and the QA agent for functional
    correctness. The Reviewer agent returns exactly one status: PASS, PASS WITH CHANGES, or
    BLOCKED, and does not implement product code itself.
24. Every implementation/change is classified LOW, MEDIUM, or HIGH risk before work begins, and a
    Definition of Ready is checked before implementation starts and a Definition of Done before
    it's considered complete — see docs/technical/engineering-framework.md for the full criteria.
    Review/testing/security depth scales with the risk level and the project's criticality
    profile; do not add unnecessary ceremony to genuinely low-risk work, and do not skip a gate a
    high-risk change actually needs.
25. TestFlow's project criticality profile (PROTOTYPE/MVP/PRODUCTION/HIGH-CRITICALITY) and code
    readability profile (MID-LEVEL/SENIOR) are user decisions, not Claude's to choose — see
    docs/technical/engineering-framework.md and docs/technical/coding-standards.md. Decided by the
    Product Owner on 2026-10-07: project criticality = PRODUCTION; code readability = MID-LEVEL.
    Apply PRODUCTION rigor and MID-LEVEL code.
26. New technology, a meaningful new dependency, or a significant/hard-to-reverse technical
    decision requires evidence-based justification (not popularity/familiarity alone) and, where
    significant, a recorded decision per docs/decisions/README.md (ADR/RFC) or the relevant
    existing decision log (architecture-decisions.md, database-decisions.md, api-decisions.md,
    product-decisions.md) — do not introduce microservices, Kubernetes, queues, caches, search
    engines, additional databases, distributed-systems patterns, or additional runtimes without
    one. See docs/technical/engineering-framework.md for dependency governance, accessibility,
    observability, performance, threat-modeling, migration/backward-compatibility, feature-flag,
    reliability, technical-debt, production-verification, and incident-practice guidance — all
    adopted forward-only; existing work is not redone to conform to it.
27. Every Stitch design must have a canonical screen name. When a design is approved, persist its
    canonical screen name, Stitch project ID, Stitch screen ID, approval status, approval date,
    and requirement/feature association (where applicable) in docs/design/stitch-registry.md.
    Resolve approved designs from that registry by exact screen ID — never by assuming the newest
    or last-listed Stitch screen is the approved one. Stitch MCP cannot rename an existing
    screen; do not regenerate a screen just to fix its title — keep the registry mapping instead.
28. Independent Judgment — Evidence Over Agreement: verify claims against primary evidence (the
    file, screenshot, test output, API response) instead of accepting them because they were
    stated; when evidence contradicts an instruction or an earlier statement, say so plainly with
    the evidence and a recommendation, then let the Product Owner decide — never silently comply,
    never silently substitute Claude's own preference, never soften a failing result. See
    docs/technical/engineering-framework.md.
29. E2E (Playwright) tests start already signed in as the DEDICATED TESTER (`e2e/testerUser.ts`, created
    once per run by `e2e/global-setup.ts`, session saved as the default `storageState`). Do not create a
    new account in a test unless it is explicitly about creating or entering an account (sign-up, trial,
    payment, login, QA-setup onboarding) or needs a signed-out/unsubscribed browser — those files/blocks
    opt out with `test.use(NO_SESSION)` (see `e2e/tests/helpers.ts`) and say why. Tests that need a known
    data state reset the dedicated tester's data through the E2E-only `reset-projects` endpoint, never by
    adding another sign-up. Never use the dedicated tester in a test that signs out of the shared session.
