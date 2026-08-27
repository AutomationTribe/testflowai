# API — Requirements Management

**Module:** REQ. See `docs/technical/api-spec.md` for shared conventions.

---

## Create Requirement

**Requirement IDs:** FR-REQ-001.
**Purpose:** Author a new requirement within a project.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /projects/{projectId}/requirements`
**Request:** Path: `projectId`. Body: `title`, `description`, `sourceReference` (optional).
**Successful Response:** `201 Created` — the requirement (`status: active`).
**Business Rules:** BA/PO cannot author requirements (PD-015) — enforced by role check, not by anything in this request shape.
**Error Conditions:** `403 forbidden`; `422 validation_error`; `409 conflict` (project archived).
**Side Effects:** Creates data.
**Audit Behaviour:** Not on the minimum list; reasonable to log.
**Security Considerations:** Standard project access + tenant isolation.

---

## List Requirements

**Requirement IDs:** FR-REQ-001.
**Purpose:** List requirements in a project.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /projects/{projectId}/requirements`
**Request:** Path: `projectId`. Query: pagination, `?status=active|archived`, `?q=` (title search).
**Successful Response:** `200 OK` — list of requirements.
**Business Rules:** None.
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## View Requirement

**Requirement IDs:** FR-REQ-001.
**Purpose:** View a single requirement, including a concurrency token for later edits.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /requirements/{requirementId}`
**Request:** Path: `requirementId`.
**Successful Response:** `200 OK` — requirement resource, including a `revisionToken` (derived from `lastEditedAt`) for optimistic concurrency on edits (APID-003).
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## Edit Requirement

**Requirement IDs:** FR-REQ-002.
**Purpose:** Update a requirement's content, triggering re-review of linked, already-Approved test cases.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `PATCH /requirements/{requirementId}`
**Request:** Path: `requirementId`. Body: `title`/`description`/`sourceReference` (partial update accepted), `revisionToken` (required — APID-003 optimistic concurrency).
**Successful Response:** `200 OK` — updated requirement, plus `affectedTestCaseIds: []` listing any test cases whose status changed to `needs_review` as a result, so the client can surface this without a follow-up query.
**Business Rules:** Every linked test case currently `approved` transitions to `needs_review` (PD-033); test cases in other statuses are untouched; `lastEditedAt` updates regardless (DBD-004 — no content history retained). Requirements do not version.
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (`revisionToken` mismatch, or requirement archived); `422 validation_error`.
**Side Effects:** Changes data; cascades status changes to linked test cases in the same transaction; creates audit entries for each affected test case.
**Audit Behaviour:** Audited — both the requirement edit and each cascaded test case status change.
**Security Considerations:** Standard project access.

---

## Archive Requirement

**Requirement IDs:** FR-REQ-004.
**Purpose:** Archive a requirement, cascading to its linked test cases, reports, and any active test run.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /requirements/{requirementId}/archive`
**Request:** Path: `requirementId`.
**Successful Response:** `200 OK` — the archived requirement, plus `cascadedTestCaseIds`, `cascadedReportIds`, and `cancelledTestRunId` (if applicable) — again avoiding N follow-up queries.
**Business Rules:** Cascades to linked test cases and reports (PD-016). Any linked test case belonging to an active, unclosed test run causes that run to be cancelled-and-archived too (PD-034). The entire operation is one atomic database transaction (AD-013) — it either fully succeeds or the requirement remains unarchived.
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (already archived).
**Side Effects:** Archives data across multiple entity types in one transaction; creates audit entries for each cascaded change.
**Audit Behaviour:** Audited (explicitly a minimum action, FR-AUD-001).
**Security Considerations:** No special concerns beyond standard project access; the atomicity guarantee is a data-layer property, not an API-layer one, but the API must surface a clear all-or-nothing result (no partial-success response shape).

---

## View Traced Test Cases

**Requirement IDs:** FR-TRACE-001, FR-TRACE-002.
**Purpose:** List test cases linked to a requirement (read-only traceability view).
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /requirements/{requirementId}/test-cases`
**Request:** Path: `requirementId`. Query: pagination.
**Successful Response:** `200 OK` — list of test cases linked to this requirement.
**Business Rules:** This is a read view only — test cases are created under `/projects/{projectId}/test-cases` with an optional `requirementId`, not under this path (PD-005: linkage is optional and secondary to a test case's project ownership).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None.
**Notes:** The reverse "show untraced test cases" view is available via `GET /projects/{projectId}/test-cases?requirementId=none` (see `test-cases.md`), not a separate endpoint here.
