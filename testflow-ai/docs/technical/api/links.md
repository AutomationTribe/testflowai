# API — Link-Based Access

**Module:** LNK. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions. Defect assignment (which generates a link) is documented in `defects.md`; report/dashboard share-link generation below.

**Read this first:** every endpoint in this document is used by BA/PO, Developer, or Stakeholder — none of whom have accounts, log in, or are identity-verified (PD-018, PD-043). The link identifier in the path (`{linkToken}`) *is* the credential. All error handling here must follow the security principles in `api-spec.md` precisely (uniform "invalid or expired" responses; `403` not `404` for wrong-scope use).

---

## Generate Report Share Link

**Requirement IDs:** FR-LNK-001, FR-LNK-003.
**Purpose:** Create a BA/PO access link scoped to a specific report.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /reports/{reportId}/share-links`
**Request:** Path: `reportId`. Body: `recipientName` (optional, PD-044), `expiresInHours` (optional, default 24, PD-042).
**Successful Response:** `201 Created` — the link resource, `id` **not** exposed as a usable URL in this response beyond what's needed for the generator's own reference (the actual link is delivered by email, FR-NOT-003).
**Business Rules:** Scoped to report-approval-and-comment only (NFR-SEC-005).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Creates an Access Link; schedules delivery email.
**Audit Behaviour:** Audited.
**Security Considerations:** See module header.

---

## Generate Dashboard Share Link

**Requirement IDs:** FR-LNK-001, FR-LNK-003, FR-DASH-003.
**Purpose:** Create a Stakeholder access link scoped to a project's dashboard.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /projects/{projectId}/dashboard/share-links`
**Request:** Path: `projectId`. Body: `recipientName` (optional), `expiresInHours` (optional, default 24).
**Successful Response:** `201 Created` — the link resource.
**Business Rules:** Scoped to read-only dashboard viewing only.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Creates an Access Link; schedules delivery email.
**Audit Behaviour:** Audited.

---

## Revoke Access Link

**Requirement IDs:** FR-LNK-005.
**Purpose:** Cut off a link's access before its natural expiry.
**Actor/Permission:** The link's original generator, or any QA Manager/Admin with project access.
**Method and Path:** `DELETE /access-links/{linkId}`
**Request:** Path: `linkId`.
**Successful Response:** `204 No Content`.
**Business Rules:** Once revoked, all subsequent uses are denied immediately, with no grace window (NFR-SEC-006).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Sets `revoked: true`.
**Audit Behaviour:** Audited.

---

## Resolve Link (What Does It Grant)

**Requirement IDs:** FR-LNK-002, FR-LNK-004.
**Purpose:** Let a link holder discover what the link lets them do, before taking the specific action.
**Actor/Permission:** Anyone holding a valid link — no identity check (PD-043).
**Method and Path:** `GET /links/{linkToken}`
**Request:** Path: `linkToken`.
**Successful Response:** `200 OK` — minimal scope description (`scopeType`, `intendedRole`, and the specific target's display-relevant summary only — e.g., a report's title, not its full content).
**Business Rules:** Usable multiple times until expiry/revocation (FR-LNK-004) — this call itself does not consume or affect the link's validity.
**Error Conditions:** A single uniform `401 unauthorized` ("invalid or expired") for any invalid/expired/revoked link — never distinguishing *why* it's invalid (security principle, `api-spec.md`).
**Side Effects:** None (read-only; does not count as "using" the link's scoped action).

---

## Update Defect Status via Link

**Requirement IDs:** FR-DEF-003, FR-LNK-002, FR-LNK-004.
**Purpose:** Let a Developer, holding only the link, update the assigned defect's status.
**Actor/Permission:** Anyone holding a valid link scoped to `defect_status_update` for this defect.
**Method and Path:** `PATCH /links/{linkToken}/defect-status`
**Request:** Path: `linkToken`. Body: `status` (`open` | `pending` | `closed` | `removed` — DBD-008).
**Successful Response:** `200 OK` — minimal confirmation (`status` only — no other defect/project data, per NFR-SEC-005).
**Business Rules:** Link must be unexpired, unrevoked, and scoped to this exact defect (not just any `defect_status_update` link). Multi-use — not a one-time token.
**Error Conditions:** `401 unauthorized` (expired/revoked — uniform message); `403 forbidden` (valid link, but wrong scope — e.g., a report-approval link used here); `422 validation_error` (invalid status value).
**Side Effects:** Changes data; creates a Defect History Entry and an Audit Log Entry attributed to the link/role, not a verified individual (FR-AUD-002).
**Audit Behaviour:** Audited.
**Security Considerations:** `403` (not `404`) for wrong-scope use, per the security principle in `api-spec.md` — the caller already possesses a link, so confirming scope mismatch (rather than pretending nothing exists) is the correct, consistent signal.

---

## Approve/Reject Report via Link

**Requirement IDs:** FR-RPT-003, PD-039.
**Purpose:** BA/PO records a formal decision on a report.
**Actor/Permission:** Anyone holding a valid link scoped to `report_approval` for this report.
**Method and Path:** `POST /links/{linkToken}/report-approval`
**Request:** Path: `linkToken`. Body: `decision` (`approved` | `rejected`).
**Successful Response:** `201 Created` — confirmation only.
**Business Rules:** **This action must never trigger, gate, or block any other action or workflow** (PD-039) — a contract-level constraint on this endpoint's side effects, not just an internal implementation detail. Multi-use link — a report can accumulate more than one approval/rejection record over time.
**Error Conditions:** `401 unauthorized` (expired/revoked); `403 forbidden` (wrong scope).
**Side Effects:** Creates a Report Approval Record. **Explicitly no other side effect** — this absence is itself an approved requirement, not an oversight.
**Audit Behaviour:** Audited (attributed to the link/role).

---

## Comment on Report via Link

**Requirement IDs:** FR-RPT-004, PD-040.
**Purpose:** BA/PO leaves private feedback to the QA Tester.
**Actor/Permission:** Anyone holding a valid link scoped to `report_comment` for this report.
**Method and Path:** `POST /links/{linkToken}/report-comments`
**Request:** Path: `linkToken`. Body: `text`.
**Successful Response:** `201 Created` — confirmation only.
**Business Rules:** Comment is stored separately from `reports.contentSnapshot` and is visible only to the QA Tester associated with the project/report (PD-040) — never to QA Manager, Admin, Developer, or Stakeholder, and never included in `GET /reports/{reportId}`'s response.
**Error Conditions:** `401 unauthorized`; `403 forbidden` (wrong scope).
**Side Effects:** Creates a Report Comment.
**Audit Behaviour:** Not on the strict minimum list; reasonable to log the action occurred (without necessarily logging the comment text itself in the audit entry).
**Security Considerations:** The QA-Tester-only visibility rule is enforced structurally (a separate resource, a separate read path — see `reports.md`), not as a conditional filter on shared data.

---

## View Dashboard via Link

**Requirement IDs:** FR-DASH-003.
**Purpose:** Stakeholder views a read-only project dashboard.
**Actor/Permission:** Anyone holding a valid link scoped to `dashboard_view` for this project.
**Method and Path:** `GET /links/{linkToken}/dashboard`
**Request:** Path: `linkToken`.
**Successful Response:** `200 OK` — the same dashboard data as `GET /projects/{projectId}/dashboard` (see `dashboards.md`), read-only, no edit capability exposed.
**Business Rules:** Multi-use, read-only.
**Error Conditions:** `401 unauthorized`; `403 forbidden` (wrong scope).
**Side Effects:** None.
