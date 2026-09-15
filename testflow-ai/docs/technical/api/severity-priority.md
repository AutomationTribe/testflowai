# API — Defect Severity Labels & Priority Options

**Module:** DEF (organisation-level classification). **New module document (CHANGE-001).** See `docs/technical/api-spec.md` for shared conventions. Defect resource representation (including `severity`/`priority` on a defect) is documented in `defects.md`. Test Case Priority uses the Template System instead (`templates.md`) — it is not covered here, since Test Case is templated and Defect is not (`database.md` §12).

---

## List / Configure Defect Severity Labels

**Requirement IDs:** FR-DEF-007, PD-055.
**Purpose:** View or rename the organisation's display labels for the four fixed severity semantics.
**Actor/Permission:** Any organisation member (list); QA Manager, Admin (update label).
**Method and Path:** `GET /organisations/{orgId}/defect-severity-labels`; `PATCH /organisations/{orgId}/defect-severity-labels/{semantic}`
**Request:** `GET` path: `orgId`. `PATCH` path: `orgId`, `semantic` (`critical`|`high`|`medium`|`low`). Body: `{ "label": "S1 - Showstopper" }`.
**Successful Response:** `GET`: `200 OK` — `[{ "semantic": "critical", "label": "Critical", "displayOrder": 1 }, ...]` (always exactly 4 rows, seeded with `Critical`/`High`/`Medium`/`Low` at organisation creation unless previously customized). `PATCH`: `200 OK` — the updated row.
**Business Rules:** **The `semantic` value itself can never be added, removed, or reassigned** — only `label` (and, if ever needed, `displayOrder` between the fixed four) is editable. There is no `POST`/`DELETE` on this resource — the four rows are permanent (DBD-019, DBD-023). Renaming a label never changes which defects are Critical/High/Medium/Low, nor how any Quality Gate evaluates.
**Error Conditions:** `403 forbidden`; `404 not_found` (unknown `semantic` — though in practice all 4 always exist); `422 validation_error`.
**Side Effects:** Updates the `defect_severity_labels` row.
**Audit Behaviour:** Audited (FR-AUD-005, "severity-label change").

---

## List / Create / Update / Deactivate Defect Priority Options

**Requirement IDs:** FR-DEF-008, PD-055.
**Purpose:** Manage the organisation-configurable Defect Priority option set.
**Actor/Permission:** Any organisation member (list); QA Manager, Admin (create/update/deactivate).
**Method and Path:** `GET /organisations/{orgId}/defect-priority-options`; `POST /organisations/{orgId}/defect-priority-options`; `PATCH /organisations/{orgId}/defect-priority-options/{optionKey}`; `DELETE /organisations/{orgId}/defect-priority-options/{optionKey}`
**Request:** `POST` body: `optionKey` (stable), `label`, `displayOrder`. `PATCH` body: any of `label`/`displayOrder`/`isActive`. `DELETE`: soft-deactivates (`isActive: false`) — never a hard delete.
**Successful Response:** `GET`: `200 OK` — list, default-seeded with `critical`/`high`/`medium`/`low` options at organisation creation (same starting labels as Severity, but this set is **freely** organisation-editable — rename, add, remove — unlike Severity's fixed semantics). `POST`/`PATCH`/`DELETE`: same conventions as `templates.md`'s field-option endpoints.
**Business Rules:** Unlike Severity, Defect Priority carries **no** TestFlow-mandated semantic mapping (PD-055) — options are pure organisation classification. `DELETE` never removes a row referenced by an existing defect's `priorityOptionId` (FK integrity, `ON DELETE RESTRICT`) — it only deactivates, so historical defects remain interpretable (FR-DEF-008).
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (`optionKey` collision on create); `422 validation_error`.
**Side Effects:** Updates `defect_priority_options` rows.
**Audit Behaviour:** Audited (FR-AUD-005, "priority-option change").
