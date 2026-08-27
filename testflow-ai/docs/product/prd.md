# TestFlow AI — Product Requirements Document (PRD)

## 1. Product Overview
TestFlow AI is a multi-tenant, web-based test management system that supports the full testing lifecycle — requirements, test case management, test suites, test execution, defects, traceability, and reporting — with AI-assisted test case generation as a core differentiator.

An organisation can contain multiple projects. Templates are organisation-scoped. Users hold one role at the organisation level (Admin, QA Manager, or QA Tester) that governs their capabilities across every project they have access to. Business Analyst/Product Owner, Developer, and Stakeholder are not organisation members; they participate via temporary, scoped access links.

TestFlow AI is a paid, subscription-based product. A new organisation is created via public sign-up (Admin or QA Manager only) and must have an active trial or paid subscription to access any platform functionality (PD-019, PD-020).

## 2. Background / Problem
QA teams manually author large volumes of test cases, and typically manage requirements, testing, and defects across disconnected tools. TestFlow AI addresses this by combining core test management functions with AI-assisted test case generation and configurable team workflow, in a single system.

## 3. Product Goals
- Provide a complete test management workflow from requirement to execution to report.
- Reduce manual test case authoring effort using AI.
- Preserve full traceability between requirements, test cases, runs, and defects.
- Allow QA managers to configure team-specific workflow, templates, and approvals.
- Support multi-tenant use at unlimited scale, with organisations able to manage multiple projects.
- Keep external stakeholder participation lightweight through scoped, temporary access.

## 4. Non-Goals (for now)
- Automated test execution — postponed.
- Fully custom/configurable roles and permissions — postponed.
- Scheduled/automated report distribution — postponed.
- AI generation from free-text task descriptions — postponed.
- Cross-organisation template sharing/library — postponed.
- Advanced AI features — postponed.
- Advanced dashboards — postponed.
- External defect-tool integration — postponed.
- Requirements import/sync from external tools — postponed (native authoring only, sourced manually from wherever the requirement originates, e.g., Jira).
- Test plan as a concept distinct from test run — postponed.
- Organisation membership/accounts for BA/PO, Developer, and Stakeholder — not planned; these roles use link-based access instead.

## 5. Target Users
- New customers signing up to create an organisation (Admin or QA Manager)
- QA testers (organisation members)
- QA managers (organisation members)
- Admins (organisation members)
- Business analysts / product owners (link-based, non-member)
- Developers (link-based, non-member)
- Stakeholders (link-based, non-member)

## 6. User Roles

### Organisation Member Roles (invited at organisation level, hold accounts)

| Role | Responsibilities |
|---|---|
| **Admin** | Per-organisation role. Manages organisation settings, invites/manages users, oversees all projects in the organisation. Is the only role that can change another member's role (PD-031); cannot be removed or reassigned away from Admin if they are the organisation's last remaining Admin (PD-030). Can perform any action available to QA Manager or QA Tester. |
| **QA Manager** | Invites organisation members and sets their role at invitation; can create/update/archive projects; sees all projects in the organisation; defines QA workflow (e.g., approval gates); creates test case and test report templates (organisation-scoped); reviews, comments on, and approves test cases; reviews reports (single report type, including its Post-Deployment section — PD-038); views project dashboards; views billing and seat history (PD-047); generates temporary access links for BA/PO, Developer, and Stakeholder; can perform any action available to a QA Tester. Cannot change another member's role (PD-031). |
| **QA Tester** | Can create, update, and archive projects; sees only projects they created or were added to; enters requirements (e.g., from a Jira ticket or wherever the requirement originates); triggers AI test case generation and/or writes test cases manually; organizes suites; executes tests; records results; attaches evidence; logs defects; can add other organisation members to a project they have access to; can remove users from a project they have access to; generates temporary access links for BA/PO, Developer, and Stakeholder. |

