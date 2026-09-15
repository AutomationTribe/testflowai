# TestFlow AI — Non-Functional Requirements (NFR)

**Source documents:** vision.md, prd.md, product-decisions.md, functional-requirements.md (all approved)
**Status:** Approved — all numerical targets and policies below have been reviewed and confirmed by the product owner, except where explicitly marked as an open decision. Extended for CHANGE-001 (Organisation QA Operating Model pivot) with new NFR categories CFG (Configuration Integrity) and DYN (Dynamic Field Validation & Performance); existing categories DI, SEC, AUD, AI, PERF gain new requirements/cross-references reflecting the pivot's new FR modules (QAOM, TPL, WF, POL, QG).
**Scope:** This document defines measurable quality expectations only. It does not specify technology, database design, API design, architecture, or UI design.

---

## How to Read This Document

Each requirement includes a Priority (MVP / Post-MVP / Future) and references the functional areas it supports. Approved numerical targets are stated directly as requirements. Where a target remains undecided, the requirement is written at the level of principle, with an explicit **Open Decision** note instead of an invented number.

---

# PERF — Performance

### NFR-PERF-001 — Standard Page Response Time
**Requirement:** The system shall render standard, non-report, non-AI pages (e.g., test case list, project dashboard) within 2 seconds at the 95th percentile under expected load.
**Purpose:** Ensures the application feels responsive during everyday use.
**Measurement/Acceptance Criteria:** 95th percentile page response time measured under expected concurrent load (load baseline to be established — see NFR-SCALE-001/002 open decisions) is under 2 seconds.
**Priority:** MVP
**Related Functional Areas:** All modules (cross-cutting)

### NFR-PERF-002 — Test Run Progress Aggregation Performance
**Requirement:** The system shall display test run progress counts (FR-TR-004, FR-DASH-002) within 2 seconds under expected load, up to a project size threshold to be defined (see Open Decisions).
**Purpose:** QA Managers rely on run progress and dashboards for real-time decision-making; slow aggregation undermines that.
**Measurement/Acceptance Criteria:** Progress figures load within 2 seconds for runs up to the defined size threshold.
**Priority:** MVP
**Related Functional Areas:** FR-TR-004, FR-DASH-001, FR-DASH-002
**Open Decision:** Test case/run volume threshold not yet defined (see NFR-SCALE-002).

### NFR-PERF-003 — Report Generation Performance
**Requirement:** The system shall generate an on-demand report (FR-RPT-001) within 5 seconds for a typical project's data volume.
**Purpose:** Reports are often needed for time-sensitive deployment decisions; slow generation undermines the workflow.
**Measurement/Acceptance Criteria:** Reports for a typical project generate within 5 seconds. "Typical project size" threshold to be defined (see Open Decisions).
**Priority:** MVP
**Related Functional Areas:** FR-RPT-001, FR-RPT-002

### NFR-PERF-004 — Import/Export Performance
**Requirement:** The system shall process bulk import/export operations (FR-IMP-001, FR-IMP-002) under a defined record-count threshold within 30 seconds, and shall display progress indication for operations exceeding that threshold.
**Purpose:** Prevents the user from being left uncertain whether an import/export has stalled.
**Measurement/Acceptance Criteria:** Operations under the defined threshold complete within 30 seconds; operations above it show progress feedback rather than a blocking wait.
**Priority:** MVP
**Related Functional Areas:** FR-IMP-001, FR-IMP-002, FR-IMP-003
**Open Decision:** Exact record-count threshold depends on resolving which entity types are in scope for import/export (open question carried from functional-requirements.md).

### NFR-PERF-005 — Quality Gate Evaluation Performance **[New — CHANGE-001]**
**Requirement:** The system shall evaluate a project's enabled Quality Gate conditions (FR-QG-003) and return a readiness result within 3 seconds for a typical project's data volume.
**Purpose:** Readiness is meant to be checked frequently (e.g., before a release decision); slow evaluation undermines that.
**Measurement/Acceptance Criteria:** Gate evaluation for a typical project completes within 3 seconds; "typical project size" threshold shares the same open decision as NFR-PERF-003.
**Priority:** MVP
**Related Functional Areas:** FR-QG-003, FR-QG-004, FR-DASH-004

---

# SCALE — Scalability

### NFR-SCALE-001 — Unlimited Organisations and Projects
**Requirement:** The system shall support an unlimited number of organisations and, within each organisation, an unlimited number of projects.
**Purpose:** Directly reflects the approved vision and PRD goal of unlimited multi-tenant scale.
**Measurement/Acceptance Criteria:** No hard-coded ceiling exists on organisation or project counts at the application logic level.
**Priority:** MVP
**Related Functional Areas:** FR-ORG-002, PD-001

### NFR-SCALE-002 — Test Case and Test Run Volume per Project
**Requirement:** The system shall remain performant (per NFR-PERF-002) as the number of test cases, suites, and test runs within a single project grows.
**Purpose:** QA teams may accumulate large volumes of test cases over a project's lifetime; performance should not degrade sharply.
**Measurement/Acceptance Criteria:** To be defined once a target project size is established.
**Priority:** MVP (principle) / target number Post-MVP
**Related Functional Areas:** FR-TC, FR-TS, FR-TR
**Open Decision:** No specific volume target set. Recommend defining once real usage data or customer expectations are available.

### NFR-SCALE-003 — Seat and User Growth per Organisation
**Requirement:** The system shall support organisations growing their seat count over time without requiring redesign of the underlying access model.
**Purpose:** Reflects the approved subscription model, where seats only ever increase.
**Measurement/Acceptance Criteria:** No hard ceiling on organisation member count at the application logic level.
**Priority:** MVP
**Related Functional Areas:** FR-SUB-004, FR-SUB-005, FR-SUB-009

