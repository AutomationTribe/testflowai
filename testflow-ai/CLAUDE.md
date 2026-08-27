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