### Link-Based Roles (no account; access via temporary, expiring link shared by QA Tester/QA Manager/Admin)

| Role | Responsibilities |
|---|---|
| **Business Analyst / Product Owner** | Reviews test results; reviews and approves test reports — via a scoped access link. |
| **Developer** | Receives assigned defects, reviews reproduction details, updates defect status — via a scoped access link. |
| **Stakeholder / Viewer** | Views dashboards and reports, read-only — via a scoped access link. |

**Confirmed:** Roles for Admin, QA Manager, and QA Tester are assigned once, at the organisation level, at invitation time (PD-017, supersedes PD-003). This role governs the user's capabilities on every project they subsequently gain access to. Adding a user to a project is an access grant only, not a separate role assignment.

**Confirmed:** Public sign-up (creating a brand-new organisation) only offers Admin or QA Manager as the selectable role — QA Tester is not a sign-up option (PD-019). QA Tester accounts are added afterward via organisation invitation, once the organisation already exists. Business Analyst/Product Owner, Developer, and Stakeholder remain link-based and are never created at sign-up.

**Confirmed:** Only Admin can change another organisation member's role; QA Manager cannot (PD-031). An organisation must always retain at least one Admin — the last remaining Admin cannot be removed or have their role changed away from Admin (PD-030).

**Confirmed:** If a project's creator is removed from the project, or loses organisation access, only that creator loses access to the project — Admin and QA Manager retain whatever access to the project they already had (PD-032).

## 7. Major Product Modules
1. Organisation & Project Management
2. Requirements Management
3. Test Case Management
4. AI Test Generation
5. Template Management (organisation-scoped)
6. Test Suite Management
7. Test Run / Execution
8. Defect Management
9. Traceability
10. Reporting & Dashboards
11. User & Access Management (organisation-level roles)
12. Link-Based Access (for BA/PO, Developer, Stakeholder)
13. Audit / History
14. Notifications
15. Subscription & Billing

## 8. Core Product Capabilities
- Multi-tenant support for unlimited organisations and projects
- Organisation-level invitation and role assignment for Admin, QA Manager, QA Tester (PD-017)
- Project creation, update, and archiving by Admin, QA Manager, or QA Tester (PD-014)
- QA Manager/Admin see all organisation projects; QA Tester sees only projects created by or added to them (PD-014)
- Adding a user to a project (access grant) performable by Admin, QA Manager, or any QA Tester with access to that project
- Requirements: native authoring by QA Tester, QA Manager, or Admin, typically sourced from an external record such as a Jira ticket (PD-015)
- Archiving a requirement cascades to archive its linked test cases and reports, and to cancel/archive any active, unclosed test run those test cases belong to (PD-016, extended by PD-034)
- Editing a requirement with already-approved linked test cases triggers re-review of those test cases (status reverts to Needs Review) (PD-033)
- AI-generated test cases: full set of test cases generated per requirement, reviewable/editable before saving
- Manual test case creation and editing
- Test case and test report templates, organisation-scoped
- Test suite organization
- Manual test execution with statuses: Pass, Fail, Blocked, Skipped
- Evidence attachment on execution results; execution results are immutable once a test run is closed (PD-037)
- Native defect logging
- Requirement-to-test-case traceability, distinguishing traced vs. untraced test cases
- On-demand reporting (single report type, including a Post-Deployment section for production testing) and dashboards (PD-038)
- Configurable QA workflow per project (approval gates), with Draft → Pending Approval → Approved → Needs Review states; self-approval by the test case creator when a project has no approval step configured (PD-035, PD-036)
- Optional AI provider key configuration per project, plus a platform-provided AI option
- Temporary, scoped access links for BA/PO, Developer, and Stakeholder, with configurable expiry (default 24h), no identity verification, named or generic recipients, and multi-use until expiry/revocation (PD-018, PD-042–PD-046)
- BA/PO can leave comments on a report via their link, visible only to the QA Tester and excluded from the report itself (PD-040)
- In-app notifications for organisation members; email notifications for all roles, serving as the access mechanism (carrying the link) for link-based roles
- Audit history on key entities, including actions performed via access links, visible only to QA Manager and Admin (PD-041)
- Only Admin can change another organisation member's role; QA Manager cannot (PD-031). An organisation always retains at least one Admin (PD-030)
- Removed project creator loses their own project access only; Admin and QA Manager retain their existing access (PD-032)
- Public sign-up for new customers, creating a new organisation and an Admin or QA Manager account (PD-019)
- Mandatory trial or paid subscription for any platform access, enforced immediately after sign-up (PD-020)
- 14-day, 3-seat-capped, one-time-only trial plan (PD-021)
- Monthly ($10/seat) and yearly ($9/seat/month, billed upfront for 12 months) paid subscription plans (PD-022, PD-023)
- Payment confirmation email on successful subscription payment (PD-024)
- Seat limit enforcement on invitation, with a directed path to purchase additional seats, plus proactive seat purchase at any time (PD-025, PD-026)
- Staggered 12-month renewal for seats purchased mid-term on a yearly plan (PD-027)
- Billing and seat history visible only to Admin and QA Manager (PD-047)
- Seats-only-increase policy with no refunds/credits for unused seats (PD-028)
- 14-day grace period with multi-channel notification on paid subscription lapse; no grace period on trial expiry (PD-029)

