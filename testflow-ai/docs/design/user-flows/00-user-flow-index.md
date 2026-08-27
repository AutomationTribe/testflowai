# TestFlow AI — User Flow Index

**Source documents:** vision.md, prd.md, product-decisions.md, functional-requirements.md, non-functional-requirements.md, architecture.md, database.md, api-spec.md, api/*.md (all approved).
**Status:** Approved user flow design. No wireframes, visual design, or code exist yet.
**Scope:** This document and its companions describe *what* users do and *why*, step by step, in plain English plus Mermaid flowcharts for the most complex flows. No screen layout, navigation UI, colour, typography, or component design is decided here.

---

## How to Read These Documents

Each flow has an ID (`UXF-XXX`), a priority classification, and a full plain-English description (Actor, Goal, Entry Point, Preconditions, Happy Path, Decision Points, Alternative Paths, Error/Failure Paths, Successful Outcome, Related Requirements, Related APIs). Flows are grouped into files by theme, matching related functional modules.

---

## Flow Catalogue

| Flow ID | Flow Name | Priority | File |
|---|---|---|---|
| UXF-001 | Sign Up & Subscription Activation | Critical MVP | `01-onboarding-and-subscription.md` |
| UXF-002 | Organisation & Team Setup | Critical MVP | `01-onboarding-and-subscription.md` |
| UXF-003 | Project Setup | Critical MVP | `02-project-setup.md` |
| UXF-004 | Requirements Management | Critical MVP | `03-requirements-management.md` |
| UXF-005 | Requirement Archive & Cascade | Supporting MVP | `03-requirements-management.md` |
| UXF-006 | Manual Test Case Creation & Self-Service Approval | Critical MVP | `04-test-case-management.md` |
| UXF-007 | Test Suite Organization | Supporting MVP | `04-test-case-management.md` |
| UXF-008 | Test Case & Report Template Management | Supporting MVP | `04-test-case-management.md` |
| UXF-009 | AI-Assisted Test Case Generation | Critical MVP | `05-ai-test-generation.md` |
| UXF-010 | Test Run Creation & Execution | Critical MVP | `06-test-execution.md` |
| UXF-011 | Defect Logging & Developer Assignment | Critical MVP | `07-defect-management.md` |
| UXF-012 | Link-Based External Access (BA/PO, Developer, Stakeholder) | Critical MVP | `08-link-based-access.md` |
| UXF-013 | Report Generation & Review | Critical MVP | `09-reporting-and-dashboards.md` |
| UXF-014 | Dashboard & Progress Monitoring | Supporting MVP | `09-reporting-and-dashboards.md` |
| UXF-015 | Audit History Review | Supporting MVP | `10-audit-and-notifications.md` |
| UXF-016 | Notification Handling | Supporting MVP | `10-audit-and-notifications.md` |
| UXF-017 | Subscription & Seat Management (ongoing) | Critical MVP | `11-subscription-and-billing.md` |

**Post-MVP / not designed:** Bulk import/export (FR-IMP-001–003) — explicitly postponed; no flow is designed for it, consistent with not inventing scope.

## Priority Definitions

- **Critical MVP Flow:** the product's core, approved workflow — cannot ship MVP without it.
- **Supporting MVP Flow:** approved and in MVP scope, but not on the primary "requirement → test case → execution → report" path.
- **Post-MVP Flow:** explicitly postponed by an approved decision (e.g., PRD Non-Goals) — not designed.
- **Future Flow:** not yet approved at all — not designed, and not listed here (would be inventing scope).

## Major Navigation Areas (Conceptual — Not UI Design)

Based on the flows below, users need conceptual access to these areas (no decision yet on sidebar/tabs/top-nav — that's a later UX activity):
- **Organisation** (settings, members, invitations, subscription/billing, audit history)
- **Projects** (list, individual project workspace)
- Within a project: **Requirements**, **Test Cases**, **Test Suites**, **Test Runs**, **Defects**, **Reports**, **Dashboard**
- **My Notifications** (cross-project, personal)
- **AI Generation** (entry point from a Requirement, not a standalone area)

Link-based roles (BA/PO, Developer, Stakeholder) do not navigate this structure at all — they land directly on the one scoped screen their link grants (a report, a defect, a dashboard), with no broader navigation available to them (see `08-link-based-access.md`).

## Required UX States (Cross-Cutting)

These states recur across multiple flows and must be accounted for wherever they apply — not redesigned per-flow:

| State | Where it applies |
|---|---|
| Empty state | Project with no requirements/test cases/runs yet; organisation with no members beyond the creator; no notifications |
| Loading | Any data fetch; report generation (up to ~5s, NFR-PERF-003) |
| Success | Every mutation (create/update/archive/approve) |
| Validation error | Every form submission |
| Permission denied | Any action outside the caller's role/access (surfaces as `403 forbidden` per `api-spec.md`) |
| Not found / no longer accessible | Deleted/inaccessible resource, or cross-tenant attempt (surfaces as `404 not_found`, deliberately indistinguishable from "doesn't exist" per the tenant-isolation security principle) |
| No search/filter results | Any list view with an active filter/search that matches nothing |
| AI processing | AI generation in progress (up to 60s, NFR-AI-001/002) |
| AI generation failed / timed out | AI provider unavailable or generation exceeded timeout (NFR-AI-002/003) |
| Concurrent-edit conflict | Editing a Test Case or Requirement that changed since it was loaded (APID-003) |
| Unsaved changes | Any in-progress edit to a Requirement, Test Case, or AI-generated draft not yet saved |
| Archived / read-only | Any archived Project, Requirement, or Test Case; any Closed/Cancelled-Archived Test Run |
| Access link expired / revoked | Any link-based screen, once the link is no longer valid (uniform message, no distinction disclosed — per the security principle in `api-spec.md`) |
| Mandatory-subscription block | Any screen attempted without an active trial/paid subscription (FR-SUB-002) |
| Grace-period warning | Any screen during the 14-day lapse grace period (PD-029) |
| Seat-limit block | Inviting a member when no seats remain (FR-SUB-007) |

---

## Companion Files

1. `01-onboarding-and-subscription.md` — UXF-001, UXF-002
2. `02-project-setup.md` — UXF-003
3. `03-requirements-management.md` — UXF-004, UXF-005
4. `04-test-case-management.md` — UXF-006, UXF-007, UXF-008
5. `05-ai-test-generation.md` — UXF-009
6. `06-test-execution.md` — UXF-010
7. `07-defect-management.md` — UXF-011
8. `08-link-based-access.md` — UXF-012
9. `09-reporting-and-dashboards.md` — UXF-013, UXF-014
10. `10-audit-and-notifications.md` — UXF-015, UXF-016
11. `11-subscription-and-billing.md` — UXF-017
12. `12-ux-gap-analysis-and-decisions.md` — UX Gap Analysis and UX Decisions Required (§10–11 of the design review)
