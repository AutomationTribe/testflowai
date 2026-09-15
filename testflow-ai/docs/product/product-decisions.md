# TestFlow AI — Product Decision Log

This log records product decisions explicitly approved during product definition and refinement sessions. Each entry reflects a decision made by the product owner, not a recommendation alone.

---

## PD-001 — Organisation and Project Structure
**Decision:** TestFlow AI uses an Organisation → Projects structure. An organisation can contain multiple projects.
**Reason:** Matches the "unlimited teams/projects" goal while keeping the model approachable.
**Alternatives Considered:** Flat model; Organisation → Teams → Projects.
**Product Impact:** Organisation setup, Projects, Users/Membership, Templates, Dashboards.
**Status:** Approved

## PD-002 — User Membership Model
**Decision:** A user can belong to multiple projects.
**Reason:** Reflects real-world usage; consistent with per-project permission control.
**Alternatives Considered:** A user belongs to exactly one project only.
**Product Impact:** Users, Projects, Permissions, Invitations.
**Status:** Approved

## PD-003 — Role Assignment Scope — **SUPERSEDED BY PD-017**
**Original Decision:** Roles were assigned per project, not globally.
**Superseded Because:** TestFlow AI now uses an organisation-level role model (see PD-017). This entry is retained for historical traceability only and no longer reflects current product behaviour.
**Status:** Superseded (see PD-017)

## PD-004 — Defect Management Scope for MVP
**Decision:** Defect management in MVP is native only; external defect-tool integration is postponed.
**Reason:** Resolves a scope conflict; keeps MVP focused.
**Alternatives Considered:** Include external defect-tool integration in MVP.
**Product Impact:** Defect Management, MVP Scope, Post-MVP Scope.
**Status:** Approved

## PD-005 — Requirement-to-Test-Case Link
**Decision:** Linking a test case to a requirement is optional, not mandatory. Reporting distinguishes traced vs. untraced test cases.
**Reason:** Supports exploratory testing while preserving traceability value where links exist.
**Alternatives Considered:** Mandatory requirement link on every test case.
**Product Impact:** Test Cases, Requirements, Traceability, Reporting.
**Status:** Approved

## PD-006 — Test Case Approval Workflow — **SUPERSEDED BY PD-048**
**Original Decision:** Test case approval was configurable per project by the QA Manager. States: Draft → Pending Approval → Approved.
**Superseded Because:** The QA-Manager approval gate has been removed entirely in favor of self-service approval (see PD-048). This entry is retained for historical traceability only and no longer reflects current product behaviour.
**Status:** Superseded (see PD-048)

## PD-007 — Versioning and Approval Interaction — **SUPERSEDED BY PD-048**
**Original Decision:** If an approved test case is edited, it reverts to "Pending Approval" status, when approval is enabled.
**Superseded Because:** "Pending Approval" no longer exists as a status (see PD-048). An edited Approved test case now reverts to "Needs Review" instead, self-approved by the user when ready. This entry is retained for historical traceability only.
**Status:** Superseded (see PD-048)

## PD-008 — AI Access Model
**Decision:** TestFlow AI supports both an optional per-project AI provider key and a platform-provided AI option. Usage limits/cost model TBD.
**Reason:** Lowers the barrier to trying AI while allowing teams to use their own key.
**Alternatives Considered:** Bring-your-own-key only.
**Product Impact:** AI Test Generation, Project Setup, future Billing/Usage Limits.
**Status:** Approved

## PD-009 — Template Scope
**Decision:** Test case and test report templates are organisation-scoped, available across all projects within that organisation.
**Reason:** Avoids duplicate template creation per project without requiring a full cross-organisation library.
**Alternatives Considered:** Project-scoped templates only.
**Product Impact:** Templates, Projects, Organisation structure.
**Status:** Approved

## PD-010 — Notifications
**Decision:** TestFlow AI includes both in-app and email notifications for key events, as part of MVP scope.
**Reason:** Core workflows depend on timely handoffs between roles.
**Alternatives Considered:** No notifications in MVP; in-app only.
**Product Impact:** Notifications, Approvals, Defect Management, Invitations.
**Status:** Approved *(refined by PD-018 for link-based roles — see below)*

## PD-011 — Requirements Import/Sync Timing
**Decision:** Requirements import/sync from external tools is postponed to Post-MVP. MVP supports native requirement authoring only.
**Reason:** Keeps MVP scope focused on the core native workflow.
**Alternatives Considered:** Include import/sync in MVP.
**Product Impact:** Requirements Management, MVP Scope, Post-MVP Scope.
**Status:** Approved

## PD-012 — Test Plan Timing
**Decision:** The "test plan" concept, distinct from a test run, is postponed to Post-MVP.
**Reason:** Suites and runs are sufficient for MVP; avoids unnecessary planning-layer complexity.
**Alternatives Considered:** Include test plan as a distinct entity in MVP.
**Product Impact:** Test Execution, Test Runs, MVP Scope, Post-MVP Scope.
**Status:** Approved

## PD-013 — Admin Role Scope
**Decision:** The Admin role is scoped per organisation, not system-wide.
**Reason:** Aligns with the Organisation → Projects structure (PD-001).
**Alternatives Considered:** System-wide Admin; both system-wide and per-organisation Admin.
**Product Impact:** Users, Roles, Permissions, Organisation structure.
**Status:** Approved

---

## PD-014 — Project Creation and Visibility Model

**Decision:** Projects can be created, updated, and archived by Admin, QA Manager, or QA Tester. QA Managers and Admins can view all projects within their organisation. QA Testers can only view projects they created or were explicitly added to.

**Reason:** Empowers QA Testers to initiate their own work directly, while preserving oversight visibility for QA Managers and Admins across the organisation, and keeping QA Testers focused on projects relevant to them.

**Alternatives Considered:**
- Restrict project creation to QA Manager/Admin only.
- Give all roles full organisation-wide project visibility regardless of involvement.

