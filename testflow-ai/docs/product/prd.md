# TestFlow AI — Product Requirements Document (PRD)

## 1. Product Overview
TestFlow AI is a multi-tenant, web-based **QA operating platform** that supports the full testing lifecycle — requirements, test case management, test suites, test execution, defects, traceability, and reporting — with AI-assisted test case generation as a core differentiator.

**Approved product pivot:** TestFlow provides stable, platform-controlled test-management semantics (execution, traceability, versioning, historical integrity) while each organisation defines and governs its own **QA Operating Model** — document templates, document lifecycle/workflow, project policy, and release/quality gates — within boundaries TestFlow permits. See `product-decisions.md` (ORG-QA-DEC-001 through ORG-QA-DEC-015) and `requirements-change-log.md` for the full record of this change. The configuration hierarchy is: **TestFlow System Semantics → Organisation QA Operating Model → Project Effective QA Configuration → Document/Execution Instance**; a lower level may only configure what the level above explicitly permits. **Terminology note (CHANGE-001 clarification):** a Project inherits a specific published Organisation QA Operating Model version — not a live link to "whatever the organisation currently publishes." Project-level configuration consists only of explicitly permitted **Project Exceptions** (bounded overrides) layered on top of that inherited version. The **Effective Project QA Process** is always: inherited Organisation QA Process + permitted Project Exceptions. Publishing a newer organisation version never silently changes an existing Project (PD-056, PD-057, PD-063).

**Methodology neutrality (CHANGE-002):** TestFlow does not model or enforce Scrum, Kanban, Waterfall, or other development methodologies as governed system concepts. Test Report and Regression Report may optionally carry a **QA Scope** value (and optional date range) describing the period/slice of work a document covers; an organisation may optionally set its preferred scope terminology as descriptive UI copy only. No Delivery Cycle/Sprint/Release entity exists, and Project Readiness remains Project-level (PD-064).

An organisation can contain multiple projects. Document templates (Test Case, Test Report, Regression Report) are organisation-scoped and organisation-configurable, built from TestFlow-provided defaults. Users hold one role at the organisation level (Admin, QA Manager, or QA Tester) that governs their capabilities across every project they have access to. Business Analyst/Product Owner, Developer, and Stakeholder are not organisation members; they participate via temporary, scoped access links.

TestFlow AI is a paid, subscription-based product. A new organisation is created via public sign-up (Admin or QA Manager only) and must have an active trial or paid subscription to access any platform functionality (PD-019, PD-020). After organisation creation, the organisation completes Organisation QA Setup — conceptually mandatory, but completable instantly via a TestFlow-provided starting preset (ORG-QA-DEC-013) — before normal project work begins.

## 2. Background / Problem
QA teams manually author large volumes of test cases, and typically manage requirements, testing, and defects across disconnected tools. Beyond that, QA organisations do not all share one QA process — they differ in what documents they require, how strict their approval process is, and what "release ready" means to them. TestFlow AI addresses this by combining core test management functions with AI-assisted test case generation and an organisation-governed QA Operating Model, in a single system, rather than forcing every team into one fixed process.

## 3. Product Goals
- Provide a complete test management workflow from requirement to execution to report.
- Reduce manual test case authoring effort using AI, generated against the organisation's applicable published template.
- Preserve full traceability between requirements, test cases, runs, and defects, with TestFlow-controlled semantics that remain stable regardless of organisation configuration.
- Allow each organisation to define and govern its own QA Operating Model — document templates, document lifecycle/approval behaviour, project policy, and release/quality gates — starting from TestFlow-provided defaults rather than a blank canvas. The previous self-service-only test case approval behaviour (PD-048) remains the default/lightweight behaviour; organisations may opt into stronger governance (ORG-QA-DEC-001).
- Support multi-tenant use at unlimited scale, with organisations able to manage multiple projects.
- Keep external stakeholder participation lightweight through scoped, temporary access.

