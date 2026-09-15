# TestFlow AI — Functional Requirements (FR)

**Source documents:** vision.md, prd.md, product-decisions.md (all approved)
**Status:** Approved — reflects all product decisions through PD-063 (Organisation QA Operating Model pivot, CHANGE-001). Requirements marked **[Generalized — CHANGE-001]** update pre-pivot behaviour to remain the default while adding organisation configurability; requirements marked **[New — CHANGE-001]** are net-new modules/capabilities introduced by the pivot. Earlier **[Updated]**/**[New]** markings from the PD-030–PD-047 round are left in place for historical traceability.
**Scope:** This document specifies functional (behavioural) requirements only. It does not specify technology, database design, API design, architecture, or UI design.

---

## How to Read This Document

Requirements are grouped by module, using the module prefixes already referenced across vision.md, prd.md, and non-functional-requirements.md (e.g., `FR-TC-005`, `FR-LNK-001`, `FR-SUB-007`). Each requirement includes: Requirement ID, Title, Requirement ("The system shall..."), Purpose, Actors, Preconditions, Main Behaviour, Business Rules, Acceptance Criteria (Given/When/Then), Error/Edge Conditions, Priority, Dependencies.

Requirements corresponding to product decisions carry a `(PD-xxx)` reference. Requirements newly added or substantively rewritten to reflect the most recent decision round (PD-030–PD-047) are marked **[Updated]** or **[New]** in their title line for traceability; this marking is descriptive only and may be removed in a future documentation pass once the change has settled.

**Requirement layers (CHANGE-001):** Every requirement in this document belongs to one of four layers, per PD-063's configuration hierarchy. This is noted at the top of each new/changed module section, not repeated per-requirement:
- **A. TestFlow System Semantics** — stable, platform-controlled behaviour (execution results, test run lifecycle, versioning/snapshotting, traceability chain, audit, tenant integrity, AI validation gate). Never organisation-configurable.
- **B. Organisation QA Configuration** — organisation-governed behaviour (QA governance toggles, templates, document workflow shape, required artifacts, quality gates, permitted overrides). New in this pass: modules QAOM, TPL, WF, POL, QG.
- **C. Project Effective Configuration** — the resolved combination of A + the organisation's published configuration + any permitted, explicit project override. See module POL.
- **D. Document/Execution Instance** — the actual Requirement/Test Case/Test Run/Defect/Report/etc. records operating under the applicable configuration version at the time they were created or acted upon.

---

## Requirement Index

| ID | Title | Module | Priority |
|---|---|---|---|
| FR-AUTH-001 | Public Sign-Up | AUTH | MVP |
| FR-AUTH-002 | Login | AUTH | MVP |
| FR-AUTH-003 | Session Management | AUTH | MVP |
| FR-AUTH-004 | Sign-Up Confirmation Email | AUTH | MVP |
| FR-AUTH-005 | Sign-Up Role Restriction | AUTH | MVP |
| FR-AUTH-006 | Post-Sign-Up Redirect to Subscription | AUTH | MVP |
| FR-QAOM-001 | Organisation QA Setup Required Before Normal Operation **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-002 | Instant Setup via Starting Preset **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-003 | Starting Preset Options **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-004 | Standard QA Preset Definition **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-005 | Lightweight QA Preset Definition **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-006 | Controlled QA Preset Definition **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-007 | Custom Setup **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-008 | QA Configuration Draft and Publish **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-009 | Published Configuration Immutability and Versioning **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-010 | Organisation QA Governance Catalogue **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-011 | Reconfiguration After Initial Setup **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-012 | Existing Projects Pinned to Effective Configuration **[New — CHANGE-001]** | QAOM | MVP |
| FR-QAOM-013 | Organisation Preferred Scope Terminology (Descriptive Only) **[New — CHANGE-002]** | QAOM | MVP |
| FR-ORG-001 | Organisation Creation at Sign-Up | ORG | MVP |
| FR-ORG-002 | Unlimited Organisations | ORG | MVP |
| FR-ORG-003 | Organisation Settings Management | ORG | MVP |
| FR-ORG-004 | Invite Organisation Member | ORG | MVP |
| FR-ORG-005 | Set Role at Invitation | ORG | MVP |
| FR-ORG-006 | Minimum One Admin Enforcement **[Updated]** | ORG | MVP |
| FR-USR-001 | Organisation-Level Role Assignment | USR | MVP |
| FR-USR-002 | Role Governs Cross-Project Capability | USR | MVP |
| FR-USR-003 | Role Change — Admin Only **[Updated]** | USR | MVP |
| FR-USR-004 | Removed Project Creator Access Handling **[Updated]** | USR | MVP |
| FR-USR-005 | Remove Organisation Member | USR | MVP |
| FR-USR-006 | View Organisation Member List | USR | MVP |
| FR-USR-007 | QA Tester Project Membership Management | USR | MVP |
| FR-PRJ-001 | Create Project | PRJ | MVP |
| FR-PRJ-002 | Update Project | PRJ | MVP |
| FR-PRJ-003 | Archive Project | PRJ | MVP |
| FR-PRJ-004 | Project Visibility by Role | PRJ | MVP |
| FR-PRJ-005 | Add User to Project | PRJ | MVP |
| FR-PRJ-006 | Remove User from Project | PRJ | MVP |
| FR-PRJ-007 | Removed Project Creator — Admin/QA Manager Access Retained **[Updated]** | PRJ | MVP |
| FR-REQ-001 | Native Requirement Authoring | REQ | MVP |
| FR-REQ-002 | Editing a Linked Requirement Triggers Re-Review **[Updated]** | REQ | MVP |
| FR-REQ-003 | Optional Requirement–Test-Case Link | REQ | MVP |
| FR-REQ-004 | Requirement Archive Cascade, Including Active Test Runs **[Updated]** | REQ | MVP |
| FR-TC-001 | Create Test Case | TC | MVP |
| FR-TC-002 | Edit Test Case | TC | MVP |
| FR-TC-003 | Test Case Versioning | TC | MVP |
| FR-TC-004 | Test Run Snapshot of Test Case Content | TC | MVP |
| FR-TC-005 | Test Case Approval Under Organisation-Configured Workflow **[Generalized — CHANGE-001]** | TC | MVP |
| FR-TC-006 | Optional Requirement Linkage | TC | MVP |
| FR-TC-007 | Review and Comment on Test Cases | TC | MVP |
| FR-TC-008 | Test Case Creation from Applicable Published Template **[Generalized — CHANGE-001]** | TC | MVP |
| FR-TC-009 | Assign Test Case to Suite | TC | MVP |
| FR-TC-010 | AI-Generated Test Case Flagging | TC | MVP |
| FR-TC-011 | Test Case Priority **[New — CHANGE-001]** | TC | MVP |
| FR-TPL-001 | Structured Template Field Definitions **[New — CHANGE-001]** | TPL | MVP |
| FR-TPL-002 | Protected System Fields vs. Configurable Fields **[New — CHANGE-001]** | TPL | MVP |
| FR-TPL-003 | Template Field-Type Palette **[New — CHANGE-001]** | TPL | MVP |
| FR-TPL-004 | Configurable Field Properties **[New — CHANGE-001]** | TPL | MVP |
| FR-TPL-005 | Default Starter Templates **[New — CHANGE-001]** | TPL | MVP |
| FR-TPL-006 | Template Draft Editing **[New — CHANGE-001]** | TPL | MVP |
| FR-TPL-007 | Template Publish, Versioning, Immutability **[New — CHANGE-001]** | TPL | MVP |
| FR-TPL-008 | Template Version History **[New — CHANGE-001]** | TPL | MVP |
| FR-TPL-009 | Document Creation Uses Applicable Published Template Version **[New — CHANGE-001]** | TPL | MVP |
| FR-WF-001 | Bounded Document Workflow Shapes **[New — CHANGE-001]** | WF | MVP |
| FR-WF-002 | Organisation Configures Workflow Shape per Document Type **[New — CHANGE-001]** | WF | MVP |
| FR-WF-003 | Stable Workflow Meta-State vs. Display Label **[New — CHANGE-001]** | WF | MVP |
| FR-WF-004 | Execution of Unapproved Test Case — Governance Setting **[New — CHANGE-001]** | WF | MVP |
| FR-WF-005 | Report Workflow (Test Report / Regression Report) **[New — CHANGE-001]** | WF | MVP |
| FR-WF-006 | Approval Permission Checkpoints **[New — CHANGE-001]** | WF | MVP |
| FR-AI-001 | Generate Test Cases from Requirement, Against Applicable Template **[Generalized — CHANGE-001]** | AI | MVP |
| FR-AI-002 | Mandatory Human Review Before Save | AI | MVP |
| FR-AI-003 | Optional Per-Project AI Provider Key | AI | MVP |
| FR-AI-004 | Platform-Provided AI Option | AI | MVP |
| FR-AI-005 | AI Generation Scope Limited to Requirements | AI | MVP |
| FR-AI-006 | AI Output Validated Against Applicable Template Before Review **[New — CHANGE-001]** | AI | MVP |
| FR-TS-001 | Create Test Suite | TS | MVP |
| FR-TS-002 | Organize Test Cases into Suite | TS | MVP |
| FR-TR-001 | Create Test Run | TR | MVP |
| FR-TR-002 | Snapshot Test Case Content at Run Creation | TR | MVP |
| FR-TR-003 | Close Test Run | TR | MVP |
| FR-TR-004 | Test Run Progress Aggregation | TR | MVP |
| FR-EXEC-001 | Record Execution Result | EXEC | MVP |
| FR-EXEC-002 | Attach Evidence to Result | EXEC | MVP |
| FR-EXEC-003 | Execution Result Immutability After Run Closure **[Updated]** | EXEC | MVP |
| FR-DEF-001 | Log Defect | DEF | MVP |
| FR-DEF-002 | Assign Defect to Developer | DEF | MVP |
| FR-DEF-003 | Update Defect Status via Link | DEF | MVP |
| FR-DEF-004 | Link Defect to Test Case/Result | DEF | MVP |
| FR-DEF-005 | Defect History | DEF | MVP |
| FR-DEF-006 | Notify Developer of Defect Assignment | DEF | MVP |
| FR-DEF-007 | Defect Severity — Stable Semantics, Configurable Labels **[New — CHANGE-001]** | DEF | MVP |
| FR-DEF-008 | Defect Priority — Organisation-Configurable **[New — CHANGE-001]** | DEF | MVP |
| FR-TRACE-001 | Requirement-to-Defect Traceability Chain | TRACE | MVP |
| FR-TRACE-002 | Traced vs. Untraced Test Case Reporting | TRACE | MVP |
| FR-RPT-001 | On-Demand Report Generation | RPT | MVP |
| FR-RPT-002 | Single Report Type with Post-Deployment Section **[Updated]** | RPT | MVP |
| FR-RPT-003 | BA/PO Report Approval/Rejection — Record-Keeping by Default **[Generalized — CHANGE-001]** | RPT | MVP |
| FR-RPT-004 | BA/PO Report Comments — Private to QA Tester **[New]** | RPT | MVP |
| FR-RPT-005 | Regression Report — Built-In Configurable Document Type **[New — CHANGE-001]** | RPT | MVP |
| FR-RPT-006 | Optional QA Scope on Test Report / Regression Report **[New — CHANGE-002]** | RPT | MVP |
| FR-POL-001 | Required QA Artifacts Configuration **[New — CHANGE-001]** | POL | MVP |
| FR-POL-002 | Project Inherits Organisation Published Configuration **[New — CHANGE-001]** | POL | MVP |
| FR-POL-003 | Overridable vs. Locked Settings **[New — CHANGE-001]** | POL | MVP |
| FR-POL-004 | Explicit, Permissioned, Audited Project Override **[New — CHANGE-001]** | POL | MVP |
| FR-POL-005 | Effective Project Configuration Visibility **[New — CHANGE-001]** | POL | MVP |
| FR-QG-001 | Quality Gate Catalogue **[New — CHANGE-001]** | QG | MVP |
| FR-QG-002 | Quality Gate Configuration **[New — CHANGE-001]** | QG | MVP |
| FR-QG-003 | Quality Gate Evaluation and Readiness Result **[New — CHANGE-001]** | QG | MVP |
| FR-QG-004 | Human-Readable Gate Failure Reason **[New — CHANGE-001]** | QG | MVP |
| FR-DASH-001 | Project Progress Dashboard | DASH | MVP |
| FR-DASH-002 | Test Run Progress Widget | DASH | MVP |
| FR-DASH-003 | Stakeholder Read-Only Dashboard View | DASH | MVP |
| FR-DASH-004 | Release/Quality Gate Readiness Widget **[New — CHANGE-001]** | DASH | MVP |
| FR-AUD-001 | Audit Log of Key Actions | AUD | MVP |
| FR-AUD-002 | Audit Entries for Link-Based Actions | AUD | MVP |
| FR-AUD-003 | Audit History Visibility Restricted to QA Manager/Admin **[Updated]** | AUD | MVP |
| FR-AUD-004 | Audit Entry Attribution and Timestamping | AUD | MVP |
| FR-AUD-005 | Audit Entries for QA Configuration Changes **[New — CHANGE-001]** | AUD | MVP |
| FR-NOT-001 | In-App Notifications for Organisation Members | NOT | MVP |
| FR-NOT-002 | Email Notifications for All Roles | NOT | MVP |
| FR-NOT-003 | Email as Sole Delivery Mechanism for Link-Based Roles | NOT | MVP |
| FR-NOT-004 | Maintenance Notification | NOT | Post-MVP |
| FR-NOT-005 | Notification/Link Delivery Retry | NOT | MVP |
| FR-NOT-006 | QA Configuration Published Notification **[New — CHANGE-001]** | NOT | MVP |
| FR-NOT-007 | Document Workflow Event Notifications **[New — CHANGE-001]** | NOT | MVP |
| FR-LNK-001 | Generate Temporary Access Link, Configurable Expiry **[Updated]** | LNK | MVP |
| FR-LNK-002 | No Identity Verification for Link Recipients **[Updated]** | LNK | MVP |
| FR-LNK-003 | Named or Generic Link Recipient **[Updated]** | LNK | MVP |
| FR-LNK-004 | Multi-Use Link Until Expiry or Revocation **[Updated]** | LNK | MVP |
| FR-LNK-005 | Link Revocation | LNK | MVP |
| FR-LNK-006 | Free Sharing of Link by Holder **[New]** | LNK | MVP |
| FR-SUB-001 | Trial Plan | SUB | MVP |
| FR-SUB-002 | Mandatory Subscription for Platform Access | SUB | MVP |
| FR-SUB-003 | Plan Selection (Trial, Monthly, Yearly) | SUB | MVP |
| FR-SUB-004 | Monthly Subscription Plan | SUB | MVP |
| FR-SUB-005 | Yearly Subscription Plan | SUB | MVP |
| FR-SUB-006 | Payment Confirmation Email | SUB | MVP |
| FR-SUB-007 | Seat Limit Enforcement on Invitation | SUB | MVP |
| FR-SUB-008 | Proactive Seat Purchase | SUB | MVP |
| FR-SUB-009 | Seats Only Increase, No Refunds | SUB | MVP |
| FR-SUB-010 | Grace Period on Subscription Lapse | SUB | MVP |
| FR-SUB-011 | Staggered Renewal for Mid-Term Yearly Seat Purchases | SUB | MVP |
| FR-SUB-012 | Billing and Seat History Visibility Restricted to Admin/QA Manager **[Updated]** | SUB | MVP |
| FR-IMP-001 | Bulk Import | IMP | Post-MVP |
| FR-IMP-002 | Bulk Export | IMP | Post-MVP |
| FR-IMP-003 | Import/Export Entity Scope | IMP | Post-MVP |

**Total requirements: 144** (99 pre-CHANGE-001 + 45 net-new IDs: QAOM ×12, TPL ×9, WF ×6, POL ×5, QG ×4, TC-011, DEF-007/008, RPT-005, DASH-004, AUD-005, NOT-006/007, AI-006 ×9. FR-TC-005, FR-TC-008, FR-AI-001, and FR-RPT-003 are generalized in place under CHANGE-001 and keep their existing IDs — not counted as new.)

---

# AUTH — Authentication & Sign-Up

### FR-AUTH-001 — Public Sign-Up
**Requirement:** The system shall provide a public sign-up form for brand-new customers, distinct from the organisation-level invitation flow.
**Purpose:** Lets a new customer create an organisation without needing an existing member to invite them.
**Actors:** Prospective customer (not yet a user).
**Preconditions:** None — publicly accessible.
**Main Behaviour:** User submits sign-up details, including a chosen role (FR-AUTH-005) and new organisation name (FR-ORG-001).
**Business Rules:** Sign-up is the only entry point that creates a new organisation from scratch (PD-019).
**Acceptance Criteria:** Given a prospective customer with no account, When they complete the sign-up form, Then a new user and a new organisation are created and linked.
**Error/Edge Conditions:** Duplicate email at sign-up is rejected (specific handling: Open Question, see below).
**Priority:** MVP
**Dependencies:** FR-ORG-001, FR-AUTH-005

### FR-AUTH-002 — Login
**Requirement:** The system shall allow an existing user to authenticate and access the organisation(s)/projects they belong to.
**Purpose:** Standard re-entry to the platform.
**Actors:** All account-holding roles (Admin, QA Manager, QA Tester).
**Preconditions:** User has an existing account.
**Main Behaviour:** User submits credentials; system establishes a session on success.
**Business Rules:** None beyond standard authentication.
**Acceptance Criteria:** Given valid credentials, When submitted, Then the user is authenticated and sees their organisation(s).
**Error/Edge Conditions:** Invalid credentials are rejected with no account detail disclosed.
**Priority:** MVP
**Dependencies:** FR-AUTH-001

### FR-AUTH-003 — Session Management
**Requirement:** The system shall maintain an authenticated session for a logged-in user until logout or session expiry.
**Purpose:** Avoids requiring re-authentication on every action.
**Actors:** All account-holding roles.
**Preconditions:** User has logged in.
**Main Behaviour:** Session persists across requests until logout/expiry.
**Business Rules:** Session duration/expiry policy: not yet decided (see Open Questions).
**Acceptance Criteria:** Given an active session, When the user navigates the app, Then they remain authenticated without re-entering credentials.
**Error/Edge Conditions:** Expired session redirects to login.
**Priority:** MVP
**Dependencies:** FR-AUTH-002

### FR-AUTH-004 — Sign-Up Confirmation Email
**Requirement:** The system shall send a confirmation email to the user upon successful sign-up.
**Purpose:** Confirms account/organisation creation succeeded.
**Actors:** New user (Admin or QA Manager).
**Preconditions:** Sign-up form submitted successfully.
**Main Behaviour:** Confirmation email sent immediately after account/organisation creation.
**Business Rules:** PD-019.
**Acceptance Criteria:** Given a successful sign-up, When the organisation and user are created, Then a confirmation email is sent to the user.
**Error/Edge Conditions:** Email delivery failure — see FR-NOT-005 retry rule.
**Priority:** MVP
**Dependencies:** FR-AUTH-001, FR-NOT-005

### FR-AUTH-005 — Sign-Up Role Restriction
**Requirement:** The system shall restrict the role selectable at public sign-up to Admin or QA Manager only.
**Purpose:** QA Tester and link-based roles are only meaningful once an organisation exists; sign-up must create a user capable of managing/bootstrapping the organisation.
**Actors:** Prospective customer.
**Preconditions:** User is on the sign-up form.
**Main Behaviour:** Role selector at sign-up presents exactly two options: Admin, QA Manager.
**Business Rules:** PD-019. QA Tester is added only via organisation invitation (FR-ORG-004) after the organisation exists.
**Acceptance Criteria:** Given the sign-up form, When the user views role options, Then only Admin and QA Manager are selectable.
**Error/Edge Conditions:** Any attempt to submit a role outside Admin/QA Manager is rejected.
**Priority:** MVP
**Dependencies:** FR-AUTH-001

### FR-AUTH-006 — Post-Sign-Up Redirect to Subscription
**Requirement:** The system shall redirect the user to the subscription page immediately after successful sign-up.
**Purpose:** Continues onboarding directly into the mandatory subscription step (FR-SUB-002).
**Actors:** New user.
**Preconditions:** Sign-up completed successfully.
**Main Behaviour:** User is routed to the subscription/plan-selection page.
**Business Rules:** PD-019, PD-020.
**Acceptance Criteria:** Given a successful sign-up, When the user is created, Then they are redirected to the subscription page.
**Error/Edge Conditions:** None beyond standard navigation failure handling.
**Priority:** MVP
**Dependencies:** FR-AUTH-001, FR-SUB-002, FR-SUB-003

---

# QAOM — Organisation QA Operating Model **[New Module — CHANGE-001]**

**Layer:** B (Organisation QA Configuration), with FR-QAOM-001/002/012 also expressing Layer C consequences. See PD-049–PD-063, PRD §18.

### FR-QAOM-001 — Organisation QA Setup Required Before Normal Operation
**Requirement:** The system shall ensure every organisation has a published QA Operating Model before normal project operation (creating requirements, test cases, runs, etc. within a project) begins. An organisation shall never operate under an undefined QA configuration.
**Purpose:** Establishes the governance principle that every organisation always has *some* published, applicable configuration (PD-061).
**Actors:** N/A (system invariant); Admin, QA Manager (satisfy it).
**Preconditions:** Organisation has an active trial or paid subscription (FR-SUB-002).
**Main Behaviour:** Immediately upon organisation creation (FR-ORG-001), the Standard QA preset (FR-QAOM-004) is automatically published as the organisation's QA Operating Model — this satisfies FR-QAOM-001 instantly and by default. The QA Setup screen (FR-QAOM-002) is presented as an opportunity to keep, change, or customize this default before or after project work begins; it does not itself gate project creation. **This resolves the previously open question (PRD §19) of whether QA Setup blocks project creation** — it does not; an implicit Standard QA default is already "published" the moment the organisation exists.
**Business Rules:** PD-061. FR-PRJ-001 (create project) has no additional precondition beyond FR-SUB-002 as a result.
**Acceptance Criteria:** Given a newly created organisation, When it is created, Then a published QA Operating Model (Standard QA by default) already exists for it, with no separate blocking step required before project creation.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-ORG-001, FR-QAOM-004

### FR-QAOM-002 — Instant Setup via Starting Preset
**Requirement:** The system shall allow Admin or QA Manager to satisfy/replace Organisation QA Setup instantly by selecting a TestFlow-provided starting preset, without requiring manual configuration of any individual setting.
**Purpose:** Prevents a lengthy configuration wizard from standing between sign-up and first value (PD-061).
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation exists (FR-ORG-001).
**Main Behaviour:** User selects one of the starting presets (FR-QAOM-003); the corresponding preset configuration is published immediately as the organisation's QA Operating Model, superseding the automatic Standard QA default from FR-QAOM-001 if a different preset is chosen.
**Business Rules:** PD-061.
**Acceptance Criteria:** Given an organisation on the automatic Standard QA default, When Admin/QA Manager selects Controlled QA, Then the Controlled QA preset configuration is published immediately with no further manual steps required.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QAOM-001, FR-QAOM-003

### FR-QAOM-003 — Starting Preset Options
**Requirement:** The system shall offer exactly four starting options for Organisation QA Setup: Standard QA (recommended default), Lightweight QA, Controlled QA, and Custom Setup.
**Purpose:** Bounds onboarding choice to a small, well-understood set rather than an open-ended configuration surface (PD-061, PD-062).
**Actors:** Admin, QA Manager.
**Preconditions:** None.
**Main Behaviour:** Setup screen presents the four options with a short description of each; Standard QA is visually indicated as recommended.
**Business Rules:** PD-062. Presets are TestFlow-defined starting points, not organisation-created presets.
**Acceptance Criteria:** Given the QA Setup screen, When viewed, Then exactly Standard QA, Lightweight QA, Controlled QA, and Custom Setup are offered.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QAOM-004, FR-QAOM-005, FR-QAOM-006, FR-QAOM-007

### FR-QAOM-004 — Standard QA Preset Definition
**Requirement:** The system shall define the Standard QA preset as: Test Case document workflow = No Approval (self-service, PD-049); unapproved test cases may be executed (FR-WF-004 = Allowed); Test Report required for project readiness, Regression Report not required; Test Report and Regression Report workflow = No Approval; no quality gates enabled by default; standard (TestFlow-default) Test Case, Test Report, and Regression Report templates (FR-TPL-005); no project overrides pre-configured as permitted (organisation must explicitly enable any override).
**Purpose:** Grounds the recommended default in the currently approved TestFlow behaviour wherever compatible (PD-062) — this is the closest preset to "how TestFlow already worked" before the pivot.
**Actors:** N/A (preset definition).
**Preconditions:** None.
**Main Behaviour:** Publishing Standard QA applies the settings above as the organisation's QA Operating Model.
**Business Rules:** PD-049, PD-050, PD-062. Does not introduce mandatory blocking gates absent from the pre-pivot product, per instruction.
**Acceptance Criteria:** Given Standard QA is published, When a test case is created, Then it follows the existing Draft → Approved → Needs Review self-service model with no approval gate, unchanged from pre-pivot behaviour.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-001, FR-TPL-005

### FR-QAOM-005 — Lightweight QA Preset Definition
**Requirement:** The system shall define the Lightweight QA preset as: Test Case, Test Report, and Regression Report workflow = No Approval; unapproved test cases may be executed (Allowed); no artifacts marked required (Test Report/Regression Report optional); no quality gates enabled; standard default templates, unmodified.
**Purpose:** Optimizes for fast setup and small teams with minimal governance overhead, distinct from Standard QA by relaxing the Test Report requirement.
**Actors:** N/A (preset definition).
**Preconditions:** None.
**Main Behaviour:** Publishing Lightweight QA applies the settings above.
**Business Rules:** PD-062.
**Acceptance Criteria:** Given Lightweight QA is published, When project readiness is evaluated, Then no artifact is treated as required and no gate blocks readiness.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-001, FR-POL-001

### FR-QAOM-006 — Controlled QA Preset Definition
**Requirement:** The system shall define the Controlled QA preset as: Test Case workflow = Review + Approval; unapproved test cases may NOT be executed (Prohibited); Test Report and Regression Report required for project readiness; Test Report and Regression Report workflow = Single Approval; quality gates enabled: required-artifacts-completed, required-approvals-completed, no-unresolved-Critical-defects; standard default templates as the starting point (organisation may still customize).
**Purpose:** Offers stronger governance for organisations that need it, exercising the full range of the bounded workflow/gate model approved in PD-049–PD-058.
**Actors:** N/A (preset definition).
**Preconditions:** None.
**Main Behaviour:** Publishing Controlled QA applies the settings above.
**Business Rules:** PD-049, PD-052, PD-058, PD-062.
**Acceptance Criteria:** Given Controlled QA is published, When a user attempts to execute a test case not in Approved status, Then execution is blocked per FR-WF-004.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-001, FR-WF-004, FR-QG-001, FR-QG-002

### FR-QAOM-007 — Custom Setup
**Requirement:** The system shall allow Admin or QA Manager to configure each supported QA Operating Model setting individually ("Custom Setup") instead of selecting a preset, using the same underlying settings the presets configure.
**Purpose:** Gives organisations with atypical needs full control without inventing settings beyond the bounded catalogue (FR-QAOM-010).
**Actors:** Admin, QA Manager.
**Preconditions:** None.
**Main Behaviour:** User is taken through the governance catalogue (FR-QAOM-010), template selection (module TPL), workflow shape selection (module WF), and policy/gate configuration (modules POL, QG), publishing the result as a draft then a published configuration (FR-QAOM-008).
**Business Rules:** PD-062. Custom Setup uses the same settings surface as the presets — it is not a separate, unbounded configuration mode.
**Acceptance Criteria:** Given Custom Setup is selected, When the user completes configuration and publishes, Then the resulting QA Operating Model reflects exactly the settings chosen, drawn from the same bounded catalogue as the presets.
**Error/Edge Conditions:** An incomplete Custom Setup draft does not publish; the previously published configuration (or the automatic Standard QA default) remains in effect until publish completes (FR-QAOM-001).
**Priority:** MVP
**Dependencies:** FR-QAOM-008, FR-QAOM-010

### FR-QAOM-008 — QA Configuration Draft and Publish
**Requirement:** The system shall allow QA Manager or Admin to prepare changes to the organisation's QA Operating Model as a draft, and to explicitly publish that draft to make it the organisation's current effective configuration.
**Purpose:** Separates "in-progress editing" from "what's actually in effect," preventing partial/inconsistent configuration from silently taking effect (PD-057).
**Actors:** QA Manager, Admin (per FR-WF-006 permission checkpoints).
**Preconditions:** Organisation has a published QA Operating Model (always true per FR-QAOM-001).
**Main Behaviour:** User edits a draft (spanning templates, workflow shapes, policy, gates); draft has no effect on any project until explicitly published; publish creates a new immutable version (FR-QAOM-009) and makes it the organisation's current effective configuration for new projects/documents per FR-QAOM-012/FR-POL-002.
**Business Rules:** PD-057.
**Acceptance Criteria:** Given an in-progress draft, When it is not yet published, Then no project's effective configuration reflects the draft's changes.
**Error/Edge Conditions:** Publishing with incomplete required settings is rejected with a clear list of what's missing.
**Priority:** MVP
**Dependencies:** FR-QAOM-009

### FR-QAOM-009 — Published Configuration Immutability and Versioning
**Requirement:** The system shall treat each published QA Operating Model as an immutable, numbered version. The system shall publish organisation QA configuration as a single aggregate "Organisation QA Configuration Version" that references the specific immutable template, workflow, policy, and quality-gate definitions in effect at that publish — rather than versioning each of those independently.
**Purpose:** Adopts the simpler of the two versioning models considered (aggregate version referencing immutable sub-definitions, per the impact analysis's recommendation) — sufficient reliability for MVP without the bookkeeping overhead of fully independent versioning per configuration element.
**Actors:** N/A (system behaviour).
**Preconditions:** A draft is published (FR-QAOM-008).
**Main Behaviour:** Publish creates a new Organisation QA Configuration Version, immutable from that point forward; the previous version remains intact and referenced by anything created under it.
**Business Rules:** PD-057, PD-063. Database implementation is explicitly out of scope for this document.
**Acceptance Criteria:** Given a published configuration version, When a later version is published, Then the earlier version's content is unchanged and remains resolvable for historical documents created under it.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-007, FR-WF-001, FR-POL-002

### FR-QAOM-010 — Organisation QA Governance Catalogue
**Requirement:** The system shall support organisation configuration of exactly the following bounded governance settings, and no others, at MVP: Test Case document workflow shape (FR-WF-002); whether unapproved test cases may be executed (FR-WF-004); which QA artifacts are required (FR-POL-001); Test Report and Regression Report document workflow shape (FR-WF-002); which quality gates are enabled and their configuration (FR-QG-002); which project-level settings are overridable (FR-POL-003).
**Purpose:** Bounds the governance catalogue explicitly, per instruction, to avoid inventing dozens of settings merely to differentiate presets.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Governance configuration screen exposes exactly these settings.
**Business Rules:** PD-063. Requirement coverage expectations and requirement-usage policy were considered and deliberately excluded from the MVP catalogue — see Open Requirement Questions below; no gate depends on them at MVP beyond the general minimum-coverage-percentage gate (FR-QG-001), which already covers this need without a separate toggle.
**Acceptance Criteria:** Given the governance configuration screen, When viewed, Then only the settings listed above are configurable — no additional toggles are present.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-002, FR-WF-004, FR-POL-001, FR-QG-002, FR-POL-003

### FR-QAOM-011 — Reconfiguration After Initial Setup
**Requirement:** The system shall allow the organisation's QA Operating Model to be edited and republished at any time after initial setup, following the same draft/publish model (FR-QAOM-008) and permission checkpoints (FR-WF-006) as initial setup.
**Purpose:** Setup is not a one-time, locked event — organisations must be able to evolve their QA process over time.
**Actors:** QA Manager, Admin.
**Preconditions:** Organisation has a published configuration.
**Main Behaviour:** Same as FR-QAOM-008/009, at any time after initial setup.
**Business Rules:** PD-057, PD-061 ("Preset configuration must remain editable after setup").
**Acceptance Criteria:** Given a published configuration in effect for 3 months, When QA Manager edits and republishes it, Then a new version is created without disturbing prior projects' pinned configuration (FR-QAOM-012).
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QAOM-008, FR-QAOM-012

### FR-QAOM-012 — Existing Projects Pinned to Effective Configuration
**Requirement:** The system shall pin each project to the Organisation QA Configuration Version that was current when the project's effective configuration was last resolved (at project creation, or at an explicit, separately-audited re-resolution). Publishing a new organisation configuration version shall NOT automatically change any existing project's effective configuration. New projects created after a publish use the newly current version.
**Purpose:** Adopts the safer MVP recommendation from §21 — no automatic migration of existing projects, avoiding the complexity and historical-consistency risk of an in-place migration mechanism, which is explicitly not built at MVP.
**Actors:** N/A (system behaviour).
**Preconditions:** A new Organisation QA Configuration Version is published while at least one project exists under an earlier version.
**Main Behaviour:** Existing projects continue operating under their pinned version indefinitely; only new projects pick up the latest version automatically.
**Business Rules:** PD-057, PD-063. A capability for an authorized user to explicitly move an existing project onto a newer version is **out of scope for MVP** — not built, not promised. Projects remain pinned permanently unless such a capability is separately approved in a future pass.
**Acceptance Criteria:** Given Project A pinned to Configuration Version 1, When Configuration Version 2 is published, Then Project A's effective configuration remains Version 1, and a newly created Project B uses Version 2.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QAOM-009, FR-POL-002

### FR-QAOM-013 — Organisation Preferred Scope Terminology (Descriptive Only) **[New — CHANGE-002]**
**Requirement:** The system shall allow an organisation to optionally set one **preferred scope terminology** value (free text, e.g., "Sprint," "Iteration," "Phase," "Cycle," "Testing Window"). This value is descriptive UI copy only — used solely to label/pre-fill the QA Scope field on Test Report/Regression Report creation and display (FR-RPT-006) — and shall never alter application behaviour, validation, gate evaluation, workflow, or any other system logic.
**Purpose:** Lets Scrum/Kanban/Waterfall/hybrid organisations see their own vocabulary without TestFlow modelling delivery methodology as a governed concept (PD-064).
**Actors:** Admin, QA Manager (configuring); all project members (see the resulting label).
**Preconditions:** None.
**Main Behaviour:** A single free-text field on organisation settings, changeable at any time by Admin/QA Manager, taking effect immediately for any QA Document created afterward. If unset, UI uses the neutral label "QA Scope" (never "Sprint").
**Business Rules:** PD-064. This setting is NOT part of QA Configuration Version draft/publish (PD-057/PD-063) — changing it is not a governance/publish event and requires no version bump, validation, or audit beyond ordinary organisation-settings change tracking.
**Acceptance Criteria:** Given an organisation with no preferred scope terminology set, When a user creates a Test Report, Then the scope field is labelled "QA Scope," not "Sprint." Given the organisation sets preferred terminology to "Sprint," When a user creates a Test Report afterward, Then the scope field is labelled using "Sprint" as supporting terminology, while the underlying field remains QA Scope (FR-RPT-006).
**Error/Edge Conditions:** Empty/cleared value reverts display to the neutral "QA Scope" label.
**Priority:** MVP
**Dependencies:** FR-RPT-006

---

# ORG — Organisation Management

### FR-ORG-001 — Organisation Creation at Sign-Up
**Requirement:** The system shall create a new organisation, named by the user, as part of the public sign-up process.
**Purpose:** Establishes the tenant boundary for a new customer.
**Actors:** New user (Admin or QA Manager).
**Preconditions:** User is completing sign-up.
**Main Behaviour:** User provides an organisation name; system creates the organisation and ties the new user to it as its first member.
**Business Rules:** PD-019.
**Acceptance Criteria:** Given a sign-up submission with an organisation name, When submitted, Then a new organisation is created and the user is its first member with the role chosen at sign-up.
**Error/Edge Conditions:** Organisation name uniqueness policy: not yet decided (see Open Questions).
**Priority:** MVP
**Dependencies:** FR-AUTH-001

### FR-ORG-002 — Unlimited Organisations
**Requirement:** The system shall support an unlimited number of organisations, each with an unlimited number of projects.
**Purpose:** Matches the approved multi-tenant vision.
**Actors:** N/A (platform-level).
**Preconditions:** None.
**Main Behaviour:** No application-level ceiling on organisation or project count.
**Business Rules:** PD-001.
**Acceptance Criteria:** Given the platform in operation, When new organisations are created, Then no hard-coded limit blocks creation.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-ORG-003 — Organisation Settings Management
**Requirement:** The system shall allow an Admin to manage organisation-level settings.
**Purpose:** Gives the organisation owner control over shared configuration.
**Actors:** Admin.
**Preconditions:** User holds the Admin role in the organisation.
**Main Behaviour:** Admin views/edits organisation settings.
**Business Rules:** Scope of "organisation settings" beyond membership/subscription: not yet fully defined (see Open Questions).
**Acceptance Criteria:** Given an Admin, When they open organisation settings, Then they can view and modify them.
**Error/Edge Conditions:** Non-Admin attempting access is denied.
**Priority:** MVP
**Dependencies:** FR-USR-001

### FR-ORG-004 — Invite Organisation Member
**Requirement:** The system shall allow Admin or QA Manager to invite a new member to the organisation, setting their role at invitation time.
**Purpose:** Standard path for adding QA Tester, and additional Admin/QA Manager, accounts after the organisation exists.
**Actors:** Admin, QA Manager (inviter); invitee (Admin, QA Manager, or QA Tester).
**Preconditions:** Inviter holds Admin or QA Manager role; organisation has available seats (FR-SUB-007).
**Main Behaviour:** Inviter sends an invitation with a role assignment; invitee accepts and becomes an organisation member.
**Business Rules:** PD-017. Blocked if no seats available (FR-SUB-007).
**Acceptance Criteria:** Given available seats, When an Admin or QA Manager invites a user with a role, Then the invitee is added as an organisation member with that role upon acceptance.
**Error/Edge Conditions:** Invitation blocked and redirected to seat purchase if it would exceed the seat count (FR-SUB-007).
**Priority:** MVP
**Dependencies:** FR-USR-001, FR-SUB-007

### FR-ORG-005 — Set Role at Invitation
**Requirement:** The system shall require the inviter to specify the invitee's role (Admin, QA Manager, or QA Tester) at the time of invitation.
**Purpose:** Establishes the invitee's organisation-level role from the outset.
**Actors:** Admin, QA Manager.
**Preconditions:** Inviter is creating an invitation.
**Main Behaviour:** Role is a required field on the invitation.
**Business Rules:** PD-017.
**Acceptance Criteria:** Given an invitation being created, When the inviter submits it without a role, Then submission is rejected.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-ORG-004

### FR-ORG-006 — Minimum One Admin Enforcement **[Updated]**
**Requirement:** The system shall ensure an organisation always retains at least one member with the Admin role. The system shall prevent the last remaining Admin from being removed from the organisation, or from having their role changed away from Admin.
**Purpose:** Prevents an organisation from being left without anyone able to perform Admin-level actions (PD-030).
**Actors:** Admin (attempting the change or removal); the last remaining Admin (subject).
**Preconditions:** The organisation currently has exactly one Admin.
**Main Behaviour:** Any attempt to remove the last Admin, or change their role, is blocked before it takes effect.
**Business Rules:** PD-030. This rule takes precedence over FR-USR-003 (role change) and FR-USR-005 (member removal) when only one Admin remains.
**Acceptance Criteria:**
- Given an organisation with exactly one Admin, When that Admin attempts to change their own role or another Admin attempts to change it, Then the change is rejected.
- Given an organisation with exactly one Admin, When any user attempts to remove that Admin from the organisation, Then the removal is rejected.
**Error/Edge Conditions:** A clear error message is shown explaining the organisation must retain at least one Admin; the action is not silently ignored.
**Priority:** MVP
**Dependencies:** FR-USR-003, FR-USR-005

---

# USR — User & Access Management

### FR-USR-001 — Organisation-Level Role Assignment
**Requirement:** The system shall assign each organisation member exactly one role (Admin, QA Manager, or QA Tester) at the organisation level.
**Purpose:** Establishes a single, consistent role per user across the organisation.
**Actors:** Admin, QA Manager (assigning); all organisation members (subject).
**Preconditions:** User is being invited or already a member.
**Main Behaviour:** Role is stored at the organisation level, not per project.
**Business Rules:** PD-017, supersedes PD-003.
**Acceptance Criteria:** Given an organisation member, When their role is queried, Then exactly one organisation-level role is returned.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-ORG-005

### FR-USR-002 — Role Governs Cross-Project Capability
**Requirement:** The system shall apply a user's organisation-level role to determine their capabilities on every project they have access to.
**Purpose:** Avoids re-deciding permissions per project.
**Actors:** All organisation members.
**Preconditions:** User has access to at least one project.
**Main Behaviour:** Adding a user to a project is an access grant only; their existing organisation role governs what they can do there.
**Business Rules:** PD-017.
**Acceptance Criteria:** Given a user with an organisation role, When they are added to a new project, Then their capabilities on that project match their existing organisation role, with no separate role assignment step.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-USR-001, FR-PRJ-005

### FR-USR-003 — Role Change — Admin Only **[Updated]**
**Requirement:** The system shall allow only a user with the Admin role to change another organisation member's role. QA Manager shall not be able to change another member's role.
**Purpose:** Keeps role-changing authority — a sensitive, organisation-wide permission change — concentrated in the Admin role (PD-031).
**Actors:** Admin (actor); any organisation member (subject).
**Preconditions:** Actor holds the Admin role; subject is an existing organisation member.
**Main Behaviour:** Admin selects a member and assigns a new role (Admin, QA Manager, or QA Tester); change takes effect immediately.
**Business Rules:** PD-031. Subject to FR-ORG-006 (cannot change the last remaining Admin away from Admin).
**Acceptance Criteria:**
- Given an Admin, When they change another member's role, Then the new role takes effect immediately.
- Given a QA Manager, When they attempt to change another member's role, Then the action is rejected.
**Error/Edge Conditions:** Attempt to change the last remaining Admin's role is blocked per FR-ORG-006.
**Priority:** MVP
**Dependencies:** FR-USR-001, FR-ORG-006

### FR-USR-004 — Removed Project Creator Access Handling **[Updated]**
**Requirement:** The system shall ensure that when a project's creator is removed from that project, or loses organisation access entirely, only the removed creator loses access to the project; Admin and QA Manager retain whatever access to that project they already had.
**Purpose:** Prevents a project from losing its Admin/QA Manager oversight access purely as a side effect of the original creator leaving (PD-032).
**Actors:** Admin, QA Manager (retaining access); the removed project creator (losing access).
**Preconditions:** A project has a recorded creator who is a QA Tester; that creator is removed from the project or from the organisation.
**Main Behaviour:** System revokes only the removed creator's project access; all other members' access, including Admin's and QA Manager's organisation-wide visibility (FR-PRJ-004), is unaffected.
**Business Rules:** PD-032. See also FR-PRJ-007.
**Acceptance Criteria:** Given a project created by a QA Tester who is later removed from the organisation, When the removal takes effect, Then Admin and QA Manager retain their existing access to that project and only the removed creator loses access.
**Error/Edge Conditions:** If the removed creator was the only QA Tester with access to a project not otherwise visible to QA Managers/Admins by default, project visibility for QA Managers/Admins is unaffected since they see all organisation projects (FR-PRJ-004).
**Priority:** MVP
**Dependencies:** FR-PRJ-004, FR-PRJ-007, FR-USR-005

### FR-USR-005 — Remove Organisation Member
**Requirement:** The system shall allow Admin to remove an organisation member, subject to the minimum-one-Admin rule (FR-ORG-006).
**Purpose:** Standard offboarding capability.
**Actors:** Admin.
**Preconditions:** Actor holds Admin role.
**Main Behaviour:** Admin removes a member; member loses organisation and project access per FR-USR-004.
**Business Rules:** PD-030, PD-032.
**Acceptance Criteria:** Given an Admin, When they remove a non-last-Admin member, Then that member loses organisation access.
**Error/Edge Conditions:** Removal of the last Admin is blocked (FR-ORG-006).
**Priority:** MVP
**Dependencies:** FR-ORG-006, FR-USR-004

### FR-USR-006 — View Organisation Member List
**Requirement:** The system shall allow Admin and QA Manager to view the list of organisation members and their roles.
**Purpose:** Supports member/role management.
**Actors:** Admin, QA Manager.
**Preconditions:** None.
**Main Behaviour:** Member list with roles is displayed.
**Business Rules:** None beyond role restriction on viewing.
**Acceptance Criteria:** Given an Admin or QA Manager, When they open the member list, Then all organisation members and their roles are shown.
**Error/Edge Conditions:** QA Tester access to this view: not yet decided (see Open Questions).
**Priority:** MVP
**Dependencies:** FR-USR-001

### FR-USR-007 — QA Tester Project Membership Management
**Requirement:** The system shall allow a QA Tester with access to a project to add other organisation members to that project, or remove their access, and to generate temporary access links.
**Purpose:** Lets QA Testers manage collaborators on projects they work in without requiring Admin/QA Manager involvement for routine access changes.
**Actors:** QA Tester.
**Preconditions:** QA Tester has access to the project.
**Main Behaviour:** QA Tester adds/removes another organisation member's access to that project, or generates a link for BA/PO, Developer, or Stakeholder.
**Business Rules:** PD-017. This is an access grant only, governed by FR-USR-002.
**Acceptance Criteria:** Given a QA Tester with project access, When they add another organisation member to the project, Then that member gains access to the project per their existing organisation role.
**Error/Edge Conditions:** QA Tester cannot grant access to a project they do not themselves have access to.
**Priority:** MVP
**Dependencies:** FR-USR-002, FR-PRJ-005, FR-LNK-001

---

# PRJ — Project Management

### FR-PRJ-001 — Create Project
**Requirement:** The system shall allow Admin, QA Manager, or QA Tester to create a project within their organisation.
**Purpose:** Enables any working role to start new project-scoped work.
**Actors:** Admin, QA Manager, QA Tester.
**Preconditions:** Organisation has an active trial or paid subscription (FR-SUB-002).
**Main Behaviour:** User creates a project with a name and initial settings.
**Business Rules:** PD-014.
**Acceptance Criteria:** Given an active subscription, When a QA Tester creates a project, Then the project exists and the creator has access to it.
**Error/Edge Conditions:** Blocked entirely if no active trial/subscription (FR-SUB-002).
**Priority:** MVP
**Dependencies:** FR-SUB-002

### FR-PRJ-002 — Update Project
**Requirement:** The system shall allow Admin, QA Manager, or QA Tester (with access) to update project details.
**Purpose:** Keeps project metadata current.
**Actors:** Admin, QA Manager, QA Tester (with access).
**Preconditions:** Actor has access to the project.
**Main Behaviour:** Actor edits project fields.
**Business Rules:** PD-014.
**Acceptance Criteria:** Given a QA Tester with project access, When they update the project name, Then the change is saved.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-001

### FR-PRJ-003 — Archive Project
**Requirement:** The system shall allow Admin, QA Manager, or QA Tester (with access) to archive a project.
**Purpose:** Retires a project without deleting its history.
**Actors:** Admin, QA Manager, QA Tester (with access).
**Preconditions:** Actor has access to the project.
**Main Behaviour:** Project is marked archived; historical data is preserved, read-only.
**Business Rules:** PD-014. Deletion of projects with history is restricted; archiving is used instead.
**Acceptance Criteria:** Given a project with access, When it is archived, Then it becomes read-only and no longer accepts new work.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-001

### FR-PRJ-004 — Project Visibility by Role
**Requirement:** The system shall show Admin and QA Manager all projects within their organisation, and shall show QA Tester only projects they created or were added to.
**Purpose:** Preserves oversight visibility for Admin/QA Manager while keeping QA Testers focused on relevant projects.
**Actors:** Admin, QA Manager, QA Tester.
**Preconditions:** None.
**Main Behaviour:** Project list is filtered per the visibility rule above.
**Business Rules:** PD-014, PD-017.
**Acceptance Criteria:** Given a QA Tester not added to a given project, When they view the project list, Then that project does not appear.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-001

### FR-PRJ-005 — Add User to Project
**Requirement:** The system shall allow Admin, QA Manager, or any QA Tester with access to a project to add another organisation member to that project.
**Purpose:** Grants project-scoped access without a separate role assignment.
**Actors:** Admin, QA Manager, QA Tester (with access).
**Preconditions:** Actor has access to the project; added user is an organisation member.
**Main Behaviour:** Added user gains project access per their existing organisation role.
**Business Rules:** PD-017.
**Acceptance Criteria:** Given a QA Tester with project access, When they add another QA Tester to the project, Then the added user can see and work in the project.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-USR-002

### FR-PRJ-006 — Remove User from Project
**Requirement:** The system shall allow Admin, QA Manager, or any QA Tester with access to a project to remove another organisation member's access to that project.
**Purpose:** Standard project-level offboarding.
**Actors:** Admin, QA Manager, QA Tester (with access).
**Preconditions:** Actor has access to the project.
**Main Behaviour:** Removed user loses access to that specific project only (organisation membership unaffected).
**Business Rules:** PD-017. See FR-PRJ-007 for the project-creator special case.
**Acceptance Criteria:** Given a QA Tester with project access, When they remove another member's project access, Then that member can no longer see or act on the project.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-005

### FR-PRJ-007 — Removed Project Creator — Admin/QA Manager Access Retained **[Updated]**
**Requirement:** The system shall ensure that when a project's creator is removed from the project (via FR-PRJ-006) or loses organisation access (via FR-USR-005), Admin and QA Manager retain whatever access to that project they already had; only the removed creator's access is revoked.
**Purpose:** The creator leaving should not disrupt other members' or Admin's/QA Manager's standing access (PD-032).
**Actors:** Admin, QA Manager (retaining access); removed project creator (losing access).
**Preconditions:** A project creator (QA Tester) is removed from the project or the organisation.
**Main Behaviour:** Only the removed creator's project access is revoked; all other access, including Admin's/QA Manager's default organisation-wide project visibility, is unchanged.
**Business Rules:** PD-032.
**Acceptance Criteria:** Given a project created by a QA Tester, When that QA Tester is removed from the project, Then Admin and QA Manager (and any other project members) retain their access and only the creator loses it.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-USR-004, FR-PRJ-004

---

# REQ — Requirements Management

### FR-REQ-001 — Native Requirement Authoring
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to natively author a requirement.
**Purpose:** Captures the requirement as the basis for test case creation.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access.
**Main Behaviour:** Actor creates a requirement record, typically sourced from an external record (e.g., a Jira ticket).
**Business Rules:** PD-015. BA/PO does not author requirements.
**Acceptance Criteria:** Given a QA Tester with project access, When they create a requirement, Then it is saved and available for linking to test cases.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-001

### FR-REQ-002 — Editing a Linked Requirement Triggers Re-Review **[Updated]**
**Requirement:** The system shall, when a requirement that has one or more linked and already-Approved test cases is edited, set the status of each such linked, Approved test case to "Needs Review."
**Purpose:** Ensures a change to a requirement's content cannot silently leave stale, already-approved test cases in place without a fresh review (PD-033).
**Actors:** QA Tester, QA Manager, Admin (editing the requirement); any user with edit access (performing the resulting self-service re-approval, per FR-TC-005).
**Preconditions:** The requirement being edited has at least one linked test case currently in "Approved" status.
**Main Behaviour:** On save of the requirement edit, every linked test case in "Approved" status transitions to "Needs Review." Linked test cases not currently Approved (e.g., Draft) are unaffected.
**Business Rules:** PD-033. Re-approval follows the same self-service path as FR-TC-005 — any user with edit access re-approves directly, with no reviewer gate.
**Acceptance Criteria:** Given a requirement with an Approved, linked test case, When the requirement is edited and saved, Then that test case's status changes to "Needs Review."
**Error/Edge Conditions:** Editing a requirement with no linked test cases, or only linked test cases not in Approved status, triggers no status change.
**Priority:** MVP
**Dependencies:** FR-TC-005, FR-REQ-003

### FR-REQ-003 — Optional Requirement–Test-Case Link
**Requirement:** The system shall allow a test case to optionally link to a requirement; linkage is not mandatory.
**Purpose:** Supports exploratory testing while preserving traceability value where links exist.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Test case may be created/edited with or without a requirement link.
**Business Rules:** PD-005.
**Acceptance Criteria:** Given a test case with no requirement link, When it is saved, Then it is accepted and reported as "untraced."
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TRACE-002

### FR-REQ-004 — Requirement Archive Cascade, Including Active Test Runs **[Updated]**
**Requirement:** The system shall, when a requirement is archived, cascade-archive all test cases and test reports linked to that requirement. If any linked test case is currently part of an active, unclosed test run, that test run shall also be cancelled and archived as part of the same cascade.
**Purpose:** Keeps traceability consistent — a requirement no longer in active use shouldn't leave orphaned active test cases, reports, or in-flight test runs (PD-016, extended by PD-034).
**Actors:** QA Tester, QA Manager, Admin (archiving the requirement).
**Preconditions:** Requirement has at least one linked test case, report, or active test run.
**Main Behaviour:** Archiving the requirement archives its linked test cases and reports. Any linked test case belonging to an active, unclosed test run causes that test run to be cancelled and archived as well.
**Business Rules:** PD-016, PD-034.
**Acceptance Criteria:**
- Given a requirement with linked test cases and reports, When it is archived, Then those test cases and reports are also archived.
- Given a requirement with a linked test case that is part of an active, unclosed test run, When the requirement is archived, Then that test run is cancelled and archived along with the requirement, its test cases, and its reports.
**Error/Edge Conditions:** A test run already closed at the time of archiving is left as-is (closed runs are historical and are not further modified — see FR-EXEC-003).
**Priority:** MVP
**Dependencies:** FR-TR-003, FR-EXEC-003, FR-RPT-001

---

# TC — Test Case Management

### FR-TC-001 — Create Test Case
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to create a test case, manually or via AI generation.
**Purpose:** Core authoring capability.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access.
**Main Behaviour:** Actor creates a test case with steps and expected results.
**Business Rules:** None beyond standard authoring.
**Acceptance Criteria:** Given project access, When a test case is created, Then it is saved in "Draft" status (see FR-TC-005).
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-005

### FR-TC-002 — Edit Test Case
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin (with project access) to edit an existing test case.
**Purpose:** Keeps test cases current.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access.
**Main Behaviour:** Test case content is updated; a new version is recorded (FR-TC-003).
**Business Rules:** Editing an Approved test case reverts it to Needs Review (FR-TC-005), whether the edit is direct or follows a linked requirement change (FR-REQ-002).
**Acceptance Criteria:** Given an Approved test case, When it is edited, Then its status reverts per FR-TC-005.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-003, FR-TC-005

### FR-TC-003 — Test Case Versioning
**Requirement:** The system shall version test cases such that each edit is recorded and a test run preserves a snapshot of the test case content at execution time.
**Purpose:** Preserves historical accuracy of what was actually tested.
**Actors:** N/A (system behaviour).
**Preconditions:** Test case has been edited or included in a test run.
**Main Behaviour:** Each save creates a new version; test runs reference a snapshot, not the live test case.
**Business Rules:** None beyond the versioning/snapshot principle.
**Acceptance Criteria:** Given a test case included in a closed test run, When the live test case is later edited, Then the closed run's recorded content is unchanged.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TR-002

### FR-TC-004 — Test Run Snapshot of Test Case Content
**Requirement:** The system shall capture a snapshot of each test case's content at the moment a test run is created, and shall use that snapshot, not the live test case, for execution within that run.
**Purpose:** Ensures execution results are traceable to the exact content tested.
**Actors:** N/A (system behaviour).
**Preconditions:** A test run is being created.
**Main Behaviour:** Snapshot is taken at run creation and stored with the run.
**Business Rules:** None beyond the snapshot principle.
**Acceptance Criteria:** Given a test run created from a test case, When the test case is later edited, Then the run continues to display the snapshot as it existed at run creation.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TR-001, FR-TC-003

### FR-TC-005 — Test Case Approval Under Organisation-Configured Workflow **[Generalized — CHANGE-001]**
**Requirement:** The system shall maintain a test case display status of Draft, Approved, or Needs Review (or the organisation's configured display labels for the equivalent internal meta-states — FR-WF-003), governed by the document workflow shape (FR-WF-001) the organisation has configured for Test Case (FR-WF-002). Under the **No Approval** shape — the default (PD-049) — any user with edit access to the test case (QA Tester, QA Manager, or Admin) may set its status directly to Approved at any time, exactly as originally specified by PD-048; there is no reviewer gate. Under **Single Approval** or **Review + Approval**, the transition to Approved requires the configured approver role(s) to act, per FR-WF-001/FR-WF-006.
**Purpose:** Retains PD-048's self-service behaviour as the default, lightweight workflow shape, while allowing an organisation to configure stronger governance (PD-049) — resolving the conflict the impact analysis identified between PD-048 and the clarified governance principle.
**Actors:** QA Tester, QA Manager, Admin (under No Approval, any may approve); under a configured stronger shape, only the assigned approver role(s) may complete the Approved transition (FR-WF-006).
**Preconditions:** The project's effective configuration (FR-POL-002) determines which workflow shape applies to Test Case.
**Main Behaviour:**
- New test case: created in the workflow's initial/Draft-equivalent state.
- Under No Approval: Draft → Approved directly, by any user with edit access, exactly as PD-048 specified.
- Under Single Approval / Review + Approval: Draft → (Submitted/Review, per FR-WF-001) → Approved, requiring the configured approver action(s).
- Approved → Needs Review: triggered automatically when the test case is edited (FR-TC-002) or when its linked requirement is edited (FR-REQ-002/PD-033), regardless of workflow shape.
- Needs Review → Approved: follows the same workflow shape as the original Draft → Approved transition (self-service re-approval under No Approval; re-submission under a configured shape).
**Business Rules:** PD-048, PD-049, PD-052.
**Acceptance Criteria:**
- Given a project under the No Approval shape (Standard/Lightweight QA default), When any user with edit access sets a Draft test case to Approved, Then the change succeeds with no reviewer/gate involved — unchanged from pre-pivot behaviour.
- Given a project under Single Approval or Review + Approval (e.g., Controlled QA), When a non-approver attempts to set a test case directly to Approved, Then the action is rejected and the test case instead enters the configured intermediate state.
- Given an Approved test case under any shape, When it is edited, Then its status becomes Needs Review.
**Error/Edge Conditions:** A workflow shape change made by the organisation after test cases already exist does not retroactively alter the status of existing test cases already in Approved/Needs Review/Draft — it governs future transitions only, consistent with FR-QAOM-012's no-silent-retroactive-change principle.
**Priority:** MVP
**Dependencies:** FR-TC-002, FR-REQ-002, FR-WF-001, FR-WF-002, FR-WF-006

### FR-TC-006 — Optional Requirement Linkage
**Requirement:** The system shall allow a test case to be created and saved without a linked requirement.
**Purpose:** Duplicate of the business rule in FR-REQ-003, stated from the test case side for module completeness.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Requirement link field is optional on the test case.
**Business Rules:** PD-005.
**Acceptance Criteria:** Given a test case being saved with no requirement link, When saved, Then it is accepted.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-REQ-003

### FR-TC-007 — Review and Comment on Test Cases
**Requirement:** The system shall allow QA Manager to review and comment on a test case.
**Purpose:** Supports optional feedback on a test case, independent of whatever document workflow shape (FR-WF-001) the organisation has configured — commenting remains available even under No Approval, where it is not a gate.
**Actors:** QA Manager.
**Preconditions:** Test case exists in the project.
**Main Behaviour:** QA Manager adds comments visible to the test case's creator.
**Business Rules:** PD-048. Under a configured Review + Approval shape (FR-WF-001), this same commenting capability may additionally serve as the "review" step's mechanism — no separate comment feature is built for that case.
**Acceptance Criteria:** Given a test case, When a QA Manager adds a comment, Then it is visible to the test case's creator.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-005

### FR-TC-008 — Test Case Creation from Applicable Published Template **[Generalized — CHANGE-001]**
**Requirement:** The system shall allow a test case to be created from the organisation's currently applicable, published Test Case template (FR-TPL-009), which pre-populates the test case's structured fields (protected system fields plus whatever configurable fields the template defines, FR-TPL-001/002) rather than a single opaque pre-population blob.
**Purpose:** Generalizes the previous narrow "template = pre-population blob" model (PD-009) into the structured Template System (PD-053), while retaining the same user-facing action: create a test case from a template.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** The organisation has a published Test Case template (always true — a default is provided per FR-TPL-005).
**Main Behaviour:** Actor creates a test case; the applicable published Test Case template version (resolved per the project's effective configuration, FR-POL-002) determines which fields are presented, which are required, and default values, per FR-TPL-001–004.
**Business Rules:** PD-009 (organisation scoping retained), PD-053, PD-054.
**Acceptance Criteria:** Given the organisation's currently applicable Test Case template, When a user creates a test case, Then the test case's fields match that template's structure, with protected system fields present regardless of template configuration.
**Error/Edge Conditions:** A test case, once created, is not retroactively affected by a later template republish — it continues reflecting the template version that was applicable when it was created (FR-TPL-007/009), consistent with FR-QAOM-012.
**Priority:** MVP
**Dependencies:** FR-TPL-001, FR-TPL-005, FR-TPL-009

### FR-TC-009 — Assign Test Case to Suite
**Requirement:** The system shall allow a test case to be organized into one or more test suites.
**Purpose:** Enables grouping for execution and reporting.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Test case and suite exist in the same project.
**Main Behaviour:** Actor assigns a test case to a suite.
**Business Rules:** None beyond project scoping.
**Acceptance Criteria:** Given a test case and a suite in the same project, When the test case is assigned, Then it appears within that suite.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TS-001

### FR-TC-010 — AI-Generated Test Case Flagging
**Requirement:** The system shall flag a test case as AI-generated when created via AI generation, distinguishing it from manually authored test cases.
**Purpose:** Preserves visibility into which test cases originated from AI generation.
**Actors:** N/A (system behaviour).
**Preconditions:** Test case created via FR-AI-001.
**Main Behaviour:** AI-generated flag is set at creation and persists through edits.
**Business Rules:** None beyond FR-AI-002 (mandatory human review before save).
**Acceptance Criteria:** Given a test case generated by AI, When it is saved, Then it is flagged as AI-generated.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AI-001, FR-AI-002

### FR-TC-011 — Test Case Priority **[New — CHANGE-001]**
**Requirement:** The system shall support an organisation-configurable Priority field on Test Case, distinct from Defect Severity/Priority (FR-DEF-007/008). TestFlow default options are Critical, High, Medium, Low; the organisation may rename, add, remove (if unused), and reorder options.
**Purpose:** Closes a previously flagged gap (design-system phase, impact analysis) — no Priority field existed on Test Case at all. Organisation-configurable per PD-055, distinct from Defect Severity's stable semantics.
**Actors:** QA Tester, QA Manager, Admin (setting priority); QA Manager, Admin (configuring the option set, via FR-TPL-004).
**Preconditions:** None.
**Main Behaviour:** Priority is a Dropdown-type configurable field (FR-TPL-003) on the Test Case template, with the default option set above unless the organisation has customized it.
**Business Rules:** PD-055. No TestFlow-mandated semantic mapping applies to Test Case Priority — it is purely organisation classification, unlike Defect Severity.
**Acceptance Criteria:** Given the default Test Case template, When a test case is created, Then Priority is available with the default options Critical/High/Medium/Low, editable by the organisation.
**Error/Edge Conditions:** Removing a Priority option currently in use on existing test cases is blocked (soft-deprecate instead — see FR-TPL-004) so historical records remain interpretable, consistent with PD-057's immutability principle.
**Priority:** MVP
**Dependencies:** FR-TPL-003, FR-TPL-004

---

# TPL — Template System **[New Module — CHANGE-001]**

**Layer:** B (Organisation QA Configuration). Generalizes the pre-pivot narrow template concept (PD-009, previously described only in `database.md` §5 and `api/templates.md`) into the structured system approved by PD-053–PD-054, PD-057. Applies to the Test Case, Test Report, and Regression Report document types (FR-RPT-005). Does not apply to Requirement, Test Suite, Test Run, Execution Result, or Defect — these remain first-class system entities with fixed core structure (PD-051), though Defect gains two organisation-configurable fields via FR-DEF-007/008 without becoming a templated document type.

### FR-TPL-001 — Structured Template Field Definitions
**Requirement:** The system shall represent each organisation's Test Case, Test Report, and Regression Report template as an ordered set of field definitions, each with a type, rather than a single opaque pre-population value.
**Purpose:** Replaces the pre-pivot `default_structure` JSON-blob model with real, field-level structure (PD-053).
**Actors:** QA Manager, Admin (authoring).
**Preconditions:** None.
**Main Behaviour:** A template is a list of field definitions, each referencing a supported field type (FR-TPL-003) and carrying properties (FR-TPL-004).
**Business Rules:** PD-053.
**Acceptance Criteria:** Given a published Test Case template, When inspected, Then it consists of an ordered list of typed field definitions, not a single blob.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-002, FR-TPL-003, FR-TPL-004

### FR-TPL-002 — Protected System Fields vs. Configurable Fields
**Requirement:** The system shall include, on every template, a fixed set of protected system fields that cannot be removed or have their underlying semantics redefined by the organisation: record identity, organisation, project, applicable configuration/template version, created by, created at, updated at, archive state, and any required execution or traceability relationship (e.g., a Test Case's link to its Requirement, a Test Report's link to the project). All other fields on a template are organisation-configurable.
**Purpose:** Implements the protected-field boundary approved by PD-054, protecting platform integrity (execution, traceability, versioning, audit) while giving organisations real control elsewhere.
**Actors:** QA Manager, Admin (may reposition/display some system fields within a template layout, per instruction, but never redefine their semantics).
**Preconditions:** None.
**Main Behaviour:** Template editor visually distinguishes protected system fields from configurable fields (FR-TPL-006) and disallows deletion or semantic redefinition of the former; internal implementation-only metadata not meaningful to a human author (e.g., internal row versioning counters) is not exposed as a template field at all.
**Business Rules:** PD-054.
**Acceptance Criteria:** Given the template editor, When a user attempts to delete or redefine a protected system field, Then the action is rejected.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-001, FR-TPL-006

### FR-TPL-003 — Template Field-Type Palette
**Requirement:** The system shall support the following configurable field types on templates, and no others, at MVP: Short Text, Long Text, Rich Text, Number, Date, Date & Time, Checkbox/Boolean, Dropdown, Multi-select, User, Tags, Attachment, URL, Entity Link (constrained to TestFlow-supported relationships: Requirement, Test Case, Defect, Test Run — not arbitrary), Step Table, Section.
**Purpose:** Adopts the approved bounded field-type palette (PD-053), explicitly excluding calculated fields, scripting, formulas, and field-level custom permissions at MVP.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Template editor's "add field" action offers exactly this palette.
**Business Rules:** PD-053. No calculated fields, arbitrary scripting, formulas, or field-level custom edit-permissions at MVP.
**Acceptance Criteria:** Given the template editor's field-type selector, When opened, Then exactly the types listed above are offered.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-001

### FR-TPL-004 — Configurable Field Properties
**Requirement:** The system shall support the following properties on a configurable field, applied only where meaningful to that field's type: label, help text/description, required/optional, default value, allowed options (Dropdown/Multi-select), numeric validation (Number), display order, active/inactive state. Deactivating an option or field that is in use on existing documents shall not delete historical values already recorded against it (soft-deprecation, not deletion).
**Purpose:** Gives real configurability per field type without forcing every property onto every type (e.g., Attachment has no "allowed options") — per instruction, and preserves PD-057's immutability principle for historical records.
**Actors:** QA Manager, Admin.
**Preconditions:** A field exists on a template draft.
**Main Behaviour:** Field editor exposes only the properties applicable to the selected field type.
**Business Rules:** PD-053. Field-level custom edit-permissions are explicitly out of scope at MVP (PD-053).
**Acceptance Criteria:** Given a Dropdown field, When edited, Then allowed options are configurable; given an Attachment field, When edited, Then no "allowed options" property is shown.
**Error/Edge Conditions:** Removing/deactivating an option or field already used on existing documents preserves those documents' recorded values (soft-deprecation), consistent with FR-QAOM-012/PD-057.
**Priority:** MVP
**Dependencies:** FR-TPL-003

### FR-TPL-005 — Default Starter Templates
**Requirement:** The system shall provide a TestFlow-defined default template for Test Case, Test Report, and Regression Report, each consisting of protected system fields plus a sensible set of default configurable fields, so that organisations are not required to start from a blank template.
**Purpose:** Implements "defaults before blank canvas" (PRD §18) — the standard Test Case template initially contains appropriate standard fields.
**Actors:** N/A (system-provided).
**Preconditions:** None.
**Main Behaviour:** The default Test Case template includes (beyond protected system fields): Title (Short Text, required), Description (Long Text, optional), Preconditions (Long Text, optional), Priority (Dropdown, optional, FR-TC-011), Steps/Expected Results (Step Table, required), Requirement (Entity Link, optional, per PD-005), Automation Status (Dropdown, optional), Tags (Tags, optional), Attachments (Attachment, optional). The default Test Report and Regression Report templates include a comparable sensible default structure appropriate to each document type, deferred to a future documentation pass for exact field-by-field content beyond this baseline. All defaults are editable by the organisation within the boundaries of FR-TPL-002.
**Business Rules:** PD-062 (Standard QA preset uses these unmodified); FR-TC-011/PD-055 (Priority defaults).
**Acceptance Criteria:** Given a new organisation on Standard QA, When a test case is created, Then it uses the default Test Case template above, unmodified, unless the organisation has customized it.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-002, FR-TC-011

### FR-TPL-006 — Template Draft Editing
**Requirement:** The system shall allow QA Manager or Admin to create/edit a template as a draft — add a configurable field, remove a configurable field, reorder fields, rename a configurable/display label, configure allowed options, mark a field required/optional, configure supported validation, and preview the template — with no effect on any document until published (FR-TPL-007).
**Purpose:** Mirrors the general Draft/Publish pattern (FR-QAOM-008) at the individual-template level.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Draft changes are visible only in the editor/preview until published.
**Business Rules:** PD-053, PD-057.
**Acceptance Criteria:** Given a template draft with unsaved changes, When another user creates a test case, Then it uses the last published template version, not the draft.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-001, FR-TPL-007

### FR-TPL-007 — Template Publish, Versioning, Immutability
**Requirement:** The system shall, on publish, create a new immutable Test Case/Test Report/Regression Report template version referenced by the organisation's next Organisation QA Configuration Version (FR-QAOM-009). A published template version shall never be modified in place; further changes require a new draft and a new publish.
**Purpose:** Guarantees historical documents remain interpretable against the template version applicable when they were created (PD-057).
**Actors:** QA Manager, Admin.
**Preconditions:** A template draft exists (FR-TPL-006).
**Main Behaviour:** Publish action creates a new, immutable template version.
**Business Rules:** PD-057.
**Acceptance Criteria:** Given a published template version, When a later version is published, Then the earlier version's field definitions are unchanged.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-006, FR-QAOM-009

### FR-TPL-008 — Template Version History
**Requirement:** The system shall allow QA Manager or Admin to inspect the version history of a template, including which version is currently published/applicable.
**Purpose:** Supports auditability and understanding of how a template has evolved.
**Actors:** QA Manager, Admin.
**Preconditions:** A template has at least one published version.
**Main Behaviour:** Version history view lists each published version with publish date/author.
**Business Rules:** PD-057, FR-AUD-005.
**Acceptance Criteria:** Given a template with 3 published versions, When history is viewed, Then all 3 are listed with the current one clearly marked.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-007

### FR-TPL-009 — Document Creation Uses Applicable Published Template Version
**Requirement:** The system shall resolve, at the moment a Test Case/Test Report/Regression Report is created, the applicable published template version from the project's effective configuration (FR-POL-002), and shall use that version — not a later one — for that document's lifetime, unless the document is itself materially recreated.
**Purpose:** Ensures a created document's structure is stable and interpretable regardless of later template republishing (PD-057), directly supporting FR-TC-008/FR-RPT-005.
**Actors:** N/A (system behaviour).
**Preconditions:** A document is being created.
**Main Behaviour:** Document stores a reference to the template version used at creation.
**Business Rules:** PD-057, PD-063.
**Acceptance Criteria:** Given a test case created under Template Version 1, When Template Version 2 is later published, Then the existing test case continues to reflect Version 1's structure.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TPL-007, FR-POL-002

---

# WF — Document Workflow **[New Module — CHANGE-001]**

**Layer:** B (Organisation QA Configuration), with FR-WF-003 spanning into Layer A (the stable internal meta-state). See PD-049, PD-050, PD-052.

### FR-WF-001 — Bounded Document Workflow Shapes
**Requirement:** The system shall support exactly three document workflow shapes, and no others, at MVP: **No Approval** (document moves from its working/draft state to a completed/final state with no approval step — any user with edit access may complete the transition, PD-049's default); **Single Approval** (document is submitted and requires one authorized approval before reaching the final/Approved state); **Review + Approval** (document receives a review step before a separate, final approval step). No generic, arbitrary workflow/state-machine builder is provided.
**Purpose:** Delivers organisation-configurable governance without building a BPM engine (PD-052).
**Actors:** N/A (shape definitions); QA Manager, Admin (configure which shape applies, FR-WF-002).
**Preconditions:** None.
**Main Behaviour:** Each shape defines a small, fixed set of states and transitions (see FR-WF-003 for the meta-state model); no shape allows organisation-defined additional states or transitions.
**Business Rules:** PD-052.
**Acceptance Criteria:** Given the workflow configuration screen, When shapes are listed, Then exactly No Approval, Single Approval, and Review + Approval are offered — no custom/arbitrary shape option exists.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-002, FR-WF-003

### FR-WF-002 — Organisation Configures Workflow Shape per Document Type
**Requirement:** The system shall allow QA Manager or Admin to configure, independently, which workflow shape (FR-WF-001) applies to Test Case, and which applies to Test Report and Regression Report (which may share one configured shape or be configured independently).
**Purpose:** Different document types may reasonably need different governance strength within the same organisation.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Workflow configuration is part of the QA Operating Model draft/publish cycle (FR-QAOM-008).
**Business Rules:** PD-052, PD-063.
**Acceptance Criteria:** Given an organisation configuring Controlled QA, When workflow shapes are set, Then Test Case may be set to Review + Approval while Test Report is set to Single Approval, independently.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-001, FR-QAOM-008

### FR-WF-003 — Stable Workflow Meta-State vs. Display Label
**Requirement:** The system shall maintain a stable, TestFlow-controlled internal meta-state for every document under a configured workflow (e.g., `working`, `in_review`, `approved`), independent of whatever display label the organisation may configure for that state (e.g., "Draft," "Ready for Review," "Approved," or organisation-specific terminology). All reporting, traceability, AI validation, and quality-gate evaluation shall key off the stable internal meta-state, never the display label.
**Purpose:** Implements the required distinction (§10 of the task) between system status and organisation-configured workflow status, ensuring organisation terminology never breaks system behaviour.
**Actors:** N/A (system behaviour).
**Preconditions:** A document exists under a configured workflow.
**Main Behaviour:** Internal meta-state is set by workflow transitions (FR-WF-001); display label is a organisation-configurable mapping onto that meta-state (label configuration deferred to a future documentation pass — the capability, not its exact UI, is established here).
**Business Rules:** PD-050 (§10 of the impact analysis).
**Acceptance Criteria:** Given an organisation that renames "Approved" to "Signed Off," When a quality gate evaluates "required approvals completed," Then it correctly evaluates the underlying `approved` meta-state regardless of the display label used.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-001, FR-QG-003

### FR-WF-004 — Execution of Unapproved Test Case — Governance Setting
**Requirement:** The system shall allow the organisation to configure whether a test case not in the `approved` meta-state may be executed within a test run: **Allowed** or **Prohibited**. No intermediate mode (e.g., warning-only) is provided at MVP.
**Purpose:** Directly answers §12's required question with the recommended two-option MVP choice, avoiding an unjustified intermediate mode.
**Actors:** QA Manager, Admin (configure); QA Tester (subject to the configured rule when executing).
**Preconditions:** Organisation's QA Operating Model configures this setting (default: Allowed, per Standard/Lightweight QA presets; Prohibited under Controlled QA).
**Main Behaviour:** At test run creation or execution (whichever the organisation's configuration semantically requires — enforcement point is at execution, per §3's preference for predictable enforcement points), the system checks each included test case's approval meta-state against the configured setting.
**Business Rules:** PD-063. Enforcement occurs at the point of recording an execution result (FR-EXEC-001), not at run creation — a run may be created with not-yet-approved test cases under either setting, since a run's snapshot content (FR-TC-004) is independent of approval state; only the ability to record a result against an unapproved snapshot is gated when Prohibited is configured.
**Acceptance Criteria:**
- Given Prohibited is configured, When a user attempts to record an execution result for a test case snapshot that was not Approved at run creation, Then the action is rejected with a clear reason.
- Given Allowed is configured (the default), When a user records a result for an unapproved test case, Then it succeeds exactly as in pre-pivot behaviour.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-003, FR-EXEC-001, FR-TC-004

### FR-WF-005 — Report Workflow (Test Report / Regression Report)
**Requirement:** The system shall apply the organisation's configured workflow shape (FR-WF-002) to Test Report and Regression Report, controlling each report's preparation, review, and approval states, independently of Quality Gate evaluation (FR-QG-003). A report's document workflow state alone shall never itself trigger, gate, or block release readiness or any other action — only an explicitly configured Quality Gate that reads that state can do so (PD-050).
**Purpose:** Formalizes the required separation between document workflow and Quality Gates (§13, §9 of the impact analysis), generalizing FR-RPT-003's record-only default without silently making report approval a generic blocking mechanism.
**Actors:** QA Manager, Admin (prepare/approve, per configured shape and FR-WF-006); BA/PO (record their own approval/rejection via link, per FR-RPT-003, which remains a separate, additional record alongside internal document workflow).
**Preconditions:** None.
**Main Behaviour:** Report moves through its configured workflow's states; BA/PO's link-based approval/rejection (FR-RPT-003) is recorded as before, and may additionally be one of the inputs a configured Quality Gate reads (FR-QG-001).
**Business Rules:** PD-038, PD-039, PD-050.
**Acceptance Criteria:** Given a Test Report under Single Approval, When it reaches the internal `approved` meta-state, Then that state alone still does not block or trigger anything unless a Quality Gate is separately configured to depend on it.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-WF-001, FR-WF-002, FR-RPT-002, FR-RPT-003, FR-QG-001

### FR-WF-006 — Approval Permission Checkpoints
**Requirement:** The system shall enforce the following MVP permission checkpoints for QA-configuration and document-workflow actions, using the existing three organisation roles with no custom-role mechanism: **Admin** — organisation-level administrative authority; may access QA configuration governance where appropriate, and holds every QA Manager permission below. **QA Manager** — primary QA Operating Model administrator: create/edit configuration drafts (FR-QAOM-008), create/edit templates (FR-TPL-006), configure workflow shapes (FR-WF-002), configure quality gates (FR-QG-002), publish QA configuration/templates (FR-QAOM-008, FR-TPL-007), approve QA documents where the configured workflow assigns that role, authorize permitted project overrides (FR-POL-004). **QA Tester** — consumes published templates (FR-TC-008), creates QA records/documents where permitted, submits documents/test cases into a configured workflow (participates as author/reviewer where the workflow assigns that role, but cannot publish organisation configuration).
**Purpose:** Delivers the governance-permission granularity the pivot requires without reopening the fully-custom-roles Non-Goal (PD-059/ORG-QA-DEC-011).
**Actors:** Admin, QA Manager, QA Tester.
**Preconditions:** None.
**Main Behaviour:** Every configuration/workflow action checks the acting user's organisation role against this mapping.
**Business Rules:** PD-059. This mapping does not conflict with any existing role decision (PD-013, PD-017, PD-031) — it is additive, gating new configuration actions only; it does not change who can be Admin/QA Manager/QA Tester or how roles are assigned.
**Acceptance Criteria:** Given a QA Tester, When they attempt to publish a QA configuration change, Then the action is rejected; given a QA Manager, When they do the same, Then it succeeds.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-USR-001

---

# AI — AI Test Generation

### FR-AI-001 — Generate Test Cases from Requirement, Against Applicable Template **[Generalized — CHANGE-001]**
**Requirement:** The system shall generate a full set of test cases from a selected requirement using AI, resolving the chain Organisation → Project → Effective Configuration → Applicable Published Test Case Template (FR-TPL-009) before generation, and structuring generated output to match that template's fields (required fields, allowed structure, configured options, organisation terminology where the template exposes it).
**Purpose:** Reduces manual test case authoring effort while ensuring generated output is usable within the organisation's actual configured document structure, not a fixed shape (PD-060).
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** A requirement exists; AI is available (platform-provided or project key, FR-AI-003/FR-AI-004); an applicable published Test Case template exists (always true — FR-TPL-005).
**Main Behaviour:** Actor triggers generation; system resolves the applicable template, generates a set of draft test cases structured to it, linked to the requirement, and validates them against the template (FR-AI-006) before presenting them for the mandatory review step (FR-AI-002).
**Business Rules:** PD-008, PD-060.
**Acceptance Criteria:** Given a requirement and an organisation-customized Test Case template, When AI generation is triggered, Then the resulting draft test cases are structured to that template's fields, not a fixed generic shape.
**Error/Edge Conditions:** AI provider failure surfaces an error; no partial/corrupted test cases are saved. Output that cannot be made to satisfy the template's required fields is surfaced to the reviewer as incomplete, never silently saved (FR-AI-006).
**Priority:** MVP
**Dependencies:** FR-REQ-001, FR-AI-002, FR-AI-006, FR-TPL-009

### FR-AI-002 — Mandatory Human Review Before Save
**Requirement:** The system shall require AI-generated test cases to be reviewed and be editable before being saved as final.
**Purpose:** Keeps humans in control of quality decisions (vision principle).
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** AI generation has produced draft test cases.
**Main Behaviour:** Draft test cases are presented for review/edit prior to save.
**Business Rules:** Vision Product Principle: AI accelerates but never replaces human review.
**Acceptance Criteria:** Given AI-generated drafts, When the user attempts to save without opening the review step, Then the system still requires the review/edit step to complete before final save.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AI-001

### FR-AI-003 — Optional Per-Project AI Provider Key
**Requirement:** The system shall allow a project to optionally configure its own AI provider key.
**Purpose:** Lets teams use their own AI provider account.
**Actors:** QA Manager, Admin.
**Preconditions:** Project exists.
**Main Behaviour:** Provider key is configured at the project level and used for that project's AI generation.
**Business Rules:** PD-008.
**Acceptance Criteria:** Given a project with a configured key, When AI generation runs, Then the project's key is used.
**Error/Edge Conditions:** Invalid key surfaces a configuration error.
**Priority:** MVP
**Dependencies:** None

### FR-AI-004 — Platform-Provided AI Option
**Requirement:** The system shall provide a platform-provided AI option usable without project-level key configuration.
**Purpose:** Lowers the barrier to trying AI features.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Project without a configured key uses the platform-provided AI option by default.
**Business Rules:** PD-008. Usage limits/cost model: not yet decided.
**Acceptance Criteria:** Given a project with no configured key, When AI generation is triggered, Then the platform-provided option is used.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-AI-005 — AI Generation Scope Limited to Requirements
**Requirement:** The system shall support AI generation of test cases from a selected requirement only; generation from free-text task descriptions is out of scope for MVP.
**Purpose:** Keeps MVP AI scope focused.
**Actors:** N/A (scope boundary).
**Preconditions:** None.
**Main Behaviour:** Generation entry point requires a selected requirement.
**Business Rules:** Vision Current Scope Boundaries; PRD Non-Goals.
**Acceptance Criteria:** Given no requirement selected, When a user looks for a generation option, Then no free-text generation entry point is presented.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-REQ-001

### FR-AI-006 — AI Output Validated Against Applicable Template Before Review **[New — CHANGE-001]**
**Requirement:** The system shall validate AI-generated test case output against the applicable published Test Case template (required fields, allowed field structure, configured options) before presenting it for the mandatory human review step (FR-AI-002). Invalid output shall never bypass template validation, workflow, or permissions, and shall never be auto-corrected into an approved state without human review.
**Purpose:** Ensures the Template System's guarantees (required fields, valid options) hold for AI-originated content exactly as they would for manually authored content (PD-060).
**Actors:** N/A (system behaviour).
**Preconditions:** AI generation has produced candidate output (FR-AI-001).
**Main Behaviour:** Candidate output is checked against the applicable template's field definitions prior to being shown to the reviewer; fields that don't validate are flagged to the reviewer rather than silently dropped or silently defaulted.
**Business Rules:** PD-060. Does not weaken NFR-AI-004 (mandatory human review cannot be bypassed) — validation happens before review, not instead of it.
**Acceptance Criteria:** Given AI output missing a required template field, When it reaches the review step, Then the reviewer sees the field flagged as missing/required, not a silently incomplete saved record.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AI-001, FR-AI-002, FR-TPL-009

---

# TS — Test Suite Management

### FR-TS-001 — Create Test Suite
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to create a test suite within a project.
**Purpose:** Groups related test cases.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access.
**Main Behaviour:** Actor creates a named suite.
**Business Rules:** None.
**Acceptance Criteria:** Given project access, When a suite is created, Then it is available for test case assignment.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-TS-002 — Organize Test Cases into Suite
**Requirement:** See FR-TC-009 (test case side of the same capability).
**Purpose:** N/A — cross-reference entry.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** N/A.
**Main Behaviour:** N/A.
**Business Rules:** N/A.
**Acceptance Criteria:** N/A.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-009

---

# TR — Test Run / Execution

### FR-TR-001 — Create Test Run
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to create a test run from one or more test cases or a suite.
**Purpose:** Starting point for executing tests.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access; at least one test case is selected.
**Main Behaviour:** Actor creates a run; system snapshots selected test case content (FR-TC-004).
**Business Rules:** None beyond the snapshot rule.
**Acceptance Criteria:** Given selected test cases, When a run is created, Then a snapshot is taken and the run is ready for execution.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-004

### FR-TR-002 — Snapshot Test Case Content at Run Creation
**Requirement:** See FR-TC-004 (system-behaviour duplicate, stated from the run side for module completeness).
**Purpose:** N/A — cross-reference entry.
**Actors:** N/A.
**Preconditions:** N/A.
**Main Behaviour:** N/A.
**Business Rules:** N/A.
**Acceptance Criteria:** N/A.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-004

### FR-TR-003 — Close Test Run
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to close a test run once execution is complete, and shall allow a test run to be cancelled and archived as part of a requirement archive cascade (FR-REQ-004).
**Purpose:** Finalizes a run's results.
**Actors:** QA Tester, QA Manager, Admin (manual close); system (cascade cancellation).
**Preconditions:** Run exists and is not already closed.
**Main Behaviour:** Run transitions to Closed; results become immutable (FR-EXEC-003). A cascade-triggered cancellation archives the run instead of a normal close.
**Business Rules:** PD-034 (cascade cancellation); FR-EXEC-003 (post-closure immutability).
**Acceptance Criteria:** Given an open run with recorded results, When it is closed, Then its results become immutable.
**Error/Edge Conditions:** A run already closed cannot be closed again; a cascade-cancelled run is marked distinctly from a normally closed run (exact status label: see Open Questions).
**Priority:** MVP
**Dependencies:** FR-EXEC-003, FR-REQ-004

### FR-TR-004 — Test Run Progress Aggregation
**Requirement:** The system shall display aggregate progress counts (e.g., Pass/Fail/Blocked/Skipped totals) for an in-progress test run.
**Purpose:** Supports real-time QA decision-making.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Run has at least one recorded result.
**Main Behaviour:** Progress counts update as results are recorded.
**Business Rules:** None.
**Acceptance Criteria:** Given a run with recorded results, When the run is viewed, Then current progress counts are displayed.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-EXEC-001

---

# EXEC — Test Execution

### FR-EXEC-001 — Record Execution Result
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to record an execution result (Pass, Fail, Blocked, or Skipped) for each test case in an open test run.
**Purpose:** Core execution recording capability.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Run is open (not closed).
**Main Behaviour:** Actor records a status per test case in the run.
**Business Rules:** None beyond the fixed status set.
**Acceptance Criteria:** Given an open run, When a result is recorded, Then it is saved against that test case's snapshot within the run.
**Error/Edge Conditions:** Attempting to record a result on a closed run is rejected (FR-EXEC-003).
**Priority:** MVP
**Dependencies:** FR-TR-001

### FR-EXEC-002 — Attach Evidence to Result
**Requirement:** The system shall allow evidence (e.g., a file or note) to be attached to a recorded execution result.
**Purpose:** Supports defect investigation and audit.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** A result has been recorded.
**Main Behaviour:** Actor attaches evidence to the result.
**Business Rules:** None.
**Acceptance Criteria:** Given a recorded result, When evidence is attached, Then it is stored with that result.
**Error/Edge Conditions:** Evidence cannot be attached after run closure (FR-EXEC-003).
**Priority:** MVP
**Dependencies:** FR-EXEC-001

### FR-EXEC-003 — Execution Result Immutability After Run Closure **[Updated]**
**Requirement:** The system shall not permit any recorded execution result within a test run to be edited, added, or removed once that test run has been closed. This is a hard rule with no exception.
**Purpose:** Preserves the integrity of historical execution records once a run is finalized (PD-037).
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Test run is in Closed status.
**Main Behaviour:** Any attempt to modify a result, or attach/remove evidence, on a closed run is rejected outright.
**Business Rules:** PD-037. Supersedes any prior "not specified" framing of post-closure editability.
**Acceptance Criteria:** Given a closed test run, When any user attempts to edit a recorded result, Then the system rejects the change and the result remains as it was at closure.
**Error/Edge Conditions:** A cascade-cancelled-and-archived run (FR-REQ-004) is treated the same as a normally closed run for this immutability rule.
**Priority:** MVP
**Dependencies:** FR-TR-003

---

# DEF — Defect Management

### FR-DEF-001 — Log Defect **[Updated]**
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to log a defect from a failed execution result. A defect's status shall be one of: Open, Pending, Closed, or Removed.
**Purpose:** Captures issues found during testing.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** A Fail result exists.
**Main Behaviour:** Actor logs a defect linked to the failed result, starting in Open status.
**Business Rules:** Defect status vocabulary: Open, Pending, Closed, Removed.
**Acceptance Criteria:** Given a Fail result, When a defect is logged, Then it is linked to that result and its test case, starting in Open status.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-EXEC-001

### FR-DEF-002 — Assign Defect to Developer
**Requirement:** The system shall allow a logged defect to be assigned to a Developer via a temporary access link.
**Purpose:** Routes the defect to the responsible party.
**Actors:** QA Tester, QA Manager, Admin (assigning); Developer (recipient, link-based).
**Preconditions:** Defect exists.
**Main Behaviour:** Assignment generates a scoped link (FR-LNK-001) sent to the Developer.
**Business Rules:** PD-018.
**Acceptance Criteria:** Given a logged defect, When it is assigned to a Developer, Then a scoped link is generated and delivered.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-DEF-006

### FR-DEF-003 — Update Defect Status via Link
**Requirement:** The system shall allow a Developer, via their access link, to update the status of the defect assigned to them.
**Purpose:** Lets Developers report progress without organisation membership.
**Actors:** Developer (via link).
**Preconditions:** Valid, unexpired link.
**Main Behaviour:** Developer updates defect status through the scoped link.
**Business Rules:** PD-018. Link has no identity verification (FR-LNK-002).
**Acceptance Criteria:** Given a valid link, When the Developer updates status, Then the change is recorded and attributed to the link/action.
**Error/Edge Conditions:** Expired or revoked link rejects the update.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-LNK-002

### FR-DEF-004 — Link Defect to Test Case/Result
**Requirement:** The system shall maintain a link between a defect and the test case/result it originated from.
**Purpose:** Supports traceability.
**Actors:** N/A (system behaviour).
**Preconditions:** Defect logged from a result.
**Main Behaviour:** Link persists for the defect's lifetime.
**Business Rules:** None.
**Acceptance Criteria:** Given a logged defect, When its origin is viewed, Then the linked test case and result are shown.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-DEF-001, FR-TRACE-001

### FR-DEF-005 — Defect History
**Requirement:** The system shall record a history of status changes and actions on a defect.
**Purpose:** Supports audit and progress tracking.
**Actors:** N/A (system behaviour).
**Preconditions:** Defect exists.
**Main Behaviour:** Each status change is timestamped and attributed.
**Business Rules:** All significant actions, including link-based ones, must be attributed and timestamped.
**Acceptance Criteria:** Given a defect with status changes, When its history is viewed, Then all changes are listed with timestamp and attribution.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AUD-002

### FR-DEF-006 — Notify Developer of Defect Assignment
**Requirement:** The system shall notify the assigned Developer, via email carrying their access link, when a defect is assigned to them.
**Purpose:** Delivers both notice and access in one step for a non-account role.
**Actors:** Developer (recipient).
**Preconditions:** Defect assigned (FR-DEF-002).
**Main Behaviour:** Email sent immediately on assignment.
**Business Rules:** PD-010, PD-018. Email is the sole delivery/access mechanism for link-based roles (FR-NOT-003).
**Acceptance Criteria:** Given a defect assignment, When it is saved, Then an email with the access link is sent to the Developer.
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-NOT-003, FR-NOT-005

### FR-DEF-007 — Defect Severity — Stable Semantics, Configurable Labels **[New — CHANGE-001]**
**Requirement:** The system shall maintain four stable, TestFlow-controlled Defect Severity semantic levels — Critical, High, Medium, Low — used consistently by reporting, filtering, and Quality Gate evaluation (FR-QG-001). The organisation may configure the *display label* mapped to each level (e.g., Critical → "S1 Showstopper") but may not remove a level, add an unmapped level, or redefine which underlying level a label maps to in a way that breaks the mapping. Default display labels are Critical/High/Medium/Low unless the organisation configures otherwise.
**Purpose:** Closes the previously flagged gap (no Severity field existed at all) while giving Quality Gates and cross-organisation reporting a stable axis to reason about (PD-055).
**Actors:** QA Tester, QA Manager, Admin (setting severity on a defect); QA Manager, Admin (configuring display labels).
**Preconditions:** None.
**Main Behaviour:** Defect Severity is set at logging time or afterward by any actor able to edit the defect; the four semantic levels are always present regardless of organisation label configuration.
**Business Rules:** PD-055. Severity is distinct from Priority (FR-DEF-008) — never treated as equivalent.
**Acceptance Criteria:** Given an organisation that relabels Critical to "S1 Showstopper," When a Quality Gate condition "no unresolved Critical defects" is evaluated, Then it correctly evaluates defects at the Critical semantic level regardless of the display label shown to users.
**Error/Edge Conditions:** An organisation cannot create a fifth, unmapped severity level at MVP.
**Priority:** MVP
**Dependencies:** FR-DEF-001, FR-QG-001

### FR-DEF-008 — Defect Priority — Organisation-Configurable **[New — CHANGE-001]**
**Requirement:** The system shall support an organisation-configurable Defect Priority field, distinct from Defect Severity (FR-DEF-007) and from Test Case Priority (FR-TC-011). TestFlow default options are Critical, High, Medium, Low; the organisation may rename, add, remove (if unused), and reorder options. No TestFlow-mandated semantic mapping applies to Defect Priority.
**Purpose:** Gives organisations a triage-ordering field distinct from the stable Severity axis, per PD-055's explicit non-equivalence.
**Actors:** QA Tester, QA Manager, Admin (setting priority); QA Manager, Admin (configuring the option set).
**Preconditions:** None.
**Main Behaviour:** Defect Priority is a Dropdown-type configurable field, independent of Severity's stable semantics.
**Business Rules:** PD-055.
**Acceptance Criteria:** Given a defect, When Priority and Severity are both set, Then they are recorded and displayed as two distinct fields, never merged or conflated.
**Error/Edge Conditions:** Removing a Priority option currently in use is soft-deprecated, not deleted, consistent with FR-TPL-004.
**Priority:** MVP
**Dependencies:** FR-DEF-001, FR-DEF-007

---

# TRACE — Traceability

### FR-TRACE-001 — Requirement-to-Defect Traceability Chain
**Requirement:** The system shall maintain traceability across the chain requirement → test case(s) → run(s) → result(s) → defect(s) wherever links exist.
**Purpose:** Core traceability value proposition.
**Actors:** N/A (system behaviour).
**Preconditions:** Links exist along the chain.
**Main Behaviour:** Each entity retains references to its upstream/downstream linked entities.
**Business Rules:** None beyond "wherever links exist" (linkage itself is often optional, e.g., FR-REQ-003).
**Acceptance Criteria:** Given a fully linked chain, When any entity in the chain is viewed, Then its related upstream/downstream entities are navigable.
**Error/Edge Conditions:** A break in the chain (e.g., untraced test case) simply stops traceability at that point; it is not an error state.
**Priority:** MVP
**Dependencies:** FR-REQ-003, FR-DEF-004

### FR-TRACE-002 — Traced vs. Untraced Test Case Reporting
**Requirement:** The system shall distinguish traced (requirement-linked) from untraced test cases in reporting.
**Purpose:** Supports the optional-linkage model without losing reporting clarity.
**Actors:** N/A (system behaviour).
**Preconditions:** None.
**Main Behaviour:** Reports/dashboards label test cases as traced or untraced.
**Business Rules:** PD-005.
**Acceptance Criteria:** Given a mix of traced and untraced test cases, When a report is generated, Then each is labelled accordingly.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-REQ-003, FR-RPT-001

---

# RPT — Reporting

### FR-RPT-001 — On-Demand Report Generation
**Requirement:** The system shall allow QA Manager or Admin to generate a report on demand for a project.
**Purpose:** Supports reporting to stakeholders and BA/PO.
**Actors:** QA Manager, Admin.
**Preconditions:** Project has execution data.
**Main Behaviour:** Actor triggers generation; system compiles current data into a report.
**Business Rules:** Reporting is on-demand only in MVP; scheduled/automated distribution is postponed.
**Acceptance Criteria:** Given a project with execution data, When a report is generated, Then it reflects current data at generation time.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-RPT-002

### FR-RPT-002 — Single Report Type with Post-Deployment Section **[Updated]**
**Requirement:** The system shall generate a single report type per project (not separate "pre-deployment" and "post-deployment" report types). This single report shall include a "Post-Deployment" section that specifically covers testing performed in production.
**Purpose:** Simplifies the reporting model to one report whose scope can span pre- and post-deployment testing activity, rather than maintaining two distinct report artifacts (PD-038).
**Actors:** QA Manager, Admin (generation); BA/PO (review via link).
**Preconditions:** None.
**Main Behaviour:** Report generation produces one report document/view; if production testing data exists, the Post-Deployment section is populated within that same report.
**Business Rules:** PD-038. **This decision supersedes any earlier framing of "pre-deployment report" and "post-deployment report" as two distinct report types — they are sections/scope within one report.**
**Acceptance Criteria:** Given a project with both pre-release and production testing activity, When a report is generated, Then both are represented within one report, with production testing appearing in its Post-Deployment section.
**Error/Edge Conditions:** A project with no production testing activity yet still generates the single report, with an empty/not-applicable Post-Deployment section.
**Priority:** MVP
**Dependencies:** FR-RPT-001

### FR-RPT-003 — BA/PO Report Approval/Rejection — Record-Keeping by Default **[Generalized — CHANGE-001]**
**Requirement:** The system shall allow BA/PO, via their access link, to approve or reject a report. This approval or rejection shall be recorded. By default, it shall not trigger, gate, or block any other action or workflow in the system. An organisation may configure a Quality Gate (FR-QG-001/002) whose evaluation reads this recorded decision as one of its inputs — in which case the gate, not the report approval itself, produces the blocking behaviour.
**Purpose:** Retains PD-039's record-only default while allowing the governance value described in the pivot — an organisation that wants report approval to matter for release readiness configures that explicitly via a gate, rather than report approval becoming an implicit blocking mechanism for everyone (PD-050).
**Actors:** BA/PO (via link).
**Preconditions:** Valid, unexpired link scoped to report approval.
**Main Behaviour:** BA/PO records an approve/reject decision on the report; decision and timestamp are stored, exactly as before. Separately, if a Quality Gate is configured to depend on this decision, gate evaluation reads it.
**Business Rules:** PD-039, PD-050. The decision itself never directly triggers anything — only a separately configured gate can produce dependent behaviour.
**Acceptance Criteria:**
- Given no Quality Gate configured against Test Report approval (Standard/Lightweight QA default), When BA/PO approves or rejects the report, Then the decision is recorded and no other system action is triggered — unchanged from pre-pivot behaviour.
- Given a Quality Gate configured to require an approved Test Report (e.g., under Controlled QA), When gate evaluation runs, Then it reads this recorded decision as one input.
**Error/Edge Conditions:** Expired/revoked link rejects the action.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-RPT-002, FR-QG-001

### FR-RPT-004 — BA/PO Report Comments — Private to QA Tester **[New]**
**Requirement:** The system shall allow BA/PO, via their access link, to leave comments on a report. These comments shall be visible only to the QA Tester and shall not be included in the report itself.
**Purpose:** Gives BA/PO a private feedback channel to the QA Tester, separate from the formal report content and from the record-only approval decision (PD-040).
**Actors:** BA/PO (via link, commenting); QA Tester (sole viewer of comments).
**Preconditions:** Valid, unexpired link scoped to the report.
**Main Behaviour:** BA/PO adds a comment associated with the report; comment is stored separately from report content and surfaced only to the QA Tester(s) associated with that project/report.
**Business Rules:** PD-040. Comments are not visible to QA Manager, Admin, Developer, or Stakeholder, and are excluded from the report document/view itself.
**Acceptance Criteria:** Given a valid report link, When BA/PO adds a comment, Then it appears to the QA Tester but does not appear within the report content, and is not visible to other roles.
**Error/Edge Conditions:** Expired/revoked link rejects new comments; existing comments remain visible to the QA Tester.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-RPT-002

### FR-RPT-005 — Regression Report — Built-In Configurable Document Type **[New — CHANGE-001]**
**Requirement:** The system shall support Regression Report as a second built-in configurable QA document type (alongside Test Report), organisation-templated (module TPL) and organisation-workflowed (module WF), generated on-demand per project. Regression Report is a TestFlow-defined document type — organisations configure its template and workflow but cannot create arbitrary additional document types.
**Purpose:** Implements PD-051's approved second built-in configurable document type, supporting the "regression activity completed" Quality Gate condition (FR-QG-001) without inventing a generic custom-document-type mechanism.
**Actors:** QA Manager, Admin (generation, per FR-RPT-001's pattern); BA/PO (review, where the organisation's link-sharing pattern extends to it, per FR-LNK-001).
**Preconditions:** Organisation's QA Operating Model determines whether Regression Report is required (FR-POL-001) — it is not required under Standard/Lightweight QA, required under Controlled QA.
**Main Behaviour:** Follows the same on-demand generation pattern as Test Report (FR-RPT-001), using the organisation's applicable published Regression Report template (FR-TPL-009) and configured workflow shape (FR-WF-002).
**Business Rules:** PD-051. Arbitrary custom document types (Performance/Security/UAT Report, Release Sign-off, Checklist) remain future expansion only — not introduced here, consistent with instruction §5.
**Acceptance Criteria:** Given Controlled QA is published, When project readiness is evaluated, Then Regression Report is treated as a required artifact per FR-POL-001, distinct from Test Report.
**Error/Edge Conditions:** A project with no regression testing activity yet still generates the report, with an appropriately empty/not-applicable state, consistent with FR-RPT-001's existing empty-state handling.
**Priority:** MVP
**Dependencies:** FR-TPL-005, FR-TPL-009, FR-WF-002, FR-POL-001

### FR-RPT-006 — Optional QA Scope on Test Report / Regression Report **[New — CHANGE-002]**
**Requirement:** The system shall allow Test Report and Regression Report to optionally carry methodology-neutral **QA Scope** metadata: a free-text scope value (e.g., "Sprint 17," "System Testing," "1–30 September 2026") and an optional scope start date and end date. All three fields are optional and independent — a document may have a scope value with no dates, dates with no label beyond the default, or neither.
**Purpose:** Gives QA Documents a neutral way to express what period or slice of work they cover, without TestFlow modelling Scrum, Kanban, Waterfall, or any other delivery methodology (PD-064). Resolves the gap identified in the CHANGE-002 impact analysis: the approved model was already methodology-neutral, but QA Documents had no scoping concept at all.
**Actors:** QA Manager, Admin (setting, at generation); all project members (viewing).
**Preconditions:** None.
**Main Behaviour:** At Test Report/Regression Report generation (FR-RPT-001, FR-RPT-005), the user may optionally enter a scope value and/or date range, pre-filled using the organisation's preferred scope terminology if set (FR-QAOM-013). If left blank, the document simply has no scope metadata — this is not an error or incomplete state. Consistent with the existing immutable-snapshot behaviour of Test Report/Regression Report (FR-RPT-001), scope is set once at generation time; there is no separate scope-edit action — regenerating produces a new document with its own scope.
**Business Rules:** PD-064. QA Scope is document-instance metadata only: it is not part of QA Configuration Version versioning, does not affect Quality Gate evaluation (FR-QG-003 remains Project-level and unaffected), does not affect Test Run behaviour, and does not create or imply any Delivery Cycle/Sprint/Release entity.
**Acceptance Criteria:** Given a QA Manager generating a Test Report, When they enter scope value "Sprint 17" with no dates, Then the report is created and displays "Sprint 17" as its scope, with Project Readiness and Quality Gate evaluation entirely unaffected. Given no scope is entered, When the report is viewed, Then no scope is displayed and no error occurs.
**Error/Edge Conditions:** Scope end date before scope start date: validation error. Scope value with no dates, or dates with no value: both valid.
**Priority:** MVP
**Dependencies:** FR-RPT-001, FR-RPT-005, FR-QAOM-013

---

# POL — Project Policy **[New Module — CHANGE-001]**

**Layer:** B/C boundary (Organisation QA Configuration resolving into Project Effective Configuration). See PD-056, PD-063.

### FR-POL-001 — Required QA Artifacts Configuration
**Requirement:** The system shall allow the organisation to configure, per its QA Operating Model, whether each of the following is required for project readiness: Requirements, Test Cases, Test Report, Regression Report. "Required" means the artifact must exist and (where a workflow applies) reach its workflow's final state **for project readiness purposes (FR-QG-001)** — it does not mean the artifact must exist immediately at project creation. Test Suite, Test Run, and Defect are not offered as "required artifact" toggles, since requiring their mere existence does not correspond to a meaningful QA governance concept (a project may legitimately have zero defects).
**Purpose:** Implements the bounded required-artifacts mechanism (§16 of the task, PD-056), with the enforcement-point clarification the task explicitly requested.
**Actors:** QA Manager, Admin (configuring); N/A (evaluated by FR-QG-003).
**Preconditions:** None.
**Main Behaviour:** Each of the four artifact types has an independent Required/Optional toggle in the organisation's (or, where overridable, project's) effective configuration.
**Business Rules:** PD-056. Enforcement occurs only at Quality Gate evaluation (FR-QG-003) — required-but-missing does not block ordinary work such as creating test cases or running tests; it only affects the computed readiness result.
**Acceptance Criteria:** Given Regression Report is configured as Required, When Quality Gate readiness is evaluated for a project with no Regression Report, Then that gate condition evaluates as Fail with a clear reason — but the project itself continues to function normally.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QG-001, FR-QG-003, FR-RPT-005

### FR-POL-002 — Project Inherits Organisation Published Configuration
**Requirement:** The system shall resolve a project's effective QA configuration as the organisation's currently applicable published QA Configuration Version (FR-QAOM-009/012), modified only by any explicit, permitted override (FR-POL-004) that project has applied.
**Purpose:** Implements the default inheritance rule (PD-056): organisation policy applies to projects unless explicitly and permissibly overridden.
**Actors:** N/A (system behaviour).
**Preconditions:** Project exists.
**Main Behaviour:** Effective configuration = organisation's pinned version (FR-QAOM-012) + any project overrides.
**Business Rules:** PD-056, PD-063.
**Acceptance Criteria:** Given a project with no overrides, When its effective configuration is resolved, Then it exactly matches the organisation's pinned published version.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QAOM-009, FR-QAOM-012, FR-POL-004

### FR-POL-003 — Overridable vs. Locked Settings
**Requirement:** The system shall classify every project-policy setting as either LOCKED (default) or OVERRIDABLE, per the organisation's configuration. The MVP overridable-eligible setting list is limited to: which QA artifacts are required for that project (FR-POL-001), and which Quality Gates are enabled for that project (FR-QG-002). Document workflow shape (FR-WF-002) and template selection (module TPL) are NOT overridable at project level at MVP — every project within an organisation uses the same published templates and workflow shapes.
**Purpose:** Keeps the MVP override surface intentionally small (§19 of the task) — real value (a higher-risk project needing stricter required-artifacts/gates) without opening template/workflow semantics to per-project drift, which the impact analysis flagged as unjustified complexity.
**Actors:** QA Manager, Admin (configuring which settings are overridable, at the organisation level).
**Preconditions:** None.
**Main Behaviour:** Organisation marks specific artifact-required and gate-enabled settings as overridable; all other settings remain locked.
**Business Rules:** PD-056.
**Acceptance Criteria:** Given the organisation has not marked any setting overridable, When a project attempts to configure its own required artifacts, Then the attempt is rejected and the organisation's setting applies.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-POL-001, FR-QG-002

### FR-POL-004 — Explicit, Permissioned, Audited Project Override
**Requirement:** The system shall require that, for a setting the organisation has marked OVERRIDABLE, a project-level override is: performed only by an authorized role (QA Manager or Admin, per FR-WF-006), explicit (never implied by another action), and recorded as an audit entry (FR-AUD-005) including the organisation value, the override value, who performed it, and when.
**Purpose:** Implements PD-056's requirement that overrides never be silent or unaudited.
**Actors:** QA Manager, Admin.
**Preconditions:** The setting being overridden is marked OVERRIDABLE (FR-POL-003).
**Main Behaviour:** Actor explicitly sets a project-specific value for an overridable setting; an audit entry is created.
**Business Rules:** PD-056.
**Acceptance Criteria:** Given an overridable setting, When QA Manager overrides it for Project A, Then Project A's effective configuration reflects the override, an audit entry is created, and other projects are unaffected.
**Error/Edge Conditions:** Attempting to override a LOCKED setting is rejected.
**Priority:** MVP
**Dependencies:** FR-POL-002, FR-POL-003, FR-AUD-005

### FR-POL-005 — Effective Project Configuration Visibility
**Requirement:** The system shall allow a project-authorized user to see, for each overridable setting, the organisation's published value, whether an override is in effect, the override value if any, and the resulting effective value.
**Purpose:** Implements PD-056's requirement that the effective configuration remain identifiable at all times, not just resolvable in the background.
**Actors:** QA Manager, Admin, QA Tester (with project access, viewing).
**Preconditions:** Project exists.
**Main Behaviour:** Project settings view shows organisation value / override / effective value for each overridable setting.
**Business Rules:** PD-056.
**Acceptance Criteria:** Given a project with one active override, When its configuration view is opened, Then both the organisation's original value and the overriding project value are shown, alongside the effective value.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-POL-002, FR-POL-004

---

# QG — Quality Gates **[New Module — CHANGE-001]**

**Layer:** B/C boundary (organisation/project-configured, TestFlow-evaluated). See PD-058, §13/§17/§18 of the impact analysis.

### FR-QG-001 — Quality Gate Catalogue
**Requirement:** The system shall support exactly the following bounded catalogue of Quality Gate conditions, and no others, at MVP: (1) required QA artifacts completed — reads FR-POL-001's configured required artifacts and each one's workflow meta-state (FR-WF-003); (2) required approvals completed — reads the `approved` meta-state of each document type the organisation has required approval for; (3) minimum requirement coverage percentage — reads FR-TRACE-002's traced/untraced data against an organisation-configured percentage threshold; (4) required regression activity completed — reads whether a Regression Report (FR-RPT-005) exists and, where configured, has reached its workflow's final state; (5) no unresolved Critical defects — reads FR-DEF-007's stable Critical severity level against open/pending defect status (FR-DEF-001); (6) no unresolved release-blocking defects — an organisation-configured defect classification (e.g., by Severity level) treated as blocking. No arbitrary rule composition, AND/OR expression language, or organisation-defined new gate types are supported.
**Purpose:** Adopts the recommended bounded catalogue (PD-058), each condition backed by a concept that already exists (or is introduced) elsewhere in this document — none invented purely for the gate catalogue.
**Actors:** N/A (catalogue definition); QA Manager, Admin (select/configure which apply, FR-QG-002).
**Preconditions:** None.
**Main Behaviour:** Each catalogue condition is independently selectable and configurable (e.g., the coverage percentage threshold, or which severity levels count as release-blocking).
**Business Rules:** PD-058.
**Acceptance Criteria:** Given the Quality Gate configuration screen, When conditions are listed, Then exactly the six conditions above are offered.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-POL-001, FR-WF-003, FR-TRACE-002, FR-DEF-007, FR-RPT-005

### FR-QG-002 — Quality Gate Configuration
**Requirement:** The system shall allow QA Manager or Admin to enable/disable each catalogue condition (FR-QG-001) for the organisation, and where FR-POL-003 marks it overridable, for an individual project, and to set each condition's organisation-specific parameter (e.g., coverage percentage, which severity levels are release-blocking).
**Purpose:** Implements the configuration half of the bounded gate model.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Gate configuration is part of the QA Operating Model draft/publish cycle (FR-QAOM-008), or a permitted project override (FR-POL-004).
**Business Rules:** PD-058, PD-056.
**Acceptance Criteria:** Given Controlled QA, When gate configuration is inspected, Then required-artifacts-completed, required-approvals-completed, and no-unresolved-Critical-defects are enabled by default, per FR-QAOM-006.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QG-001, FR-QAOM-008, FR-POL-003, FR-POL-004

### FR-QG-003 — Quality Gate Evaluation and Readiness Result
**Requirement:** The system shall evaluate, on demand (and reflected on the project dashboard, FR-DASH-004), each enabled Quality Gate condition for a project against current data, producing a per-condition result of Pass, Fail, or Not Applicable (e.g., a gate condition is Not Applicable if its underlying artifact type is not required, FR-POL-001), and an overall project readiness result derived from whether all enabled, non-Not-Applicable conditions Pass. Evaluation occurs at the **Project** level using current data — TestFlow does not introduce a separate Release entity or release/version identifier at MVP.
**Purpose:** Implements §18's required resolution: readiness is evaluated at the Project level using existing data, avoiding a full Release-management subsystem, per the impact analysis's recommendation to prefer the minimal domain concept. See §18 Product Decision Handling note in the Final Report below regarding future release/version identifiers.
**Actors:** QA Manager, Admin, QA Tester (viewing); N/A (evaluation itself is system behaviour).
**Preconditions:** A project has at least one enabled Quality Gate.
**Main Behaviour:** Evaluation reads current, live data (not a frozen snapshot) — readiness reflects the project's state at the moment it's checked, consistent with the Dashboard's existing live-data principle (FR-DASH-001).
**Business Rules:** PD-058, PD-063.
**Acceptance Criteria:** Given a project with all enabled gate conditions passing, When readiness is evaluated, Then the overall result is Ready; given at least one Fail, Then the overall result is Not Ready.
**Error/Edge Conditions:** A project with zero enabled gates always evaluates as Ready (no conditions to fail), consistent with Standard/Lightweight QA's "no aggressive gates by default."
**Priority:** MVP
**Dependencies:** FR-QG-001, FR-QG-002, FR-DASH-004

### FR-QG-004 — Human-Readable Gate Failure Reason
**Requirement:** The system shall present, for each Fail result (FR-QG-003), a human-readable reason identifying which condition failed and why (e.g., "Regression Report required but not yet Approved," "2 unresolved Critical defects").
**Purpose:** Directly required by §17 of the task — a bare Pass/Fail without explanation is not actionable for a QA Manager.
**Actors:** QA Manager, Admin, QA Tester (viewing).
**Preconditions:** At least one gate condition has failed.
**Main Behaviour:** Failure reason is generated from the specific condition and current data that caused the Fail.
**Business Rules:** PD-058.
**Acceptance Criteria:** Given a Fail on "no unresolved Critical defects" with 2 such defects open, When the reason is viewed, Then it names the condition and the count.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QG-003

---

# DASH — Dashboards

### FR-DASH-001 — Project Progress Dashboard
**Requirement:** The system shall provide a project-level dashboard showing testing progress.
**Purpose:** Central visibility for QA Manager/Admin.
**Actors:** QA Manager, Admin.
**Preconditions:** Project has activity.
**Main Behaviour:** Dashboard aggregates run/result/defect data for the project.
**Business Rules:** None.
**Acceptance Criteria:** Given a project with activity, When the dashboard is viewed, Then current progress is shown.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TR-004

### FR-DASH-002 — Test Run Progress Widget
**Requirement:** See FR-TR-004 (dashboard-facing view of the same underlying data).
**Purpose:** N/A — cross-reference entry.
**Actors:** QA Manager, Admin, QA Tester.
**Preconditions:** N/A.
**Main Behaviour:** N/A.
**Business Rules:** N/A.
**Acceptance Criteria:** N/A.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TR-004

### FR-DASH-003 — Stakeholder Read-Only Dashboard View
**Requirement:** The system shall allow a Stakeholder, via their access link, to view a read-only dashboard or report.
**Purpose:** Gives external stakeholders visibility without organisation membership.
**Actors:** Stakeholder (via link).
**Preconditions:** Valid, unexpired link.
**Main Behaviour:** Stakeholder views dashboard/report data; no edit capability.
**Business Rules:** PD-018.
**Acceptance Criteria:** Given a valid link, When a Stakeholder opens it, Then they see read-only dashboard/report data.
**Error/Edge Conditions:** Expired/revoked link denies access.
**Priority:** MVP
**Dependencies:** FR-LNK-001

### FR-DASH-004 — Release/Quality Gate Readiness Widget **[New — CHANGE-001]**
**Requirement:** The system shall display, on the project dashboard, the project's current Quality Gate readiness result (FR-QG-003) and, where Not Ready, the failing conditions' human-readable reasons (FR-QG-004).
**Purpose:** Surfaces the pivot's highest-leverage new capability where QA Managers already look for status (§13/§23 of the impact analysis).
**Actors:** QA Manager, Admin, QA Tester (viewing); Stakeholder (read-only via link, FR-DASH-003), where the organisation permits.
**Preconditions:** Project has at least one enabled Quality Gate; otherwise the widget shows "No gates configured" rather than a false Ready.
**Main Behaviour:** Widget reflects current, live evaluation (FR-QG-003), not a cached/stale value.
**Business Rules:** PD-058.
**Acceptance Criteria:** Given a project with an enabled, currently-failing gate, When the dashboard is viewed, Then the widget shows Not Ready with the failing condition's reason.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-QG-003, FR-QG-004, FR-DASH-001

---

# AUD — Audit / History

### FR-AUD-001 — Audit Log of Key Actions
**Requirement:** The system shall maintain an audit log of key actions across projects (e.g., approvals, archiving, role changes, defect status changes).
**Purpose:** Supports accountability and traceability of significant actions.
**Actors:** N/A (system behaviour).
**Preconditions:** A key action occurs.
**Main Behaviour:** Each key action creates an audit entry.
**Business Rules:** None beyond "key actions" scope, which includes at minimum: role changes (FR-USR-003), member removal (FR-USR-005), project archive (FR-PRJ-003), requirement archive cascade (FR-REQ-004), test case approval/status changes (FR-TC-005), and defect status changes (FR-DEF-003).
**Acceptance Criteria:** Given a key action, When it occurs, Then an audit entry is created.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AUD-004

### FR-AUD-002 — Audit Entries for Link-Based Actions
**Requirement:** The system shall record audit entries for actions performed via a temporary access link (e.g., defect status update, report approval/rejection).
**Purpose:** Preserves accountability even for non-account, link-based actors.
**Actors:** N/A (system behaviour).
**Preconditions:** A link-based action occurs.
**Main Behaviour:** Audit entry records the action, the link/role it was performed through, and timestamp.
**Business Rules:** Because links have no identity verification (FR-LNK-002), the audit entry identifies the link/role used, not a verified individual identity.
**Acceptance Criteria:** Given a link-based defect status update, When it occurs, Then an audit entry is recorded reflecting the link/role and timestamp.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-LNK-002

### FR-AUD-003 — Audit History Visibility Restricted to QA Manager/Admin **[Updated]**
**Requirement:** The system shall restrict visibility of audit history to users holding the QA Manager or Admin role. QA Tester and all link-based roles (BA/PO, Developer, Stakeholder) shall not be able to view audit history.
**Purpose:** Keeps the full action history — including sensitive actions like role changes and removals — restricted to the roles responsible for organisation/project oversight (PD-041).
**Actors:** QA Manager, Admin (viewers); QA Tester and link-based roles (excluded).
**Preconditions:** Audit entries exist.
**Main Behaviour:** Audit history view/query is only accessible to QA Manager and Admin.
**Business Rules:** PD-041.
**Acceptance Criteria:**
- Given a QA Manager or Admin, When they open audit history, Then they can view it.
- Given a QA Tester or a link-based role, When they attempt to access audit history, Then access is denied.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AUD-001

### FR-AUD-004 — Audit Entry Attribution and Timestamping
**Requirement:** The system shall attribute and timestamp every audit entry.
**Purpose:** Ensures audit entries are meaningful and traceable.
**Actors:** N/A (system behaviour).
**Preconditions:** An audit entry is created.
**Main Behaviour:** Entry records actor (user or link/role) and timestamp.
**Business Rules:** All significant actions must be attributed and timestamped.
**Acceptance Criteria:** Given any audit entry, When viewed, Then it shows who (or which link/role) performed it and when.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-AUD-005 — Audit Entries for QA Configuration Changes **[New — CHANGE-001]**
**Requirement:** The system shall record an audit entry for: QA configuration draft publish (FR-QAOM-008), template publish (FR-TPL-007), workflow shape change (FR-WF-002), governance/policy change (FR-QAOM-010, FR-POL-001), quality gate configuration change (FR-QG-002), project override (FR-POL-004), and document approval/rejection where a configured workflow applies (FR-WF-001).
**Purpose:** Extends the existing append-only audit model (FR-AUD-001) to cover the new configuration/governance action surface introduced by this pivot, per §16 of the task.
**Actors:** N/A (system behaviour).
**Preconditions:** One of the listed actions occurs.
**Main Behaviour:** Each action creates an audit entry per the existing FR-AUD-001/FR-AUD-004 pattern (attribution, timestamp); visibility remains restricted to QA Manager/Admin per FR-AUD-003.
**Business Rules:** PD-041 (visibility restriction unchanged), PD-057 (publish events specifically).
**Acceptance Criteria:** Given a QA configuration publish, When it occurs, Then an audit entry is created identifying the actor, the resulting configuration version, and timestamp.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AUD-001, FR-AUD-003, FR-AUD-004

---

# NOT — Notifications

### FR-NOT-001 — In-App Notifications for Organisation Members
**Requirement:** The system shall deliver in-app notifications to organisation members for key events (e.g., invitation, approval request, defect assignment).
**Purpose:** Timely handoff between roles.
**Actors:** Admin, QA Manager, QA Tester.
**Preconditions:** A notifiable event occurs.
**Main Behaviour:** In-app notification is created for the relevant member(s).
**Business Rules:** PD-010.
**Acceptance Criteria:** Given a notifiable event, When it occurs, Then the relevant organisation member(s) see an in-app notification.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-NOT-002 — Email Notifications for All Roles
**Requirement:** The system shall send email notifications for key events to all roles, including link-based roles.
**Purpose:** Ensures notification reach beyond in-app presence.
**Actors:** All roles.
**Preconditions:** A notifiable event occurs.
**Main Behaviour:** Email is sent in addition to (for organisation members) or instead of (for link-based roles) in-app notification.
**Business Rules:** PD-010.
**Acceptance Criteria:** Given a notifiable event, When it occurs, Then an email is sent to the relevant recipient(s).
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-NOT-005

### FR-NOT-003 — Email as Sole Delivery Mechanism for Link-Based Roles
**Requirement:** The system shall use email as the sole delivery mechanism for link-based roles, with the email itself carrying the access link.
**Purpose:** Link-based roles have no account or in-app presence to notify.
**Actors:** BA/PO, Developer, Stakeholder.
**Preconditions:** A link is generated for one of these roles.
**Main Behaviour:** Email containing the link is sent; no in-app notification exists for these roles.
**Business Rules:** PD-010, PD-018.
**Acceptance Criteria:** Given a link generated for a Developer, When it is sent, Then it arrives by email and contains the access link.
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-LNK-001

### FR-NOT-004 — Maintenance Notification
**Requirement:** The system shall notify Admin and QA Manager at least 24 hours in advance of planned maintenance affecting availability.
**Purpose:** Avoids surprising customers with downtime during active testing cycles.
**Actors:** Admin, QA Manager.
**Preconditions:** Planned maintenance is scheduled.
**Main Behaviour:** Notice is sent at least 24 hours ahead of the maintenance window.
**Business Rules:** None beyond the 24-hour minimum.
**Acceptance Criteria:** Given scheduled maintenance, When the notice is due, Then it is sent at least 24 hours before the window.
**Error/Edge Conditions:** N/A.
**Priority:** Post-MVP
**Dependencies:** None

### FR-NOT-005 — Notification/Link Delivery Retry
**Requirement:** The system shall retry a failed notification email or access link delivery at least once, within 5 minutes of the initial failure, before treating it as a permanent failure.
**Purpose:** Link-based roles depend entirely on email delivery for access; a non-retried failure blocks their ability to work.
**Actors:** N/A (system behaviour).
**Preconditions:** An email send fails.
**Main Behaviour:** System retries at least once within 5 minutes; logs and surfaces a permanent failure to the sender if retry also fails.
**Business Rules:** None beyond the retry minimum.
**Acceptance Criteria:** Given a failed send, When retried within 5 minutes and it succeeds, Then the recipient receives the notification/link.
**Error/Edge Conditions:** Permanent failure after retry is logged and visible to the sender.
**Priority:** MVP
**Dependencies:** None

### FR-NOT-006 — QA Configuration Published Notification **[New — CHANGE-001]**
**Requirement:** The system shall notify Admin and QA Manager (in-app and email, per FR-NOT-001/002) when a new Organisation QA Configuration Version is published (FR-QAOM-008).
**Purpose:** Keeps organisation configuration authorities aware of changes, particularly relevant when one QA Manager publishes a change another should know about.
**Actors:** Admin, QA Manager (recipients).
**Preconditions:** A configuration publish occurs.
**Main Behaviour:** Notification sent immediately on publish, using the existing notification architecture — no new delivery mechanism.
**Business Rules:** PD-010 (existing notification model).
**Acceptance Criteria:** Given a configuration publish, When it completes, Then Admin and QA Manager receive a notification.
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-NOT-001, FR-NOT-002, FR-QAOM-008

### FR-NOT-007 — Document Workflow Event Notifications **[New — CHANGE-001]**
**Requirement:** The system shall notify the relevant user(s) when a document under a configured workflow (FR-WF-001) is submitted for review, has approval requested, is approved, or is rejected, using the existing notification architecture (in-app for organisation members, email as sole channel for link-based roles, per FR-NOT-001/002/003). No configurable notification-rule builder is provided — recipients follow directly from the workflow shape's defined roles (e.g., the configured approver is notified when a document reaches the state requiring their action).
**Purpose:** Extends existing notification concepts to the new document workflow states, per §25 of the task, without building a rules engine.
**Actors:** Whichever role the configured workflow shape assigns to the relevant step (e.g., the Single Approval approver).
**Preconditions:** A document transitions to a state requiring another user's action, under a configured Single Approval or Review + Approval shape (not applicable under No Approval, since no handoff occurs).
**Main Behaviour:** Notification fires on the relevant transition, addressed to the role/user the workflow shape assigns.
**Business Rules:** PD-010.
**Acceptance Criteria:** Given a Test Case under Review + Approval submitted for review, When it reaches that state, Then the configured reviewer is notified.
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-NOT-001, FR-NOT-002, FR-WF-001

---

# LNK — Link-Based Access

### FR-LNK-001 — Generate Temporary Access Link, Configurable Expiry **[Updated]**
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin (with project access) to generate a temporary access link scoped to a specific action (e.g., report approval, defect status update, dashboard viewing) for BA/PO, Developer, or Stakeholder. The link's expiry duration shall be configurable by the generator, defaulting to 24 hours if not otherwise specified.
**Purpose:** Provides lightweight, no-account access for external roles, with a bounded and adjustable exposure window (PD-042).
**Actors:** QA Tester, QA Manager, Admin (generating); BA/PO, Developer, Stakeholder (recipient).
**Preconditions:** Generator has project access.
**Main Behaviour:** Generator creates a link scoped to one action/role; optionally sets a custom expiry duration; if none is set, expiry defaults to 24 hours from generation.
**Business Rules:** PD-018, PD-042.
**Acceptance Criteria:**
- Given a generator who specifies no expiry, When the link is created, Then it expires 24 hours after generation.
- Given a generator who specifies a custom expiry duration, When the link is created, Then it expires after that duration instead.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-LNK-002 — No Identity Verification for Link Recipients **[Updated]**
**Requirement:** The system shall not perform formal identity verification of a link recipient. The link itself shall be the sole credential; anyone possessing the link URL can perform the action(s) it scopes, until it expires or is revoked.
**Purpose:** Consistent with the lightweight, no-account access model already approved; mitigated by expiry (FR-LNK-001) and revocability (FR-LNK-005), which are the accepted trade-off controls (PD-043).
**Actors:** BA/PO, Developer, Stakeholder.
**Preconditions:** A link exists and is unexpired/unrevoked.
**Main Behaviour:** Link grants its scoped action to whoever holds the URL, with no login or identity check.
**Business Rules:** PD-043. This is an accepted trade-off, not a gap to be fixed.
**Acceptance Criteria:** Given a valid, unexpired link, When it is opened by anyone holding the URL, Then the scoped action is available without any identity check.
**Error/Edge Conditions:** N/A — absence of identity verification is the specified behaviour, not an error condition.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-LNK-005

### FR-LNK-003 — Named or Generic Link Recipient **[Updated]**
**Requirement:** The system shall support generating a temporary access link either targeted to a named recipient or generic, with no named recipient specified.
**Purpose:** Covers both cases — a link addressed to a specific known person (e.g., a named Developer) and a link meant for whoever needs it (e.g., a generic Stakeholder viewing link) (PD-044).
**Actors:** QA Tester, QA Manager, Admin (generating).
**Preconditions:** Generator has project access.
**Main Behaviour:** At generation, the generator optionally provides a recipient name/identifier; if omitted, the link is generic.
**Business Rules:** PD-044.
**Acceptance Criteria:**
- Given a generator who provides a recipient name, When the link is created, Then it is recorded as targeted to that named recipient.
- Given a generator who provides no recipient name, When the link is created, Then it is recorded as generic.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-LNK-001

### FR-LNK-004 — Multi-Use Link Until Expiry or Revocation **[Updated]**
**Requirement:** The system shall allow a temporary access link to be used multiple times, by whoever holds it, until it expires or is revoked. A link shall not be single-use.
**Purpose:** Matches the accepted lightweight access model, where the link (not a per-use token) is the credential (PD-045).
**Actors:** BA/PO, Developer, Stakeholder.
**Preconditions:** Link is unexpired and unrevoked.
**Main Behaviour:** Each open of the link performs the scoped action again; no first-use consumption occurs.
**Business Rules:** PD-045.
**Acceptance Criteria:** Given a valid link already used once, When it is used again before expiry/revocation, Then the scoped action remains available.
**Error/Edge Conditions:** Use after expiry or revocation is denied.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-LNK-005

### FR-LNK-005 — Link Revocation
**Requirement:** The system shall allow the link's generator (or Admin/QA Manager with project access) to revoke a temporary access link before its expiry.
**Purpose:** Provides a way to cut off access early if needed, mitigating the no-identity-verification trade-off (FR-LNK-002).
**Actors:** QA Tester (generator), QA Manager, Admin.
**Preconditions:** Link exists and is not already expired/revoked.
**Main Behaviour:** Actor revokes the link; subsequent uses are denied.
**Business Rules:** PD-018, PD-043.
**Acceptance Criteria:** Given an active link, When it is revoked, Then any subsequent attempt to use it is denied.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-LNK-001

### FR-LNK-006 — Free Sharing of Link by Holder **[New]**
**Requirement:** The system shall not restrict a link holder from copying or sharing the link URL with others; there is no mechanism preventing this.
**Purpose:** Explicit consequence of decisions on identity verification (FR-LNK-002) and multi-use (FR-LNK-004) — since the link is the sole, reusable credential, its holder can freely pass it on (PD-046).
**Actors:** BA/PO, Developer, Stakeholder (or anyone holding the link).
**Preconditions:** A valid link exists.
**Main Behaviour:** No technical restriction exists on forwarding, copying, or otherwise sharing the link URL.
**Business Rules:** PD-046. This is an accepted consequence of FR-LNK-002 and FR-LNK-004, not a defect.
**Acceptance Criteria:** Given a valid link, When its holder forwards it to a third party, Then that third party can use it exactly as the original holder could, until expiry/revocation.
**Error/Edge Conditions:** N/A — this is specified behaviour.
**Priority:** MVP
**Dependencies:** FR-LNK-002, FR-LNK-004

---

# SUB — Subscription & Billing

### FR-SUB-001 — Trial Plan
**Requirement:** The system shall offer a 14-day trial plan, requiring no payment, capped at a maximum of 3 seats, available only once per organisation.
**Purpose:** No-risk evaluation period for new organisations.
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation has never previously activated a trial.
**Main Behaviour:** Organisation selects trial; 14-day countdown begins; seat count capped at 3.
**Business Rules:** PD-021. Once activated, the trial cannot be selected again, whether it expired or was converted to paid.
**Acceptance Criteria:** Given an organisation that has never used a trial, When it selects the trial plan, Then a 14-day, 3-seat-capped trial begins.
**Error/Edge Conditions:** An organisation that already used a trial (expired or converted) cannot select it again.
**Priority:** MVP
**Dependencies:** FR-SUB-002

### FR-SUB-002 — Mandatory Subscription for Platform Access
**Requirement:** The system shall block all platform functionality (projects, organisation features, etc.) for an organisation without an active trial or active paid subscription. This applies immediately after sign-up.
**Purpose:** Uniform billing enforcement from the first session.
**Actors:** All roles.
**Preconditions:** None.
**Main Behaviour:** Access checks verify active trial/subscription status before allowing any platform functionality.
**Business Rules:** PD-020.
**Acceptance Criteria:** Given an organisation with no active trial or subscription, When any member attempts to access platform functionality, Then access is blocked.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-SUB-001, FR-SUB-003

### FR-SUB-003 — Plan Selection (Trial, Monthly, Yearly)
**Requirement:** The system shall present trial, monthly, and yearly plan options on the subscription page for selection.
**Purpose:** Lets the organisation choose how to satisfy the mandatory subscription requirement.
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation has no active trial/subscription, or is purchasing additional seats.
**Main Behaviour:** User selects a plan and completes the corresponding flow (FR-SUB-001, FR-SUB-004, or FR-SUB-005).
**Business Rules:** PD-021, PD-022, PD-023.
**Acceptance Criteria:** Given the subscription page, When viewed, Then trial (if not yet used), monthly, and yearly options are shown.
**Error/Edge Conditions:** Trial option is hidden/disabled if already used by the organisation.
**Priority:** MVP
**Dependencies:** FR-SUB-001, FR-SUB-004, FR-SUB-005

### FR-SUB-004 — Monthly Subscription Plan
**Requirement:** The system shall offer a monthly subscription plan where the user specifies the number of seats at subscribe time, billed at $10 per seat, charged as a single upfront payment for the total (seats × $10).
**Purpose:** Flexible paid option without annual commitment.
**Actors:** Admin, QA Manager.
**Preconditions:** None.
**Main Behaviour:** User specifies seat count; system calculates and charges seats × $10 upfront.
**Business Rules:** PD-022. All amounts in USD.
**Acceptance Criteria:** Given a seat count of N, When the monthly plan is purchased, Then the charge is N × $10, paid upfront.
**Error/Edge Conditions:** Payment failure prevents plan activation.
**Priority:** MVP
**Dependencies:** FR-SUB-006

### FR-SUB-005 — Yearly Subscription Plan
**Requirement:** The system shall offer a yearly subscription plan where the user specifies the number of seats at subscribe time, billed at $9 per seat per month, with the 12-month total (seats × $9 × 12) calculated and shown before payment, charged as a single upfront payment.
**Purpose:** Discounted rate as an incentive for annual commitment.
**Actors:** Admin, QA Manager.
**Preconditions:** None.
**Main Behaviour:** User specifies seat count; system shows and charges seats × $9 × 12 upfront.
**Business Rules:** PD-023. All amounts in USD.
**Acceptance Criteria:** Given a seat count of N, When the yearly plan is purchased, Then the total shown and charged is N × $9 × 12, paid upfront.
**Error/Edge Conditions:** Payment failure prevents plan activation.
**Priority:** MVP
**Dependencies:** FR-SUB-006

### FR-SUB-006 — Payment Confirmation Email
**Requirement:** The system shall send a confirmation email stating the plan and amount charged upon successful subscription payment (monthly or yearly).
**Purpose:** Confirms the payment succeeded and what was charged.
**Actors:** Admin, QA Manager (recipient).
**Preconditions:** A subscription payment succeeds.
**Main Behaviour:** Confirmation email sent immediately after successful payment.
**Business Rules:** PD-024. No itemized invoice/receipt beyond this email is required.
**Acceptance Criteria:** Given a successful payment, When it completes, Then a confirmation email with plan and amount is sent.
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-NOT-005

### FR-SUB-007 — Seat Limit Enforcement on Invitation
**Requirement:** The system shall block an organisation invitation that would cause the seat count to exceed the number of seats paid for (or the 3-seat trial cap), and shall show a notification directing the inviter to a page to pay for additional seats.
**Purpose:** Enforces the paid-seat model at the point of invitation.
**Actors:** Admin, QA Manager (inviter).
**Preconditions:** Inviting would exceed the current seat allowance.
**Main Behaviour:** Invitation is blocked; notification with a link to seat purchase (FR-SUB-008) is shown.
**Business Rules:** PD-025.
**Acceptance Criteria:** Given an organisation at its seat limit, When Admin/QA Manager attempts to invite another member, Then the invitation is blocked and a seat-purchase notification is shown.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-ORG-004, FR-SUB-008

### FR-SUB-008 — Proactive Seat Purchase
**Requirement:** The system shall allow Admin or QA Manager to purchase additional seats at any time, without first needing to hit the seat limit.
**Purpose:** Lets organisations plan ahead for growth.
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation has an active trial or paid subscription. Note: seat purchase beyond the trial cap requires conversion to a paid plan (FR-SUB-001).
**Main Behaviour:** Actor purchases additional seats; seat count increases immediately upon successful payment.
**Business Rules:** PD-026.
**Acceptance Criteria:** Given an active paid subscription, When Admin/QA Manager purchases additional seats proactively, Then the seat count increases without requiring a blocked invitation first.
**Error/Edge Conditions:** Attempting to add seats beyond 3 while still on trial requires converting to a paid plan first (FR-SUB-001).
**Priority:** MVP
**Dependencies:** FR-SUB-004, FR-SUB-005

### FR-SUB-009 — Seats Only Increase, No Refunds
**Requirement:** The system shall not permit seat count to be reduced, and shall not issue refunds or credits for unused seats, even if organisation members are later removed.
**Purpose:** Keeps billing logic simple for MVP.
**Actors:** N/A (system constraint).
**Preconditions:** None.
**Main Behaviour:** No seat-reduction or refund/credit action exists.
**Business Rules:** PD-028.
**Acceptance Criteria:** Given an organisation that removes members, When seat count is checked afterward, Then it remains unchanged (not reduced), and no refund/credit is issued.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-SUB-010 — Grace Period on Subscription Lapse
**Requirement:** The system shall grant a 14-day grace period of continued platform access when a paid subscription lapses (e.g., a failed renewal), during which Admin and QA Manager are notified via all available channels (in-app and email). After 14 days without resolution, the system shall block platform access until payment is resolved. This grace period shall not apply to trial expiry, where access is blocked immediately at day 14.
**Purpose:** Buffers paying customers against involuntary churn, while trial users (who haven't paid) get no such buffer.
**Actors:** Admin, QA Manager (notified); all roles (affected by eventual block).
**Preconditions:** A paid subscription lapses.
**Main Behaviour:** 14-day grace period begins on lapse; multi-channel notifications sent; access blocked if unresolved after 14 days.
**Business Rules:** PD-029.
**Acceptance Criteria:**
- Given a lapsed paid subscription, When the lapse occurs, Then Admin and QA Manager are notified in-app and by email, and access continues for 14 days.
- Given a lapsed paid subscription unresolved after 14 days, When the grace period ends, Then platform access is blocked.
- Given a trial expiring at day 14, When it expires, Then access is blocked immediately with no grace period.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-NOT-001, FR-NOT-002

### FR-SUB-011 — Staggered Renewal for Mid-Term Yearly Seat Purchases
**Requirement:** The system shall charge additional seats purchased mid-term on a yearly plan at the full yearly rate (seats × $9 × 12), and shall make those seats valid for 12 months from their own purchase date, independent of the original subscription's renewal date.
**Purpose:** Reflects that each seat batch is its own independent 12-month commitment.
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation is on an active yearly plan; additional seats purchased before the original subscription's renewal date.
**Main Behaviour:** New seat batch's 12-month term is tracked independently of the original batch's renewal date.
**Business Rules:** PD-027. Different seat batches within the same organisation can have staggered renewal dates.
**Acceptance Criteria:** Given an active yearly plan, When additional seats are purchased mid-term, Then those seats are billed at seats × $9 × 12 and renew 12 months from their own purchase date.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-SUB-005, FR-SUB-008

### FR-SUB-012 — Billing and Seat History Visibility Restricted to Admin/QA Manager **[Updated]**
**Requirement:** The system shall restrict visibility of billing and seat purchase/usage history to users holding the Admin or QA Manager role. No other role shall have read-only or any other access to this information.
**Purpose:** Keeps billing/seat data restricted to the same roles already responsible for managing subscriptions and seats (PD-047).
**Actors:** Admin, QA Manager (viewers); QA Tester and link-based roles (excluded).
**Preconditions:** Billing/seat history exists.
**Main Behaviour:** Billing/seat history view/query is only accessible to Admin and QA Manager.
**Business Rules:** PD-047.
**Acceptance Criteria:**
- Given an Admin or QA Manager, When they open billing/seat history, Then they can view it.
- Given a QA Tester or a link-based role, When they attempt to access billing/seat history, Then access is denied.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-SUB-006, FR-SUB-007, FR-SUB-008, FR-SUB-011

---

# IMP — Import/Export

### FR-IMP-001 — Bulk Import
**Requirement:** The system shall support bulk import of entities (scope: see FR-IMP-003).
**Purpose:** Reduces manual data entry for existing data.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** User uploads a data file; system creates entities from it.
**Business Rules:** Postponed to Post-MVP.
**Acceptance Criteria:** Not yet defined — Post-MVP.
**Error/Edge Conditions:** Not yet defined.
**Priority:** Post-MVP
**Dependencies:** FR-IMP-003

### FR-IMP-002 — Bulk Export
**Requirement:** The system shall support bulk export of entities (scope: see FR-IMP-003).
**Purpose:** Supports data portability.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** User exports data to a file.
**Business Rules:** Postponed to Post-MVP.
**Acceptance Criteria:** Not yet defined — Post-MVP.
**Error/Edge Conditions:** Not yet defined.
**Priority:** Post-MVP
**Dependencies:** FR-IMP-003

### FR-IMP-003 — Import/Export Entity Scope
**Requirement:** The system shall define which entity types are in scope for import/export.
**Purpose:** Bounds the import/export feature.
**Actors:** N/A (scope definition).
**Preconditions:** None.
**Main Behaviour:** N/A — scope not yet decided.
**Business Rules:** Postponed to Post-MVP; requirements import/sync specifically is covered by PD-011.
**Acceptance Criteria:** Not yet defined.
**Error/Edge Conditions:** N/A.
**Priority:** Post-MVP
**Dependencies:** None

---

## Open Requirement Questions

- What is the organisation name uniqueness policy at sign-up (FR-ORG-001) — must names be globally unique, or can duplicates exist across organisations?
- What is the session expiry/duration policy (FR-AUTH-003)?
- What is the full scope of "organisation settings" beyond membership and subscription (FR-ORG-003)?
- Can QA Tester view the organisation member list (FR-USR-006), or is that restricted to Admin/QA Manager only?
- What exact status label does a requirement-archive-cascade-cancelled test run receive, to distinguish it from a normally closed run (FR-TR-003, FR-REQ-004)?
- Is the lapse-grace-period notification (FR-SUB-010) a single notice, or does it repeat/remind across the 14 days?
- Is the staggered renewal behavior for mid-term yearly seat purchases (FR-SUB-011) acceptable as a permanent model, or should a future consolidation/alignment mechanism be considered?
- Is there any upper limit on how many seats can be purchased in a single transaction (FR-SUB-008)?
- What happens to an organisation's data/access if the trial ends and the organisation never subscribes (long-term dormant/unpaid organisations) — is there a data retention or deletion policy?
- Is there any warning shown before a trial's 3-seat cap blocks a new invitation, similar to the paid-plan seat-limit notification (FR-SUB-007)?

### Open Questions Introduced by CHANGE-001 (Organisation QA Operating Model)

- **Exact default field-by-field content of the Test Report and Regression Report starter templates** beyond the baseline established in FR-TPL-005 — deferred to a future documentation pass.
- **Exact label configuration UI/mechanism for Defect Severity display labels** (FR-DEF-007) — the capability is established; its exact configuration surface is not.
- **Whether requirement-usage policy and requirement-coverage-expectation should become separate governance toggles** beyond the minimum-coverage-percentage Quality Gate (FR-QG-001) already covering this need — considered and deliberately excluded from the MVP catalogue (FR-QAOM-010); revisit if real usage shows the gate alone is insufficient.
- **Whether a lightweight release/version identifier should be introduced in a future pass** to support multiple readiness checks per project over time (e.g., "Release 2.3 readiness" distinct from "current project readiness") — explicitly deferred; FR-QG-003 evaluates readiness at the Project level using current data only, with no Release entity introduced at MVP. Revisit only if real usage shows project-level readiness is insufficient once a project has multiple releases in flight.
- **Whether an explicit "migrate this project onto the latest QA Configuration Version" capability should be built** — explicitly out of scope for MVP per FR-QAOM-012; projects remain pinned permanently until/unless this is separately approved.

## Potential Requirement Conflicts

- **Resolved by this update:** The prior ambiguity between "pre-deployment report" and "post-deployment report" as possibly-separate deliverables (previously flagged against FR-RPT-001/002) is resolved — FR-RPT-002 now specifies a single report type with a Post-Deployment section (PD-038).
- **Resolved by this update:** The prior undefined interaction between BA/PO report approval (FR-RPT-003) and any release/workflow gating is resolved — approval/rejection is explicitly record-keeping only, with no downstream trigger (PD-039).
- **Resolved by this update:** The approval workflow was simplified (PD-048): the QA Manager approval gate is removed; test cases now follow a 3-state Draft → Approved → Needs Review model with fully self-service approval. This resolves the previously-flagged open question about a Needs Review test case in a project that disables its approval workflow, since there is no longer a per-project approval-workflow setting to disable.
- **New watch item:** FR-TC-005 (self-service approval, Needs Review) and FR-REQ-002 (requirement-edit-triggered re-review) together mean a test case's status can cycle through Approved → Needs Review → Approved multiple times over its life. No conflict identified, but reporting/traceability views should account for this cycle rather than assuming a one-way approval flow.
- **New watch item:** FR-LNK-002 (no identity verification) combined with FR-RPT-004 (BA/PO comments private to QA Tester) means a comment attributed to "BA/PO" is only as trustworthy as the link's possession — anyone with the link could leave a comment. This is consistent with the already-accepted link trade-off (PD-043) and is not treated as a new conflict, but is noted for awareness.

### Resolved by CHANGE-001 (Organisation QA Operating Model)

- **Resolved:** The apparent conflict between PD-048 (self-service test case approval, no gate) and the clarified governance principle (organisations may require approval) is resolved by FR-TC-005/FR-WF-001–004 — PD-048's behaviour is retained exactly as the No Approval default; a configured Single Approval/Review + Approval shape is additive, not a reversal.
- **Resolved:** The apparent conflict between PD-039 (report approval record-only) and the clarified governance principle (approval may gate release) is resolved by FR-RPT-003/FR-WF-005/FR-QG-001 — report approval remains non-blocking by default; only an explicitly configured Quality Gate that reads the approval record can make it consequential.
- **Resolved:** The prior absence of Priority/Severity fields (flagged in the design-system phase and the impact analysis) is resolved by FR-TC-011, FR-DEF-007, FR-DEF-008.
- **Resolved:** The prior narrow template model (`database.md` §5's "no custom-field system" position, now superseded at the product-definition layer) is resolved by module TPL; `database.md`/`schema.sql`/`api/templates.md` still describe the pre-pivot model and require their own re-baseline pass (not performed in this document).
- **New watch item:** FR-QAOM-012 (existing projects pinned, no migration at MVP) means an organisation that republishes a stricter QA Operating Model (e.g., switching from Lightweight to Controlled QA) will NOT see that stricter configuration apply to any of its existing projects — only new ones. This is a deliberate, approved trade-off (favoring historical consistency over automatic enforcement), but should be clearly communicated to the organisation at publish time to avoid surprise. No FR currently mandates this specific publish-time messaging — flagged as a UX consideration for a future user-flow pass, not a functional gap.
- **New watch item:** FR-WF-004 (execution of unapproved test cases — Allowed/Prohibited) enforces at the point of recording an execution result, not at test run creation. This means a run can be created (and its snapshot taken, FR-TC-004) containing not-yet-approved test cases even under Prohibited — the block only bites when someone tries to record a result. This is a deliberate predictable-enforcement-point choice (§3 of the task) and not a gap, but is worth confirming feels right once wireframed.