**Product Impact:** Projects, User Visibility, Permissions.

**Status:** Approved

---

## PD-015 — Requirement Authoring Ownership

**Decision:** Requirements are authored by QA Tester, QA Manager, or Admin — typically entered from an external source such as a Jira ticket, or wherever the requirement originates. Business Analysts/Product Owners do not author requirements. Their role is to review test results and review/approve test reports.

**Reason:** Reflects the actual intended workflow: QA captures the requirement (from whatever source it originates) as the basis for test case creation; BA/PO's role is oversight and sign-off, not authorship.

**Alternatives Considered:** BA/PO authors requirements natively (original approved model, now replaced).

**Product Impact:** Requirements Management, User Roles, Workflows.

**Status:** Approved

---

## PD-016 — Requirement Archive Cascade

**Decision:** Archiving a requirement automatically archives all test cases and test reports associated with that requirement.

**Reason:** Keeps traceability consistent — a requirement no longer in active use shouldn't leave "orphaned" active test cases or reports still appearing as current work.

**Alternatives Considered:** Archive the requirement only, leaving linked test cases/reports active and independently managed.

**Product Impact:** Requirements Management, Test Cases, Reports, Traceability.

**Status:** Approved

---

## PD-017 — Organisation-Level Role Model (Supersedes PD-003)

**Decision:** Roles for Admin, QA Manager, and QA Tester are assigned at the organisation level, not per project. Invitation to the organisation happens once, with a role (Admin, QA Manager, or QA Tester) set at that time by the inviting QA Manager or Admin. A user's organisation-level role determines their capabilities on every project they are given access to. "Adding a user to a project" is now an access grant, not a separate role assignment — the added user's existing organisation role governs what they can do there. Only a QA Tester who creates a project, along with QA Managers and Admins, can see a project by default; QA Testers see only projects they created or were added to.

**Reason:** Simplifies team management — a person's role is consistent across the organisation, and adding someone to a project is just about granting access to relevant work, not re-deciding their permissions each time. Matches the real-world mental model described: invite once at the organisation, grant project access as needed.

**Alternatives Considered:** Retain per-project role assignment (original PD-003); hybrid model with an organisation default role that can be overridden per project.

**Product Impact:** Users, Roles, Permissions, Projects, Invitations. **This decision supersedes PD-003.**

**Status:** Approved

---

## PD-018 — Link-Based Access for Non-Member Roles

**Decision:** Business Analyst/Product Owner, Developer, and Stakeholder are not organisation members and do not have accounts. They are granted access to perform specific actions (e.g., approving a test case or report, updating defect status, viewing a dashboard) via a temporary, expiring link shared with them by a QA Tester, QA Manager, or Admin. The link scopes them to only the action(s) defined for their assigned role at the time of sharing.

**Reason:** Keeps external stakeholder participation lightweight — these roles need to perform a small number of specific actions without the overhead of full organisation membership, invitation, and login.

**Alternatives Considered:** Require BA/PO, Developer, and Stakeholder to be full organisation members with accounts and logins, like Admin/QA Manager/QA Tester.

**Product Impact:** User Roles, Notifications, Defect Management, Reporting, Dashboards, Audit/History.

**Status:** Approved

---

## PD-019 — Public Sign-Up Flow and Role Restriction

**Decision:** TestFlow AI has a public sign-up form for brand-new customers, distinct from the existing organisation-level invitation flow. Only Admin or QA Manager may be selected as the role at sign-up — QA Tester is not a sign-up option. At sign-up, the user specifies the name of a new organisation, which is created and tied to them. On successful sign-up, a confirmation email is sent to the user, and the user is redirected to the subscription page. QA Tester (via organisation invitation) and the link-based roles — Business Analyst/Product Owner, Developer, Stakeholder (via temporary access links) — can only be added once the organisation already exists.

**Reason:** Sign-up creates both a new organisation and its first user, who must have organisation-management capability (invite users, configure settings, manage billing) to bootstrap the organisation. QA Tester and link-based roles are only meaningful once an organisation and its projects already exist.

**Alternatives Considered:** None discussed.

**Product Impact:** Sign-Up, Onboarding, User Roles, Organisation & Project Management, Notifications, Subscription & Billing.

**Status:** Approved

---

## PD-020 — Mandatory Subscription for Platform Access

**Decision:** A user/organisation cannot access any platform functionality (projects, organisation features, etc.) without an active trial or active paid subscription. This blocking applies immediately after sign-up and persists until a trial or paid plan is active.

**Reason:** Ensures billing enforcement applies uniformly from the very first session, with no unpaid/untrialed usage window.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing, Access Control, Onboarding.

**Status:** Approved

---

## PD-021 — Trial Plan

**Decision:** New organisations may start a 14-day trial requiring no payment, capped at a maximum of 3 seats. The trial is one-time only per organisation — once activated, it cannot be selected again, whether it expired or was converted to a paid plan. To exceed 3 seats or continue past 14 days, the organisation must convert to a paid plan (monthly or yearly); there is no seat top-up or extension option while remaining on trial.

**Reason:** Gives new organisations a no-risk evaluation period while preventing repeated trial abuse and keeping the trial tier simple (no partial upgrades within trial).

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing, Seat Management, Onboarding.

**Status:** Approved

---

## PD-022 — Monthly Subscription Plan

**Decision:** On the monthly plan, the user specifies the number of seats at the time of subscribing. Billing is $10 per seat, charged as a single upfront payment for the total (seats × $10). All amounts are in US dollars.

**Reason:** Provides a straightforward, flexible paid option for organisations not ready to commit annually.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing.

**Status:** Approved

---

## PD-023 — Yearly Subscription Plan

**Decision:** On the yearly plan, the user specifies the number of seats at the time of subscribing. Billing is $9 per seat per month; the total for 12 months (seats × $9 × 12) is calculated and shown to the user before payment, and charged as a single upfront payment. All amounts are in US dollars.