## 4. Non-Goals (for now)
- Automated test execution — postponed.
- Fully custom/configurable roles and permissions — postponed. QA-configuration authority (drafting/publishing templates, workflows, policy) is layered onto the existing three fixed organisation roles via explicit permission checkpoints, not a custom-role builder (ORG-QA-DEC-011).
- A generic workflow/BPM engine or arbitrary state-machine builder — postponed. MVP supports a small, bounded set of parameterized workflow shapes only (ORG-QA-DEC-004).
- An open-ended quality-gate rules language — postponed. MVP supports a bounded, TestFlow-understood catalogue of gate conditions (ORG-QA-DEC-010).
- Arbitrary organisation-defined custom document types — postponed. MVP's configurable document types are limited to the built-in Test Report and Regression Report definitions (ORG-QA-DEC-003); Requirement, Test Case, Test Suite, Test Run, Execution Result, and Defect remain fixed, TestFlow-controlled system entities, not configurable document types.
- Calculated template fields and field-level edit permissions — postponed (ORG-QA-DEC-005).
- Scheduled/automated report distribution — postponed.
- AI generation from free-text task descriptions — postponed.
- Cross-organisation template sharing/library — postponed.
- Advanced AI features — postponed.
- Advanced dashboards — postponed.
- External defect-tool integration — postponed.
- Requirements import/sync from external tools — postponed (native authoring only, sourced manually from wherever the requirement originates, e.g., Jira).
- Test plan as a concept distinct from test run — postponed.
- Organisation membership/accounts for BA/PO, Developer, and Stakeholder — not planned; these roles use link-based access instead.
- Automatic migration of historical documents onto a newer published template/workflow/policy version — not planned; published configuration versions are immutable and historical documents retain the version applicable when they were created (ORG-QA-DEC-009).

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
| **QA Manager** | Invites organisation members and sets their role at invitation; can create/update/archive projects; sees all projects in the organisation; **defines and publishes the organisation's QA Operating Model** — document templates (Test Case, Test Report, Regression Report), document workflow/approval behaviour, project policy, and release/quality gates (ORG-QA-DEC series) — or adopts a TestFlow-provided starting preset; configures project-level policy within what the organisation permits to be overridden; reviews and comments on test cases, and approves documents where the organisation's configured workflow assigns that role to QA Manager (default self-service behaviour is unchanged, PD-048/ORG-QA-DEC-001); reviews reports (Test Report, and Regression Report where configured — PD-038); views project dashboards; views billing and seat history (PD-047); generates temporary access links for BA/PO, Developer, and Stakeholder; can perform any action available to a QA Tester. Cannot change another member's role (PD-031). |
| **QA Tester** | Can create, update, and archive projects; sees only projects they created or were added to; enters requirements (e.g., from a Jira ticket or wherever the requirement originates); triggers AI test case generation (against the organisation's applicable published Test Case template) and/or writes test cases manually; approves their own test cases under the organisation's default self-service behaviour, or participates in a configured review/approval workflow where the organisation has opted into one (PD-048/ORG-QA-DEC-001); organizes suites; executes tests; records results; attaches evidence; logs defects; can add other organisation members to a project they have access to; can remove users from a project they have access to; generates temporary access links for BA/PO, Developer, and Stakeholder. |

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
2. **Organisation QA Operating Model** (QA process/governance configuration, project policy, release/quality gates — new module; supersedes the narrow "Template Management" framing below)
3. Requirements Management
4. Test Case Management
5. AI Test Generation
6. Template Management (organisation-scoped; generalized into a structured Template System under the QA Operating Model — see §18)
7. Test Suite Management
8. Test Run / Execution
9. Defect Management
10. Traceability
11. Reporting & Dashboards
12. User & Access Management (organisation-level roles)
13. Link-Based Access (for BA/PO, Developer, Stakeholder)
14. Audit / History
15. Notifications
16. Subscription & Billing

**Note:** module 2 (Organisation QA Operating Model) and module 6's generalization are the direct product-layer result of the approved pivot. Their exact functional scope (configuration catalogue, template field model, workflow shapes, quality gate catalogue) is deferred to Functional Requirements — see §18 for the bounded, non-detailed capability statement approved at this layer.

## 8. Core Product Capabilities
- Multi-tenant support for unlimited organisations and projects
- Organisation-level invitation and role assignment for Admin, QA Manager, QA Tester (PD-017)
- Project creation, update, and archiving by Admin, QA Manager, or QA Tester (PD-014)
- QA Manager/Admin see all organisation projects; QA Tester sees only projects created by or added to them (PD-014)
- Adding a user to a project (access grant) performable by Admin, QA Manager, or any QA Tester with access to that project
- Requirements: native authoring by QA Tester, QA Manager, or Admin, typically sourced from an external record such as a Jira ticket (PD-015)
- Archiving a requirement cascades to archive its linked test cases and reports, and to cancel/archive any active, unclosed test run those test cases belong to (PD-016, extended by PD-034)
- Editing a requirement with already-approved linked test cases triggers re-review of those test cases (status reverts to Needs Review) (PD-033)
- AI-generated test cases: full set of test cases generated per requirement, generated against the organisation's applicable published Test Case template, reviewable/editable before saving (ORG-QA-DEC-012)
- Manual test case creation and editing
- **Organisation QA Operating Model**: organisation-configurable document templates (Test Case, Test Report, Regression Report), built from TestFlow-provided defaults; document lifecycle/approval behaviour chosen from a bounded set of workflow shapes (No Approval / Single Approval / Review + Approval); project policy (which QA artifacts a project requires); and release/quality gates drawn from a bounded, TestFlow-understood catalogue (ORG-QA-DEC-003 through ORG-QA-DEC-010) — see §18
- Test suite organization
- Manual test execution with statuses: Pass, Fail, Blocked, Skipped (unchanged, TestFlow-controlled system semantics — ORG-QA-DEC applies only to document/record workflow status, not execution result status)
- Evidence attachment on execution results; execution results are immutable once a test run is closed (PD-037)
- Native defect logging, with Defect Severity carrying stable TestFlow-controlled semantics (organisation-configurable display labels) and Defect Priority as an organisation-configurable field, distinct concepts (ORG-QA-DEC-007)
- Requirement-to-test-case traceability, distinguishing traced vs. untraced test cases
- On-demand reporting (Test Report as a built-in configurable document type, with a Post-Deployment section for production testing; Regression Report as a second built-in configurable document type) and dashboards (PD-038, ORG-QA-DEC-003)
- Test case approval defaults to the existing self-service behaviour (Draft → Approved → Needs Review; any user with edit access can approve directly, at any time — PD-048); organisations may instead opt into a configured Single Approval or Review + Approval workflow shape (ORG-QA-DEC-001, ORG-QA-DEC-004)
- Release/quality gates, evaluated by TestFlow against configured document-workflow state and system data (e.g., "no unresolved Critical defects," "required Test Report approved") — document workflow approval and quality-gate evaluation are separate, explicitly related concerns (ORG-QA-DEC-002)
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
6. Completes **Organisation QA Setup**: conceptually mandatory (every organisation must have a published QA Operating Model), but satisfiable instantly by selecting a TestFlow-provided starting preset (Standard QA recommended default, Lightweight QA, Controlled QA, or Custom Setup) rather than a lengthy configuration wizard — ORG-QA-DEC-013
7. Once active and QA Setup is complete, can invite other organisation members (QA Tester, additional Admin/QA Manager) and generate link-based access as needed

**QA Manager**
1. Invites organisation members (Admin, QA Manager, or QA Tester), setting their role at invitation
2. Creates or oversees projects (sees all projects in the organisation)
3. Defines and publishes the organisation's QA Operating Model, or adopts/refines a starting preset — document templates, document workflow, project policy, and release/quality gates
4. Sets project-level policy within what the organisation permits to be overridden
5. Adds/removes organisation members' access to specific projects
6. Reviews and comments on test cases; approves documents where the organisation's configured workflow assigns that role to QA Manager (self-service remains the default — PD-048/ORG-QA-DEC-001)
7. Generates temporary access links for BA/PO (report approval), Developer (defect resolution), and Stakeholder (dashboard/report viewing)
8. Reviews Test Reports (including the Post-Deployment section) and, where configured, Regression Reports
9. Views a project progress dashboard, including release/quality-gate readiness where configured
10. Can perform any action available to a QA Tester

**QA Tester**
1. Creates a project (or is added to one) — sees only projects they created or were added to
2. Enters requirements sourced from an external record (e.g., a Jira ticket) or wherever the requirement originates
3. Triggers AI generation of a full set of test cases from a requirement, or writes test cases manually
4. Reviews, edits, and saves generated test cases
5. Assigns test cases to a suite
6. Approves their own test cases when ready (self-service, PD-048)
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
- **Every organisation has a published QA Operating Model, governing document templates, document lifecycle/workflow, project policy, and release/quality gates (ORG-QA-DEC-013). Organisations adopt a TestFlow-provided starting preset (Standard QA, Lightweight QA, Controlled QA) or configure Custom Setup from scratch; the exact content of each preset is deferred to Functional Requirements (ORG-QA-DEC-014), except that the Standard QA preset's conceptual basis is the previously approved TestFlow default behaviour, generalized where the new model requires it.**
- **Test case approval defaults to the simplified self-service state model — Draft → Approved → Needs Review, any user with edit access can set a test case directly to Approved, at any time — as the Standard QA default (PD-048, generalized by ORG-QA-DEC-001; supersedes PD-006/PD-007/PD-035/PD-036). An organisation may instead configure a Single Approval or Review + Approval workflow shape; exact states/transitions/approver-role rules are deferred to Functional Requirements (ORG-QA-DEC-004).**
- **If an Approved test case is edited, it reverts to "Needs Review"; under the default self-service behaviour the user reviews and re-approves it themselves when ready. Under a configured approval workflow, re-approval follows that workflow's rule instead.**
- **Editing a requirement that has already-approved linked test cases triggers those test cases into "Needs Review" (PD-033); re-approval then follows whichever document-workflow behaviour the organisation has configured (self-service by default, ORG-QA-DEC-001).**
- **Document workflow status (e.g., a test case's or report's lifecycle state) is organisation-configurable within TestFlow-supported workflow shapes; it is distinct from TestFlow-controlled execution result status (Pass/Fail/Blocked/Skipped, unchanged) and test run lifecycle status (unchanged). TestFlow retains stable internal/meta semantics for document workflow status so organisation-specific labels do not break reporting, traceability, AI, or quality-gate evaluation (ORG-QA-DEC-002, §10 of the impact analysis).**
- **An approved document (e.g., an approved Test Report) does not itself block or trigger anything by default — document workflow and release/quality gates are separate concerns. An organisation may configure a quality gate that depends on a document's workflow state (e.g., "an approved Test Report is required for Release Ready"); the gate evaluator checks that state (ORG-QA-DEC-002, generalizes PD-039's record-only default).**
- **Defect Severity carries stable, TestFlow-controlled semantic levels (Critical/High/Medium/Low) so reporting and quality gates can reason consistently; organisations may configure the display label mapped to each level, but not remove the underlying semantic mapping where it's used by system functionality. Defect Priority and Test Case Priority are organisation-configurable fields, distinct from Severity (ORG-QA-DEC-007).**
- **Projects inherit the organisation's published QA Operating Model by default. Project-level overrides are not automatically allowed — the organisation determines which settings are overridable, only authorized roles may exercise an override, overrides are explicit and audited, and the effective configuration for a project must remain identifiable at all times. The MVP override surface is intentionally limited (ORG-QA-DEC-008).**
- **Published QA configuration (templates, workflows, organisation policy, project-effective configuration, quality gates) is versioned and immutable once published — changes are prepared separately and published as a new version. Historical documents are unaffected by a later publish and remain interpretable against the configuration version applicable when they were created (ORG-QA-DEC-009).**
- **Release/quality gates are evaluated by TestFlow against a bounded, TestFlow-understood catalogue of conditions the organisation selects/configures (e.g., required artifacts completed, required approvals completed, minimum requirement coverage, no unresolved Critical defects) — not an open-ended rules language (ORG-QA-DEC-010).**
- **AI-generated test cases must be generated against the organisation's applicable published Test Case template and validated against it (required fields, allowed structure, configured options) before being offered for the existing mandatory human review/save step; AI must not bypass workflow, permissions, or governance (ORG-QA-DEC-012).**
- AI provider key configuration is optional per project; a platform-provided AI option is also available.
- **Templates are organisation-scoped and are no longer merely a pre-population blob — they define a structured, field-level document schema distinguishing TestFlow-protected system fields from organisation-configurable fields, with TestFlow-provided sensible defaults so organisations are not required to start from a blank canvas (ORG-QA-DEC-005, ORG-QA-DEC-006). Exact field types/properties are deferred to Functional Requirements.**
- **Requirements are authored by QA Tester, QA Manager, or Admin — not by BA/PO (PD-015).**
- **Archiving a requirement cascades to archive its linked test cases and reports; if a linked test case belongs to an active, unclosed test run, that run is also cancelled and archived (PD-016, extended by PD-034).**
- **Execution results cannot be edited once a test run is closed — this is a hard rule with no exception (PD-037).**
- **There is a single built-in Test Report document type, not separate pre-deployment and post-deployment reports; it includes a "Post-Deployment" section covering testing performed in production (PD-038). A second built-in configurable document type, Regression Report, is also approved at this layer (ORG-QA-DEC-003); its detailed content is deferred to Functional Requirements. This supersedes any earlier framing of pre-/post-deployment as distinct report types.**
- **A BA/PO's approval or rejection of a report via their link is record-keeping only by default — it does not itself trigger, gate, or block any other action or workflow (PD-039, as the Standard QA default). An organisation may configure a quality gate that depends on this approval record (e.g., requiring an approved Test Report for Release Ready); the dependency lives in the quality gate configuration, not in report approval itself (ORG-QA-DEC-002).**
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
- Generate a full set of test cases from a selected requirement (MVP).
- **Generation must target the organisation's applicable published Test Case template and be validated against it (required fields, allowed structure, configured options, organisation terminology) before being offered for review (ORG-QA-DEC-012) — a change from the previous fixed-shape generation behaviour.**
- Generated test cases must be reviewable and editable before saving; human review remains mandatory and AI must not bypass workflow, permissions, or governance.
- AI generation from free-text task descriptions is postponed.
- Optional per-project AI provider key, plus a platform-provided AI option.
- AI provider selection and platform usage limits/cost model: not yet decided.
- The same template-awareness principle is intended to extend to future AI-generated configurable QA documents, where that capability is separately approved — not committed as MVP scope here.

