# API — Audit / History

**Module:** AUD. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions.

---

## View Audit History

**Requirement IDs:** FR-AUD-001, FR-AUD-002, FR-AUD-003, FR-AUD-004.
**Purpose:** View the organisation's audit trail of key actions.
**Actor/Permission:** QA Manager, Admin **only** — QA Tester and all link-based roles are denied (PD-041, FR-AUD-003).
**Method and Path:** `GET /organisations/{orgId}/audit-log`
**Request:** Path: `orgId`. Query: pagination (cursor, ordered most-recent-first — matching the `idx_audit_log_organisation_occurred` index), `?actionType=`, `?fromDate=`/`?toDate=`.
**Successful Response:** `200 OK` — list of audit entries (`actionType`, `affectedEntityType`/`affectedEntityId`, `performedBy` [user or link/role], `occurredAt`).
**Business Rules:** Read-only — no endpoint exists to edit or delete an audit entry, for any role, including Admin (NFR-DI-002).
**Error Conditions:** `403 forbidden` (QA Tester or link-based role — enforced at the API layer itself, not merely hidden in the UI).
**Side Effects:** None.
**Audit Behaviour:** Viewing audit history is not itself audited.
**Security Considerations:** This endpoint's own access control is one of the most important in the API — a leak here would defeat the entire purpose of restricting audit visibility (PD-041).