---

# AVAIL — Availability

### NFR-AVAIL-001 — Platform Availability Target
**Requirement:** The system shall maintain 99.5% monthly uptime, excluding announced maintenance windows.
**Purpose:** TestFlow AI is a paid product that gates all customer work behind an active subscription; downtime directly costs customers access they've paid for.
**Measurement/Acceptance Criteria:** Measured as monthly uptime percentage, excluding announced maintenance windows.
**Priority:** MVP
**Related Functional Areas:** Cross-cutting; FR-SUB-002 (access gating)

### NFR-AVAIL-002 — Planned Maintenance Communication
**Requirement:** The system shall notify organisation members (Admin, QA Manager) at least 24 hours in advance of planned maintenance that will affect availability.
**Purpose:** Avoids surprising customers with downtime during active testing cycles.
**Measurement/Acceptance Criteria:** Maintenance notices are issued at least 24 hours before the maintenance window begins.
**Priority:** Post-MVP
**Related Functional Areas:** FR-NOT-004, FR-NOT-005

---

# REL — Reliability

### NFR-REL-001 — Test Run Snapshot Integrity Under Failure
**Requirement:** The system shall ensure that a test run's snapshot of test case content (FR-TR-002) is never lost or corrupted, even in the event of a system failure during run creation.
**Purpose:** Snapshot integrity is a core approved business rule; a failure here would silently invalidate historical results.
**Measurement/Acceptance Criteria:** No observed instances of a test run referencing altered/live test case content instead of its snapshot, verified through testing.
**Priority:** MVP
**Related Functional Areas:** FR-TR-001, FR-TR-002, FR-TC-004

### NFR-REL-002 — Reliable Delivery of Notifications and Links
**Requirement:** The system shall retry a failed notification email or access link delivery (FR-NOT-005, FR-LNK-001) at least once, within 5 minutes of the initial failure, before treating it as a permanent failure.
**Purpose:** Link-based roles (BA/PO, Developer, Stakeholder) depend entirely on email delivery for access — a failed, non-retried send blocks their ability to work.
**Measurement/Acceptance Criteria:** Failed sends are automatically retried at least once within 5 minutes; permanent failures are logged and visible to the sender.
**Priority:** MVP
**Related Functional Areas:** FR-NOT-005, FR-LNK-001, FR-DEF-006

### NFR-REL-003 — Payment Processing Reliability
**Requirement:** The system shall ensure that a subscription payment is either fully completed (seats activated, confirmation sent) or fully not completed (no partial seat activation, no charge without activation).
**Purpose:** Prevents customers being charged without receiving access, or gaining access without being charged.
**Measurement/Acceptance Criteria:** No observed instances of payment succeeding without corresponding seat/subscription activation, or vice versa.
**Priority:** MVP
**Related Functional Areas:** FR-SUB-004, FR-SUB-005, FR-SUB-006, FR-SUB-007

---

# SEC — Security

### NFR-SEC-001 — Authentication Protection Against Brute Force
**Requirement:** The system shall trigger a protective response (e.g., lockout or escalating delay) after 5 consecutive failed login attempts within a short window.
**Purpose:** Prevents credential-guessing attacks against organisation accounts.
**Measurement/Acceptance Criteria:** A protective response is triggered at the 5th consecutive failed attempt within the defined window.
**Priority:** MVP
**Related Functional Areas:** FR-AUTH-001

### NFR-SEC-002 — Session Security
**Requirement:** The system shall protect active user sessions against hijacking and shall terminate a session after 30 minutes of inactivity.
**Purpose:** Limits the window of exposure if a session is compromised or a device is left unattended, while avoiding disruption mid-workflow.
**Measurement/Acceptance Criteria:** Inactive sessions are terminated after exactly 30 minutes; session tokens are not exposed in a way that allows trivial reuse.
**Priority:** MVP
**Related Functional Areas:** FR-AUTH-001, FR-AUTH-003 *(resolves prior open question on FR-AUTH-003 session timeout)*

### NFR-SEC-003 — Multi-Tenant Data Isolation
**Requirement:** The system shall ensure that data belonging to one organisation is never accessible, directly or indirectly, to users of another organisation.
**Purpose:** TestFlow AI is explicitly multi-tenant (PD-001); a tenant isolation failure would be a severe breach of customer trust.
**Measurement/Acceptance Criteria:** No data access path exists across organisation boundaries under any role, including Admin (Admin is scoped per organisation, per PD-013). Verified through dedicated cross-tenant access testing.
**Priority:** MVP
**Related Functional Areas:** FR-ORG-001 through FR-ORG-006, FR-PRJ-007, PD-001, PD-013

### NFR-SEC-004 — Project-Level Access Enforcement
**Requirement:** The system shall enforce that only users with granted project access (per the organisation-level role model, PD-017) can view or act on that project's data.
**Purpose:** Directly implements the approved access model; a gap here would let organisation members see projects they were never given access to.
**Measurement/Acceptance Criteria:** No access path exists to a project's data for a user without granted access, verified through testing across all roles.
**Priority:** MVP
**Related Functional Areas:** FR-PRJ-004 through FR-PRJ-007, FR-ORG-006

### NFR-SEC-005 — Link-Based Access Scope Enforcement
**Requirement:** The system shall ensure that a temporary access link (FR-LNK-001) grants access only to the specific action and item it was scoped to, and to nothing else in the project or organisation.
**Purpose:** Link-based roles (BA/PO, Developer, Stakeholder) have no account and no other access control layer — the link's scope is the entire security boundary for these roles.
**Measurement/Acceptance Criteria:** A link scoped to one report's approval cannot be used to access any other report, defect, dashboard, or project data. Verified through testing.
**Priority:** MVP
**Related Functional Areas:** FR-LNK-001 through FR-LNK-005