## 12. Test Case Template Capabilities
Organisation-scoped, structured field-level template (superseding the previous simple pre-population blob), with TestFlow-provided defaults and a distinction between protected system fields and organisation-configurable fields (ORG-QA-DEC-005, ORG-QA-DEC-006). Authored/published by QA Manager or authorized organisation administrator. Exact field types/properties/validation are deferred to Functional Requirements. MVP scope.

## 13. Test Report Template Capabilities
Organisation-scoped, same structured template model as §12, applied to the built-in Test Report and Regression Report document types (ORG-QA-DEC-003). Authored/published by QA Manager or authorized organisation administrator; on-demand reporting only. Exact field types/properties are deferred to Functional Requirements. MVP scope.

## 14. Requirements and Traceability Capabilities
- Requirements are natively authored by QA Tester, QA Manager, or Admin (PD-015), typically sourced from an external record such as a Jira ticket.
- Import/sync of requirements from external tools is postponed to Post-MVP (PD-011).
- Full traceability required where links exist: requirement → test case(s) → run(s) → result(s) → defect(s).
- Requirement linkage on a test case is optional (PD-005).
- Editing a requirement that has already-approved linked test cases triggers those test cases into "Needs Review" status; the user re-approves them directly, self-service (PD-033, PD-048).
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
- The simplified "Draft → Approved → Needs Review" test case state model, self-service approval (no QA Manager gate), and requirement-edit-triggered re-review are in MVP scope (PD-033, PD-048).
- Single report type with a Post-Deployment section, BA/PO record-only approval/rejection, and BA/PO private comments to QA Tester are in MVP scope (PD-038, PD-039, PD-040).
- Audit history visibility restricted to QA Manager and Admin is in MVP scope (PD-041).
- Configurable link expiry (24h default), no identity verification, named/generic links, multi-use, and free link sharing are in MVP scope (PD-042–PD-046).
- Payment processor selection, detailed billing UI, and itemized invoicing beyond the confirmation email are implementation/design details, not covered here.
- Organisation QA Setup as an onboarding step, satisfiable instantly via a starting preset, is in MVP scope at the product-definition layer (ORG-QA-DEC-013); its detailed configuration surface is not yet specified (see §18).
- A bounded Template System (structured fields, system/configurable-field distinction, TestFlow defaults), a bounded set of document-workflow shapes, a bounded quality-gate catalogue, and project-policy overrides are in MVP scope at the product-definition layer (ORG-QA-DEC-003 through ORG-QA-DEC-010); their detailed specification is deferred to Functional Requirements.

