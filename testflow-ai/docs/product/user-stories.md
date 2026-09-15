# User Stories

**Source documents:** vision.md, prd.md, product-decisions.md, functional-requirements.md (all approved)
**Status:** Initial population, focused on the Organisation QA Operating Model pivot (CHANGE-001), per the current re-baselining task. This document was previously a placeholder; a broader backfill covering every pre-existing FR module (Auth, Org, Project, Requirements, Test Case core CRUD, Test Run/Execution, Defects, Subscription/Billing, Link-Based Access, etc.) with user stories is **not** attempted here and remains a future documentation task. Each story below references the FR(s) it derives from — no story here introduces a capability not already specified in `functional-requirements.md`.

**Format:** As a `<role>`, I want to `<action>`, so that `<benefit>`. Each story lists its Acceptance Notes (pointers to the governing FR's acceptance criteria, not a restatement) and Related FR(s).

---

## QA Manager — Organisation QA Setup & Governance

### US-QAOM-001 — Choose Initial QA Setup
As a QA Manager, I want to select a starting QA setup option (Standard QA, Lightweight QA, Controlled QA, or Custom Setup) right after my organisation is created, so that my organisation has a working QA process without a lengthy configuration wizard.
**Acceptance Notes:** Selecting a preset other than Standard QA immediately supersedes the automatic Standard QA default. See FR-QAOM-001–003.
**Related FRs:** FR-QAOM-001, FR-QAOM-002, FR-QAOM-003

### US-QAOM-002 — Configure QA Process via Custom Setup
As a QA Manager, I want to configure each QA governance setting individually instead of picking a preset, so that my organisation's process reflects our specific needs without being boxed into a fixed preset.
**Acceptance Notes:** Custom Setup draws from the same bounded settings catalogue as the presets — no unbounded/freeform configuration surface. See FR-QAOM-007, FR-QAOM-010.
**Related FRs:** FR-QAOM-007, FR-QAOM-010

### US-QAOM-003 — Customize the Test Case Template
As a QA Manager, I want to add, remove, reorder, and configure fields on my organisation's Test Case template, so that test cases capture exactly the information my team needs.
**Acceptance Notes:** Protected system fields cannot be removed or redefined; changes only take effect once published. See FR-TPL-001, FR-TPL-002, FR-TPL-006.
**Related FRs:** FR-TPL-001, FR-TPL-002, FR-TPL-003, FR-TPL-004, FR-TPL-006

### US-QAOM-004 — Customize the Test Report Template
As a QA Manager, I want to customize the structure of my organisation's Test Report template, so that generated reports match what my stakeholders expect to see.
**Acceptance Notes:** Same mechanism as the Test Case template (module TPL), applied to the Test Report document type.
**Related FRs:** FR-TPL-001–007, FR-RPT-002

### US-QAOM-005 — Customize the Regression Report Template
As a QA Manager, I want to customize the structure of my organisation's Regression Report template, so that our regression evidence is captured consistently before a release.
**Acceptance Notes:** Same mechanism as above, applied to Regression Report (FR-RPT-005).
**Related FRs:** FR-TPL-001–007, FR-RPT-005

### US-QAOM-006 — Configure Approval Behaviour
As a QA Manager, I want to choose whether Test Cases (and Test/Regression Reports) require No Approval, Single Approval, or Review + Approval, so that our governance strength matches how much oversight our team actually needs.
**Acceptance Notes:** Exactly three bounded shapes are offered; No Approval preserves today's self-service behaviour unchanged. See FR-WF-001, FR-WF-002.
**Related FRs:** FR-WF-001, FR-WF-002, FR-TC-005

### US-QAOM-007 — Configure Required QA Artifacts
As a QA Manager, I want to specify which QA artifacts (Requirements, Test Cases, Test Report, Regression Report) are required for a project to be considered ready, so that my team knows what "done" means before a release.
**Acceptance Notes:** "Required" affects the computed readiness result, not day-to-day ability to work — see FR-POL-001's enforcement-point clarification.
**Related FRs:** FR-POL-001, FR-QG-001

### US-QAOM-008 — Configure Quality Gates
As a QA Manager, I want to enable and configure Quality Gate conditions (e.g., no unresolved Critical defects, minimum requirement coverage), so that TestFlow can tell me objectively whether a project is release-ready.
**Acceptance Notes:** Drawn from the bounded catalogue only — no arbitrary rule composition. See FR-QG-001, FR-QG-002.
**Related FRs:** FR-QG-001, FR-QG-002, FR-QG-003

### US-QAOM-009 — Publish QA Configuration
As a QA Manager, I want to publish my draft QA Operating Model changes explicitly, so that nothing takes effect until I've reviewed and confirmed it.
**Acceptance Notes:** Draft changes have zero effect on any project until publish; publish creates a new immutable configuration version. See FR-QAOM-008, FR-QAOM-009.
**Related FRs:** FR-QAOM-008, FR-QAOM-009, FR-NOT-006

### US-QAOM-010 — Inspect Configuration Version History
As a QA Manager, I want to see the history of published QA configuration versions and templates, including which is currently in effect, so that I can understand how our process has evolved and troubleshoot when a project behaves unexpectedly.
**Acceptance Notes:** See FR-TPL-008 (template history) and FR-QAOM-009 (configuration version).
**Related FRs:** FR-QAOM-009, FR-TPL-008, FR-AUD-005

### US-QAOM-011 — Control Project Override Permission
As a QA Manager, I want to decide which QA settings a project is allowed to override, and lock the rest, so that individual projects can adapt where it makes sense without undermining organisation-wide governance.
**Acceptance Notes:** Default is LOCKED; only explicitly marked settings can be overridden, and only by QA Manager/Admin. See FR-POL-003.
**Related FRs:** FR-POL-003, FR-POL-004, FR-WF-006

---

## QA Tester — Working Within the Organisation's QA Operating Model

### US-QAOM-012 — Create a Test Case Using the Applicable Template
As a QA Tester, I want to create a test case using my organisation's currently published Test Case template, so that my test case automatically follows our team's agreed structure.
**Acceptance Notes:** The template used is resolved from the project's effective configuration at creation time and does not change later even if the template is republished. See FR-TC-008, FR-TPL-009.
**Related FRs:** FR-TC-008, FR-TPL-009

### US-QAOM-013 — Understand Which Fields Are Required
As a QA Tester, I want to clearly see which fields on a test case, report, or other governed document are required versus optional, so that I don't waste time guessing what's mandatory.
**Acceptance Notes:** Required/optional is a per-field template property. See FR-TPL-004.
**Related FRs:** FR-TPL-004

### US-QAOM-014 — Submit a Test Case for Approval When Configured
As a QA Tester, I want to submit my test case into whatever approval workflow my organisation has configured, so that I follow the right process without needing to know the underlying rules myself.
**Acceptance Notes:** Under No Approval, this is just self-approval as today; under a configured stronger shape, submission routes to the assigned approver. See FR-TC-005, FR-WF-001.
**Related FRs:** FR-TC-005, FR-WF-001, FR-NOT-007

### US-QAOM-015 — Execute Testing According to Applicable Governance
As a QA Tester, I want the system to tell me clearly if I can't record a result for a test case that isn't approved (when my organisation requires that), so that I don't do work that won't count.
**Acceptance Notes:** Enforcement occurs at the point of recording a result, not at run creation. See FR-WF-004.
**Related FRs:** FR-WF-004, FR-EXEC-001

### US-QAOM-016 — Create Reports Using Applicable Templates
As a QA Tester, I want my Test Report / Regression Report generation to automatically use my organisation's current published template, so that I don't have to manually reformat reports to match our standard.
**Acceptance Notes:** See FR-RPT-002, FR-RPT-005, FR-TPL-009.
**Related FRs:** FR-RPT-002, FR-RPT-005, FR-TPL-009

---

## Project-Authorized User — Policy Inheritance & Override

### US-QAOM-017 — See Inherited Organisation Policy
As a project-authorized user (QA Manager, Admin, or QA Tester with project access), I want to see which QA settings my project inherited from the organisation, and which (if any) have been overridden, so that I understand exactly what rules apply to my project.
**Acceptance Notes:** Shows organisation value, override value if any, and the effective value together. See FR-POL-005.
**Related FRs:** FR-POL-002, FR-POL-005

### US-QAOM-018 — Override an Allowed Project Setting
As a QA Manager or Admin, I want to override a project-level setting the organisation has explicitly permitted overriding (e.g., requiring Regression Report for one high-risk project), so that a specific project can follow stricter or different rules without changing the whole organisation's policy.
**Acceptance Notes:** Override must be explicit, permissioned, and is always audited. See FR-POL-004.
**Related FRs:** FR-POL-003, FR-POL-004, FR-AUD-005

---

## Approver — Reviewing and Approving Governed QA Documents

### US-QAOM-019 — Review and Approve a Governed Test Case
As a QA Manager (or other role assigned the approver checkpoint, FR-WF-006), I want to review a test case submitted under a Single Approval or Review + Approval workflow and approve or reject it, so that stronger governance is actually enforced, not just configured.
**Acceptance Notes:** Approver role is determined by the configured workflow shape and FR-WF-006's permission mapping, not a custom role.
**Related FRs:** FR-WF-001, FR-WF-002, FR-WF-006, FR-TC-005, FR-NOT-007

### US-QAOM-020 — Review and Approve a Governed Report
As a QA Manager, I want to approve or reject a Test Report or Regression Report under my organisation's configured workflow, so that the report's internal readiness state is accurate before it's shared externally or used in a Quality Gate.
**Acceptance Notes:** This internal workflow approval is distinct from BA/PO's separate, link-based report approval (FR-RPT-003) — see FR-WF-005's explicit separation from Quality Gates.
**Related FRs:** FR-WF-005, FR-RPT-002, FR-RPT-005

---

## Cross-Cutting — Readiness Visibility

### US-QAOM-021 — See Project Release Readiness at a Glance
As a QA Manager, I want to see my project's overall Quality Gate readiness (Ready / Not Ready, with reasons for any failing condition) on the project dashboard, so that I know whether we're actually ready to release without manually checking every artifact.
**Acceptance Notes:** Evaluated live against current data at the Project level — no separate Release entity exists at MVP. See FR-QG-003, FR-QG-004, FR-DASH-004.
**Related FRs:** FR-QG-003, FR-QG-004, FR-DASH-004

### US-QAOM-022 — Set My Organisation's Preferred Scope Terminology **[New — CHANGE-002]**
As an Admin or QA Manager, I want to tell TestFlow what my organisation calls its delivery cycle (e.g., "Sprint," "Phase," "Iteration"), so that QA documents use language my team already understands, without TestFlow forcing us into Scrum-specific terms.
**Acceptance Notes:** Descriptive only — never changes gate evaluation, readiness, or any other behaviour (PD-064). See FR-QAOM-013.
**Related FRs:** FR-QAOM-013

### US-RPT-006 — Record What Period a Test Report / Regression Report Covers **[New — CHANGE-002]**
As a QA Manager, I want to optionally label a Test Report or Regression Report with the scope it covers (e.g., "Sprint 17," "System Testing," "1–30 September"), so that the report is understandable regardless of whether my team uses Scrum, Kanban, Waterfall, or something else.
**Acceptance Notes:** Fully optional; no scope value or date range is required to generate or view a report. See FR-RPT-006.
**Related FRs:** FR-RPT-006, FR-QAOM-013

---

## Note on Role Alignment

Every story above uses the existing three organisation roles (Admin, QA Manager, QA Tester) plus the existing link-based BA/PO role where already approved (FR-RPT-003). No story introduces a new role — "Approver" and "project-authorized user" above are functional labels for whichever existing role a given organisation's configured workflow/permission mapping (FR-WF-006) assigns to that responsibility, not new role types. This is consistent with PD-059 (existing role model retained; permission checkpoints, not custom roles).