## 9. High-Level User Workflows

**New Customer (Sign-Up)**
1. Completes the public sign-up form, selecting Admin or QA Manager as their role
2. Specifies the name of a new organisation, which is created and tied to them
3. Receives a confirmation email
4. Is redirected to the subscription page
5. Selects a trial or paid (monthly/yearly) plan; platform access remains blocked until one is active
6. Once active, can invite other organisation members (QA Tester, additional Admin/QA Manager) and generate link-based access as needed

**QA Manager**
1. Invites organisation members (Admin, QA Manager, or QA Tester), setting their role at invitation
2. Creates or oversees projects (sees all projects in the organisation)
3. Sets the project's QA workflow (e.g., approval gates)
4. Creates test case and test report templates, available across the organisation's projects
5. Adds/removes organisation members' access to specific projects
6. Reviews, comments on, and approves test cases
7. Generates temporary access links for BA/PO (report approval), Developer (defect resolution), and Stakeholder (dashboard/report viewing)
8. Reviews pre- and post-deployment reports
9. Views a project progress dashboard
10. Can perform any action available to a QA Tester

**QA Tester**
1. Creates a project (or is added to one) — sees only projects they created or were added to
2. Enters requirements sourced from an external record (e.g., a Jira ticket) or wherever the requirement originates
3. Triggers AI generation of a full set of test cases from a requirement, or writes test cases manually
4. Reviews, edits, and saves generated test cases
5. Assigns test cases to a suite
6. Submits test cases for approval if required by project workflow
7. Adds other organisation members to the project, or removes their access
8. Generates temporary access links for BA/PO, Developer, and Stakeholder as needed
9. Executes assigned test cases in a test run
10. Records results and attaches evidence
11. Logs a defect if a test fails, generating a link for the assigned Developer

**Admin**
1. Manages organisation settings
2. Invites and manages organisation members and their roles
3. Has visibility across all projects in the organisation
4. Can perform any action available to QA Manager or QA Tester

**Business Analyst / Product Owner (via link)**
1. Receives a temporary access link from a QA Tester/Manager/Admin
2. Reviews test results
3. Reviews and approves a test report, scoped to that link

**Developer (via link)**
1. Receives a temporary access link when a defect is assigned to them
2. Reviews reproduction steps, evidence, and the linked test case
3. Updates the defect's status via the link

**Stakeholder (via link)**
1. Receives a temporary access link for a dashboard or report
2. Views progress data or reports, read-only

