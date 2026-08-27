# API — Organisation & User Management

**Modules:** ORG, USR. See `docs/technical/api-spec.md` for shared conventions.

---

## View Organisation Settings

**Requirement IDs:** FR-ORG-003.
**Purpose:** Retrieve organisation-level settings.
**Actor/Permission:** Admin, QA Manager.
**Method and Path:** `GET /organisations/{orgId}`
**Request:** Path: `orgId`.
**Successful Response:** `200 OK` — organisation resource (`id`, `name`, `trialUsed`, `createdAt`).
**Business Rules:** None beyond tenant isolation.
**Error Conditions:** `403 forbidden` (QA Tester or link-based role); `404 not_found` (wrong organisation).
**Side Effects:** None (read-only).
**Audit Behaviour:** Not audited.
**Security Considerations:** Standard tenant isolation.
**Notes:** The full scope of "organisation settings" beyond name/subscription is an open item (`functional-requirements.md`).

---

## Update Organisation Settings

**Requirement IDs:** FR-ORG-003.
**Purpose:** Update organisation-level settings (currently: name).
**Actor/Permission:** Admin only.
**Method and Path:** `PATCH /organisations/{orgId}`
**Request:** Path: `orgId`. Body: `name`.
**Successful Response:** `200 OK` — updated organisation resource.
**Business Rules:** None beyond tenant isolation.
**Error Conditions:** `403 forbidden` (non-Admin); `422 validation_error`.
**Side Effects:** Changes data.
**Audit Behaviour:** Audited.
**Security Considerations:** Admin-only, strictly enforced.

---

## Invite Organisation Member

**Requirement IDs:** FR-ORG-004, FR-ORG-005.
**Purpose:** Invite a new member to the organisation with a specified role.
**Actor/Permission:** Admin, QA Manager.
**Method and Path:** `POST /organisations/{orgId}/invitations`
**Request:** Path: `orgId`. Body: `invitedEmail`, `proposedRole` (`admin` | `qa_manager` | `qa_tester`, required — FR-ORG-005).
**Successful Response:** `201 Created` — the invitation resource (`status: pending`).
**Business Rules:** Blocked (`409 conflict`, redirecting the client to seat purchase) if it would exceed the organisation's current seat count (FR-SUB-007).
**Error Conditions:** `403 forbidden` (QA Tester); `422 validation_error` (missing role); `409 conflict` (seat limit).
**Side Effects:** Creates an Invitation; sends invitation email.
**Audit Behaviour:** Audited.
**Security Considerations:** Standard role/tenant checks.

---

## List Invitations

**Requirement IDs:** FR-ORG-004.
**Purpose:** View pending invitations for the organisation.
**Actor/Permission:** Admin, QA Manager.
**Method and Path:** `GET /organisations/{orgId}/invitations`
**Request:** Path: `orgId`. Query: pagination.
**Successful Response:** `200 OK` — list of invitations.
**Business Rules:** None.
**Error Conditions:** `403 forbidden` (QA Tester).
**Side Effects:** None.
**Audit Behaviour:** Not audited.

*(Accept Invitation is documented in `authentication.md`, since it is a pre-authentication, public-token action.)*

---

## List Organisation Members

**Requirement IDs:** FR-USR-006.
**Purpose:** View organisation members and their roles.
**Actor/Permission:** Admin, QA Manager.
**Method and Path:** `GET /organisations/{orgId}/members`
**Request:** Path: `orgId`. Query: pagination, `?q=` (name/email substring search).
**Successful Response:** `200 OK` — list of members (`id`, `name`, `email`, `role`, `status`).
**Business Rules:** None.
**Error Conditions:** `403 forbidden` (QA Tester — whether QA Tester should have read access here is an open item, see `functional-requirements.md`).
**Side Effects:** None.
**Audit Behaviour:** Not audited (read-only).

---

## Change Member Role

**Requirement IDs:** FR-USR-003, FR-ORG-006.
**Purpose:** Change another organisation member's role.
**Actor/Permission:** Admin only (PD-031).
**Method and Path:** `PATCH /organisations/{orgId}/members/{userId}`
**Request:** Path: `orgId`, `userId`. Body: `role` (`admin` | `qa_manager` | `qa_tester`).
**Successful Response:** `200 OK` — updated member resource.
**Business Rules:** Rejected if the target is the organisation's last remaining Admin and the new role is not `admin` (FR-ORG-006, PD-030).
**Error Conditions:** `403 forbidden` (non-Admin actor); `409 conflict` (last-Admin protection); `404 not_found`.
**Side Effects:** Changes data.
**Audit Behaviour:** Audited (explicitly a minimum auditable action, FR-AUD-001).
**Security Considerations:** The single most sensitive permission-changing endpoint in the API — Admin-only, no exceptions.

---

## Remove Organisation Member

**Requirement IDs:** FR-USR-005, FR-ORG-006.
**Purpose:** Remove a member from the organisation.
**Actor/Permission:** Admin only.
**Method and Path:** `DELETE /organisations/{orgId}/members/{userId}`
**Request:** Path: `orgId`, `userId`.
**Successful Response:** `204 No Content`.
**Business Rules:** Rejected if the target is the organisation's last remaining Admin (FR-ORG-006). Removing a project creator only revokes *their* project access — other members, and Admin/QA Manager's standing access, are unaffected (FR-PRJ-007, PD-032).
**Error Conditions:** `403 forbidden`; `409 conflict` (last Admin).
**Side Effects:** User status set to `removed` (not hard-deleted — historical attribution is preserved, per `database.md`); revokes all Project Memberships for this user.
**Audit Behaviour:** Audited.
**Security Considerations:** Admin-only.
