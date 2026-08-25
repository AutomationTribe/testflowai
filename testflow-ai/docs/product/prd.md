## 6. User Roles

| Role | Responsibilities |
|---|---|
| **Admin** | Per-organisation role. Manages users, roles, permissions, settings, and templates within their organisation. |
| **QA Manager** | Sets up the project (adds testers, developers, managers, PO — can update membership at any time); defines QA workflow (e.g., whether test cases/reports require approval before execution, automation settings); creates test case and test report templates, available across the organisation's projects; invites QA testers; reviews, comments on, and approves test cases per tester; reviews pre- and post-deployment reports; views project progress dashboard; can also perform any action available to a Tester |
| **Test Author / QA Engineer (Tester)** | Writes/edits test cases (manually or AI-assisted), organizes suites, executes tests, records results, attaches evidence, logs defects |
| **Business Analyst / Product Owner** | Authors requirements; reviews and approves test reports; reviews test results |
| **Developer** | Receives assigned defects, reviews reproduction details, updates defect status |
| **Viewer / Stakeholder** | Read-only access to requirements, test cases, results, dashboards, reports |

**Confirmed:** Roles are assigned **per project**, not globally. A user may hold different roles on different projects (e.g., QA Manager on Project A, Viewer on Project B). The **Admin** role operates at the organisation level.

## 8. Core Product Capabilities
- Multi-tenant support for unlimited organisations and projects; an organisation may contain multiple projects
- Users can belong to multiple projects, with a role assigned per project
- Requirements: native authoring (MVP). Import/sync is an approved future capability; MVP timing postponed — see Post-MVP Scope.
- AI-generated test cases: full set of test cases generated per requirement, reviewable/editable before saving
- Manual test case creation and editing
- Test case and test report templates, created by the QA Manager and available across all projects within the organisation
- Test suite organization
- Manual test execution with statuses: Pass, Fail, Blocked, Skipped
- Evidence attachment (screenshots, files) on execution results
- Native defect logging
- Requirement-to-test-case traceability, with reporting that distinguishes traced vs. untraced test cases
- On-demand reporting and dashboards
- Configurable QA workflow per project (e.g., approval required before execution)
- Test case approval workflow with states: Draft → Pending Approval → Approved
- Optional AI provider key configuration per project/team, in addition to a platform-provided AI option
- In-app and email notifications for key events
- Audit history on key entities

## 14. Requirements and Traceability Capabilities
- Requirements are natively authored in MVP.
- Import/sync of requirements from external tools is an approved capability but is **postponed to Post-MVP**.
- Full traceability required where links exist: requirement → test case(s) → run(s) → result(s) → defect(s).
- Requirement linkage on a test case is optional, not mandatory. Reporting distinguishes traced vs. untraced test cases.

## 15. Test Execution Capabilities
- Manual test execution only in MVP; automated execution is postponed.
- Execution statuses: Pass, Fail, Blocked, Skipped.
- Evidence attachment (screenshots, files) supported on results.
- Data-driven / parameterized test cases confirmed as part of MVP scope.
- A "test plan" concept, distinct from a test run, is confirmed as a future capability and is **postponed to Post-MVP**. MVP execution is organized directly through suites and runs.

## 17. User / Role / Permission Capabilities
- Fixed set of roles in MVP (Admin, QA Manager, Tester, Business Analyst/PO, Developer, Viewer).
- The **Admin** role is scoped **per organisation**, not system-wide.
- Roles other than Admin are assigned per project. A user can belong to multiple projects with a different role in each.
- QA managers can invite testers and manage project membership (add/update at any time).
- Fully custom/configurable roles and permissions postponed.

## 20. MVP Scope
- Multi-tenant organisation and project setup, including membership management by QA Manager
- Users able to belong to multiple projects with per-project roles
- Per-organisation Admin role
- Requirements: native authoring only (import/sync postponed)
- Test case management: manual creation/editing
- Test case templates, organisation-scoped, created by QA Manager
- Test report templates, organisation-scoped, created by QA Manager
- AI-generated test cases from requirements (full set per requirement), reviewable/editable before saving
- AI access via optional per-project provider key or platform-provided option
- Test suites (organization/grouping)
- Manual test execution with Pass/Fail/Blocked/Skipped statuses
- Evidence attachment on results
- Data-driven / parameterized test cases
- Native defect logging (no external defect-tool integration in MVP)
- Requirement-to-test-case traceability view, distinguishing traced vs. untraced test cases
- Configurable QA workflow (approval gates before execution) with Draft → Pending Approval → Approved states
- Basic dashboard (project progress)
- On-demand reporting
- Fixed roles and per-project permissions
- In-app and email notifications for key events
- Audit log on key entities
- Bulk import/export tooling

## 21. Post-MVP / Future Scope
- Requirements import/sync from external tools
- Test plan concept, distinct from test run
- AI generation from free-text task descriptions
- Automated test execution (CI/CD, automated test tool integration)
- Cross-organisation template sharing/library
- Fully custom/configurable roles and permissions
- Advanced dashboards (trend analysis, custom widgets/filters)
- Scheduled/automated report distribution
- Advanced AI features (quality scoring, duplicate detection, coverage gap suggestions)
- External defect-tool integration (e.g., Jira)

## 24. Open Questions / Decisions Still Required
1. Which AI providers should be supported, and what are the usage limits/cost model for the platform-provided AI option? (Safe to finalize closer to implementation.)
2. What is the full list of "important changes" that must be captured in the audit log? (Safe to finalize during detailed requirements.)