### NFR-SEC-006 — Link Expiry and Revocation Enforcement
**Requirement:** The system shall deny all access attempts through an expired or revoked link, with no grace window.
**Purpose:** Expiry and revocation are the primary security control for link-based access, since links can be freely copied and shared (per approved decision).
**Measurement/Acceptance Criteria:** Access attempts immediately after expiry/revocation are denied; no successful access is observed post-expiry in testing.
**Priority:** MVP
**Related Functional Areas:** FR-LNK-002, FR-LNK-005

### NFR-SEC-007 — Encryption of Data in Transit
**Requirement:** The system shall encrypt all data transmitted between the user's browser/client and the system.
**Purpose:** Protects credentials, test data, requirements, and payment-related interactions from interception.
**Measurement/Acceptance Criteria:** No unencrypted transmission path exists for any user-facing interaction.
**Priority:** MVP
**Related Functional Areas:** Cross-cutting

### NFR-SEC-008 — Encryption of Data at Rest
**Requirement:** The system shall encrypt stored customer data, including requirements, test cases, attachments, and payment-related records.
**Purpose:** Protects customer business data and payment-adjacent data from exposure in the event of storage-layer compromise.
**Measurement/Acceptance Criteria:** Stored data is encrypted; specific mechanism is an architecture-phase decision.
**Priority:** MVP
**Related Functional Areas:** Cross-cutting

### NFR-SEC-009 — File Upload Validation
**Requirement:** The system shall validate uploaded evidence attachments (FR-EXEC-002) against an approved file-type allowlist (NFR-FILE-002) before storage.
**Purpose:** File upload is a common attack vector; validating file type/content protects both TestFlow AI's infrastructure and other users who may later open the attachment.
**Measurement/Acceptance Criteria:** Files outside the allowlist are rejected before storage.
**Priority:** MVP
**Related Functional Areas:** FR-EXEC-002

### NFR-SEC-010 — Input Validation Against Injection
**Requirement:** The system shall validate and sanitize all user-supplied input (requirements text, test case content, comments, defect descriptions, etc.) to prevent injection-based attacks.
**Purpose:** Baseline protection for any system accepting significant free-text user input across many modules.
**Measurement/Acceptance Criteria:** No successful injection observed in security testing across all free-text input fields.
**Priority:** MVP
**Related Functional Areas:** FR-REQ-001, FR-TC-001, FR-TC-007, FR-DEF-001

### NFR-SEC-011 — Secrets Protection (AI Provider Keys)
**Requirement:** The system shall store AI provider keys configured by QA Managers (FR-AI-004) such that they are never displayed in full after initial entry, and never appear in logs or error output.
**Purpose:** A leaked AI provider key would expose the customer to unauthorized usage charges on their own AI provider account.
**Measurement/Acceptance Criteria:** Provider keys are masked in the UI after entry; verified absent from logs/error output through testing.
**Priority:** MVP
**Related Functional Areas:** FR-AI-004

### NFR-SEC-012 — Payment Data Handling
**Requirement:** The system shall not store raw payment card data within TestFlow AI's own systems.
**Purpose:** Reduces compliance burden and risk exposure.
**Measurement/Acceptance Criteria:** No raw card data present in TestFlow AI's own data stores, verified through architecture review once a payment approach is selected.
**Priority:** MVP
**Related Functional Areas:** FR-SUB-006, FR-SUB-007

### NFR-SEC-013 — Abuse Protection on AI Generation
**Requirement:** The system shall protect against excessive or abusive use of AI test case generation (FR-AI-001), particularly for the platform-provided AI option (FR-AI-005).
**Purpose:** Without protection, a single organisation could consume disproportionate platform AI resources, driving up cost or degrading service for other customers.
**Measurement/Acceptance Criteria:** To be defined — see NFR-AI-008.
**Priority:** MVP
**Related Functional Areas:** FR-AI-005
**Open Decision:** Depends on the still-open usage limit/cost model decision for the platform-provided AI option (FR-AI-005).

