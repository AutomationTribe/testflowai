# API — Reporting

**Module:** RPT. See `docs/technical/api-spec.md` for shared conventions. Report approval, comments, and dashboard viewing via a link are documented in `links.md`.

---

## Generate Report

**Requirement IDs:** FR-RPT-001, FR-RPT-002, PD-038.
**Purpose:** Compile the single report type (including its Post-Deployment section) for a project.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /projects/{projectId}/reports`
**Request:** Path: `projectId`. Header: `Idempotency-Key` (APID-006). No date-range or filter parameters — no approved requirement calls for a partial report; it compiles current project data as of generation time.
**Successful Response:** `201 Created` — the full report content snapshot (target: within 5 seconds per NFR-PERF-003; handled synchronously, not via the async pattern used for AI generation).
**Business Rules:** There is only one report type (PD-038) — the response always includes a Post-Deployment section, empty/not-applicable if no production testing data exists. Never a separate "pre-deployment" vs. "post-deployment" artifact.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Creates an immutable report snapshot (regenerating produces a new Report record, never an edit to an old one).
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** Standard project access.

---

## List Reports

**Requirement IDs:** FR-RPT-001.
**Purpose:** List previously generated reports for a project.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `GET /projects/{projectId}/reports`
**Request:** Path: `projectId`. Query: pagination.
**Successful Response:** `200 OK` — list of report summaries (`id`, `generatedAt`, `generatedBy`).
**Business Rules:** None.
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## View Report

**Requirement IDs:** FR-RPT-002.
**Purpose:** View a report's full content.
**Actor/Permission:** QA Manager, Admin. (BA/PO views via a scoped link — see `links.md`; that response is deliberately narrower, not this same endpoint.)
**Method and Path:** `GET /reports/{reportId}`
**Request:** Path: `reportId`.
**Successful Response:** `200 OK` — the report's full content snapshot, including its Post-Deployment section.
**Business Rules:** **This response must never include Report Comments** (PD-040) — comments are structurally a separate resource with separate, QA-Tester-only visibility (see below), not a field on this response, even for QA Manager/Admin.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None.
**Security Considerations:** The comment-exclusion rule above is the most important security property of this endpoint.

---

## View Report Comments (QA Tester Only)

**Requirement IDs:** FR-RPT-004, PD-040.
**Purpose:** Let the relevant QA Tester(s) see private BA/PO feedback on a report.
**Actor/Permission:** The QA Tester(s) the comments are scoped to — **not** QA Manager, Admin, Developer, or Stakeholder.
**Method and Path:** `GET /reports/{reportId}/comments`
**Request:** Path: `reportId`. Query: pagination.
**Successful Response:** `200 OK` — list of comments visible to this specific QA Tester.
**Business Rules:** Visibility is per-comment, tied to the `visibleToUserId` set when the comment was created (PD-040) — not simply "any QA Tester on the project."
**Error Conditions:** `403 forbidden` (a QA Manager, Admin, or a QA Tester the comments aren't scoped to attempting access).
**Side Effects:** None.
**Security Considerations:** This is the read-side enforcement of PD-040's privacy rule — must be checked per comment, not just per role.
