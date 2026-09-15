# API — Defect Management

**Module:** DEF. See `docs/technical/api-spec.md` for shared conventions. Link-based defect status updates are documented in `links.md` (the endpoint lives at `/links/{linkToken}/...` since it requires no login). Defect Priority option management is documented in `severity-priority.md` (CHANGE-001, new).

**CHANGE-001 summary:** `status` is **unchanged** (DBD-018 — Defect status deliberately remains fixed/non-configurable; Stage 2 did not approve a configurable Defect lifecycle). `severity` and `priority` are added (FR-DEF-007/008). Defect is **not** a templated document type — it has no `documentTemplateVersionId`, no `configurableFieldValues`, no workflow shape.

---

## Log Defect

**Requirement IDs:** FR-DEF-001, FR-DEF-007, FR-DEF-008.
**Purpose:** Log a defect from a failed execution result.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /execution-results/{resultId}/defects`
**Request:** Path: `resultId`. Body: `title`, `description`, `severity` (optional, one of `critical`|`high`|`medium`|`low` — the stable semantic value, not a display label; defaults to `medium` if omitted, matching `schema.sql`'s column default), `priorityOptionId` (optional — FK into the organisation's `defect_priority_options`, `severity-priority.md`).
**Successful Response:** `201 Created` — the defect (`status: open` — DBD-008 vocabulary unchanged: Open, Pending, Closed, Removed; `severity: { semantic: "critical", label: "S1 - Showstopper" }` — see Severity Representation below; `priority: { optionId, label } | null`).
**Business Rules:** Only loggable from a `fail` result. `severity` in the request body is always the stable semantic value (`critical`/`high`/`medium`/`low`) — the API never accepts an organisation's display label as input, only as output (§17 of the task).
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (result status is not `fail`); `422 validation_error` (`INVALID_FIELD_VALUE` for an out-of-enum `severity`; `INVALID_FIELD_OPTION` for an unknown/inactive `priorityOptionId`).
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
**Successful Response:** `200 OK` — defect resource, including its linked execution result/test case reference, `severity`, `priority`.
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## Update Defect Severity / Priority

**Requirement IDs:** FR-DEF-007, FR-DEF-008.
**Purpose:** Change a defect's severity or priority after logging (status changes remain via the existing, unchanged status-update path — see Note below).
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `PATCH /defects/{defectId}`
**Request:** Path: `defectId`. Body: any of `severity` (stable semantic value), `priorityOptionId`.
**Successful Response:** `200 OK` — updated defect.
**Business Rules:** `status` is **not** accepted on this endpoint — CHANGE-001 does not add a new status-change path; the pre-existing status-update behaviour (organisation-member and link-based, `links.md`) is unchanged and untouched by this rewrite.
**Error Conditions:** `403 forbidden`; `404 not_found`; `422 validation_error` (same codes as Log Defect above).
**Side Effects:** Updates data; reasonable to log.
**Security Considerations:** `status` remains changeable only via its existing, separate mechanism — never through this endpoint, to avoid accidentally widening DBD-018's deliberate boundary.

---

## List Defects

**Requirement IDs:** FR-DEF-001, FR-DEF-007, FR-DEF-008, FR-QG-001.
**Purpose:** List/filter defects in a project.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /projects/{projectId}/defects`
**Request:** Path: `projectId`. Query: pagination, `?status=open|pending|closed|removed`, `?severity=critical|high|medium|low` (CHANGE-001, filters on the stable semantic, never on display label — §17 of the task), `?priorityOptionId={id}` (CHANGE-001).
**Successful Response:** `200 OK` — list of defects.
**Business Rules:** `severity`/`priorityOptionId` are filterable because both are typed, indexed columns (`database.md` §12, `idx_defects_severity_semantic`/`idx_defects_priority_option_id`).
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## Severity Representation

Every defect response's `severity` field has this shape (§17 of the task's explicit example):

```json
{
  "severity": {
    "semantic": "critical",
    "label": "S1 - Showstopper"
  }
}
```

`semantic` is the stable, TestFlow-controlled value that Quality Gate evaluation (`quality-gates.md`) and cross-organisation reporting always key off — it is **never** organisation-editable through any endpoint. `label` is the organisation's currently configured display text for that semantic level (`severity-priority.md`), resolved server-side at read time — a client must never use `label` for gate logic, filtering by semantic meaning, or persisted business logic of any kind; it is display-only.

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