### NFR-SEC-014 — Configuration/Governance Actions Restricted to Authorized Roles **[New — CHANGE-001]**
**Requirement:** The system shall enforce that only Admin or QA Manager (per FR-WF-006's permission checkpoints) can draft, publish, or modify organisation QA configuration, templates, workflow, policy, or quality gates; QA Tester shall not be able to perform any of these actions through any path.
**Purpose:** Directly required by §27 of the task — tenant isolation already covers cross-organisation access (NFR-SEC-003); this specifically covers within-organisation configuration authority.
**Measurement/Acceptance Criteria:** No configuration/governance action is reachable by a QA Tester or link-based role through any code path, verified through authorization testing.
**Priority:** MVP
**Related Functional Areas:** FR-WF-006, FR-QAOM-008, FR-TPL-006, FR-TPL-007, FR-QG-002, FR-POL-004

---

# PRIV — Privacy and Data Protection

### NFR-PRIV-001 — Customer Data Not Used to Train External Models
**Requirement:** The system shall ensure that customer requirements, test cases, and other project content submitted for AI generation are not used by the AI provider to train models accessible to other customers, where technically and contractually controllable.
**Purpose:** Customer requirements and test cases may reveal sensitive product details; this directly affects trust in the AI feature (PD-008).
**Measurement/Acceptance Criteria:** Confirmed via AI provider contractual terms once a provider is selected (architecture-phase decision); this requirement constrains that selection.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001, FR-AI-004, FR-AI-005

### NFR-PRIV-002 — Data Retention After Account/Organisation Cancellation
**Requirement:** The system shall define and apply a retention period for organisation data after a subscription is cancelled or lapses beyond the grace period.
**Purpose:** Customers and regulators reasonably expect clarity on what happens to data after cancellation.
**Measurement/Acceptance Criteria:** To be defined.
**Priority:** MVP (the policy must exist before launch, even if the exact period is decided later)
**Related Functional Areas:** FR-SUB-002, FR-SUB-010, FR-ORG-001
**Open Decision:** No retention period or deletion policy has been approved. This is a new policy decision requiring product-owner input, not merely a number.

### NFR-PRIV-003 — Personal Data Minimization for Link-Based Roles
**Requirement:** The system shall collect only the minimum personal data necessary (e.g., name/email) to generate and attribute a temporary access link for BA/PO, Developer, and Stakeholder.
**Purpose:** These roles never hold accounts (PD-018); the system should not collect more personal data about them than the link mechanism requires.
**Measurement/Acceptance Criteria:** Link creation requires no personal data fields beyond what's needed for delivery (FR-LNK-001) and audit attribution (FR-LNK-004).
**Priority:** MVP
**Related Functional Areas:** FR-LNK-001, FR-LNK-004

---

# AUTHZ — Authorization

### NFR-AUTHZ-001 — Consistent Role Enforcement Across All Actions
**Requirement:** The system shall enforce organisation-level role permissions (FR-USR-007, FR-ORG-006) consistently across every action in every module, with no action reachable through an unprotected path.
**Purpose:** A single unprotected action would undermine the entire approved role model.
**Measurement/Acceptance Criteria:** Systematic authorization testing confirms every functional requirement's stated "Actors" list is enforced, with no bypass path.
**Priority:** MVP
**Related Functional Areas:** FR-USR-007, FR-ORG-006, all modules

### NFR-AUTHZ-002 — Link-Scoped Authorization Independent of Session State
**Requirement:** The system shall evaluate a link's permitted action independently for each access attempt, rather than granting broader session-based trust after first use.
**Purpose:** Since links are multi-use and require no login (FR-LNK-003), each use must be independently re-validated against the link's scope and expiry.
**Measurement/Acceptance Criteria:** Each access attempt via a link is independently checked against current expiry/revocation status and action scope.
**Priority:** MVP
**Related Functional Areas:** FR-LNK-001, FR-LNK-002, FR-LNK-003, FR-LNK-005

---

# CFG — Configuration Integrity **[New Category — CHANGE-001]**

### NFR-CFG-001 — Published Configuration Immutability
**Requirement:** The system shall ensure that a published Organisation QA Configuration Version, template version, or workflow/policy/gate definition (FR-QAOM-009, FR-TPL-007) can never be modified in place after publish.
**Purpose:** Technical enforcement of PD-057 — the foundation every other historical-consistency guarantee in this section depends on.
**Measurement/Acceptance Criteria:** No code path exists that mutates a published configuration/template version's content; only a new publish creates a new version.
**Priority:** MVP
**Related Functional Areas:** FR-QAOM-008, FR-QAOM-009, FR-TPL-006, FR-TPL-007

### NFR-CFG-002 — Historical Records Remain Interpretable
**Requirement:** The system shall ensure that a Test Case, Test Report, Regression Report, or other governed document remains fully interpretable (fields, labels, workflow meta-state mapping) using the configuration/template version applicable when it was created, regardless of how many newer versions have since been published.
**Purpose:** Directly extends the existing Test Case Version / Test Run Snapshot historical-accuracy guarantee (NFR-DI-001) to the new configuration layer.
**Measurement/Acceptance Criteria:** No document's rendering/interpretation silently changes as a side effect of a later, unrelated configuration publish.
**Priority:** MVP
**Related Functional Areas:** FR-TPL-009, FR-QAOM-012, FR-WF-003

### NFR-CFG-003 — Effective Configuration Deterministic Resolution
**Requirement:** The system shall resolve a project's effective QA configuration (organisation published version + permitted overrides) deterministically — the same inputs always produce the same effective configuration, with no race condition or ambiguity about which version applies.
**Purpose:** Supports FR-POL-002/FR-POL-005's requirement that effective configuration always be identifiable.
**Measurement/Acceptance Criteria:** Effective-configuration resolution is idempotent and produces a single unambiguous result for any given project at any point in time, verified through testing.
**Priority:** MVP
**Related Functional Areas:** FR-POL-002, FR-POL-004, FR-POL-005, FR-QAOM-012

### NFR-CFG-004 — Configuration Version Traceability
**Requirement:** The system shall retain, for every governed document, an identifiable reference to the exact configuration/template version applicable to it at creation, discoverable by an authorized user without ambiguity.
**Purpose:** Supports auditability (FR-AUD-005) and historical reporting (NFR-CFG-002) — a version reference that can't actually be traced back defeats the purpose of versioning.
**Measurement/Acceptance Criteria:** Every governed document exposes its applicable configuration/template version identifier to an authorized viewer.
**Priority:** MVP
**Related Functional Areas:** FR-TPL-009, FR-QAOM-009, FR-AUD-005

---

# DYN — Dynamic Field Validation & Performance **[New Category — CHANGE-001]**

### NFR-DYN-001 — Configurable Field Values Validated Against Applicable Template Version
**Requirement:** The system shall validate every configurable field's value against the field's definition (type, required/optional, allowed options, numeric validation) from the document's applicable template version (FR-TPL-009) at the time of every create/update, not merely at initial creation.
**Purpose:** A template's configurability is only meaningful if values are actually enforced against it — otherwise the Template System is decorative.
**Measurement/Acceptance Criteria:** No create/update path bypasses field-definition validation for any configurable field, verified through testing across all field types (FR-TPL-003).
**Priority:** MVP
**Related Functional Areas:** FR-TPL-001–004, FR-TPL-009, FR-AI-006

### NFR-DYN-002 — Configurable Fields Do Not Degrade Common List/Filter Performance
**Requirement:** The system shall ensure that the presence of organisation-configured fields on Test Case, Test Report, or Regression Report does not cause common list/filter operations (e.g., the Test Case list, filtered by a configurable field) to fall outside NFR-PERF-001's standard page response target at typical organisation-configured field counts.
**Purpose:** Directly required by §27 of the task — dynamic fields must not make common operations unusably slow.
**Measurement/Acceptance Criteria:** List/filter operations involving configurable fields meet NFR-PERF-001's 2-second, 95th-percentile target at a typical field count (exact "typical" threshold shares the same open-decision status as other volume thresholds in this document — see Open Decisions).
**Priority:** MVP
**Related Functional Areas:** FR-TPL-001, FR-TC-008, NFR-PERF-001

---

# DI — Data Integrity

### NFR-DI-001 — Test Case Version Integrity
**Requirement:** The system shall ensure that once a test case version is referenced by a test run snapshot (FR-TC-004, FR-TR-002), that version's content can never be altered.
**Purpose:** This is the technical foundation of an already-approved business rule.
**Measurement/Acceptance Criteria:** No code path exists that modifies a previously snapshotted test case version's content.
**Priority:** MVP
**Related Functional Areas:** FR-TC-004, FR-TR-002

### NFR-DI-002 — Immutable Audit Entries
**Requirement:** The system shall enforce that audit entries (FR-AUD-004) cannot be modified or deleted by any role, including Admin.
**Purpose:** Audit integrity depends on this being unconditional.
**Measurement/Acceptance Criteria:** No update or delete operation is exposed for audit entries at any layer, verified through testing.
**Priority:** MVP
**Related Functional Areas:** FR-AUD-004

### NFR-DI-003 — Execution Result Immutability After Run Closure
**Requirement:** The system shall enforce that execution results cannot be modified once their test run is closed.
**Purpose:** Technical enforcement of the approved decision that results are not editable after closure.
**Measurement/Acceptance Criteria:** No update path exists for execution results once the parent run's status is closed.
**Priority:** MVP
**Related Functional Areas:** FR-EXEC-001, FR-EXEC-003

### NFR-DI-004 — Referential Integrity on Archive Cascade
**Requirement:** The system shall ensure that cascading archive operations (requirement → test cases → reports → active test runs) complete fully and consistently, with no partially-archived state left behind if the operation is interrupted.
**Purpose:** Directly supports the approved cascade-archive decisions (PD-016 and its extension covering active test runs); a partial cascade would leave inconsistent state.
**Measurement/Acceptance Criteria:** Cascade archive operations are atomic — either fully complete or fully rolled back, verified through failure-injection testing.
**Priority:** MVP
**Related Functional Areas:** FR-REQ-004, FR-TC-010, FR-TR

### NFR-DI-005 — Current Configuration Changes Do Not Reinterpret Historical Execution/Reporting **[New — CHANGE-001]**
**Requirement:** The system shall ensure that a change to the organisation's QA Operating Model, templates, or workflow — however published afterward — never alters the recorded meaning of already-closed test runs, already-recorded execution results, or already-generated reports.
**Purpose:** Directly required by §27 of the task — extends the existing execution-result immutability guarantee (NFR-DI-003) to cover the new configuration layer, ensuring backward/historical consistency.
**Measurement/Acceptance Criteria:** No code path re-derives a historical execution result's meaning, or a generated report's content, from a configuration version other than the one applicable when that record was created/generated.
**Priority:** MVP
**Related Functional Areas:** FR-QAOM-012, FR-TPL-009, NFR-CFG-002, NFR-DI-001, NFR-DI-003

---

# BCK — Backup and Recovery

### NFR-BCK-001 — Automated Data Backup
**Requirement:** The system shall perform automated backups of customer data daily.
**Purpose:** Protects against data loss from infrastructure failure, human error, or corruption.
**Measurement/Acceptance Criteria:** Backups occur daily and are verified to be restorable.
**Priority:** MVP
**Related Functional Areas:** Cross-cutting

### NFR-BCK-002 — Recovery Point Objective (RPO)
**Requirement:** The system shall be capable of restoring customer data to a point no older than 24 hours in the event of a major failure.
**Purpose:** Sets a concrete, measurable ceiling on acceptable data loss, consistent with the daily backup schedule.
**Measurement/Acceptance Criteria:** Restore testing confirms data can be recovered within a 24-hour RPO window.
**Priority:** MVP
**Related Functional Areas:** Cross-cutting

### NFR-BCK-003 — Recovery Time Objective (RTO)
**Requirement:** The system shall be restorable to service within a defined maximum time following a major failure.
**Purpose:** Sets an expectation for how long customers could be without access during a severe incident.
**Measurement/Acceptance Criteria:** To be defined.
**Priority:** MVP (principle) / target Post-MVP or architecture phase
**Related Functional Areas:** Cross-cutting
**Open Decision:** No RTO target set. Depends on infrastructure decisions not yet made; defer to architecture phase.

---

# AUD — Auditability

### NFR-AUD-001 — Audit Log Completeness
**Requirement:** The system shall ensure that every action defined as auditable in the functional requirements (FR-AUD-001) reliably produces a corresponding audit entry, with no silent gaps.
**Purpose:** An incomplete audit trail undermines the entire purpose of the audit feature.
**Measurement/Acceptance Criteria:** Systematic testing confirms an audit entry is produced for every action currently defined as auditable.
**Priority:** MVP
**Related Functional Areas:** FR-AUD-001, FR-AUD-002, FR-LNK-004

### NFR-AUD-002 — Audit Log Retention Period
**Requirement:** The system shall retain audit log entries for a minimum of 1 year.
**Purpose:** Audit history has diminishing value if it can be lost quickly; supports later compliance or dispute-resolution needs.
**Measurement/Acceptance Criteria:** Audit entries are retained for at least 1 year; handling of entries beyond that period follows policy, not silent deletion.
**Priority:** MVP
**Related Functional Areas:** FR-AUD-001

### NFR-AUD-003 — Audit History Visibility Restriction
**Requirement:** The system shall restrict audit history visibility to QA Manager and Admin only.
**Purpose:** Implements the approved decision that audit history is a management/oversight capability, not a general project-member capability.
**Measurement/Acceptance Criteria:** No role other than QA Manager or Admin can access audit history views, verified through testing.
**Priority:** MVP
**Related Functional Areas:** FR-AUD-003

### NFR-AUD-004 — Configuration Change Traceability **[New — CHANGE-001]**
**Requirement:** The system shall ensure every configuration/governance action listed in FR-AUD-005 reliably produces a corresponding audit entry, with no silent gaps, consistent with NFR-AUD-001's existing completeness guarantee.
**Purpose:** Directly required by §16/§24 of the task — configuration changes must be traceable.
**Measurement/Acceptance Criteria:** Systematic testing confirms an audit entry is produced for every action currently defined as auditable in FR-AUD-005.
**Priority:** MVP
**Related Functional Areas:** FR-AUD-005, FR-QAOM-008, FR-TPL-007, FR-WF-002, FR-QG-002, FR-POL-004

---

# FILE — File and Attachment Handling

### NFR-FILE-001 — Attachment Size Limit
**Requirement:** The system shall enforce a maximum file size of 10 MB per evidence attachment (FR-EXEC-002).
**Purpose:** Prevents storage cost/performance issues from unrestricted upload sizes.
**Measurement/Acceptance Criteria:** Uploads exceeding 10 MB are rejected with a clear message.
**Priority:** MVP
**Related Functional Areas:** FR-EXEC-002

### NFR-FILE-002 — Supported Attachment File Types
**Requirement:** The system shall restrict evidence attachment uploads to common image formats (e.g., PNG, JPG) and PDF for MVP; video format support is deferred to Post-MVP.
**Purpose:** Covers the most common QA evidence types (screenshots, exported logs) while limiting the storage/cost implications of video at MVP; also reduces security risk (NFR-SEC-009).
**Measurement/Acceptance Criteria:** Uploads outside the approved allowlist are rejected.
**Priority:** MVP (images, PDF) / Post-MVP (video)
**Related Functional Areas:** FR-EXEC-002

---

# ACC — Accessibility

### NFR-ACC-001 — Accessibility Conformance
**Requirement:** The system shall conform to WCAG 2.1 Level AA for its user interface.
**Purpose:** Supports usability for users with disabilities and is an increasingly common baseline procurement expectation for B2B software.
**Measurement/Acceptance Criteria:** Automated and manual accessibility audits confirm conformance to WCAG 2.1 AA for core workflows.
**Priority:** Post-MVP
**Related Functional Areas:** Cross-cutting (UI, not yet designed)

---

# COMPAT — Browser Compatibility

### NFR-COMPAT-001 — Supported Browsers
**Requirement:** The system shall function correctly on the latest two versions of Chrome, Firefox, Safari, and Edge.
**Purpose:** Sets a clear, testable compatibility boundary; excludes legacy browsers that carry disproportionate support cost for a new B2B product.
**Measurement/Acceptance Criteria:** Core workflows tested and confirmed functional on the approved browser list.
**Priority:** MVP
**Related Functional Areas:** Cross-cutting

---

# MOB — Mobile / Responsive Behaviour

### NFR-MOB-001 — Responsive Layout for Core Workflows
**Requirement:** The system shall present a usable, responsive layout down to tablet width for link-based approval flows (BA/PO report approval, Stakeholder dashboard/report viewing) at MVP. Full native mobile phone optimization is deferred to Post-MVP.
**Purpose:** Test management is predominantly a desktop-oriented workflow, but link-based approval actions (a quick BA/PO sign-off) are plausible on-the-go use cases worth covering early.
**Measurement/Acceptance Criteria:** Link-based approval and viewing flows remain usable at tablet screen widths at MVP; full phone-width optimization assessed Post-MVP.
**Priority:** MVP (link-based flows) / Post-MVP (full mobile optimization)
**Related Functional Areas:** FR-LNK-001, FR-RPT-003, FR-DASH-003

---

# OBS — Observability and Monitoring

### NFR-OBS-001 — System Health Monitoring
**Requirement:** The system shall provide monitoring of core service health sufficient to detect major outages or degraded performance.
**Purpose:** Supports meeting the availability target (NFR-AVAIL-001) by enabling timely detection and response to incidents.
**Measurement/Acceptance Criteria:** Monitoring exists for core service availability and key performance indicators; specific tooling is an architecture-phase decision.
**Priority:** MVP
**Related Functional Areas:** Cross-cutting

### NFR-OBS-002 — AI Generation Failure Monitoring
**Requirement:** The system shall monitor and log failures or degraded performance of AI test case generation (FR-AI-001), including provider-side failures.
**Purpose:** AI generation is a core differentiator; silent failures would undermine trust in the feature without anyone noticing a pattern.
**Measurement/Acceptance Criteria:** Failed or slow AI generation requests are logged with enough detail to identify systemic issues.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001, FR-AI-004, FR-AI-005

### NFR-OBS-003 — Payment and Subscription Event Monitoring
**Requirement:** The system shall monitor and alert on failures in the subscription/payment flow (e.g., a payment marked successful without corresponding seat activation).
**Purpose:** Directly supports NFR-REL-003 by ensuring failures are caught rather than silently affecting customers.
**Measurement/Acceptance Criteria:** Payment/activation mismatches are detectable and alertable.
**Priority:** MVP
**Related Functional Areas:** FR-SUB-006, FR-SUB-007

---

# MAINT — Maintainability

### NFR-MAINT-001 — Modular Alignment with Functional Structure
**Requirement:** The system's implementation shall be organized in a way that reflects the approved functional modules (ORG, PRJ, TC, TR, AI, SUB, LNK, etc.), so that changes to one module's behaviour do not require unrelated changes elsewhere.
**Purpose:** Supports long-term maintainability and reduces regression risk as the product evolves through Post-MVP phases.
**Measurement/Acceptance Criteria:** Architecture-phase decision; principle stated here for downstream design to satisfy.
**Priority:** MVP (principle) — implementation detail deferred to architecture
**Related Functional Areas:** Cross-cutting

---

# TEST — Testability

### NFR-TEST-001 — Environment Support for Automated Testing
**Requirement:** The system shall support automated testing of its own functionality to validate functional and non-functional requirements before release.
**Purpose:** Given the breadth of role-based, cascade, and versioning business rules already approved, manual-only verification would be unreliable and slow.
**Measurement/Acceptance Criteria:** Architecture-phase decision on specific tooling; principle stated here as a requirement the architecture must support.
**Priority:** MVP (principle)
**Related Functional Areas:** Cross-cutting

---

# AI — AI Performance, Reliability, and Transparency

### NFR-AI-001 — AI Generation Response Time
**Requirement:** The system shall return a full set of AI-generated test cases (FR-AI-001) within 30 seconds at the 95th percentile under normal conditions.
**Purpose:** AI generation is the product's core differentiator; excessive wait time undermines the "faster test case creation" value proposition.
**Measurement/Acceptance Criteria:** 95th percentile generation time, measured from user trigger to candidates displayed for review, is under 30 seconds.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001
**Note:** Actual achievable time depends on the AI provider/model selected (not yet chosen); this target should be revisited once that decision is made.

### NFR-AI-002 — AI Generation Timeout and Failure Handling
**Requirement:** The system shall treat an AI generation request as failed if it exceeds 60 seconds, and shall inform the user clearly with an option to retry.
**Purpose:** Prevents the user from being stuck on an unresponsive generation request with no feedback.
**Measurement/Acceptance Criteria:** Requests exceeding 60 seconds are surfaced to the user as a failure, with a retry option.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001

### NFR-AI-003 — Graceful Handling of AI Service Unavailability
**Requirement:** The system shall detect when the configured AI provider (project key or platform-provided) is unavailable and inform the user clearly, without blocking other, non-AI parts of the product.
**Purpose:** AI generation is optional to the product's core functioning (PD-008) — an AI outage should not degrade the rest of TestFlow AI.
**Measurement/Acceptance Criteria:** AI service unavailability is detected and communicated to the user; manual test case creation and all other modules remain fully functional during an AI outage.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001, FR-AI-004, FR-AI-005

### NFR-AI-004 — Mandatory Human Review Cannot Be Bypassed
**Requirement:** The system shall make it technically impossible for AI-generated test cases to be saved as final project data without passing through the human review step (FR-AI-002).
**Purpose:** This is a non-negotiable product principle already approved; the NFR ensures it's enforced as a hard technical constraint, not just a UI convention.
**Measurement/Acceptance Criteria:** No code path exists that persists AI-generated candidates directly as saved test cases without explicit user save action.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001, FR-AI-002, FR-AI-003

### NFR-AI-005 — AI-Generated Content Clearly Marked
**Requirement:** The system shall visibly indicate to the user, at the point of review, that displayed candidate test cases were AI-generated and have not yet been saved.
**Purpose:** Supports transparency and reinforces the human-review requirement.
**Measurement/Acceptance Criteria:** AI-generated candidates are visually/textually distinguishable from saved, human-authored, or previously-approved test cases throughout the review flow.
**Priority:** MVP
**Related Functional Areas:** FR-AI-002, FR-AI-003

### NFR-AI-006 — Traceability of AI-Generated Test Cases to Source Requirement
**Requirement:** The system shall retain a record that a given test case was originally AI-generated and identify the requirement it was generated from, even after human editing.
**Purpose:** Supports traceability (a core product value) and gives visibility into how much of the test suite originated from AI vs. manual authoring.
**Measurement/Acceptance Criteria:** Every AI-generated test case retains a record of its AI origin and source requirement, viewable by project members with appropriate access.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001, FR-TC-003, FR-TRACE-001

### NFR-AI-007 — Protection of Customer Data Sent to AI Providers
**Requirement:** The system shall transmit only the data necessary for test case generation (i.e., the relevant requirement content) to the AI provider, and shall not include unrelated project, customer, or organisation data in generation requests.
**Purpose:** Minimizes data exposure to a third-party AI provider, consistent with NFR-PRIV-001.
**Measurement/Acceptance Criteria:** AI generation requests contain only the selected requirement's content (and directly necessary context), verified through request payload review.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001, NFR-PRIV-001

### NFR-AI-008 — AI Usage/Rate Limiting
**Requirement:** The system shall apply a usage or rate limit to AI generation requests, particularly for the platform-provided AI option, to prevent excessive cost exposure.
**Purpose:** Without a limit, a single organisation's usage of the platform-provided AI option (FR-AI-005) could impose unbounded cost on TestFlow AI.
**Measurement/Acceptance Criteria:** To be defined.
**Priority:** MVP
**Related Functional Areas:** FR-AI-005
**Open Decision:** No specific rate/usage cap set. Blocked on the still-open cost/usage-limit model for the platform-provided AI option (FR-AI-005). Recommend defining a per-organisation monthly generation cap once the underlying AI provider/cost model is chosen.

### NFR-AI-009 — Hallucination / Quality Risk Mitigation Through Review, Not Automated Trust
**Requirement:** The system shall not present AI-generated test cases as verified or authoritative prior to human review, and shall not automatically execute, approve, or otherwise act on AI-generated content without the human review step.
**Purpose:** LLM-generated content carries a risk of inaccurate or irrelevant output; the product's defense against this risk is the mandatory human review step (NFR-AI-004), not automated quality detection, which is explicitly Post-MVP/out of scope.
**Measurement/Acceptance Criteria:** Enforced via NFR-AI-004 and NFR-AI-005; hallucination risk is treated as a human-review problem, not an automated-detection problem, for MVP.
**Priority:** MVP
**Related Functional Areas:** FR-AI-002, FR-AI-003

### NFR-AI-010 — Generation Template/Configuration Version Identifiable **[New — CHANGE-001]**
**Requirement:** The system shall retain, for every AI generation request, an identifiable record of which Test Case template version (FR-TPL-009) it was generated against, viewable by an authorized user.
**Purpose:** Directly required by §27 of the task's AI category — supports troubleshooting when a template changes and generated output stops matching expectations, and supports historical interpretation of older AI-generated content.
**Measurement/Acceptance Criteria:** Every AI generation request/result exposes its applicable template version identifier to an authorized viewer.
**Priority:** MVP
**Related Functional Areas:** FR-AI-001, FR-AI-006, FR-TPL-009, NFR-CFG-004

---

# Requirement Summary

| Category | Count | MVP | Post-MVP |
|---|---|---|---|
| PERF | 5 | 5 | 0 |
| SCALE | 3 | 3 | 0 |
| AVAIL | 2 | 1 | 1 |
| REL | 3 | 3 | 0 |
| SEC | 14 | 14 | 0 |
| PRIV | 3 | 3 | 0 |
| AUTHZ | 2 | 2 | 0 |
| CFG | 4 | 4 | 0 |
| DYN | 2 | 2 | 0 |
| DI | 5 | 5 | 0 |
| BCK | 3 | 3 | 0 |
| AUD | 4 | 4 | 0 |
| FILE | 2 | 2 (partial Post-MVP for video) | — |
| ACC | 1 | 0 | 1 |
| COMPAT | 1 | 1 | 0 |
| MOB | 1 | 1 (partial) | 1 (partial) |
| OBS | 3 | 3 | 0 |
| MAINT | 1 | 1 | 0 |
| TEST | 1 | 1 | 0 |
| AI | 10 | 10 | 0 |
| **Total** | **70** | | |

---

# Open Decisions (Unresolved — Carried Forward)

These remain open and are not yet approved targets. They should be resolved before the affected requirement can be considered final, though most do not block progress to technical design.

1. **Test case/test run volume threshold** for performance targets (NFR-PERF-002, NFR-SCALE-002) — recommend defining once real usage data is available.
2. **"Typical project size" definition** for report generation performance (NFR-PERF-003).
3. **Import/export record-count threshold** (NFR-PERF-004) — blocked on the still-open functional-requirements question of which entity types are in scope for import/export.
4. **Recovery Time Objective (RTO)** (NFR-BCK-003) — depends on infrastructure decisions not yet made; defer to architecture phase.
5. **Data retention period after account/organisation cancellation** (NFR-PRIV-002) — no policy has been approved yet; this is a new decision requiring product-owner input, not just a number.
6. **AI usage/rate limit for the platform-provided AI option** (NFR-AI-008, NFR-SEC-013) — blocked on the still-open cost/usage-limit model decision for FR-AI-005.
7. **Concurrent user / load capacity baseline** underlying the "expected load" language in NFR-PERF-001 and NFR-PERF-002 — recommend deferring until real usage data exists.
8. **"Typical" configurable-field count threshold** for NFR-DYN-002 — recommend defining once real organisation template customization data is available, same posture as item 1.
9. **Exact configuration/template version identifier display mechanism** for NFR-CFG-004/NFR-AI-010 — the capability is required; its exact surfacing (e.g., a version badge vs. a detail-panel field) is a design-phase decision, not an NFR-layer one.

These open items do not block progress to technical design, except where a requirement explicitly states a dependency (e.g., NFR-AI-008 depends on the AI cost model decision, which should be resolved before AI provider selection).

---

# Note on Scope Introduced at This Layer

Two areas (Accessibility and Mobile/Responsive Behaviour) were not previously mentioned in vision.md or prd.md. They have been included here because they were raised and approved during this review, but for full traceability it is recommended that vision.md/product-decisions.md be updated to reflect them as product-level decisions, not only as NFRs. This is noted for awareness and does not require action before proceeding.

---

**This document does not proceed to technical architecture, database design, API design, or UX design. It defines quality expectations only, for use as input to those future phases.**