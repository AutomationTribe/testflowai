# API — Project Management

**Module:** PRJ. See `docs/technical/api-spec.md` for shared conventions.

---

## Create Project

**Requirement IDs:** FR-PRJ-001, FR-QAOM-012, FR-POL-002; PD-066, PD-067, PD-068.
**Purpose:** Create a new project within the organisation, pinned to the organisation's current published QA configuration version.
**Actor/Permission:** Admin, QA Manager, QA Tester.
**Method and Path:** `POST /organisations/{orgId}/projects`
**Request:** Path: `orgId`. Body: `name` (required, trimmed, 1–120 characters); `description` (optional, at most 500 characters, blank stored as null); `qaConfigurationVersionId` (optional uuid — if sent it must be the organisation's current published version, otherwise the request is rejected; omitted means "the current published version"). Organisation and creator always come from the session, never the body; `projectCode`, `status` and any other body fields are ignored.
**Successful Response:** `201 Created` — the project: `id`, `organisationId`, `projectCode` (`PRJ-001`, per-organisation sequential), `name`, `description`, `status: active`, `createdAt`, `createdBy {userId, name}`, `qaConfiguration {versionId, versionNumber, presetOrigin}`, `members [{userId, name}]` (the creator, via a Project Membership with `isCreatorGrant: true`).
**Business Rules:** Blocked entirely if the organisation has no active trial/paid subscription (FR-SUB-002). Pinned once to the current published version and never auto-updated (FR-QAOM-012). A version from another organisation, a draft, a superseded version, or an unknown id all return the same `422` (nothing about other tenants is revealed).
**Error Conditions:** `401 unauthorized`; `403 subscription_required` (mandatory-subscription block); `404 not_found` (orgId is not the caller's organisation, or the organisation has no published QA configuration — a data-integrity fault FR-QAOM-001 should make impossible); `422 validation_error` (`fields.name`, `fields.description`, `fields.qaConfigurationVersionId`).
**Side Effects:** Creates the Project and the creator's Project Membership, and advances the organisation's project-code counter, in one transaction.
**Audit Behaviour:** Logged through the structured logger (`project_created`). Writing an Audit Log Entry is deferred — the audit module is not built yet (see `technical-debt.md` TD-006).
**Security Considerations:** Standard tenant isolation; the pinned configuration is enforced to belong to the caller's organisation both in the service and by a composite foreign key (DBD-025).

---

## List Projects

**Requirement IDs:** FR-PRJ-004.
**Purpose:** List projects visible to the caller.
**Actor/Permission:** Admin, QA Manager, QA Tester.
**Method and Path:** `GET /organisations/{orgId}/projects`
**Request:** Path: `orgId`. Query: `cursor`, `limit` (1–100, default 25) — cursor pagination (APID-002; the web UI pages with 10/25/50 — pending PD-069); `q` (case-insensitive match on name — approved; matching the project code and the 120-character limit are pending PD-069); `status` (`active` | `archived`) and `qaConfigurationVersionId` (uuid) — **pending PD-069, not yet an approved filter**.
**Successful Response:** `200 OK` — `{ items, nextCursor, counts, qaConfigurations }`. `items` are projects as above, newest first. `counts` (`total`, `active`, `archived`; pending PD-069) cover the caller's visible projects honouring `q` and the QA configuration filter but not `status`. `qaConfigurations` (pending PD-069) lists the distinct QA configuration versions among the caller's visible projects (filter options). Admin/QA Manager see all organisation projects; a QA Tester sees only projects they hold a Project Membership on (the creator holds one from creation) — filtering happens server-side, in the query.
**Business Rules:** Visibility rule above is enforced regardless of any client-supplied filter. Blocked with `403 subscription_required` when the organisation has no active trial/subscription (FR-SUB-002).
**Error Conditions:** `401 unauthorized`; `403 subscription_required`; `404 not_found` (orgId is not the caller's organisation); `422 validation_error` (malformed cursor/limit/status/QA-configuration filter, or `q` over 120 characters).
**Side Effects:** None.
**Audit Behaviour:** Not audited.
**Security Considerations:** The visibility rule (not just an access-control check, but a *filtering* rule) is applied at the query level, not post-filtered in application code, and the same rule governs `counts` and `qaConfigurations` so metadata never reveals hidden projects.

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