**Reason:** Offers a discounted rate as an incentive for annual commitment, paid upfront to simplify billing.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing.

**Status:** Approved

---

## PD-024 — Payment Confirmation Notification

**Decision:** On successful subscription payment (monthly or yearly), a confirmation email is sent to the user stating the plan and amount charged. No itemized invoice/receipt beyond this confirmation email is required.

**Reason:** Keeps payment confirmation simple and consistent with MVP scope, without building a full invoicing system.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing, Notifications.

**Status:** Approved

---

## PD-025 — Seat Limit Enforcement on Invitation

**Decision:** Seats can never exceed the number paid for (or the 3-seat trial cap). If inviting a new user would exceed the current seat count, the invitation is blocked and a notification is shown directing the inviter to a page to pay for additional seats. Only Admin and QA Manager can manage/complete subscription payments and seat purchases.

**Reason:** Enforces the paid-seat model at the point of invitation while giving the inviter a clear, immediate path to resolve the block.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing, Invitations, User Roles.

**Status:** Approved

---

## PD-026 — Proactive Seat Purchase

**Decision:** Users (Admin or QA Manager) can purchase additional seats at any time, without first needing to hit the seat limit.

**Reason:** Lets organisations plan ahead for growth (e.g., onboarding a batch of new members) instead of being forced through a blocked-invitation flow every time.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing, Seat Management.

**Status:** Approved

---

## PD-027 — Staggered Renewal for Mid-Term Yearly Seat Purchases

**Decision:** Additional seats purchased mid-term on a yearly plan are charged the full yearly rate (seats × $9 × 12) and are valid for 12 months starting from their own purchase date, independent of the original subscription's renewal date. This means different seat batches within the same organisation can have staggered renewal dates.

**Reason:** Reflects that each seat batch purchased is treated as its own independent 12-month commitment.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing, Seat Management.

**Status:** Approved

---

## PD-028 — Seats Only Increase, No Refunds

**Decision:** Seat count can never be reduced. No refunds or credits are issued for unused seats, even if organisation members are later removed.

**Reason:** Keeps seat/billing logic simple for MVP — seat count is monotonically increasing with no proration or credit tracking required.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing, Seat Management.

**Status:** Approved

---

## PD-029 — Grace Period on Subscription Lapse

**Decision:** If a paid subscription lapses (e.g., a failed renewal), the organisation gets a 14-day grace period of continued platform access. During the grace period, Admin and QA Manager are notified via all available channels (in-app and email) of the lapse and the need to resolve payment. After 14 days without resolution, platform access is blocked until payment is resolved. This grace period does not apply to trial expiry — trial access is blocked immediately at day 14, with no separate grace period.

**Reason:** Gives paying customers a buffer against involuntary churn (e.g., an expired card) that trial users, who have not paid, don't need.

**Alternatives Considered:** None discussed.

**Product Impact:** Subscription & Billing, Notifications, Access Control.

**Status:** Approved

---

## PD-030 — Minimum One Admin Enforcement

**Decision:** An organisation must always have at least one Admin. The last remaining Admin cannot be removed from the organisation, and cannot have their role changed away from Admin.

**Reason:** Prevents an organisation from being left with no one able to perform Admin-level actions (managing settings, roles, billing).

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** User Roles, Permissions, Organisation Management.

**Status:** Approved

---

## PD-031 — Role Change Restricted to Admin

**Decision:** Only Admin can change another organisation member's role. QA Manager cannot change another member's role.

**Reason:** Role assignment is a sensitive, organisation-wide permission change; keeping it exclusive to Admin avoids QA Managers being able to alter the org's permission structure, including potentially elevating themselves or others.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** User Roles, Permissions.

**Status:** Approved

---

## PD-032 — Removed Project Creator Access Handling

**Decision:** When a project's creator is removed from the project, or loses organisation access, Admin and QA Manager retain their existing access to that project. Only the removed creator loses access.

**Reason:** The creator leaving shouldn't disrupt other members' or Admin's/QA Manager's standing access to a project they're already working in.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Projects, User Roles, Permissions.

**Status:** Approved

---

## PD-033 — Editing a Linked Requirement Triggers Re-Review

**Decision:** If a requirement is edited after test cases linked to it have already been approved, those approved linked test cases are triggered for re-review — their status reverts to "Needs Review," requiring re-approval by any user with edit access (self-service — see PD-048, which superseded the original QA-Manager/no-workflow re-approval mechanism referenced here at the time this decision was made).

**Reason:** A changed requirement can invalidate the basis on which a test case was previously approved; automatic re-review prevents stale approvals from persisting silently.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Requirements Management, Test Cases, Approvals, Traceability.

**Status:** Approved

---

## PD-034 — Requirement Archive Cascade to Active Test Run

**Decision:** If archiving a requirement cascades to a test case that is currently part of an active, unclosed test run, that test run is cancelled and archived, along with the requirement and its associated test cases and reports. This extends the existing cascade-archive rule (PD-016).

**Reason:** Leaves no orphaned, active test run referencing a requirement/test case that has just been archived out from under it.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Requirements Management, Test Execution, Test Runs, Traceability.

**Status:** Approved

---

## PD-035 — QA Manager Rejection Moves Test Case to "Needs Review" — **SUPERSEDED BY PD-048**

**Original Decision:** When a QA Manager rejects a test case that is in "Pending Approval" status, its status changes to a new state called "Needs Review" (not back to Draft). The test case author addresses feedback and resubmits, moving it back to Pending Approval.

**Superseded Because:** There is no longer a QA Manager rejection action, since the approval gate itself has been removed (see PD-048). The "Needs Review" status is retained, but is now reached only via editing an Approved test case or via the requirement-edit re-review trigger (PD-033) — never via a formal reviewer rejection.

**Status:** Superseded (see PD-048)

---

## PD-036 — Self-Approval When No Approval Step Is Configured — **SUPERSEDED BY PD-048**

