# API — Defect Management

**Module:** DEF. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions. Link-based defect status updates are documented in `links.md` (the endpoint lives at `/links/{linkToken}/...` since it requires no login).

---

## Log Defect

**Requirement IDs:** FR-DEF-001.
**Purpose:** Log a defect from a failed execution result.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /execution-results/{resultId}/defects`
**Request:** Path: `resultId`. Body: `title`, `description`.
**Successful Response:** `201 Created` — the defect (`status: open` — DBD-008 vocabulary: Open, Pending, Closed, Removed).
**Business Rules:** Only loggable from a `fail` result.
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (result status is not `fail`).
**Side Effects:** Creates data, linked to the failed result and its test case.
**Audit Behaviour:** Not on the strict minimum list; reasonable to log.
**Security Considerations:** Standard project access.

---

## View Defect

**Requirement IDs:** FR-DEF-004.
**Purpose:** View a defect's details.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /defects/{defectId}`
**Request:** Path: `defectId`.
**Successful Response:** `200 OK` — defect resource, including its linked execution result/test case reference.
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## List Defects

**Requirement IDs:** FR-DEF-001.
**Purpose:** List/filter defects in a project.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /projects/{projectId}/defects`
**Request:** Path: `projectId`. Query: pagination, `?status=open|pending|closed|removed`.
**Successful Response:** `200 OK` — list of defects.
**Business Rules:** None.
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## Assign Defect to Developer

**Requirement IDs:** FR-DEF-002, FR-DEF-006, FR-LNK-001, FR-LNK-003.
**Purpose:** Route a defect to a Developer, generating their scoped access link.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /defects/{defectId}/assign`
**Request:** Path: `defectId`. Body: `recipientName` (optional — named vs. generic link, PD-044), `expiresInHours` (optional, defaults to 24 — PD-042).
**Successful Response:** `201 Created` — the defect with `assignedViaAccessLinkId` set. The link itself is **not** returned in this response body — it is delivered only by email (FR-NOT-003), to avoid it appearing unnecessarily in logs/browser history.
**Business Rules:** Link is scoped only to defect-status-update for this specific defect (NFR-SEC-005). Default expiry 24h unless overridden.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Creates an Access Link; schedules a delivery email (background job, retried per FR-NOT-005); creates an audit entry.
**Audit Behaviour:** Audited.
**Security Considerations:** The link is the entire access credential for the Developer from this point forward — never logged or displayed in the UI beyond the email itself.

---

## View Defect History

**Requirement IDs:** FR-DEF-005.
**Purpose:** View the full history of status changes and actions on a defect.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /defects/{defectId}/history`
**Request:** Path: `defectId`. Query: pagination.
**Successful Response:** `200 OK` — list of history entries, each attributed to a user or an access link/role (FR-AUD-002 — link-based entries identify the link/role, not a verified individual identity).
**Business Rules:** Append-only — no endpoint exists to edit or delete a history entry.
**Error Conditions:** `404 not_found`.
**Side Effects:** None (read-only).
