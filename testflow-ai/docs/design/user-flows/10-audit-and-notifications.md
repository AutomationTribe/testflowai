# User Flows — Audit History & Notifications

---

## UXF-015 — Audit History Review

**Priority:** Supporting MVP

**Actor:** QA Manager, Admin only — QA Tester and all link-based roles cannot access this at all (PD-041).

**Goal:** Review a trustworthy history of significant actions in the organisation.

**Entry Point:** Audit History area (organisation-level).

**Preconditions:** User is QA Manager or Admin.

**Happy Path:**
1. User opens Audit History.
2. Sees a chronological list of key actions (role changes, removals, archiving, test case status changes, defect status changes — including who or which link performed each one).
3. Filters by action type or date range as needed.

**Decision Points:** None — read-only.

**Alternative Paths:** None.

**Error / Failure Paths:** QA Tester or a link-based role attempting to reach this area: permission denied outright, not merely hidden from navigation (the restriction is enforced at the API level too, per `audit.md`).

**Successful Outcome:** User has confidence in an accurate, tamper-proof (append-only) record of what happened and by whom.

**Related Requirements:** FR-AUD-001–004, PD-041.

**Related APIs:** `GET /organisations/{orgId}/audit-log` (`audit.md`).

---

## UXF-016 — Notification Handling

**Priority:** Supporting MVP

**Actor:** Admin, QA Manager, QA Tester (organisation members only — link-based roles receive email only, with no in-app notification concept at all, per FR-NOT-003).

**Goal:** Stay aware of events relevant to the user without needing to actively check every area.

**Entry Point:** Notifications area, accessible from anywhere in the authenticated app.

**Preconditions:** User is logged in.

**Happy Path:**
1. A relevant event occurs (e.g., an invitation, a defect assignment nearby, feedback on a test case) — an in-app notification appears, and (per FR-NOT-002) an email is also sent.
2. User opens the notifications area, sees unread items highlighted.
3. Selects a notification, is taken directly to the relevant item (defect, test case, etc.).
4. Notification is marked read.

**Decision Points:** None beyond which notification to open.

**Alternative Paths:** Marking a notification read without opening its target (if such an action is offered) — a minor variant, not a distinct flow.

**Error / Failure Paths:** None specific beyond standard auth.

**Successful Outcome:** User is aware of, and can act on, relevant events without needing to poll every area of the product manually.

**Related Requirements:** FR-NOT-001, FR-NOT-002.

**Related APIs:** `GET /me/notifications`, `PATCH /notifications/{notificationId}` (`notifications.md`).
