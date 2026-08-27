# API — Test Run / Execution

**Modules:** TR, EXEC. See `docs/technical/api-spec.md` for shared conventions. Defects raised from a failed result are documented in `defects.md`.

---

## Create Test Run

**Requirement IDs:** FR-TR-001, FR-TC-004.
**Purpose:** Start a new test run from selected test cases or a suite, snapshotting their content.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /projects/{projectId}/test-runs`
**Request:** Path: `projectId`. Body: `name`, and either `testCaseIds: []` or `testSuiteId`. Header: `Idempotency-Key` (APID-006 — protects against duplicate run creation on retry).
**Successful Response:** `201 Created` — the run (`status: open`) with its list of run items, each carrying the frozen content snapshot taken at this moment.
**Business Rules:** Content is snapshotted at creation regardless of whether a formal Test Case Version exists at that instant (NFR-DI-001, DBD-003) — this always happens, no exceptions.
**Error Conditions:** `400 validation_error` (empty test case list); `403 forbidden`; `404 not_found` (referenced test case/suite); `409 conflict` (project archived).
**Side Effects:** Creates the run and one snapshot row per included test case, in one transaction.
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** Standard project access.

---

## List Test Runs

**Requirement IDs:** FR-TR-004.
**Purpose:** List test runs in a project.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /projects/{projectId}/test-runs`
**Request:** Path: `projectId`. Query: pagination, `?status=open|closed|cancelled_archived`.
**Successful Response:** `200 OK` — list of runs, each with summary progress counts.
**Business Rules:** None.
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## View Test Run

**Requirement IDs:** FR-TR-004.
**Purpose:** View a run's detail and aggregate progress.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-runs/{runId}`
**Request:** Path: `runId`.
**Successful Response:** `200 OK` — run resource including Pass/Fail/Blocked/Skipped counts.
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## Close Test Run

**Requirement IDs:** FR-TR-003, PD-037.
**Purpose:** Finalize a run, permanently locking all its results.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /test-runs/{runId}/close`
**Request:** Path: `runId`.
**Successful Response:** `200 OK` — run with `status: closed`, `closedAt` set.
**Business Rules:** Irreversible — no endpoint exists to reopen a closed run. A run already `cancelled_archived` (via requirement-archive cascade — see `requirements.md`) cannot be closed through this endpoint.
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (already closed or cancelled-archived).
**Side Effects:** From this point on, every result-recording and evidence-attach endpoint against this run permanently rejects requests.
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** The most important state transition to get right server-side — must be enforced regardless of client belief about run state.

---

## List Run Items

**Requirement IDs:** FR-EXEC-001.
**Purpose:** List a run's test case snapshots and their recorded results.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-runs/{runId}/items`
**Request:** Path: `runId`. Query: pagination, `?resultStatus=pass|fail|blocked|skipped|unrecorded`.
**Successful Response:** `200 OK` — list of items (frozen `steps`/`expectedResults`, plus recorded result if any).
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## Record Execution Result

**Requirement IDs:** FR-EXEC-001, FR-EXEC-003, PD-037.
**Purpose:** Record Pass/Fail/Blocked/Skipped for one item in an open run.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `PATCH /test-runs/{runId}/items/{itemId}/result`
**Request:** Path: `runId`, `itemId`. Body: `status` (`pass` | `fail` | `blocked` | `skipped`).
**Successful Response:** `200 OK` — the updated item with its result.
**Business Rules:** **Hard rule, no exception:** rejected outright if the parent run's `status` is not `open` (PD-037) — checked server-side on every request, never trusted from client state.
**Error Conditions:** `422 validation_error` (invalid status value); `403 forbidden`; `404 not_found`; **`409 invalid_state`** (run is not open — the single most important error case in this entire API).
**Side Effects:** Changes data; feeds progress aggregation (FR-TR-004).
**Audit Behaviour:** Not on the strict minimum list; reasonable to log given its importance to historical accuracy.
**Security Considerations:** Enforced at the data layer too (per `database.md`/`schema.sql` comments) — the API must not be the only place this rule is checked.

---

## Attach Evidence

**Requirement IDs:** FR-EXEC-002.
**Purpose:** Attach a file (screenshot, PDF) to a recorded execution result.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /test-runs/{runId}/items/{itemId}/evidence`
**Request:** Path: `runId`, `itemId`. Body: `originalFilename`, `fileType`, `fileSizeBytes` (metadata only — see File Handling in `api-spec.md` for the upload-authorization flow; the actual bytes never go through this JSON body).
**Successful Response:** `201 Created` — the Evidence metadata record, plus a short-lived signed upload URL for the actual file content.
**Business Rules:** File must be within the 10 MB cap and an approved MIME type (NFR-FILE-001/002) — validated before the metadata record is confirmed. Rejected if the parent run is not `open` (same immutability rule as results).
**Error Conditions:** `422 validation_error` (size/type outside allowlist); `403 forbidden`; `409 invalid_state` (run not open).
**Side Effects:** Creates an Evidence record; the actual file lands in cloud object storage, not the database (AD-008).
**Audit Behaviour:** Not audited.
**Security Considerations:** Upload authorization is brokered — the client never gets a permanent public write URL to storage.