## 10. Business Rules Identified So Far
- A test case may optionally be linked to a requirement; linkage is not mandatory. Reporting distinguishes traced vs. untraced test cases.
- AI-generated test cases must be reviewed/edited by a human before being saved as final.
- Test cases require versioning; test runs preserve a snapshot of test case content at execution time.
- Deletion of requirements, test cases, suites, or projects with history is restricted; archiving is used instead.
- **Archiving a requirement cascades to archive its linked test cases and reports (PD-016).**
- All significant actions (including actions performed via access links) must be attributed and timestamped.
- **Roles (Admin, QA Manager, QA Tester) are assigned once at the organisation level and apply across all projects the user has access to (PD-017, supersedes PD-003).**
- **Project creation, update, and archiving are available to Admin, QA Manager, and QA Tester (PD-014).**
- **QA Manager and Admin see all projects in their organisation; QA Tester sees only projects they created or were added to (PD-014).**
- **Adding a user to a project is an access grant, not a role assignment; the added user's organisation role governs their capabilities on that project.**
- QA workflow (e.g., approval gates before execution) is configurable per project.
- **Test cases follow the state model Draft → Pending Approval → Approved, with a "Needs Review" state reached either when a QA Manager rejects a Pending Approval test case, or when a linked requirement is edited after the test case was already Approved (PD-035, PD-033).**
- If an approved test case is edited, it reverts to Pending Approval status (when approval is enabled).
- **In a project whose QA workflow does not have approval enabled, the test case's creator can self-approve — setting the test case's status directly to Approved (PD-036).**
- **Editing a requirement that has already-approved linked test cases triggers those test cases into "Needs Review," requiring re-approval (PD-033).**
- AI provider key configuration is optional per project; a platform-provided AI option is also available.
- Templates are organisation-scoped.
- **Requirements are authored by QA Tester, QA Manager, or Admin — not by BA/PO (PD-015).**
- **Archiving a requirement cascades to archive its linked test cases and reports; if a linked test case belongs to an active, unclosed test run, that run is also cancelled and archived (PD-016, extended by PD-034).**
- **Execution results cannot be edited once a test run is closed — this is a hard rule with no exception (PD-037).**
- **There is a single report type, not separate pre-deployment and post-deployment reports; the single report includes a "Post-Deployment" section covering testing performed in production (PD-038). This supersedes any earlier framing of pre-/post-deployment as distinct report types.**
- **A BA/PO's approval or rejection of a report via their link is record-keeping only — it does not trigger, gate, or block any other action or workflow (PD-039).**
- **A BA/PO can leave comments on a report via their link; these comments are visible only to the QA Tester, are not included in the report itself, and are a private feedback channel (PD-040).**
- **Only QA Manager and Admin can view audit history; QA Tester and link-based roles cannot (PD-041).**
- **Only Admin can change another organisation member's role; QA Manager cannot (PD-031). An organisation must always retain at least one Admin — the last remaining Admin cannot be removed or reassigned away from Admin (PD-030).**
- **When a project's creator is removed from the project, or loses organisation access, only that creator loses project access — Admin and QA Manager retain whatever access they already had (PD-032).**
- **BA/PO, Developer, and Stakeholder are not organisation members; they act via a temporary, action-scoped link generated by a QA Tester, QA Manager, or Admin with project access (PD-018). Link expiry is configurable, defaulting to 24 hours (PD-042). There is no formal identity verification of link recipients — the link itself is the sole credential (PD-043). A link can be targeted to a named recipient or generic (PD-044), can be used multiple times until it expires or is revoked (PD-045), and can be freely copied/shared by whoever holds it (PD-046).**
- For organisation members, notifications are delivered in-app and by email. For link-based roles, email is the sole delivery mechanism and carries the access link itself.
- **Billing and seat history are visible only to Admin and QA Manager (PD-047).**
- **Public sign-up only allows selecting Admin or QA Manager as the role; QA Tester is added only via organisation invitation after the organisation exists (PD-019).**
- **No platform functionality is accessible without an active trial or active paid subscription; this applies from immediately after sign-up (PD-020).**
- **The trial is 14 days, capped at 3 seats, no payment required, and one-time only per organisation — once activated (whether it expires or is converted to paid), it cannot be selected again (PD-021).**
- **The monthly plan is billed at $10/seat, charged upfront as a single payment for the seat count chosen at subscribe time (PD-022).**
- **The yearly plan is billed at $9/seat/month, with the full 12-month total (seats × $9 × 12) shown before payment and charged upfront (PD-023).**
- **A confirmation email listing plan and amount charged is sent on every successful subscription payment (PD-024).**
- **Seats can never exceed the number paid for (or the 3-seat trial cap); an invitation that would exceed the seat count is blocked, with the inviter directed to purchase additional seats. Only Admin and QA Manager can manage payments/seat purchases (PD-025). Additional seats may also be purchased proactively at any time (PD-026).**
- **Seats purchased mid-term on a yearly plan are billed at the full yearly rate and run for 12 months from their own purchase date, independent of the original subscription's renewal date, producing staggered renewal dates (PD-027).**
- **Seat count can only increase; no refunds or credits are issued for unused seats, even after member removal (PD-028).**
- **A lapsed paid subscription gets a 14-day grace period with continued access and multi-channel (in-app + email) notification to Admin/QA Manager; access is blocked after 14 days without resolution. Trial expiry has no grace period — access is blocked immediately at day 14 (PD-029).**
- All subscription and seat amounts are in US dollars.

