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
20. The normal path from requirements to deployment is: Requirements → Approved Design →
    Design agent Handoff → Implementation + Unit Tests → Design agent Conformance Review → QA
    agent → Security agent → Human Acceptance → DevOps agent → Deployment → Smoke Verification.
    When an approved design (e.g. a Stitch screenshot) exists for a screen, Claude should invoke
    the Design agent for a handoff before implementing it, and for a conformance review after
    implementing it — before QA. Claude should invoke the QA agent after completing an
    implementation or fix, before considering the work complete, and the Security agent before any
    deployment. If Design, QA, or Security reports a failure — a MATERIAL DIFFERENCE/PRODUCT
    CONFLICT, a failed test, or a security finding — explain exactly what failed, the risk, and a
    recommendation, then explicitly ask the user whether to proceed anyway. Never silently skip a
    gate, auto-override a reported failure, or let an agent silently resolve a
    design/requirement conflict in either direction; the user is always the final decision-maker,
    including final acceptance before deployment. See docs/technical/testing.md,
    docs/technical/security.md, and docs/technical/design-handoff.md.
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
    or bypass that hook instead of actually updating the file.
