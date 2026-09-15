# API — Reporting (Test Report & Regression Report)

**Module:** RPT. See `docs/technical/api-spec.md` for shared conventions. Report approval, comments, and dashboard viewing via a link are documented in `links.md`. Template contracts in `templates.md`; workflow action endpoints in `workflows.md`.

**CHANGE-001 / `reports` → `qa_documents` compatibility (APID-016, see `api-decisions.md`):** the database generalized `reports` to `qa_documents` (DBD-016), but this API **keeps the existing `/reports` paths for Test Report unchanged** and adds **parallel `/regression-reports` paths** for the new Regression Report document type, rather than mechanically renaming every endpoint to `/qa-documents`. Both are the same underlying resource server-side (`qa_documents`, filtered by `documentType`) — table naming does not dictate API naming (§15 of the task). No public `/qa-documents` collection endpoint exists at MVP; no approved requirement calls for a cross-type generic list.

**CHANGE-002 — Methodology-Neutral QA Scope (APID-021, see `api-decisions.md`):** both endpoint families below accept optional `scopeValue`/`scopeStartDate`/`scopeEndDate` fields (FR-RPT-006) — inert, methodology-neutral document metadata, never Sprint/Cycle/Release-specific. See `users.md` for the organisation's optional `preferredScopeTerminology` (FR-QAOM-013), which only affects UI copy.

---

## Generate Report

**Requirement IDs:** FR-RPT-001, FR-RPT-002, FR-RPT-005, FR-RPT-006, FR-TPL-009, PD-038.
**Purpose:** Compile a Test Report (including its Post-Deployment section) or a Regression Report for a project, against the project's applicable published template.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /projects/{projectId}/reports` (Test Report); `POST /projects/{projectId}/regression-reports` (Regression Report, CHANGE-001)
**Request:** Path: `projectId`. Header: `Idempotency-Key` (APID-006). Body (all optional, CHANGE-002/APID-021): `scopeValue` (string), `scopeStartDate` (date), `scopeEndDate` (date) — methodology-neutral QA Scope metadata (FR-RPT-006); `scopeEndDate` must not precede `scopeStartDate` if both are given. No other date-range or filter parameters — no approved requirement calls for a partial report; it compiles current project data as of generation time. No `templateId` field — the server resolves the project's applicable published template for the relevant document type, same principle as Test Case creation (`test-cases.md`).
**Successful Response:** `201 Created` — the full content snapshot, `documentTemplateVersionId`, `workflowState`/`availableActions` (`workflows.md`, initial state per the project's configured workflow shape for this document type), `scopeValue`/`scopeStartDate`/`scopeEndDate` (echoed, `null` if not supplied) (target: within 5 seconds per NFR-PERF-003; handled synchronously, not via the async pattern used for AI generation).
**Business Rules:** Test Report is a single type (PD-038) — its response always includes a Post-Deployment section, empty/not-applicable if no production testing data exists; never a separate "pre-deployment"/"post-deployment" artifact. Regression Report has no equivalent section requirement — its content shape follows its own applicable template. QA Scope fields are optional, inert document metadata (PD-064) — they never affect content compilation, workflow, or Quality Gate evaluation, and are set once at generation time (consistent with this endpoint's existing immutable-snapshot behaviour — there is no scope edit path; regenerating creates a new document with its own scope).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Creates an immutable content snapshot (regenerating produces a new record, never an edit to an old one).
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** Standard project access.

---

## List Reports / Regression Reports

**Requirement IDs:** FR-RPT-001, FR-RPT-005.
**Purpose:** List previously generated documents of the relevant type for a project.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `GET /projects/{projectId}/reports`; `GET /projects/{projectId}/regression-reports`
**Request:** Path: `projectId`. Query: pagination, `?metaState=...` (CHANGE-001, same bounded values as `workflows.md`).
**Successful Response:** `200 OK` — list of document summaries (`id`, `generatedAt`, `generatedBy`, `workflowState`, `scopeValue` (CHANGE-002, `null` if not set)).
**Business Rules:** None.
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## View Report / Regression Report

**Requirement IDs:** FR-RPT-002, FR-RPT-005.
**Purpose:** View a document's full content.
**Actor/Permission:** QA Manager, Admin. (BA/PO views a Test Report via a scoped link — see `links.md`; that response is deliberately narrower, not this same endpoint. Regression Report has no approved link-based viewing path at MVP — no FR calls for one.)
**Method and Path:** `GET /reports/{reportId}`; `GET /regression-reports/{regressionReportId}`
**Request:** Path: the relevant ID.
**Successful Response:** `200 OK` — the document's full content snapshot (including the Post-Deployment section for Test Report), `documentTemplateVersionId`, `configurableFieldValues`, `workflowState`/`availableActions`, `scopeValue`/`scopeStartDate`/`scopeEndDate` (CHANGE-002, `null` if not set), and (Test Report only) `linkApproval` (`workflows.md`'s Report Approval vs. Document Workflow section).
**Business Rules:** **This response must never include Report Comments** (PD-040) — comments are structurally a separate resource with separate, QA-Tester-only visibility (see below), not a field on this response, even for QA Manager/Admin. This applies identically to Regression Report if/when comments are ever approved for it (not currently — FR-RPT-004 is Test-Report-specific).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None.
**Security Considerations:** The comment-exclusion rule above is the most important security property of this endpoint.

---

## Regression Report Workflow & Readiness

**Requirement IDs:** FR-RPT-005, FR-QG-001 (condition 4, "regression activity completed").
A Regression Report's `workflowState` is advanced via the same bounded actions as any workflow-governed subject (`POST /regression-reports/{id}/workflow/{action}`, per `workflows.md` — note the path uses `qa-documents`-generic actions internally but is exposed at the product-friendly `/regression-reports/{id}/workflow/...` path here, consistent with this document's compatibility decision). The `regression_activity_completed` Quality Gate (`quality-gates.md`) reads exactly this document's existence and, where the organisation configures it, its `workflowState.metaState === "approved"` — there is no separate "regression completed" flag anywhere else in the API.

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