## 11. AI Capabilities
*(Unchanged from previous approved version.)*
- Generate a full set of test cases from a selected requirement (MVP).
- Generated test cases must be reviewable and editable before saving.
- AI generation from free-text task descriptions is postponed.
- Optional per-project AI provider key, plus a platform-provided AI option.
- AI provider selection and platform usage limits/cost model: not yet decided.

## 12. Test Case Template Capabilities
*(Unchanged.)* Organisation-scoped, created by QA Manager, MVP scope.

## 13. Test Report Template Capabilities
*(Unchanged.)* Organisation-scoped, created by QA Manager, MVP scope; on-demand reporting only.

## 14. Requirements and Traceability Capabilities
- Requirements are natively authored by QA Tester, QA Manager, or Admin (PD-015), typically sourced from an external record such as a Jira ticket.
- Import/sync of requirements from external tools is postponed to Post-MVP (PD-011).
- Full traceability required where links exist: requirement → test case(s) → run(s) → result(s) → defect(s).
- Requirement linkage on a test case is optional (PD-005).
- Editing a requirement that has already-approved linked test cases triggers those test cases into "Needs Review" status, requiring re-approval — by QA Manager, or by the test case's creator if the project has no approval step configured (PD-033).
- Archiving a requirement cascades to archive its linked test cases and reports. If a linked test case is currently part of an active, unclosed test run, that test run is also cancelled and archived as part of the same cascade (PD-016, extended by PD-034).

## 15. Subscription & Billing Capabilities

**Sign-up and access gating**
- Public sign-up form for new customers, separate from organisation invitation (PD-019).
- Sign-up role choice limited to Admin or QA Manager; sign-up creates the user's new organisation (PD-019).
- Confirmation email on successful sign-up; user is redirected to the subscription page (PD-019).
- No platform functionality is available until the organisation has an active trial or active paid subscription (PD-020).

**Plans**
- Trial: 14 days, no payment, capped at 3 seats, one-time only per organisation (PD-021).
- Monthly: seat count chosen at subscribe time, $10/seat, charged upfront as a single payment (PD-022).
- Yearly: seat count chosen at subscribe time, $9/seat/month, total shown as seats × $9 × 12 before payment, charged upfront as a single payment (PD-023).
- All amounts are in US dollars.

