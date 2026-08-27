# TestFlow AI — API Decisions

This log records **API design decisions** explicitly approved by the product owner during the API design and contract review. It follows the same convention as `product-decisions.md`, `database-decisions.md`, and `architecture-decisions.md`: each entry reflects a decision actually approved, not an engineering recommendation alone.

---

## APID-001 — API Versioning: `/v1/` Prefix From Day One

**Status:** Approved

**Context:** The API needed a decision on whether to introduce version prefixing immediately or defer it until a breaking change is actually needed.

**Decision:** Every API path is prefixed `/v1/` from the outset.

**Reason:** Retrofitting a version prefix after clients already depend on unversioned paths is significantly more disruptive than starting with one; the upfront cost is minimal.

**Alternatives Considered:** No versioning until a breaking change is actually needed (rejected — cheap now, expensive to retrofit).

**Consequences:** All endpoints documented in `docs/technical/api/` are shown without the prefix for readability, but it applies uniformly. No second version is planned or implied by this decision.

---

## APID-002 — Pagination: Cursor-Based

**Status:** Approved

**Context:** Every list endpoint needed a consistent pagination approach, and several result sets (test cases, execution history, audit log) can grow large.

**Decision:** All list endpoints use cursor-based pagination (`?cursor=...&limit=...`, response includes `nextCursor`).

**Reason:** Offset/page-based pagination degrades in performance and becomes unstable under concurrent inserts as a table grows — a real concern for execution history and audit logs over a project's lifetime.

**Alternatives Considered:** Offset/page-based pagination (`page`/`pageSize`) — simpler to implement, but rejected due to the scaling and stability concerns above.

**Consequences:** Clients cannot jump to an arbitrary page number, only page forward via a cursor — an acceptable trade-off, since no approved requirement calls for arbitrary page-jumping.

---

## APID-003 — Optimistic Concurrency on Test Case and Requirement Edits

**Status:** Approved

**Context:** Two users could edit the same Test Case or Requirement simultaneously; because edits to these two resources trigger meaningful side effects (test case approval-status reversion per PD-048, requirement-edit re-review cascade per PD-033), a silent last-write-wins overwrite is riskier here than in a typical CRUD resource.

**Decision:** `PATCH` requests to Test Case and Requirement must include a version token read from the most recent `GET` (Test Case: `currentVersionNumber`; Requirement: a response-only `revisionToken`). A mismatch is rejected with `409 conflict`.

**Reason:** Prevents one user's edit from silently discarding another's, specifically where the consequence of a silent overwrite (an incorrect approval-status transition, or a missed re-review trigger) is worse than in an ordinary field-level conflict.

**Alternatives Considered:** No concurrency protection (last write wins) — rejected as too risky given the side effects involved.

**Consequences:** Clients must re-fetch and retry on a `409`. No other resource (projects, test suites, templates) carries this mechanism at MVP, since no approved requirement flags a comparable risk there.

---

## APID-004 — No Bulk Operations at MVP

**Status:** Approved

**Context:** A decision was needed on whether to support bulk variants of write operations (e.g., adding many test cases to a suite in one call).

**Decision:** Every write operation acts on a single resource at a time; no bulk endpoints are built at MVP.

**Reason:** No approved functional requirement calls for bulk operations specifically, and bulk import/export (FR-IMP) is explicitly Post-MVP.

**Alternatives Considered:** Bulk variants for suite membership and test run creation — rejected as premature complexity not justified by approved scope.

**Consequences:** Operations on many items require multiple client-side calls; acceptable given current approved scope and volume.

---

## APID-005 — Asynchronous Pattern for AI Generation

**Status:** Approved

**Context:** AI generation can take up to the approved 60-second timeout (NFR-AI-002), too slow for a synchronous request/response held open.

**Decision:** AI generation uses `202 Accepted` plus a status-poll endpoint (`GET /ai-generations/{id}`), matching the background-job architecture already approved (AD-009).

**Reason:** Directly follows from the already-approved AI architecture; a synchronous call would be incompatible with the approved timing and background-processing design.

**Alternatives Considered:** Synchronous long-poll — rejected as incompatible with the approved architecture and timing requirements.

**Consequences:** Clients must poll (or the frontend implements an equivalent UI pattern) rather than receiving an immediate result. No other approved operation needs this pattern — report generation remains synchronous (5-second target, NFR-PERF-003).

---

## APID-006 — Idempotency Keys on Payment-Like and Generation-Triggering Actions

**Status:** Approved

**Context:** Accidental duplicate submissions (double-click, retry after a timeout) could cause double-charging a customer or double-triggering an expensive AI generation or report compilation.

**Decision:** An `Idempotency-Key` request header is honored on: subscription actions (trial/monthly/yearly), seat purchases, AI generation triggers, test run creation, and report generation.

**Reason:** Standard, low-cost protection against a real customer-trust risk (double billing) and a real cost risk (duplicate AI/report generation).

**Alternatives Considered:** No idempotency protection — rejected given the double-charge risk specifically.

**Consequences:** Clients are expected to generate and retain an idempotency key per logical action attempt; the API returns the original result on a replayed key within a reasonable window.

---

## APID-007 — Shared Error Envelope

**Status:** Approved

**Context:** Consistency was needed across every endpoint's error responses.

**Decision:** One shared error envelope (`error`, `message`, optional `fields`) is used across all endpoints, with a fixed mapping of situations to HTTP status codes and `error` values (see `api-spec.md`).

**Reason:** Inconsistent per-module error shapes would complicate client handling and make security review harder (e.g., ensuring `401` vs. `403` is used consistently).

**Alternatives Considered:** Per-module ad hoc error shapes — rejected in favor of one consistent contract.

**Consequences:** All module documentation and any future new endpoint must conform to this shape.

---

## APID-008 — API Field Naming: camelCase

**Status:** Approved

**Context:** A decision was needed on JSON field naming, given the database uses `snake_case` column names (PostgreSQL convention) while the approved stack is TypeScript/React (AD-002/003).

**Decision:** All API request/response JSON fields use camelCase; the mapping to `snake_case` database columns happens at the data-access layer, not in the API contract.

**Reason:** camelCase is idiomatic for the approved JavaScript/TypeScript stack on both frontend and backend.

**Alternatives Considered:** snake_case matching the database directly — rejected as unidiomatic for a JSON API in this stack.

**Consequences:** A thin field-name mapping layer is needed between the API and the database — a standard, low-cost pattern.

---

## APID-009 — Security Concerns Confirmed as Contract Rules, No Further Decision Needed

**Status:** Approved

**Context:** During API design review, several security considerations were flagged (tenant isolation, object-level authorization, link-scope error codes, mass-assignment prevention, file access brokering, AI data minimization, report-comment exclusion). These were confirmed as already-settled design principles rather than open decisions requiring options/trade-offs.

**Decision:** All flagged security concerns are treated as mandatory contract rules, documented in `api-spec.md`'s Security Principles section and enforced per-operation in the module documents — not further options to choose between.

**Reason:** These are direct implications of already-approved decisions (NFR-SEC-003, NFR-SEC-005, NFR-SEC-006, PD-040, PD-043) rather than new trade-offs; no alternative was genuinely on the table.

**Alternatives Considered:** None — these are requirement-derived contract rules, not a choice between options.

**Consequences:** Every module document's Security Considerations field must reflect these rules where relevant; a future new endpoint must be checked against them before being added.