## 18. Organisation QA Operating Model (Approved Product Pivot)

**Status:** Approved at the product-definition layer only (this document, `vision.md`, `product-decisions.md`). Functional Requirements, database, API, architecture, user flows, and design documentation have not yet been re-baselined to reflect this — see `requirements-change-log.md` for the pivot record and `requirements-traceability.md` for re-baseline status.

**Principle:** TestFlow is a QA operating platform. It retains stable, platform-controlled semantics for execution, traceability, historical integrity, AI validation, and platform operation. Each organisation defines and governs its own QA Operating Model within the boundaries TestFlow permits. Configuration hierarchy: **TestFlow System Semantics → Organisation QA Operating Model → Project Effective QA Configuration → Document/Execution Instance**. A lower level may only configure what the level above explicitly permits.

**Onboarding:** Sign Up → Subscribe → Create Organisation → **Organisation QA Setup** → Create/Operate Projects. Every organisation must have a published QA Operating Model, but manual configuration is not required to get there — selecting a TestFlow-provided starting preset (Standard QA recommended, Lightweight QA, Controlled QA, or Custom Setup) satisfies setup immediately (ORG-QA-DEC-013). The exact contents of each preset are a future product-definition task, except that Standard QA is conceptually grounded in TestFlow's existing approved default behaviour wherever compatible with the new model (ORG-QA-DEC-014).

