# Requirements checkpoint — Projects: Update Project and Archive Project (FR-PRJ-002, FR-PRJ-003)

**Status:** PREPARED 2026-10-10 for Product Owner decision. **No implementation has started and none may start before the decisions in section 4 are answered** (CLAUDE.md rules 3, 5, 6, 20). Nothing here is a new requirement: every behaviour below is quoted from, or derived from, the approved documents; gaps are listed as questions, not filled in.

## 1. Why this slice next
Both requirements are **MVP**, depend only on **FR-PRJ-001** (done, accepted, deployed to staging), and finish capabilities that already exist half-built: the Projects list already has an **Archived** status tab, an Archived filter and counts (FR-PRJ-008), but no project can ever be archived. FR-PRJ-005/006/007 (project membership) depend on a user-invitation flow that does not exist yet (`FR-USR-*` pending), and the Requirements module (FR-REQ-*) needs the project lifecycle in place first, so this is the smallest sequential step. Release blockers are tracked separately in `docs/HANDOFF.md`; this slice is not one of them.

## 2. Approved requirements (verbatim sources)
- **FR-PRJ-002 Update Project** (`functional-requirements.md`): Admin, QA Manager or QA Tester **with access** may update project details. Acceptance: *a QA Tester with project access updates the project name -> the change is saved.* Business rule PD-014. Priority MVP.
- **FR-PRJ-003 Archive Project**: Admin, QA Manager or QA Tester **with access** may archive a project; it becomes **read-only and no longer accepts new work**; historical data is preserved; deleting a project with history is restricted (archiving is the retirement mechanism). PD-014. Priority MVP.
- **PD-014**: projects can be created, updated and archived by Admin, QA Manager or QA Tester; Admin/QA Manager see all organisation projects, QA Tester only projects they created or were added to (PD-017, FR-PRJ-004 — already implemented).
- **Approved API contract** (`docs/technical/api/projects.md`): `PATCH /projects/{projectId}` — body **`name`** — `200` updated project; `403`, `404`, `409 conflict (project archived)`. `POST /projects/{projectId}/archive` — `200` project with `status: archived`; `403`; `409 conflict (already archived)`; **audited** (an FR-AUD-001 minimum action); no cascade to child entities.
- Already in the system: `projects.status` is `active|archived` (check constraint), the list endpoint filters/counts by status, the UI has Archived tab/filter.

## 3. Risk classification and Definition of Ready
**Risk: MEDIUM** (new state-changing endpoints on tenant data; archive has no approved reverse action, see D3). Specialist reviews + QA; `security` review (object-level authorisation on bare-ID endpoints, rule 14); `database-architect` only if D2 chooses an audit table.

| Definition of Ready item | State |
|---|---|
| Requirement approved and clear | **Partly** — D1, D3 |
| Dependencies understood | Yes (FR-PRJ-001/004/008, FR-QAOM-012 pinning is not touched) |
| Affected decisions known | PD-014, PD-017, PD-066/067/068; APID-001/002/007; rule 14 |
| Risk class assigned | Yes (MEDIUM) |
| API/database impact understood | Yes: no migration needed unless D2 = audit table |
| Design exists and is approved (UI) | **No** — D4 (no Stitch design for edit or archive; registry lists only Projects Empty State / List / Create Project) |
| Design handoff (design agent) | Blocked by D4 |
| Acceptance criteria testable | Yes (section 5) |
| Technical decisions made | Yes, with the defaults in section 6 |

## 4. Decisions needed from the Product Owner (nothing is assumed)
- **D1 — Which fields can be updated?** The approved API contract says body `name` only; FR-PRJ-002 says "project details" and PD-067 added an optional description at creation. *Proposed default:* name **and** description (project code and the pinned QA configuration are never editable), with `docs/technical/api/projects.md` amended. Alternative: name only, as documented.
- **D2 — "Archive is audited" (FR-AUD-001 minimum action).** There is no audit-log table (TD-006: project creation is only logged). *Options:* (a) record archive in the structured log like creation, extend TD-006, and ship now; (b) build the audit-log entry table first (database change, `database-architect` review, larger slice). *Recommendation:* (a), because a general audit-log module is a separate feature that FR-AUD-001 covers for many actions at once.
- **D3 — Un-archive.** Not in the approved requirements ("archiving is the retirement mechanism"). *Proposed:* **not built**; the archive confirmation says it cannot be undone from the product. Confirm.
- **D4 — Design.** Approved Stitch designs (or explicit approval to follow existing patterns) are needed for: the edit action/dialog, the archive confirmation, and the archived/read-only presentation of a project row. The backend can be built and reviewed first while this is pending.

## 5. Acceptance criteria (testable)
1. A QA Tester who created (or is a member of) a project updates its name -> `200`, the list shows the new name after reload. Admin and QA Manager can update any project in their organisation.
2. A QA Tester without access to a project, and any user of another organisation, get **`404`** for update and archive (never `403`, rule 14); unauthenticated -> `401`; an organisation without active access -> the existing `403 subscription_required`.
3. Name validation matches creation (required, trimmed, 1-120 chars; description up to 500 if D1 includes it); errors use the shared envelope (`422` with `fields`).
4. Updating or archiving an **archived** project -> `409 conflict`; archiving twice -> `409`.
5. Archiving sets `status: archived`; the project moves from the Active to the Archived tab and counts update; nothing is deleted; no other project changes; the project code and QA configuration pin never change.
6. State-changing requests pass the Origin check (APID-022).
7. D2 outcome is implemented (log line or audit row) and tested.
8. Backend unit/integration tests written first and shown to fail for the old behaviour (no endpoint) and then pass; frontend component tests; E2E journey (update, archive, tab move, cross-organisation `404`), all run and reported.

## 6. Proposed technical shape (defaults unless D1-D4 say otherwise)
- Backend: `PATCH /v1/projects/{projectId}` and `POST /v1/projects/{projectId}/archive` in `modules/projects`; the organisation and the caller's access are resolved server-side from the session and the project row (object-level check, `404` otherwise); optimistic concurrency is **not** required (APID-003 covers Test Case and Requirement only); no migration; OpenAPI and `api/projects.md` updated in the same change.
- Frontend: an edit dialog and an archive confirmation reusing the existing Create Project dialog patterns and tokens; archived rows presented read-only; nothing invented beyond the approved designs.
- Sequence (POLICY steps 6-14): design handoff after D4 -> backend + tests -> `backend-reviewer` -> frontend + tests -> `frontend-reviewer` -> `reviewer` only if cross-cutting -> `qa` -> `security` -> human acceptance. Backend can start as soon as D1-D3 are answered.

## 7. Impact analysis
| Area | Impact |
|---|---|
| Database | none (status column and constraint exist); an audit table only if D2 = (b) |
| API | 2 endpoints, contract exists; OpenAPI update |
| Backend | projects service/routes/tests |
| Web | edit + archive UI, list refresh, read-only presentation |
| Mobile | none (not built) |
| Security / permissions | object-level authorisation on bare-ID endpoints (rule 14), role = any of the three, with access; Origin check applies |
| Tests | backend integration, frontend component, E2E (`@critical` journey) |
| Documentation | `api/projects.md`, `openapi.yaml`, traceability rows FR-PRJ-002/003, `TASKS.md`, status/handoff |
