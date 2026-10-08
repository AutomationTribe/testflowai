# Requirements coverage — Projects list: search, filters, counts, pagination

**Date:** 2026-10-08 · **Question asked by the Product Owner:** the Projects list page has search,
filters, etc. — are there requirements covering them? And the list should paginate.

**Method:** searched `docs/product/` (functional/non-functional requirements, user stories, PRD,
product decisions), `docs/technical/api-spec.md` (APID-001…), `docs/technical/api/projects.md` and
`docs/design/user-flows/02-project-setup.md`.

## Result

| List capability (as built) | Covered by an approved requirement/decision? | Where / gap |
|---|---|---|
| Role-filtered visibility | **Yes** | FR-PRJ-004, PD-014, PD-017 |
| Search by project **name** (`?q`) | **Yes (API level)** | `api-spec.md` "Search": case-insensitive substring match on a resource's `name`/`title` only, where listing exists; `api/projects.md` List lists `?q=`. No *functional* requirement says the Projects page has a search box. |
| Search also matches the project **code** | **No** | Approved search is "name/title field only". Matching `PRJ-###` is an extension (the code itself is PD-066). |
| **Cursor pagination** (`cursor`, `limit`, `nextCursor`) | **Yes (API level)** | APID-002: every list endpoint is cursor-based. No requirement defines page size, rows-per-page choices, or "Page X of Y". |
| **Status filter** (Active / Archived) and status tabs | **No** | `api-spec.md` "Filtering" lists approved filters per resource and **Projects is not in the list**; the same section says no query parameter is added "just in case". Archiving itself (FR-PRJ-003) is not built, so no project can be Archived yet. |
| **QA-configuration filter** | **No** | Not in any requirement or the approved filter list. |
| **Status counts** on the tabs (`counts`) and filter options (`qaConfigurations`) | **No** | Response fields not in any approved contract. |
| Default sort: newest first | **Partly** | `api-spec.md` allows `?sort=createdAt:…` generally; a default order for Projects is not specified. |
| Empty state / "no match" state | **Partly** | Empty state is in the approved designs; no FR text. |

## What this means

- **Search by name and cursor pagination are covered** at the API-decision level. What is *not*
  specified is the page-size options and the footer ("Rows per page", "Page X of Y").
- **The status filter, status tabs with counts, QA-configuration filter, project-code search and the
  `counts` / `qaConfigurations` response fields are not covered by any approved requirement.** They
  were built because the approved *designs* show them (and real data supports them), and the earlier
  question "build only what real data and the approved spec support, or amend?" was not amended. By
  CLAUDE.md rule 3 they should not stay as undocumented behaviour.
- **Pagination UI added 2026-10-08 at the Product Owner's request:** Previous/Next with "Page X of Y",
  "Showing a–b of N", and Rows per page (10 / 25 / 50, default 10 as the design shows). It uses the
  approved cursor API; "Previous" works because the page remembers the cursors it has used.

## Decision needed — proposed as PD-069 (NOT yet approved)

`docs/product/product-decisions.md` PD-069 records the proposal for the Product Owner to approve,
amend, or reject: (1) status filter + tabs + counts, (2) QA-configuration filter, (3) search also
matching the project code, (4) default newest-first order, (5) pagination UI shape and page sizes.
Until approved, `api/projects.md` marks these as "pending PD-069", and `api-spec.md`'s approved
filter list is **not** changed.

## Resolution (2026-10-08)

The Product Owner approved adding these to the requirements. **PD-069 is Approved**, the behaviour is now
requirement **FR-PRJ-008** (`functional-requirements.md`), the approved filter list in `api-spec.md` includes
Projects (`status`, `qaConfigurationVersionId`) and the project-code search exception, and `api/projects.md` no longer
marks any of it "pending". Implementation already matched; end-to-end coverage added (flows G and I).