**First-class system entities** (fixed platform semantics, not configurable document types): Requirement, Test Case, Test Suite, Test Run, Execution Result, Defect. Their content may include organisation-configurable fields where TestFlow permits; their core relationships and execution/traceability behaviour remain platform-controlled (ORG-QA-DEC-003).

**Built-in configurable QA documents:** Test Report and Regression Report. Organisations configure their templates. Arbitrary custom document types (e.g., Performance/Security/UAT Test Report, Release QA Sign-off, Checklist) are documented as possible future expansions only, not an MVP commitment (ORG-QA-DEC-003).

**Template System:** supersedes the previous narrow "pre-population blob" template concept. Templates define a structured, field-level schema distinguishing TestFlow-protected system fields (record identity, tenant/project ownership, execution semantics, traceability, versioning, audit/history) from organisation-configurable fields. TestFlow provides sensible default templates; organisations are not required to start from a blank canvas (ORG-QA-DEC-005, ORG-QA-DEC-006, §18 of the impact analysis).

**Document workflow / approval:** bounded to a small set of parameterized shapes — No Approval, Single Approval, Review + Approval — not a generic workflow/BPM engine. The existing self-service Draft → Approved → Needs Review behaviour is the No-Approval default; organisations may opt into a stronger shape (ORG-QA-DEC-001, ORG-QA-DEC-004).

