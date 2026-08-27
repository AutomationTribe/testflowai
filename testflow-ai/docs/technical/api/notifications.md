# API — Notifications

**Module:** NOT. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions. Email delivery to link-based roles is not modeled as an API resource here — it is the delivery mechanism for Access Links themselves (see `links.md`, `defects.md`).

---

## List My Notifications

**Requirement IDs:** FR-NOT-001.
**Purpose:** View in-app notifications for the authenticated organisation member.
**Actor/Permission:** Any authenticated organisation member (Admin, QA Manager, QA Tester).
**Method and Path:** `GET /me/notifications`
**Request:** Query: pagination, `?read=true|false`.
**Successful Response:** `200 OK` — list of notifications (`type`, `relatedEntityType`/`relatedEntityId`, `read`, `createdAt`).
**Business Rules:** Only the caller's own notifications are ever returned — never another user's, even within the same organisation.
**Error Conditions:** `401 unauthorized`.
**Side Effects:** None.
**Audit Behaviour:** Not audited.
**Security Considerations:** Strictly scoped to the authenticated caller — object-level authorization applies even though this looks like a "list my own things" endpoint with low apparent risk.

---

## Mark Notification Read

**Requirement IDs:** FR-NOT-001.
**Purpose:** Mark a notification as read.
**Actor/Permission:** The notification's recipient only.
**Method and Path:** `PATCH /notifications/{notificationId}`
**Request:** Path: `notificationId`. Body: `read: true`.
**Successful Response:** `200 OK` — updated notification.
**Business Rules:** None.
**Error Conditions:** `403 forbidden` (not the recipient); `404 not_found`.
**Side Effects:** Changes data.
**Audit Behaviour:** Not audited.