**Original Decision:** If a project's QA workflow does not have approval enabled, the test case's creator can directly set its status to "Approved" themselves, since there is no QA Manager approval gate in that project's configured workflow.

**Superseded Because:** Self-approval is no longer conditional on a per-project workflow setting — it is now the only approval mechanism, for every project, unconditionally (see PD-048).

**Status:** Superseded (see PD-048)

---

## PD-037 — Execution Results Immutable After Run Closure

**Decision:** Execution results cannot be edited once a test run is closed. This is a hard rule with no exception — closure is final for recorded results.

**Reason:** Preserves the integrity of historical execution records once a run is finalized.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Test Execution, Test Runs.

**Status:** Approved

---

## PD-038 — Single Report Type with a Post-Deployment Section

**Decision:** There is only one report type (not two separate ones). This single report includes a "Post-Deployment" section, which specifically covers testing performed in production.

**Reason:** Simplifies the reporting model to a single artifact whose scope can span pre- and post-deployment testing activity, rather than maintaining two distinct report types.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Reporting & Dashboards.

**Status:** Approved

**Note:** This decision supersedes any earlier language treating "pre-deployment report" and "post-deployment report" as two distinct report types — they are sections/scope within one report.

---

## PD-039 — Report Approval Is Record-Keeping Only — **GENERALIZED BY PD-050**

**Decision:** A BA/PO approving or rejecting a report via their access link is a record-keeping action only. It does not trigger, gate, or block any other action or workflow in the system.

**Reason:** Keeps report review decoupled from release or workflow gating logic that hasn't been separately approved.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Reporting & Dashboards, Link-Based Access.

**Current Status Note (Organisation QA Operating Model pivot):** This decision's *default* behaviour is retained exactly as written — report approval still does not, by itself, trigger, gate, or block anything. What changes is that "workflow gating logic" is no longer categorically unapproved: an organisation may now configure a **Quality Gate** (a separate concept from document workflow, PD-050) that reads this approval record as one of its input conditions (e.g., "Release Ready requires an approved Test Report"). The gate — not report approval itself — becomes the blocking mechanism, so this decision's core principle (approval ≠ automatic gate) is preserved, not reversed.

**Status:** Generalized — record-only default retained; gate-dependency layer added by PD-050 (see below)

---

## PD-040 — BA/PO Report Feedback via Private Comments

**Decision:** A Business Analyst/Product Owner accessing a report via a link can leave comments on it. These comments are visible only to the QA Tester (not to other roles), and are NOT included in the report itself — they are a separate, private feedback channel between BA/PO and QA Tester.

**Reason:** Gives BA/PO a way to give informal feedback to the QA Tester without polluting the formal report content or exposing commentary to other roles.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Reporting & Dashboards, Link-Based Access.

**Status:** Approved

---

## PD-041 — Audit History Visibility Restricted to QA Manager and Admin

**Decision:** Only QA Manager and Admin can view audit history. Other roles (QA Tester, and link-based roles) cannot.

**Reason:** Audit history includes sensitive actions (e.g., role changes, removals); restricting visibility keeps it aligned with the roles responsible for organisation/project oversight.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Audit/History, Permissions.

**Status:** Approved

---

## PD-042 — Configurable Link Expiry with 24-Hour Default

**Decision:** Temporary access links (for BA/PO, Developer, Stakeholder) have a configurable expiry duration, with a default of 24 hours if not otherwise specified.

**Reason:** Balances usability (a sensible default) with flexibility (adjustable for cases needing a longer or shorter window).

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Link-Based Access.

**Status:** Approved

---

## PD-043 — No Formal Identity Verification for Link Recipients

**Decision:** There is no formal identity verification for link recipients. The link itself is the sole credential — anyone with the link URL can perform the scoped action.

**Reason:** Consistent with the lightweight, no-account access model already approved (PD-018), mitigated by expiry (default 24h, PD-042) and revocability.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Link-Based Access, Security.

**Status:** Approved

---

## PD-044 — Named or Generic Link Recipient

**Decision:** A link can be either targeted to a named recipient OR generic (no named recipient specified) — both are supported.

**Reason:** Covers both the case of a link addressed to a specific known person and a link meant for whoever needs it (e.g., a generic Stakeholder viewing link).

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Link-Based Access.

**Status:** Approved

---

## PD-045 — Multi-Use Links

**Decision:** A link can be used multiple times (by whoever has it) until it expires or is revoked. It is not single-use.

**Reason:** Matches the accepted lightweight access model, where the link (not a per-use token) is the credential.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Link-Based Access.

**Status:** Approved

---

## PD-046 — Links Can Be Freely Shared

**Decision:** A link can be freely copied and shared by whoever holds it. There is no mechanism preventing this.

**Reason:** A direct consequence of the no-identity-verification (PD-043) and multi-use (PD-045) decisions — since the link is the sole, reusable credential, its holder can pass it on freely.

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Link-Based Access, Security.

**Status:** Approved

---

## PD-047 — Billing and Seat History Visibility Restricted to Admin and QA Manager

**Decision:** Only Admin and QA Manager can view billing and seat history. No other role has read-only access to this information.

**Reason:** Keeps billing/seat visibility aligned with the same roles who already manage subscriptions/seats (PD-025).

**Alternatives Considered:** Not explicitly discussed.

**Product Impact:** Subscription & Billing, Permissions.

**Status:** Approved

---

## PD-048 — Test Case Approval Simplified: No QA Manager Gate, Self-Service Approval Only (Supersedes PD-006, PD-007, PD-035, PD-036) — **GENERALIZED BY PD-049**