**Quality Gates:** a separate concern from document workflow. TestFlow evaluates a bounded, TestFlow-understood catalogue of gate conditions (e.g., required artifacts completed, required approvals recorded, minimum coverage, no unresolved Critical defects) that an organisation selects/configures; a document's workflow/approval state can be a gate condition's input without report/document approval itself becoming a generic blocking mechanism (ORG-QA-DEC-002, ORG-QA-DEC-010).

**Project policy & inheritance:** projects inherit the organisation's published QA Operating Model by default; overrides are not automatic, require organisation-designated overridability, permission, and are audited; the effective configuration for a project must always be identifiable (ORG-QA-DEC-008).

**Versioning:** published configuration (templates, workflows, policy, quality gates) is immutable once published; changes publish as a new version; historical documents remain interpretable against the version applicable when created; no silent retroactive mutation, no automatic migration of historical documents (ORG-QA-DEC-009).

**Permissions:** the existing three-role model (Admin, QA Manager, QA Tester) is retained; QA-configuration authority (draft/publish templates, configure workflow/policy, approve documents, perform permitted overrides) is layered on via explicit permission checkpoints, not a custom-role builder (ORG-QA-DEC-011).

**AI:** generation must target and validate against the applicable published template/configuration before the mandatory human-review/save step; AI must not bypass workflow, permissions, or governance (ORG-QA-DEC-012).

