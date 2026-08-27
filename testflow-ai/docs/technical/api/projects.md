# API — Project Management

**Module:** PRJ. See `docs/technical/api-spec.md` for shared conventions.

---

## Create Project

**Requirement IDs:** FR-PRJ-001.
**Purpose:** Create a new project within the organisation.
**Actor/Permission:** Admin, QA Manager, QA Tester.
**Method and Path:** `POST /organisations/{orgId}/projects`
**Request:** Path: `orgId`. Body: `name`.
**Successful Response:** `201 Created` — the project (`status: active`, creator granted a Project Membership).
**Business Rules:** Blocked entirely if the organisation has no active trial/paid subscription (FR-SUB-002).
**Error Conditions:** `403 forbidden` (mandatory-subscription block, or link-based role); `422 validation_error`.
**Side Effects:** Creates Project and a Project Membership (creator, `isCreatorGrant: true`).
**Audit Behaviour:** Audited.
**Security Considerations:** Standard tenant isolation.

---

## List Projects

**Requirement IDs:** FR-PRJ-004.
**Purpose:** List projects visible to the caller.
**Actor/Permission:** Admin, QA Manager, QA Tester.
**Method and Path:** `GET /organisations/{orgId}/projects`
**Request:** Path: `orgId`. Query: pagination, `?q=` (name search).
**Successful Response:** `200 OK` — list of projects. Admin/QA Manager see all organisation projects; QA Tester sees only projects they created or were added to (FR-PRJ-004) — this filtering happens server-side, not client-side.
**Business Rules:** Visibility rule above is enforced regardless of any client-supplied filter.
**Error Conditions:** None beyond standard auth.
**Side Effects:** None.
**Audit Behaviour:** Not audited.
**Security Considerations:** The visibility rule (not just an access-control check, but a *filtering* rule) must be applied at the query level, not post-filtered in application code, to avoid ever constructing a response that briefly holds unauthorized data.

---

## View Project

**Requirement IDs:** FR-PRJ-002.
**Purpose:** View a single project's details.
**Actor/Permission:** Any member with access (per FR-PRJ-004's visibility rule).
**Method and Path:** `GET /projects/{projectId}`
**Request:** Path: `projectId`.
**Successful Response:** `200 OK` — project resource.
**Business Rules:** None beyond access/visibility.
**Error Conditions:** `404 not_found` (no access, or wrong organisation — same response either way, per tenant-isolation security principle).
**Side Effects:** None.
**Audit Behaviour:** Not audited.

---

## Update Project

**Requirement IDs:** FR-PRJ-002.
**Purpose:** Update project details.
**Actor/Permission:** Admin, QA Manager, QA Tester (with project access).
**Method and Path:** `PATCH /projects/{projectId}`
**Request:** Path: `projectId`. Body: `name`.
**Successful Response:** `200 OK` — updated project.
**Business Rules:** None beyond access.
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (project archived).
**Side Effects:** Changes data.
**Audit Behaviour:** Not on the FR-AUD-001 minimum list; reasonable to log.

---

## Archive Project

**Requirement IDs:** FR-PRJ-003.
**Purpose:** Archive a project, preserving its history read-only.
**Actor/Permission:** Admin, QA Manager, QA Tester (with project access).
**Method and Path:** `POST /projects/{projectId}/archive`
**Request:** Path: `projectId`.
**Successful Response:** `200 OK` — project with `status: archived`.
**Business Rules:** Deletion is not offered anywhere for projects with history — archiving is the only retirement mechanism.
**Error Conditions:** `403 forbidden`; `409 conflict` (already archived).
**Side Effects:** Project becomes read-only; no cascade to child entities is defined at the project level (unlike Requirement archiving) — requirements/test cases/runs within remain in their own individual states.
**Audit Behaviour:** Audited (explicitly a minimum action, alongside requirement archive).

---

## Add Project Member

**Requirement IDs:** FR-PRJ-005.
**Purpose:** Grant an organisation member access to a project.
**Actor/Permission:** Admin, QA Manager, QA Tester (with project access).
**Method and Path:** `POST /projects/{projectId}/members`
**Request:** Path: `projectId`. Body: `userId`.
**Successful Response:** `201 Created` — the Project Membership resource.
**Business Rules:** This is an access grant only, not a role assignment — the added user's existing organisation role governs their capabilities (PD-017).
**Error Conditions:** `403 forbidden` (actor has no project access); `404 not_found` (user not an organisation member); `409 conflict` (already a member).
**Side Effects:** Creates a Project Membership.
**Audit Behaviour:** Not on the minimum list; reasonable to log.

---

## Remove Project Member

**Requirement IDs:** FR-PRJ-006, FR-PRJ-007.
**Purpose:** Revoke a member's access to a specific project.
**Actor/Permission:** Admin, QA Manager, QA Tester (with project access).
**Method and Path:** `DELETE /projects/{projectId}/members/{userId}`
**Request:** Path: `projectId`, `userId`.
**Successful Response:** `204 No Content`.
**Business Rules:** If the removed user is the project's creator, only their access is revoked — Admin/QA Manager standing access (and any other member's) is unaffected (FR-PRJ-007, PD-032). Organisation membership itself is untouched (this is project-level only).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Deletes the Project Membership row for this user only.
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** Must not cascade beyond the single targeted membership row — this is the API-level manifestation of FR-PRJ-007's core guarantee.
