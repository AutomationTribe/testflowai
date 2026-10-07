# Requirements Checkpoint — Projects: Create Project + Project List

**Date:** 2026-10-07 · **Status:** Definition of Ready **MET** (updated 2026-10-07 after the Product
Owner's decisions below). The first version of this document recorded DoR as NOT MET.

**In scope:** FR-PRJ-001 (Create Project), FR-PRJ-004 (Project Visibility by Role), and the
QA-configuration pinning/inheritance that happens at project creation (FR-QAOM-012, FR-POL-002;
DBD-014).
**Out of scope (do not expand):** FR-PRJ-002 update, FR-PRJ-003 archive, FR-PRJ-005/006/007
membership management, FR-POL-003/004/005 overrides and effective-config views.

## Requirements as approved

| ID | What it requires | Source |
|---|---|---|
| FR-PRJ-001 | Admin, QA Manager, QA Tester can create a project in their organisation. Name + "initial settings". Blocked if no active trial/subscription (FR-SUB-002). Creator gets access. | functional-requirements.md, PD-014, `api/projects.md` |
| FR-PRJ-004 | Admin and QA Manager see all org projects; QA Tester sees only projects they created or were added to. Filtering at the query level, server-side. | functional-requirements.md, PD-014, PD-017, `api/projects.md` |
| FR-QAOM-012 / DBD-014 | `projects.qa_configuration_version_id` is NOT NULL, set once at creation to the org's then-current published version, never auto-updated. | functional-requirements.md, database-decisions.md, `schema.sql` |
| FR-POL-002 | A project with no overrides resolves to exactly the org's pinned published version. | functional-requirements.md |

## Existing groundwork (verified in code)

- `qaConfiguration.service.ts` already has `getCurrentPublished(organisationId)`; signup
  auto-publishes Standard QA, so every org has a published version (FR-QAOM-001/PD-061).
- `middleware/subscriptionGate.ts` (`requireActiveSubscription`) and `requireAuth` exist.
- `users.role` is `admin | qa_manager | qa_tester`; roles are stored on `users`.
- **No `projects` / `project_memberships` table exists yet** (migrations 0001–0004).
  `0004_qa_operating_model.sql` explicitly deferred the FK. `schema.sql` already specifies both
  tables, so the migration is additive and creates new tables only.

## Feature Entry Gate

| Check | Result |
|---|---|
| Requirement approved and clear | PASS for name, role access, subscription gate, visibility, pinning |
| Product decisions known (PD-014, PD-017, PD-056/057/063, DBD-014) | PASS |
| No requirement invented | **FAIL for Description and project code — see Decisions** |
| API/DB impact understood | PASS (additive migration; new endpoints under `/v1`) |
| Approved design exists | Create Project: PASS (viewed at 2560×2048). **Projects — List and Projects — Empty State: could not be viewed — see Blocker** |

## Risk classification: **MEDIUM**

New feature screen with backend support and an additive migration (new tables only). Touches
tenant isolation and object-level authorization (new org-scoped endpoints, role-filtered list),
so the **Security agent review is mandatory** and tenant-isolation tests are required. Not HIGH:
no auth/session/payment/webhook change, no destructive migration, no external integration, and
rollback is dropping two new empty-in-production tables. Under PRODUCTION criticality the full
Definition of Done applies (reviewer, design conformance, QA incl. E2E/regression, security,
accessibility, openapi sync, observability via the existing JSON logger, audit entry on create).

## BLOCKER — design not verifiable

The Stitch screenshots for **Projects — List** (`b2b302b729534983880869b8e214b6af`) and
**Projects — Empty State** (`585484247e734477825bf374a61b60ec`) redirect to a Google sign-in page
when fetched (every size variant tried; the HTML export links do the same). Only **Projects —
Create Project** could be downloaded at full resolution
(`docs/design/approved/projects/create-project.png`). Without the other two images the Design
Handoff cannot be written and later conformance cannot be verified by screenshot comparison.
The lowercase `project list` / `project empty state` screens are viewable (512px) but are not
registered as approved and show different chrome from the Create Project backdrop.

## Decisions needed from the Product Owner

1. **Provide the two images** (export Projects — List and Projects — Empty State as PNG into
   `docs/design/approved/projects/list.png` and `empty-state.png`, same convention as
   `account-subscription/`), or confirm which Stitch screens to use instead.
2. **Description.** The approved Create Project modal has an optional Description, and the
   list design shows a Description column. No approved requirement, schema column, or API field
   exists for it (`api/projects.md` Create body is `name` only). Proposed: approve an optional
   `description` (text, nullable, max 500) as an additive change, recorded as a new PD plus
   DBD/API/schema updates. Needs explicit approval — not assumed.
3. **Project code (`PRJ-001`).** Shown in both the modal's backdrop table and the list design.
   No requirement or column supports it. Per the standing rule against fabricated IDs, proposed
   default: **omit it** and report a MATERIAL DIFFERENCE at conformance, unless you approve a
   defined, per-organisation sequential code.
4. **List chrome/columns beyond FR-PRJ-004** (status tabs with counts, QA Configurations and
   Status filters, "Last sync", Members avatars, sort, bulk-select). Proposed: implement only
   what real data supports — name, description (if approved), QA configuration name/version,
   status, creator, created date, members (from real memberships), name search (`?q=` is in the
   approved spec) — and report each unbacked design element as a conformance difference rather
   than inventing behaviour. Confirm or amend.

## What is ready once the above are resolved

- Backend: migration for `projects` + `project_memberships` per `schema.sql`;
  `POST /v1/organisations/{orgId}/projects` (role check, subscription gate, pin
  `getCurrentPublished`, creator membership with `is_creator_grant`, audit entry, single
  transaction); `GET /v1/organisations/{orgId}/projects` (role-filtered in the SQL query,
  cursor pagination, `?q=`); openapi.yaml + api docs updated; backend tests incl. cross-tenant
  404, QA Tester visibility, subscription block, pinning.
- Frontend: the three approved screens, wired to the real endpoints.


---

## Resolution (2026-10-07)

- **Design access:** the two blocked images were viewed in the Product Owner's logged-in Chrome;
  see `docs/design/handoffs/projects.md` for how each screen was referenced and for the full
  Product Truth Review. Implementation proceeds against all three approved screens.
- **Description** — approved → PD-067. **Project code** — approved, `PRJ-###` per organisation
  → PD-066. **QA configuration "selection"** — clarified, not a new capability: only the
  current published version is eligible → PD-068.
- **Other list elements** — the default stood (the Product Owner asked what "amend" meant and
  did not amend it): implement what real data supports (status tabs + counts, name/code search,
  status and QA-configuration filters), omit the rest and report each as a design difference.
- **Audit:** `projects.md` says create is audited, but the audit module does not exist and
  project creation is not on FR-AUD-001's minimum list → structured log now, tracked as TD-006.
- **Risk:** MEDIUM (unchanged). Security review mandatory.