**Design status:** the approved visual design direction (`docs/design/design-direction.md`, `docs/design/design-system.md`) remains valid; the Dashboard and Test Case Management screens remain representative references. Any hard-coded fields/statuses shown in those references are illustrative pending formal configuration-backed specification — no design documents are modified by this pivot.

**Deferred to Functional Requirements:** the exact configuration catalogue (which QA rules are configurable and their options), template field types/properties, workflow states/transitions/permissions, quality-gate catalogue and calculation rules, and the precise content of each starting preset. This section establishes the capability and its boundaries, not the detailed specification.

## 19. Open Questions / Decisions Still Required
- What happens to an organisation's data/access at the end of the trial if the user never subscribes and never returns (long-term dormant/unpaid organisations) — is there a data retention or deletion policy?
- Can a trial-capped seat limit (3 seats) be reached exactly, or is there any warning before the cap blocks a new invitation, similar to paid-plan seat blocking?
- Is there any upper limit on how many seats can be purchased in a single transaction (proactive or blocked-invitation-triggered)?
- What exact status label distinguishes a test run cancelled/archived via requirement-archive cascade (PD-034) from a normally closed run?
- Is the lapse-grace-period notification (PD-029) a single notice, or does it repeat/remind across the 14 days?
- Is the staggered renewal behavior for mid-term yearly seat purchases (PD-027) acceptable as a permanent model, or should a future consolidation/alignment mechanism be considered?
- What is the organisation name uniqueness policy at sign-up — must names be globally unique, or can duplicates exist across organisations?
- What is the session expiry/duration policy for logged-in users?
- Can QA Tester view the organisation member list, or is that restricted to Admin/QA Manager only?
- **Exact content of the Standard QA, Lightweight QA, and Controlled QA presets** — deferred to Functional Requirements (ORG-QA-DEC-014).
- **Exact template field-type palette, field properties, and validation rules** for the Template System — deferred to Functional Requirements (ORG-QA-DEC-005).
- **Exact document-workflow states, transition rules, and approver-role assignment** for the No Approval / Single Approval / Review + Approval shapes — deferred to Functional Requirements (ORG-QA-DEC-004).
- **Exact quality-gate condition catalogue and calculation rules** — deferred to Functional Requirements (ORG-QA-DEC-010).
- **Exact set of project-policy settings organisations may mark overridable** — deferred to Functional Requirements (ORG-QA-DEC-008).
- **Exact Defect Severity default label set and how organisations remap display labels** — deferred to Functional Requirements (ORG-QA-DEC-007).
- **Exact permission checkpoints and role assignment for QA-configuration actions** (draft/publish/configure/override) — deferred to Functional Requirements (ORG-QA-DEC-011).
- **Whether Organisation QA Setup blocks project creation entirely, or projects can exist against an implicit default before setup is explicitly completed** — flagged, not resolved, at this layer.