**Payment confirmation**
- Confirmation email with plan and amount charged sent on every successful subscription payment; no itemized invoice/receipt required beyond this (PD-024).

**Seat management**
- Seats can never exceed the number paid for (or the 3-seat trial cap) (PD-025).
- An invitation that would exceed the current seat count is blocked, with a notification directing the inviter to purchase additional seats (PD-025).
- Additional seats can be purchased proactively at any time, not only when blocked (PD-026).
- Only Admin and QA Manager can manage/complete subscription payments and seat purchases (PD-025).
- Seats purchased mid-term on a yearly plan are billed at the full yearly rate and run 12 months from their own purchase date, independent of the original subscription's renewal date — seat batches can have staggered renewal dates (PD-027).
- Seat count can only increase; no refunds or credits for unused seats, even after member removal (PD-028).

**Lapse handling**
- Paid subscription lapse (e.g., failed renewal): 14-day grace period with continued access; Admin and QA Manager notified via all available channels (in-app and email); access blocked after 14 days without resolution (PD-029).
- Trial expiry: access blocked immediately at day 14, with no grace period (PD-029).

**Visibility**
- Billing and seat history (purchases, plan, payment confirmations) are visible only to Admin and QA Manager; no other role has read-only access (PD-047).

## 16. MVP Scope (Additions for Sign-Up and Subscription & Billing)
- Public sign-up flow (Admin/QA Manager only) is in MVP scope.
- Mandatory trial-or-paid-subscription gating for platform access is in MVP scope.
- Trial plan, monthly plan, and yearly plan are all in MVP scope.
- Seat limit enforcement, blocked-invitation handling, and proactive seat purchase are in MVP scope.
- Payment confirmation email is in MVP scope.
- 14-day grace period on paid subscription lapse is in MVP scope.
- Billing/seat history visibility restricted to Admin and QA Manager is in MVP scope (PD-047).
- Role-change restriction to Admin only, and minimum-one-Admin enforcement, are in MVP scope (PD-030, PD-031).
- The "Needs Review" test case state, self-approval without an approval step, and requirement-edit-triggered re-review are in MVP scope (PD-033, PD-035, PD-036).
- Single report type with a Post-Deployment section, BA/PO record-only approval/rejection, and BA/PO private comments to QA Tester are in MVP scope (PD-038, PD-039, PD-040).
- Audit history visibility restricted to QA Manager and Admin is in MVP scope (PD-041).
- Configurable link expiry (24h default), no identity verification, named/generic links, multi-use, and free link sharing are in MVP scope (PD-042–PD-046).
- Payment processor selection, detailed billing UI, and itemized invoicing beyond the confirmation email are implementation/design details, not covered here.

## 17. Open Questions / Decisions Still Required
- What happens to an organisation's data/access at the end of the trial if the user never subscribes and never returns (long-term dormant/unpaid organisations) — is there a data retention or deletion policy?
- Can a trial-capped seat limit (3 seats) be reached exactly, or is there any warning before the cap blocks a new invitation, similar to paid-plan seat blocking?
- Is there any upper limit on how many seats can be purchased in a single transaction (proactive or blocked-invitation-triggered)?
- What happens to a test case stuck in "Needs Review" if the project's approval workflow is subsequently disabled — does it become self-approvable by its creator, or does it remain gated?
- What exact status label distinguishes a test run cancelled/archived via requirement-archive cascade (PD-034) from a normally closed run?
- Is the lapse-grace-period notification (PD-029) a single notice, or does it repeat/remind across the 14 days?
- Is the staggered renewal behavior for mid-term yearly seat purchases (PD-027) acceptable as a permanent model, or should a future consolidation/alignment mechanism be considered?
- What is the organisation name uniqueness policy at sign-up — must names be globally unique, or can duplicates exist across organisations?
- What is the session expiry/duration policy for logged-in users?
- Can QA Tester view the organisation member list, or is that restricted to Admin/QA Manager only?