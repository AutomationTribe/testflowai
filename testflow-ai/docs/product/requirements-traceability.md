# Requirements Traceability

**Status:** API design and user-flow design stages complete. Database (logical + physical) design complete. Wireframe/visual UI design and test design have not yet begun.

This document maps each functional requirement to the API operation(s) that support it, the database table(s) it's backed by, and the user flow(s) that walk through it end-to-end (all completed design stages). **UI (wireframe) and Test columns are marked "Pending" throughout** — those design stages have not been reached yet.

Legend: DB tables reference `docs/technical/schema.sql`. API operations reference `docs/technical/api/*.md`. User flows reference `docs/design/user-flows/*.md` (`UXF-XXX`).

| FR ID | API Operation(s) | DB Table(s) | User Flow(s) | UI | Tests |
|---|---|---|---|---|---|
| FR-AUTH-001 | Sign Up (`authentication.md`) | `organisations`, `users` | UXF-001 | Pending | Pending |
| FR-AUTH-002 | Log In (`authentication.md`) | `users` | — (cross-cutting entry precondition) | Pending | Pending |
| FR-AUTH-003 | (session — infrastructure, no dedicated endpoint) | `users` | — | Pending | Pending |
| FR-AUTH-004 | Sign Up (`authentication.md`) | `users` | UXF-001 | Pending | Pending |
| FR-AUTH-005 | Sign Up (`authentication.md`) | `users` | UXF-001 | Pending | Pending |
| FR-AUTH-006 | Sign Up (`authentication.md`) | `subscriptions` | UXF-001 | Pending | Pending |
| FR-ORG-001 | Sign Up (`authentication.md`) | `organisations` | UXF-001 | Pending | Pending |
| FR-ORG-002 | (no ceiling — architectural property, no endpoint) | `organisations` | — | Pending | Pending |
| FR-ORG-003 | View/Update Organisation Settings (`users.md`) | `organisations` | UXF-002 | Pending | Pending |
| FR-ORG-004 | Invite Organisation Member; Accept Invitation (`users.md`, `authentication.md`) | `invitations`, `users` | UXF-002 | Pending | Pending |
| FR-ORG-005 | Invite Organisation Member (`users.md`) | `invitations` | UXF-002 | Pending | Pending |
| FR-ORG-006 | Change Member Role; Remove Organisation Member (`users.md`) | `users` | UXF-002 | Pending | Pending |
| FR-USR-001 | Invite Organisation Member (`users.md`) | `users` | UXF-002 | Pending | Pending |
| FR-USR-002 | Add Project Member (`projects.md`) | `project_memberships` | UXF-003 | Pending | Pending |
| FR-USR-003 | Change Member Role (`users.md`) | `users` | UXF-002 | Pending | Pending |
| FR-USR-004 | Remove Organisation Member; Remove Project Member (`users.md`, `projects.md`) | `project_memberships` | UXF-002, UXF-003 | Pending | Pending |
| FR-USR-005 | Remove Organisation Member (`users.md`) | `users` | UXF-002 | Pending | Pending |
| FR-USR-006 | List Organisation Members (`users.md`) | `users` | UXF-002 | Pending | Pending |
| FR-USR-007 | Add/Remove Project Member; Generate links (`projects.md`, `links.md`) | `project_memberships`, `access_links` | UXF-003, UXF-012 | Pending | Pending |
| FR-PRJ-001 | Create Project (`projects.md`) | `projects` | UXF-003 | Pending | Pending |
| FR-PRJ-002 | View/Update Project (`projects.md`) | `projects` | UXF-003 | Pending | Pending |
| FR-PRJ-003 | Archive Project (`projects.md`) | `projects` | UXF-003 | Pending | Pending |
| FR-PRJ-004 | List Projects (`projects.md`) | `projects`, `project_memberships` | UXF-003 | Pending | Pending |
| FR-PRJ-005 | Add Project Member (`projects.md`) | `project_memberships` | UXF-003 | Pending | Pending |
| FR-PRJ-006 | Remove Project Member (`projects.md`) | `project_memberships` | UXF-003 | Pending | Pending |
| FR-PRJ-007 | Remove Project Member (`projects.md`) | `project_memberships` | UXF-003 | Pending | Pending |
| FR-REQ-001 | Create/List Requirement (`requirements.md`) | `requirements` | UXF-004 | Pending | Pending |
| FR-REQ-002 | Edit Requirement (`requirements.md`) | `requirements`, `test_cases` | UXF-004 | Pending | Pending |
| FR-REQ-003 | Create Test Case (optional link) (`test-cases.md`) | `test_cases` | UXF-004, UXF-006 | Pending | Pending |
| FR-REQ-004 | Archive Requirement (`requirements.md`) | `requirements`, `test_cases`, `reports`, `test_runs` | UXF-005 | Pending | Pending |
| FR-TC-001 | Create Test Case (`test-cases.md`) | `test_cases` | UXF-006 | Pending | Pending |
| FR-TC-002 | Edit Test Case (`test-cases.md`) | `test_cases` | UXF-006 | Pending | Pending |
| FR-TC-003 | View/List Test Case Versions (`test-cases.md`) | `test_case_versions` | UXF-006 | Pending | Pending |
| FR-TC-004 | Create Test Run (`test-runs.md`) | `test_run_test_cases` | UXF-010 | Pending | Pending |
| FR-TC-005 | Edit Test Case (status field) (`test-cases.md`) | `test_cases` | UXF-006 | Pending | Pending |
| FR-TC-006 | Create Test Case (`test-cases.md`) | `test_cases` | UXF-006 | Pending | Pending |
| FR-TC-007 | Add/List Test Case Comments (`test-cases.md`) | `test_case_comments` | UXF-006 | Pending | Pending |
| FR-TC-008 | Create/List Test Case Templates (`templates.md`) | `test_case_templates` | UXF-008 | Pending | Pending |
| FR-TC-009 | Add/Remove Test Case from Suite; View Suite Contents (`test-cases.md`, `test-suites.md`) | `test_suite_memberships` | UXF-007 | Pending | Pending |
| FR-TC-010 | Create Test Case; Save AI Drafts (`test-cases.md`, `ai.md`) | `test_cases` | UXF-006, UXF-009 | Pending | Pending |
| FR-AI-001 | Trigger Generation (`ai.md`) | `ai_generation_requests` | UXF-009 | Pending | Pending |
| FR-AI-002 | Check Status/Retrieve Drafts; Save Selected Drafts (`ai.md`) | `test_cases` | UXF-009 | Pending | Pending |
| FR-AI-003 | (project-level config — no dedicated endpoint documented yet) | — | Not yet designed — flagged gap | Pending | Pending |
| FR-AI-004 | Trigger Generation (`ai.md`) | `ai_generation_requests` | UXF-009 | Pending | Pending |
| FR-AI-005 | Trigger Generation (`ai.md`) | `ai_generation_requests` | UXF-009 | Pending | Pending |
| FR-TS-001 | Create Test Suite (`test-suites.md`) | `test_suites` | UXF-007 | Pending | Pending |
| FR-TS-002 | (see FR-TC-009) | `test_suite_memberships` | UXF-007 | Pending | Pending |
| FR-TR-001 | Create Test Run (`test-runs.md`) | `test_runs` | UXF-010 | Pending | Pending |
| FR-TR-002 | Create Test Run (`test-runs.md`) | `test_run_test_cases` | UXF-010 | Pending | Pending |
| FR-TR-003 | Close Test Run (`test-runs.md`) | `test_runs` | UXF-010 | Pending | Pending |
| FR-TR-004 | View Test Run; View Project Dashboard (`test-runs.md`, `dashboards.md`) | `execution_results` | UXF-010, UXF-014 | Pending | Pending |
| FR-EXEC-001 | Record Execution Result (`test-runs.md`) | `execution_results` | UXF-010 | Pending | Pending |
| FR-EXEC-002 | Attach Evidence (`test-runs.md`) | `evidence` | UXF-010 | Pending | Pending |
| FR-EXEC-003 | Record Execution Result (rejected on closed run) (`test-runs.md`) | `execution_results` | UXF-010 | Pending | Pending |
| FR-DEF-001 | Log Defect (`defects.md`) | `defects` | UXF-011 | Pending | Pending |
| FR-DEF-002 | Assign Defect to Developer (`defects.md`) | `defects`, `access_links` | UXF-011 | Pending | Pending |
| FR-DEF-003 | Update Defect Status via Link (`links.md`) | `defects` | UXF-012 | Pending | Pending |
| FR-DEF-004 | View Defect (`defects.md`) | `defects` | UXF-011 | Pending | Pending |
| FR-DEF-005 | View Defect History (`defects.md`) | `defect_history_entries` | UXF-011 | Pending | Pending |
| FR-DEF-006 | Assign Defect to Developer (`defects.md`) | `defects` | UXF-011 | Pending | Pending |
| FR-TRACE-001 | View Traced Test Cases (`requirements.md`) | `test_cases`, `defects` | UXF-004 | Pending | Pending |
| FR-TRACE-002 | List/Search Test Cases (`test-cases.md`) | `test_cases` | UXF-004, UXF-006 | Pending | Pending |
| FR-RPT-001 | Generate/List Reports (`reports.md`) | `reports` | UXF-013 | Pending | Pending |
| FR-RPT-002 | Generate Report; View Report (`reports.md`) | `reports` | UXF-013 | Pending | Pending |
| FR-RPT-003 | Approve/Reject Report via Link (`links.md`) | `report_approval_records` | UXF-012, UXF-013 | Pending | Pending |
| FR-RPT-004 | Comment on Report via Link; View Report Comments (`links.md`, `reports.md`) | `report_comments` | UXF-012, UXF-013 | Pending | Pending |
| FR-DASH-001 | View Project Dashboard (`dashboards.md`) | (aggregated, no dedicated table) | UXF-014 | Pending | Pending |
| FR-DASH-002 | View Project Dashboard (`dashboards.md`) | `execution_results` | UXF-014 | Pending | Pending |
| FR-DASH-003 | View Dashboard via Link (`links.md`) | (aggregated) | UXF-012, UXF-014 | Pending | Pending |
| FR-AUD-001 | View Audit History (`audit.md`) | `audit_log_entries` | UXF-015 | Pending | Pending |
| FR-AUD-002 | View Audit History (`audit.md`) | `audit_log_entries` | UXF-015 | Pending | Pending |
| FR-AUD-003 | View Audit History (`audit.md`) | `audit_log_entries` | UXF-015 | Pending | Pending |
| FR-AUD-004 | View Audit History (`audit.md`) | `audit_log_entries` | UXF-015 | Pending | Pending |
| FR-NOT-001 | List/Mark My Notifications (`notifications.md`) | `notifications` | UXF-016 | Pending | Pending |
| FR-NOT-002 | (email delivery — no dedicated endpoint; see side effects throughout) | — | UXF-016 (cross-cutting) | Pending | Pending |
| FR-NOT-003 | Assign Defect; Generate Share Links (`defects.md`, `links.md`) | `access_links` | UXF-011, UXF-012 | Pending | Pending |
| FR-NOT-004 | (Post-MVP — no endpoint) | — | — | Pending | Pending |
| FR-NOT-005 | (background retry — no dedicated endpoint) | — | — (cross-cutting) | Pending | Pending |
| FR-LNK-001 | Generate Report/Dashboard Share Link; Assign Defect (`links.md`, `defects.md`) | `access_links` | UXF-011, UXF-012 | Pending | Pending |
| FR-LNK-002 | Resolve Link; all `/links/{linkToken}/...` operations (`links.md`) | `access_links` | UXF-012 | Pending | Pending |
| FR-LNK-003 | Generate Report/Dashboard Share Link (`links.md`) | `access_links` | UXF-012 | Pending | Pending |
| FR-LNK-004 | All `/links/{linkToken}/...` operations (`links.md`) | `access_links` | UXF-012 | Pending | Pending |
| FR-LNK-005 | Revoke Access Link (`links.md`) | `access_links` | UXF-011, UXF-012 | Pending | Pending |
| FR-LNK-006 | (no technical restriction — absence of an endpoint, not a gap) | `access_links` | UXF-012 | Pending | Pending |
| FR-SUB-001 | Start Trial (`subscription-billing.md`) | `subscriptions`, `seat_batches` | UXF-001, UXF-017 | Pending | Pending |
| FR-SUB-002 | (access gating — enforced on every endpoint, no dedicated operation) | `subscriptions` | UXF-001, UXF-017 | Pending | Pending |
| FR-SUB-003 | View Subscription State (`subscription-billing.md`) | `subscriptions` | UXF-017 | Pending | Pending |
| FR-SUB-004 | Subscribe Monthly (`subscription-billing.md`) | `seat_batches`, `payments` | UXF-001, UXF-017 | Pending | Pending |
| FR-SUB-005 | Subscribe Yearly (`subscription-billing.md`) | `seat_batches`, `payments` | UXF-001, UXF-017 | Pending | Pending |
| FR-SUB-006 | Subscribe Monthly/Yearly (`subscription-billing.md`) | `payments` | UXF-001, UXF-017 | Pending | Pending |
| FR-SUB-007 | Invite Organisation Member (blocked path) (`users.md`) | `seat_batches` | UXF-002, UXF-017 | Pending | Pending |
| FR-SUB-008 | Purchase Additional Seats (`subscription-billing.md`) | `seat_batches` | UXF-017 | Pending | Pending |
| FR-SUB-009 | (no "reduce seats" endpoint exists — absence is the enforcement) | `seat_batches` | UXF-017 | Pending | Pending |
| FR-SUB-010 | (grace period state — reflected in Subscription.status, no dedicated endpoint) | `subscriptions` | UXF-017 | Pending | Pending |
| FR-SUB-011 | Purchase Additional Seats (`subscription-billing.md`) | `seat_batches` | UXF-017 | Pending | Pending |
| FR-SUB-012 | View Billing/Seat History (`subscription-billing.md`) | `payments`, `seat_batches` | UXF-017 | Pending | Pending |
| FR-IMP-001 | Not built — Post-MVP (`prd.md` Non-Goals) | — | Not designed — Post-MVP | Pending | Pending |
| FR-IMP-002 | Not built — Post-MVP | — | Not designed — Post-MVP | Pending | Pending |
| FR-IMP-003 | Not built — Post-MVP | — | Not designed — Post-MVP | Pending | Pending |

## Notes on Coverage

- **FR-AI-003** (optional per-project AI provider key configuration) has no documented endpoint or user flow — flagged consistently since the API design phase (`api-decisions.md` consistency review) and again in the user-flow gap analysis (`docs/design/user-flows/12-ux-gap-analysis-and-decisions.md`). Needs a small settings screen and a small API addition in a future pass — not invented here.
- **FR-NOT-002, FR-NOT-004, FR-NOT-005** have no dedicated endpoint or flow by design — they describe delivery-channel/background behaviour, not user-invokable actions.
- **FR-IMP-001–003** are correctly unbuilt and undesigned — Post-MVP, per approved scope.
- **UI** and **Tests** columns remain "Pending" — wireframe/visual design and test design have not started. This will be updated as those phases complete.
