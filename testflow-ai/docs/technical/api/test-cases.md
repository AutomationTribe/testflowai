# API — Test Case Management

**Module:** TC. See `docs/technical/api-spec.md` for shared conventions. Test Case Templates are documented in `templates.md`; Test Suites in `test-suites.md`; AI generation in `ai.md`.

---

## Create Test Case

**Requirement IDs:** FR-TC-001, FR-TC-006, FR-TC-008, FR-TC-010.
**Purpose:** Author a new test case, manually or from a template.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /projects/{projectId}/test-cases`
**Request:** Path: `projectId`. Body: `title`, `steps` (structured), `expectedResults` (structured), `requirementId` (optional), `templateId` (optional — pre-populates `steps`/`expectedResults`; no ongoing link to the template is kept after creation).
**Successful Response:** `201 Created` — the test case (`approvalStatus: draft`, `currentVersionNumber: 1`, `isAiGenerated: false`).
**Business Rules:** Requirement link is optional (PD-005). Template content is copied at creation time only — later template edits never retroactively affect this test case.
**Error Conditions:** `403 forbidden`; `404 not_found` (project/requirement/template); `409 conflict` (project archived); `422 validation_error`.
**Side Effects:** Creates data.
**Audit Behaviour:** Reasonable to log (not on the strict FR-AUD-001 minimum list).
**Security Considerations:** `approvalStatus`, `currentVersionNumber`, `isAiGenerated` are never client-writable on create — server-computed only.

---

## List / Search Test Cases

**Requirement IDs:** FR-TC-001.
**Purpose:** List and filter test cases within a project.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /projects/{projectId}/test-cases`
**Request:** Path: `projectId`. Query: pagination, `?status=draft|approved|needs_review`, `?requirementId={id}|none` (traced/untraced filter), `?suiteId={id}`, `?q=` (title search).
**Successful Response:** `200 OK` — list of test cases.
**Business Rules:** None beyond project access.
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## View Test Case (Current)

**Requirement IDs:** FR-TC-002.
**Purpose:** Retrieve current live content and status.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-cases/{testCaseId}`
**Request:** Path: `testCaseId`.
**Successful Response:** `200 OK` — the test case, including `currentVersionNumber` (used as the concurrency token for edits, APID-003).
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## Edit Test Case

**Requirement IDs:** FR-TC-002, FR-TC-003.
**Purpose:** Update a test case's content or set its approval status directly (self-service, PD-048).
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access) — any of these may set `approvalStatus` to `approved`; there is no QA-Manager-only gate.
**Method and Path:** `PATCH /test-cases/{testCaseId}`
**Request:** Path: `testCaseId`. Body: any of `title`/`steps`/`expectedResults` (content edit), or `approvalStatus: "approved"` (direct self-service approval) — `currentVersionNumber` (required, APID-003 concurrency token).
**Successful Response:** `200 OK` — updated test case, reflecting new `approvalStatus` and, if a "significant" content edit occurred (a full replacement of `steps` and `expectedResults` together — DBD-003), an incremented `currentVersionNumber`.
**Business Rules:**
- If the test case is currently `approved` and its content is edited, it reverts to `needs_review` (PD-048) — regardless of edit size.
- A "significant" edit (full content replacement) creates a new Test Case Version; a partial edit (e.g., one field) mutates the current version in place with no history.
- Setting `approvalStatus: "approved"` is available from `draft` or `needs_review`, by any user with edit access — no reviewer gate, no restriction to the original creator.
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (`currentVersionNumber` mismatch — concurrent edit; or test case archived); `422 validation_error`.
**Side Effects:** Changes data; may create a Test Case Version; may change `approvalStatus`; creates an audit entry.
**Audit Behaviour:** Audited (status changes are explicitly a minimum action, FR-AUD-001).
**Security Considerations:** `isAiGenerated` and the AI generation link are never client-writable via this endpoint.

---

## List Test Case Versions

**Requirement IDs:** FR-TC-003.
**Purpose:** List historical versions (only "significant" edits produce one — a gap between version numbers is normal).
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-cases/{testCaseId}/versions`
**Request:** Path: `testCaseId`. Query: pagination.
**Successful Response:** `200 OK` — list of version summaries (`versionNumber`, `createdAt`).
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## View Test Case Version

**Requirement IDs:** FR-TC-003.
**Purpose:** View one historical version's frozen content.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-cases/{testCaseId}/versions/{versionNumber}`
**Request:** Path: `testCaseId`, `versionNumber`.
**Successful Response:** `200 OK` — read-only version snapshot (`steps`, `expectedResults`, `createdAt`) — no `approvalStatus` (that belongs to the live test case, not a frozen version).
**Business Rules:** None.
**Error Conditions:** `404 not_found` (test case or that specific version number).
**Side Effects:** None.

---

## Add Test Case Comment

**Requirement IDs:** FR-TC-007.
**Purpose:** Leave feedback on a test case (optional, not a gate — PD-048).
**Actor/Permission:** QA Manager.
**Method and Path:** `POST /test-cases/{testCaseId}/comments`
**Request:** Path: `testCaseId`. Body: `text`.
**Successful Response:** `201 Created` — the comment.
**Business Rules:** None — commenting has no effect on `approvalStatus`.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Creates data; may notify the test case's creator (out of scope for this endpoint's own contract).
**Audit Behaviour:** Not audited (feedback, not a key action).

---

## List Test Case Comments

**Requirement IDs:** FR-TC-007.
**Purpose:** View comments on a test case.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-cases/{testCaseId}/comments`
**Request:** Path: `testCaseId`. Query: pagination.
**Successful Response:** `200 OK` — list of comments.
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## Archive Test Case

**Requirement IDs:** — (direct archiving; cascade archiving is documented in `requirements.md`).
**Purpose:** Retire a test case from active use, preserving history.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /test-cases/{testCaseId}/archive`
**Request:** Path: `testCaseId`.
**Successful Response:** `200 OK` — test case with `recordStatus: archived`.
**Business Rules:** Archiving is separate from `approvalStatus` — an archived test case retains whatever approval status it last had.
**Error Conditions:** `403 forbidden`; `409 conflict` (already archived).
**Side Effects:** Test case becomes read-only.
**Audit Behaviour:** Reasonable to log.

---

## Add / Remove Test Case from Suite

**Requirement IDs:** FR-TC-009.
**Purpose:** Manage a test case's suite membership (many-to-many, DBD-002).
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `PUT /test-cases/{testCaseId}/suites/{suiteId}` (add); `DELETE /test-cases/{testCaseId}/suites/{suiteId}` (remove)
**Request:** Path: `testCaseId`, `suiteId`.
**Successful Response:** `PUT`: `201 Created` (membership created) or `200 OK` (already existed — idempotent by design, since `PUT` is naturally idempotent here). `DELETE`: `204 No Content`.
**Business Rules:** A test case may belong to multiple suites simultaneously (DBD-002); removing it from one suite has no effect on its membership in others.
**Error Conditions:** `403 forbidden`; `404 not_found` (test case or suite not in the same project).
**Side Effects:** Creates/removes a Test Suite Membership row.
**Audit Behaviour:** Not audited.
