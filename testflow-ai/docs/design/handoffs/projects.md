# Design Handoff — Projects (Empty State, List, Create Project)

**Date:** 2026-10-07 · **Screens** (Stitch project `6056437425670809929`, see `docs/design/stitch-registry.md`):

| Canonical name | Stitch screen ID |
|---|---|
| Projects — Empty State | `585484247e734477825bf374a61b60ec` |
| Projects — List | `b2b302b729534983880869b8e214b6af` |
| Projects — Create Project | `40ac626b6df0487fb0ea0d07bc6d9dfe` |

**How the references were viewed.** Create Project downloads as a full 2560×2048 PNG
(`docs/design/approved/projects/create-project.png`). The screenshot links for the other two
approved screens require a Google login, so they were viewed in the Product Owner's logged-in
Chrome. Their near-identical siblings `project list` (`ec89d852…`) and `project empty state`
(`a91c29d7…`) download at full size and were used for pixel-level comparison — *those two are
not registered as approved; the equivalence with the approved titled screens was judged by eye,
not verified byte-for-byte.*

## Product Truth Review

Product requirements win on behaviour; the designs win on presentation of whatever is real.

### Supported by approved requirements or decisions (implemented)

| Design element | Backing |
|---|---|
| Create Project modal: Project Name (required), Cancel, Create Project | FR-PRJ-001 |
| Description (optional) field and list column | PD-067 (approved 2026-10-07) |
| `PRJ-###` code chip in the list | PD-066 (approved 2026-10-07) |
| QA Configuration field, "(Organization default)", "View configuration", inherited-from-organisation note | FR-QAOM-012, FR-POL-002, DBD-014, PD-068 — shows the one real current published version |
| List columns Project / Description / QA Configuration / Status / Created By / Created On / Members | real `projects`, `qa_configuration_versions`, `users`, `project_memberships` data |
| Status tabs with counts, status and QA-configuration filters, name/code search | real data; query params on the approved list endpoint |
| Role-filtered list; empty state when nothing is accessible | FR-PRJ-004 |
| "New Project" (header and empty state) | FR-PRJ-001 |
| "Browse QA Configurations" | links to the existing QA Setup page; shown to Admin/QA Manager only (QA Setup is Admin/QA Manager only, FR-WF-006) |

### Shown in the designs but NOT implemented (no approved requirement)

| Design element | Why not | Conformance class |
|---|---|---|
| Workspace search (Ctrl+K) and theme toggle in the top bar | no search/theme requirement | MATERIAL DIFFERENCE — unbacked control omitted |
| "PROD" environment tag and "Sprint 17 Workspace" crumb | invented; "Sprint" contradicts methodology-neutrality (PD-064) | MATERIAL DIFFERENCE — omitted |
| Empty-state status line "Repository: connected … Schema: v1.0.4 · Engine: Systematic" | fabricated telemetry | MATERIAL DIFFERENCE — omitted |
| Empty-state cards "Standardised Suites", "CLI & CI/CD Pipelines", "Release Readiness" | advertise capabilities no requirement defines | MATERIAL DIFFERENCE — omitted |
| Per-row bulk-select checkboxes, row action menu (⋯), "Selected: N", "Rows per page", "Page 1 of 1" | no bulk action/row action in scope; APID-002 is cursor-based, so no page numbers | MATERIAL DIFFERENCE — replaced by "Showing N of M" + "Load more" |
| Create Project backdrop "Projects Directory" table with "Last sync", "Total active", Filters, Sort | decorative backdrop of a different shell; "Last sync" has no data source | not rendered (backdrop is the real page) |
| Sidebar variants ("QA Manager"/"v4.8.2"/"PRECISION v1.0", CONFIGURATION group, user card) | the three designs disagree with each other; the established AppSidebar (already approved via QA Setup) is reused and gains a real **Projects** item | PRODUCT CONFLICT — resolved in favour of the existing shared sidebar |
| QA configuration shown as `v1.0` | versions are integers; no minor version exists | MINOR DIFFERENCE — rendered `v1` |
| "Projects" sidebar count badge | not requested | MINOR DIFFERENCE — omitted |

No MATERIAL product conflict requiring a Product Owner decision remains: every omission above
errs toward not inventing behaviour.

## Behaviour

- `/projects` (Admin, QA Manager, QA Tester; subscription required). Loads
  `GET /v1/organisations/{orgId}/projects`.
- Empty (no projects, no filters) → empty state. Filters that hide everything → "No projects
  match your filters" + Clear filters.
- New Project → modal. QA configuration is loaded from
  `GET /v1/organisations/{orgId}/qa-configuration/current`. Submit →
  `POST /v1/organisations/{orgId}/projects` → modal closes, filters reset, list reloads with
  the new project at the top.
- Responsive: only one viewport (desktop) is designed. The shell reuses the sidebar's existing
  collapse mechanism; the table scrolls horizontally rather than inventing a mobile layout.