**Decision:** The QA Manager approval gate for test cases is removed entirely. Any user with edit access to a test case (QA Tester, QA Manager, or Admin) can set its status directly to "Approved" at any time, regardless of any per-project workflow setting — there is no separate submission/review/reject cycle. The test case status model is simplified to three states: **Draft → Approved → Needs Review**. Editing an Approved test case (directly, or via the requirement-edit re-review trigger, PD-033) reverts it to Needs Review; the user reviews and re-approves it themselves when ready. "Pending Approval" no longer exists as a status, and there is no QA Manager rejection action. QA Manager commenting on a test case (PD-006's original commenting capability) is retained as optional feedback, not a gate.

**Reason:** Simplifies the product's approval model — a formal QA-Manager-gated review cycle was found to add process overhead without a corresponding approved need for it as a mandatory control; self-service approval covers the same underlying goal (a clear signal that a test case is ready) with much less workflow complexity.

**Alternatives Considered:** Keep the QA-Manager-gated workflow as configurable per project (original PD-006 model, now replaced). Keep a four-state model with Pending Approval retained but no reviewer role (considered and rejected as an unnecessary intermediate state once there is no reviewer to pend for).

**Product Impact:** Test Cases, Approvals, QA Workflow Configuration (the per-project `approval_workflow_enabled` setting is removed), User Roles (QA Manager's role description no longer includes approving test cases), Requirements (PD-033's re-review trigger is unaffected — it still reverts an Approved test case to Needs Review). **This decision supersedes PD-006, PD-007, PD-035, and PD-036.**

**Current Status Note (Organisation QA Operating Model pivot):** This decision's *behaviour* is retained exactly as written and is now the **Standard QA / default workflow shape ("No Approval")** under the Organisation QA Operating Model (see PD-049). It is no longer stated as the *only* behaviour every organisation must use — an organisation may configure a stronger workflow shape (Single Approval or Review + Approval) instead. The clause "regardless of any per-project workflow setting" is superseded: workflow setting now determines whether this self-service behaviour applies. Historical record preserved above unchanged; PD-049 is the current governing decision for approval configurability.

**Status:** Generalized — self-service behaviour retained as the default; configurability layer added by PD-049 (see below)

---

# Organisation QA Operating Model — Approved Product Pivot (PD-049 through PD-063)

**Context:** The following decisions formalize the approved Organization QA Operating Model pivot (see `docs/product/requirements-change-log.md` for the full pivot record, and the prior read-only impact analysis for the reasoning/options behind each). Core principle: *"Organizations should be able to define and govern their QA operating model within TestFlow while TestFlow retains stable system semantics required for core test-management functionality."* These decisions are product-definition-layer only — none of them yet change Functional Requirements, database, API, architecture, user flows, or design documentation; each defers exact specification to a future Functional Requirements pass, as noted.

## PD-049 — Configurable Test Case Approval; Self-Service Remains the Default (ORG-QA-DEC-001; Generalizes PD-048)

**Decision:** Organisations may configure test case approval behaviour as part of their QA Operating Model, chosen from the bounded workflow shapes established in PD-052. The previous self-service-only behaviour (PD-048: Draft → Approved → Needs Review, any editor may approve) remains available and is the **default/lightweight ("No Approval") shape** — it is not removed. Organisations may instead opt into Single Approval or Review + Approval for test cases.

**Reason:** The impact analysis identified a direct conflict between the newly clarified governance principle (organisations should be able to require test case approval) and the recently-approved PD-048 (which removed approval gating entirely). Resolving in favour of "PD-048 as default, configurable stronger option available" preserves the deliberate recent simplification for organisations who want it, while enabling the governance capability for organisations who need it.

**Alternatives Considered:** Fully reopen PD-048 and make approval-gating unconditionally configurable with no special-cased default (rejected — would silently discard a recent, deliberate product simplification without preserving it as an option). Leave PD-048 completely unconfigurable and reject the governance requirement (rejected — conflicts with the approved core principle).

**Product Impact:** Test Cases, QA Operating Model, Product Decisions (annotates PD-048).

**Status:** Approved

---

## PD-050 — Document Workflow and Quality Gates Are Separate Concerns (ORG-QA-DEC-002; Generalizes PD-039)

**Decision:** Document/record workflow (a document's lifecycle/approval state) and Quality Gates (organisation-configured conditions for release/readiness) are formally separate product concepts. A document's approval, by itself, never automatically blocks or triggers another action. An organisation may configure a Quality Gate that depends on a document's workflow state (e.g., "Release Ready requires an approved Test Report") — the gate evaluator reads that state; the document workflow itself remains non-blocking by default. This preserves PD-039's record-only default for report approval while allowing gate-dependent behaviour where an organisation explicitly configures it.

**Reason:** Prevents the governance principle from silently reversing PD-039 (which deliberately decoupled report approval from any blocking behaviour), while still enabling the real governance value described in the clarified model (organisations that want approval to matter for release readiness can configure that, explicitly, via a gate).

**Alternatives Considered:** Make report/document approval itself capable of blocking downstream actions directly (rejected — conflates two concerns and reverses PD-039 without an explicit, scoped mechanism).

**Product Impact:** Reporting & Dashboards, Quality Gates (new capability), Product Decisions (annotates PD-039).

**Status:** Approved

---

## PD-051 — First-Class System Entities vs. Built-In Configurable QA Documents (ORG-QA-DEC-003)

**Decision:** Requirement, Test Case, Test Suite, Test Run, Execution Result, and Defect remain TestFlow-controlled, first-class system entities — not generic/configurable document types. Their core relationships and execution/traceability/versioning behaviour remain platform-controlled; their content may include organisation-configurable fields where TestFlow permits (see PD-054). Test Report and Regression Report are approved as **built-in configurable QA document types** — organisations configure their templates, but the document types themselves are TestFlow-defined, not user-created. Arbitrary organisation-defined custom document types (e.g., Performance/Security/UAT Test Report, Release QA Sign-off, Checklist) are deferred as future expansion only and are not an MVP commitment.

**Reason:** Preserves the execution/traceability/historical-integrity guarantees that depend on these six entities' specific, non-generic shape, while giving organisations real document-configurability where it doesn't threaten that integrity. Avoids the "generic form builder" trap explicitly flagged as a risk in the impact analysis.

**Alternatives Considered:** Make every entity, including Test Case/Test Run/Defect, a configurable document type (rejected — would threaten NFR-DI-001-class historical-accuracy guarantees and the versioning/snapshot model). Support arbitrary custom document types at MVP (rejected — unbounded scope, no approved requirement calls for it yet).

**Product Impact:** Requirements, Test Cases, Test Suites, Test Runs, Execution Results, Defects, Reporting, QA Operating Model.

**Status:** Approved

---

## PD-052 — Bounded Workflow Shapes, Not a Generic Workflow/BPM Engine (ORG-QA-DEC-004)

**Decision:** MVP document-workflow configurability is limited to a small, fixed set of parameterized workflow shapes: **No Approval, Single Approval, Review + Approval**. Exact states, transition rules, and approver-role assignment per shape are deferred to Functional Requirements. A generic, arbitrary state-machine/workflow builder is explicitly out of scope for MVP.

**Reason:** Delivers the governance value organisations need (the ability to require review/approval) without building a general-purpose BPM engine — directly following the impact analysis's recommendation and the explicit instruction to avoid that complexity trap.

**Alternatives Considered:** Fully generic, arbitrary workflow builder (rejected for MVP — unjustified complexity, open-ended scope, high implementation/maintenance risk).

**Product Impact:** QA Operating Model, Test Cases, Reporting (Test Report/Regression Report workflow).

**Status:** Approved

---

## PD-053 — Structured Template Field Model (ORG-QA-DEC-005)

**Decision:** The Template System (see PD-009's org-scoping, generalized here) supports a structured, field-level document schema — not merely a pre-population blob. Organisations may add/remove configurable fields, rename configurable/display labels, reorder fields, configure field options, and configure required/optional behaviour and validation, within a bounded field-type palette. Advanced capabilities — calculated fields and field-level edit permissions — are explicitly deferred, not MVP. Exact field types/properties are deferred to Functional Requirements.

**Reason:** The previous template model (`database.md` §5, `templates.md`) was found materially insufficient for the clarified governance principle. A bounded field model delivers real configurability without the complexity of calculated fields or per-field permission graphs, which the impact analysis flagged as disproportionate for MVP.

**Alternatives Considered:** Full field palette including calculated fields and field-level edit permissions at MVP (rejected — deferred as future expansion, real but uncertain value against real complexity).

**Product Impact:** Template Management (generalized), Test Cases, Reporting, AI Test Generation.

**Status:** Approved

---

## PD-054 — Protected System Fields vs. Configurable Fields — Formal Boundary (ORG-QA-DEC-006)

**Decision:** TestFlow owns and protects fields required for record identity, tenant ownership, project relationships, execution semantics, traceability, versioning, audit/history, and platform integrity. Organisations cannot remove or redefine the underlying semantics of these fields. All other fields — business-content fields, and any field TestFlow explicitly exposes as configurable — are organisation-configurable. The Template System (PD-053) must clearly distinguish protected/system fields from configurable fields wherever templates are authored.

**Reason:** Establishes the conceptual boundary the clarified model requires, protecting the platform guarantees (execution, traceability, versioning, audit) that the rest of the product depends on, while giving organisations genuine control over the rest.

**Alternatives Considered:** Not explicitly discussed as an alternative — this boundary is foundational to the approved core principle and has no reasonable alternative within it.

**Product Impact:** Template Management, Database integrity (future re-baseline), Audit/History, all first-class system entities.

**Status:** Approved

---

## PD-055 — Defect Severity vs. Priority Model (ORG-QA-DEC-007)

**Decision:** Defect Severity carries stable, TestFlow-controlled semantic levels — **Critical, High, Medium, Low** — so that reporting and Quality Gates can reason consistently across organisations. Organisations may configure the *display label* mapped to each semantic level (e.g., Critical → "S1 Showstopper") but cannot destroy or redefine the underlying semantic mapping where it's used by system functionality (e.g., a gate condition keyed to "no unresolved Critical defects"). Defect Priority and Test Case Priority are organisation-configurable fields, with no TestFlow-mandated semantic mapping. Priority and Severity are explicitly not treated as equivalent concepts.

**Reason:** Closes a gap flagged twice previously (design-system phase, impact analysis) — neither field existed at all in the approved schema. The Severity/Priority split reflects that release-readiness logic needs a stable axis to reason about (Severity), while triage ordering is legitimately organisation-specific (Priority).

**Alternatives Considered:** Treat Priority and Severity as one field (rejected — explicitly against the clarified model's instruction and conflates two different concerns). Make Severity fully organisation-configurable with no stable semantics (rejected — would break Quality Gate conditions that need to reason about severity consistently).

**Product Impact:** Defects, Test Cases, Reporting, Quality Gates, Template Management.

**Status:** Approved

---

## PD-056 — Project Policy Inheritance and Bounded Overrides (ORG-QA-DEC-008)

**Decision:** Projects inherit the organisation's published QA Operating Model by default. Project-level overrides are not automatically allowed — the organisation determines which settings are overridable at all. Where override is permitted: only authorized roles may exercise it, the override is explicit (never implicit/silent), it is audited, and the project's effective configuration must remain identifiable at all times. The organisation may also lock a setting to forbid override entirely. The MVP override surface is intentionally kept limited (a small number of policy toggles, not every setting).

**Reason:** Gives organisations real flexibility for legitimate project-level variation (e.g., a higher-risk project needing a stricter gate) without the complexity and audit burden of unlimited, ungoverned overrides.

**Alternatives Considered:** Unlimited, unaudited project overrides (rejected — explicitly named as a risk to avoid in the impact analysis and clarified prompt). No overrides permitted at all (rejected — too rigid for real organisational variation, e.g., across project risk levels).

**Product Impact:** Project Management, QA Operating Model, Audit/History, Permissions.

**Status:** Approved

**Terminology clarification (CHANGE-001 product-model refinement, no behavior change):** this decision already expresses the approved model exactly — a Project does not own an independent QA process. State it precisely as **inheritance with explicit exceptions**: a Project inherits a specific published Organisation QA Operating Model version (PD-057/PD-063); "override" here means a **Project Exception** — an explicit, bounded, permission-controlled, audited deviation from that inherited version, never a second, independently-governed configuration. The **Effective Project QA Process** is always resolved as *inherited Organisation QA Process + permitted Project Exceptions*, never described as the project "having its own QA process." This annotation does not change PD-056's decision, MVP override surface, or any approved behavior — it fixes terminology drift risk across FR/API/architecture/user-flow documents.

---

## PD-057 — Immutable Published Configuration Versions (ORG-QA-DEC-009)

**Decision:** Published QA configuration — templates, workflows, organisation QA policy, project-effective configuration, and quality gates — is versioned and immutable once published. Changes are prepared separately (as a draft) and published as a new version; the previous version is never mutated in place. Existing documents retain the configuration/template version applicable when they were created and remain historically interpretable against it, regardless of later publishes. New projects/documents use the currently applicable published configuration per the inheritance rules (PD-056). Automatic migration of historical documents onto a newer version is explicitly not built.

**Reason:** Protects historical reporting and audit integrity — directly analogous to, and reusing the proven precedent of, the existing Test Case Version / Test Run Snapshot model (NFR-DI-001) that already guarantees this kind of historical accuracy elsewhere in the product.

**Alternatives Considered:** Allow published templates/workflows to mutate in place, retroactively affecting existing documents (rejected — explicitly named as a must-not-promise in the clarified model; would silently corrupt historical reporting/auditability).

**Product Impact:** Template Management, QA Operating Model, Reporting, Audit/History, Database (future re-baseline).

**Status:** Approved

---

## PD-058 — Bounded Quality Gate Catalogue, Not an Open-Ended Rules Engine (ORG-QA-DEC-010)

**Decision:** Quality Gates are approved as a TestFlow capability for MVP, built from a bounded, TestFlow-understood catalogue of gate conditions (e.g., required QA artifacts completed, required approvals completed, minimum requirement coverage achieved, required regression activity completed, no unresolved Critical defects, no unresolved release-blocking defects). Organisations choose/configure which supported conditions apply; they cannot compose arbitrary new conditions or logic. The exact gate catalogue and calculation rules are deferred to Functional Requirements. A generic, open-ended rules language/engine is explicitly out of scope for MVP.

**Reason:** Delivers the release-readiness governance value described in the clarified model — likely the single highest-leverage new capability — without the complexity, performance risk, and maintenance burden of a general rules engine.

**Alternatives Considered:** Open-ended, organisation-composable rule logic (rejected for MVP — explicitly named as a risk/trap to avoid).

**Product Impact:** Reporting & Dashboards, QA Operating Model, Test Reports, Defects, Requirements/Traceability.

**Status:** Approved

---

## PD-059 — Existing Role Model Retained; Permission Checkpoints, Not Custom Roles (ORG-QA-DEC-011)

**Decision:** The existing three-role organisation model (Admin, QA Manager, QA Tester) is retained as the basis for QA-configuration authority. Fully custom/configurable roles and permissions remain a Non-Goal (PRD §4), unaffected by this pivot. Instead, explicit permission checkpoints are layered onto the existing roles for configuration/governance actions — e.g., configure QA process, draft templates, publish configuration/templates, configure policies, approve documents, perform a permitted project override. Exact role-to-permission mappings are deferred to Functional Requirements.

**Reason:** Delivers the governance-permission granularity the clarified model requires without reopening the fully-custom-roles Non-Goal, which the impact analysis confirmed remains sound and low-risk to preserve.

**Alternatives Considered:** Reopen fully custom/configurable roles and permissions to support this (rejected — explicitly instructed not to, and unjustified complexity relative to the fixed-role-plus-checkpoints approach).

**Product Impact:** User Roles, Permissions, QA Operating Model, Template Management.

**Status:** Approved

---

## PD-060 — AI Generation Must Be Configuration-Aware (ORG-QA-DEC-012)

**Decision:** AI-generated test cases must be generated against the organisation's applicable published Test Case template and validated against it (required fields, allowed field structure, configured options, organisation terminology) before being offered for the existing mandatory human-review/save step (NFR-AI-004, unchanged). AI must not bypass workflow, permissions, or governance. This principle is intended to extend to future AI-generated configurable QA documents where that capability is separately approved, but that extension is not itself an MVP commitment here.

**Reason:** Without this, AI generation would produce output inconsistent with an organisation's configured document structure, undermining the entire Template System. Extends, rather than replaces, the existing AI-review safeguards (NFR-AI-004, CLAUDE.md rules 13/16).

**Alternatives Considered:** Keep AI generation producing a single fixed structure regardless of organisation template (rejected — directly contradicts the approved core principle and would produce output inconsistent with the organisation's configured document, requiring manual restructuring on every generation).

**Product Impact:** AI Test Generation, Template Management, Test Cases.

**Status:** Approved

---

## PD-061 — Organisation QA Setup Is Conceptually Mandatory but Instantly Satisfiable via Preset (ORG-QA-DEC-013)

**Decision:** Every organisation must have a published QA Operating Model — Organisation QA Setup is conceptually mandatory as an onboarding step (Sign Up → Subscribe → Create Organisation → **Organisation QA Setup** → Create/Operate Projects). However, manual configuration is not mandatory: selecting a TestFlow-provided starting preset (Standard QA — recommended default, Lightweight QA, Controlled QA, or Custom Setup) satisfies Organisation QA Setup immediately. Onboarding must not require a lengthy configuration wizard before first value.

**Reason:** Balances the governance principle (every organisation operates under *some* published QA Operating Model, never an undefined one) against the product's existing bias toward fast time-to-first-project, which a mandatory manual wizard would directly undermine.

**Alternatives Considered:** Fully mandatory manual configuration before any project work (rejected — high onboarding friction, contrary to existing fast-activation product bias). Fully optional/deferred setup with no default in effect (rejected — leaves organisations with an undefined QA Operating Model, contrary to the governance principle).

**Product Impact:** Onboarding, Organisation Setup, QA Operating Model.

**Status:** Approved

---

## PD-062 — Standard QA Preset Is Grounded in Existing Approved Behaviour Where Compatible (ORG-QA-DEC-014)

**Decision:** The Standard QA preset's conceptual foundation is the currently approved TestFlow default behaviour (self-service test case approval per PD-048/PD-049, record-only report approval per PD-039/PD-050, single Test Report with Post-Deployment section per PD-038, existing project/role/link model), carried forward wherever it remains compatible with the newly approved model. Where an existing decision conflicts with the new model (e.g., PD-048's "regardless of any workflow setting" clause), the preset reflects the *generalized*, current decision, not the original unconditional wording. The exact full contents of Standard QA, Lightweight QA, and Controlled QA remain a future product-definition task.

**Reason:** Maximizes retention of already-completed, carefully-considered product design work rather than discarding it, while being explicit that compatibility — not blind copying — governs what carries forward.

**Alternatives Considered:** Design Standard QA from scratch with no reference to existing decisions (rejected — wastes substantial completed, approved design work with no benefit). Copy every existing decision verbatim into the preset regardless of conflicts (rejected — would reintroduce exactly the conflicts PD-049/PD-050 were created to resolve).

**Product Impact:** Onboarding, QA Operating Model, all superseded/generalized decisions listed above.

**Status:** Approved

---

## PD-063 — Configuration Hierarchy (Formal Structure)

**Decision:** The following four-level configuration hierarchy is formally approved as a foundational product structure: **Level 1 — TestFlow System Semantics; Level 2 — Organisation QA Operating Model; Level 3 — Project Effective QA Configuration; Level 4 — Document/Execution Instance.** A lower level may only configure what the level immediately above it explicitly permits. Effective configuration at any level must always be determinable. Overrides must be explicit, never implicit. Historical records must remain interpretable against the configuration version applicable when they were created. Applicable configuration versions must be traceable.

**Reason:** Gives every other decision in this pivot (PD-049 through PD-062) a single, consistent structural frame, and gives Functional Requirements/database/API design a clear governing principle to build against rather than an ad-hoc collection of independent rules.

**Alternatives Considered:** Leave the hierarchy implicit across the individual decisions above (rejected — the impact analysis and clarified model both treat this hierarchy as a named, foundational structure, not an incidental byproduct; recording it formally avoids future inconsistency).

**Product Impact:** Every module touched by this pivot — Organisation & Project Management, QA Operating Model, Template Management, Reporting, AI Test Generation, Permissions, Audit/History.

**Status:** Approved

---

## PD-064 — Methodology-Neutral QA Scope (CHANGE-002)

**Decision:** TestFlow does not model or enforce Scrum, Kanban, Waterfall, Agile, SAFe, or any other development/delivery methodology as a governed system concept — no methodology enum, engine, or configuration surface is introduced. Where an actual QA artifact genuinely needs contextual scoping, TestFlow instead provides lightweight, methodology-neutral **QA Scope** metadata: Test Report and Regression Report may each optionally carry a **scope value** (free text, e.g., "Sprint 17," "System Testing," "September Production Verification") and an optional scope date range. Separately, an organisation may optionally define its **preferred scope terminology** (e.g., "Sprint," "Iteration," "Phase," "Cycle," "Testing Window") — this is purely descriptive UI copy, used only to label the scope field; it must never alter application behaviour, gate evaluation, or any other system logic. No Delivery Cycle, Test Cycle, Sprint, Iteration, Phase, or Release entity is introduced. QA Scope is document-instance metadata, not part of QA Operating Model draft/publish versioning (PD-057/PD-063) — changing a scope value or an organisation's preferred terminology is not a governance/publish event. Project Readiness (FR-QG-003) remains evaluated at the Project level only, using current live data; it is not made scope-aware, and no per-scope/per-cycle readiness is introduced. Test Runs remain independent execution containers (PD-034/PD-037), structurally unrelated to QA Scope — a Test Run is never equated with a Sprint, cycle, or scope.

**Reason:** An in-progress visual design surfaced an accidental Scrum/Sprint assumption ("Sprint Test Report," "Sprint Readiness"). Impact analysis (CHANGE-002) found the approved underlying model already methodology-neutral in requirements, database, API, and architecture — the one gap was that QA Documents had no neutral way to express *what period or slice of work* they cover. Modelling "methodology" itself would add a taxonomy with no behavioural consumer anywhere in the approved requirement set, and risks turning TestFlow into project-management software (a stated non-goal) or silently reintroducing the Release-entity complexity already deliberately rejected for Readiness (FR-QG-003, AD-023).

**Alternatives Considered:** A governed Scrum/Kanban/Waterfall methodology enum with per-methodology behaviour (rejected — no requirement branches on methodology; pure speculative generality, and a fixed enum would itself remain too restrictive for hybrid/custom delivery approaches). A first-class Delivery Cycle/Test Cycle entity (rejected — no requirement needs to query, join, or manage lifecycle across scopes; would reintroduce the Release-entity complexity already rejected for Readiness). Scope-aware/per-cycle Project Readiness (rejected — contradicts FR-QG-003's approved on-demand, Project-level, no-persisted-result design). Equating Test Run with Sprint/cycle (rejected — a Sprint or Waterfall phase may contain many Test Runs, and Kanban may have none; the two concepts are independent).

**Product Impact:** Reporting (Test Report, Regression Report), Organisation QA Operating Model (descriptive setting only), Project Readiness (explicitly unaffected), Test Runs (explicitly unaffected), Quality Gates (unchanged).

**Status:** Approved