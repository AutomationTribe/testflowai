# Requirements Traceability

**Status:** API design, user-flow design, and design-direction/design-system stages complete. Database (logical + physical) design complete. Wireframe/visual UI design and test design have not yet begun.

**⚠ Partially re-baselined (Organisation QA Operating Model pivot — CHANGE-001, see `requirements-change-log.md` and `product-decisions.md` PD-049–PD-063):** Product-definition, **Functional Requirements/User Stories/Non-Functional Requirements**, **Database (logical + physical)**, **API contracts**, **Architecture**, and now **User Flows are re-baselined**. **Design documentation is NOT yet re-baselined** (the final remaining stage). DB Table and API Operation mappings cover ALL FR IDs, including the 45 CHANGE-001 net-new ones and the 4 generalized ones — see the dedicated tables below. Module-level Architecture and User Flow mapping tables are also included below. Design (visual/screen) mappings remain genuinely unmapped ("Pending — CHANGE-001") pending the final re-baseline stage.

This document maps each functional requirement to the API operation(s) that support it, the database table(s) it's backed by, and the user flow(s) that walk through it end-to-end (all completed design stages). **UI (wireframe) and Test columns are marked "Pending" throughout**, except where the FR's user flow corresponds to one of the two representative screens (Dashboard, Test Case Management) used to validate the approved design direction — those rows are marked "Design direction validated" in the UI column. This reflects that the *visual direction* (see `docs/design/design-direction.md` and `docs/design/design-system.md`) has been validated for that area, not that a wireframe/screen specification exists yet.

Legend: DB tables reference `docs/technical/schema.sql`. API operations reference `docs/technical/api/*.md`. User flows reference `docs/design/user-flows/*.md` (`UXF-XXX`).

**CHANGE-002 (Methodology-Neutral QA Scope, bounded requirement change — see `requirements-change-log.md`):** two new FRs (FR-QAOM-013, FR-RPT-006) are mapped below alongside the existing CHANGE-001 rows. All other CHANGE-001 mappings are unchanged.

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
| FR-REQ-003 | Create Test Case (optional link) (`test-cases.md`) | `test_cases` | UXF-004, UXF-006 | Design direction validated | Pending |
| FR-REQ-004 | Archive Requirement (`requirements.md`) | `requirements`, `test_cases`, `qa_documents` (formerly `reports`), `test_runs` | UXF-005 | Pending | Pending |
| FR-TC-001 | Create Test Case (`test-cases.md`) | `test_cases` | UXF-006 | Design direction validated | Pending |
| FR-TC-002 | Edit Test Case (`test-cases.md`) | `test_cases` | UXF-006 | Design direction validated | Pending |
| FR-TC-003 | View/List Test Case Versions (`test-cases.md`) | `test_case_versions` | UXF-006 | Design direction validated | Pending |
| FR-TC-004 | Create Test Run (`test-runs.md`) | `test_run_test_cases` | UXF-010 | Pending | Pending |
| FR-TC-005 | Edit Test Case (`setApproved`, no_approval shape); Perform Workflow Action (stronger shapes) (`test-cases.md`, `workflows.md` — CHANGE-001/generalized) | `test_cases` | UXF-006 | Design direction validated | Pending |
| FR-TC-006 | Create Test Case (`test-cases.md`) | `test_cases` | UXF-006 | Design direction validated | Pending |
| FR-TC-007 | Add/List Test Case Comments (`test-cases.md`) | `test_case_comments` | UXF-006 | Design direction validated | Pending |
| FR-TC-008 | Templates (rewritten: draft/publish/fields/options) (`templates.md` — CHANGE-001/generalized) | `test_case_templates` | UXF-008 | Pending | Pending |
| FR-TC-009 | Add/Remove Test Case from Suite; View Suite Contents (`test-cases.md`, `test-suites.md`) | `test_suite_memberships` | UXF-007 | Pending | Pending |
| FR-TC-010 | Create Test Case; Save AI Drafts (`test-cases.md`, `ai.md`) | `test_cases` | UXF-006, UXF-009 | Design direction validated | Pending |
| FR-AI-001 | Trigger Generation (server-resolved template) (`ai.md` — CHANGE-001/generalized) | `ai_generation_requests` | UXF-009 | Design direction validated | Pending |
| FR-AI-002 | Check Status/Retrieve Drafts; Save Selected Drafts (`ai.md`) | `test_cases` | UXF-009 | Design direction validated | Pending |
| FR-AI-003 | (project-level config — no dedicated endpoint documented yet) | — | Not yet designed — flagged gap | Pending | Pending |
| FR-AI-004 | Trigger Generation (`ai.md`) | `ai_generation_requests` | UXF-009 | Design direction validated | Pending |
| FR-AI-005 | Trigger Generation (`ai.md`) | `ai_generation_requests` | UXF-009 | Design direction validated | Pending |
| FR-TS-001 | Create Test Suite (`test-suites.md`) | `test_suites` | UXF-007 | Pending | Pending |
| FR-TS-002 | (see FR-TC-009) | `test_suite_memberships` | UXF-007 | Pending | Pending |
| FR-TR-001 | Create Test Run (`test-runs.md`) | `test_runs` | UXF-010 | Pending | Pending |
| FR-TR-002 | Create Test Run (`test-runs.md`) | `test_run_test_cases` | UXF-010 | Pending | Pending |
| FR-TR-003 | Close Test Run (`test-runs.md`) | `test_runs` | UXF-010 | Pending | Pending |
| FR-TR-004 | View Test Run; View Project Dashboard (`test-runs.md`, `dashboards.md`) | `execution_results` | UXF-010, UXF-014 | Design direction validated | Pending |
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
| FR-TRACE-002 | List/Search Test Cases (`test-cases.md`) | `test_cases` | UXF-004, UXF-006 | Design direction validated | Pending |
| FR-RPT-001 | Generate/List Reports (`reports.md`) | `qa_documents` (formerly `reports`; CHANGE-001/DBD-016 — still the same product-facing `/reports` API path, `reports.md`) | UXF-013 | Pending | Pending |
| FR-RPT-002 | Generate Report; View Report (`reports.md`) | `qa_documents` (formerly `reports`) | UXF-013 | Pending | Pending |
| FR-RPT-003 | Approve/Reject Report via Link (`links.md`); see Report Approval vs. Document Workflow (`workflows.md` — CHANGE-001/generalized) | `report_approval_records` (now references `qa_documents`) | UXF-012, UXF-013 | Pending | Pending |
| FR-RPT-004 | Comment on Report via Link; View Report Comments (`links.md`, `reports.md`) | `report_comments` (now references `qa_documents`) | UXF-012, UXF-013 | Pending | Pending |
| FR-DASH-001 | View Project Dashboard (`dashboards.md`) | (aggregated, no dedicated table) | UXF-014 | Design direction validated | Pending |
| FR-DASH-002 | View Project Dashboard (`dashboards.md`) | `execution_results` | UXF-014 | Design direction validated | Pending |
| FR-DASH-003 | View Dashboard via Link (`links.md`) | (aggregated) | UXF-012, UXF-014 | Design direction validated | Pending |
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

## New/Generalized FR IDs from CHANGE-001 (Organisation QA Operating Model)

The following FR IDs were introduced or generalized by the CHANGE-001 re-baseline of `functional-requirements.md`. **DB Table and API Operation mappings are now established** (database and API re-baselines complete — see `docs/technical/database.md` §12, `docs/technical/schema.sql`, and `docs/technical/api/qa-configuration.md`, `templates.md`, `workflows.md`, `project-policy.md`, `quality-gates.md`, `severity-priority.md`). **User-flow mappings remain genuinely unmapped**, pending the architecture and user-flow re-baseline stages.

| FR ID(s) | Module | DB Table(s) | API Operation(s) | User Flow(s) |
|---|---|---|---|---|
| FR-QAOM-001–003, 007, 011 | QA Setup / Presets | `qa_configuration_versions` | List Presets; Start/Retrieve Draft (`qa-configuration.md`) | Pending — CHANGE-001 |
| FR-QAOM-004–006 | Preset Definitions | `qa_configuration_versions`, `workflow_definitions`, `qa_artifact_policies`, `quality_gate_definitions`, `qa_configuration_version_templates` | Start Configuration Draft (preset materialization) (`qa-configuration.md`) | Pending |
| FR-QAOM-008, 009 | Draft/Publish/Versioning | `qa_configuration_versions` | Update/Publish Draft; Retrieve Current/Version History (`qa-configuration.md`) | Pending |
| FR-QAOM-010 | Governance Catalogue | `workflow_definitions`, `qa_artifact_policies`, `quality_gate_definitions` (the catalogue is the union of these tables' configurable columns) | Update Configuration Draft (`qa-configuration.md`) | Pending |
| FR-QAOM-012 | Project Pinning | `projects.qa_configuration_version_id` | (resolved server-side on project creation/reads — `projects.md`, `project-policy.md`) | Pending |
| FR-QAOM-013 **[CHANGE-002]** | Preferred Scope Terminology | `organisations.preferred_scope_terminology` | View/Update Organisation Settings (`preferredScopeTerminology`) (`users.md`) | UXF-019 |
| FR-TPL-001–004 | Structured Fields | `document_template_fields`, `document_template_field_options` | Add/Update/Remove Field; Configure Field Options (`templates.md`) | Pending |
| FR-TPL-005 | Default Templates | `document_templates`, `document_template_versions`, `document_template_fields` (seeded rows, app-layer) | Create Template (default-seeded) (`templates.md`) | Pending |
| FR-TPL-006–008 | Draft/Publish/History | `document_template_versions` | Retrieve/Start Draft; Publish Template; List/Retrieve Versions (`templates.md`) | Pending |
| FR-TPL-009 | Applicable Version Resolution | `test_cases.document_template_version_id`, `qa_documents.document_template_version_id`, `qa_configuration_version_templates` | (resolved server-side on Test Case/QA Document creation — `test-cases.md`, `reports.md`) | Pending |
| FR-WF-001, 002 | Workflow Shapes/Config | `workflow_definitions` | Update Configuration Draft (workflow shapes) (`qa-configuration.md`) | Pending |
| FR-WF-003 | Meta-State/Label Split | `workflow_state_labels`, `workflow_instances.current_meta_state` | Perform Workflow Action (`workflowState`/`availableActions`) (`workflows.md`) | Pending |
| FR-WF-004 | Unapproved-Execution Setting | `test_cases.current_meta_state`, `execution_results` (enforcement point) | Test Run item read (`executionEligible`); Record Execution Result (`workflows.md`, `test-runs.md`) | Pending |
| FR-WF-005 | Report Workflow | `qa_documents.current_meta_state`, `workflow_instances`, `report_approval_records` | Perform Workflow Action; Report Approval vs. Document Workflow (`workflows.md`, `reports.md`) | Pending |
| FR-WF-006 | Permission Checkpoints | (enforced against `users.role`; no new table — see database-decisions.md DBD-015 note) | (enforced per-operation across `qa-configuration.md`/`templates.md`/`workflows.md`/`project-policy.md`/`quality-gates.md` — no dedicated endpoint) | Pending |
| FR-POL-001 | Required Artifacts | `qa_artifact_policies` | Update Configuration Draft (artifactPolicies) (`qa-configuration.md`) | Pending |
| FR-POL-002 | Inheritance | `projects.qa_configuration_version_id` | Retrieve Effective Project Configuration (`project-policy.md`) | Pending |
| FR-POL-003, 004 | Overridable/Override | `project_artifact_policy_overrides`, `project_quality_gate_overrides` | Apply/Remove Project Artifact-Policy/Quality-Gate Override (`project-policy.md`) | Pending |
| FR-POL-005 | Effective Config Visibility | `qa_artifact_policies` + `project_artifact_policy_overrides` (read together) | Retrieve Effective Project Configuration (`project-policy.md`) | Pending |
| FR-QG-001, 002 | Gate Catalogue/Config | `quality_gate_definitions`, `project_quality_gate_overrides` | Update Configuration Draft (qualityGates) (`qa-configuration.md`) | Pending |
| FR-QG-003, 004 | Evaluation/Reasons | (computed on demand from `quality_gate_definitions` + live data — no dedicated table, DBD-021) | Evaluate Project Readiness (`quality-gates.md`) | Pending |
| FR-TC-011 | Test Case Priority | `test_cases.priority_option_id`, `document_template_field_options` | Create/Edit Test Case (`priorityOptionId`) (`test-cases.md`) | Pending |
| FR-DEF-007 | Defect Severity | `defects.severity_semantic`, `defect_severity_labels` | Log Defect; Update Defect Severity/Priority; Severity Representation (`defects.md`) | Pending |
| FR-DEF-008 | Defect Priority | `defects.priority_option_id`, `defect_priority_options` | List/Configure Defect Priority Options (`severity-priority.md`) | Pending |
| FR-RPT-005 | Regression Report | `qa_documents` (document_type='regression_report') | Generate/List/View Regression Report (`reports.md`) | Pending |
| FR-RPT-006 **[CHANGE-002]** | QA Scope Metadata | `qa_documents.scope_value`/`.scope_start_date`/`.scope_end_date` | Generate/View/List Report & Regression Report (`scopeValue`/`scopeStartDate`/`scopeEndDate`) (`reports.md`) | UXF-013, UXF-030 |
| FR-DASH-004 | Readiness Widget | (reads FR-QG-003's on-demand evaluation — no dedicated table) | View Project Dashboard (`readiness` field) (`dashboards.md`) | Pending |
| FR-AUD-005 | Config Change Audit | `audit_log_entries` (existing generic table, new `action_type` values — no schema change) | (audit side-effect documented per operation across new modules — no dedicated endpoint) | Pending |
| FR-NOT-006, FR-NOT-007 | Config/Workflow Notifications | `notifications` (existing generic table, new `type` values — no schema change) | (notification side-effect documented per operation — `qa-configuration.md`, `workflows.md`) | Pending |
| FR-AI-006 | AI Template Validation | `ai_generation_requests.document_template_version_id` | Trigger Generation; Check Generation Status (template validation) (`ai.md`) | Pending |
| FR-TC-005 | Test Case Approval (generalized) | `test_cases.current_meta_state`, `workflow_instances`, `workflow_transitions` | Edit Test Case (`setApproved`); Perform Workflow Action (`test-cases.md`, `workflows.md`) | Pending |
| FR-TC-008 | Template Creation (generalized) | `document_template_versions`, `document_template_fields`, `test_cases.document_template_version_id` | Create Test Case (server-resolved template) (`test-cases.md`) | Pending |
| FR-AI-001 | AI Generation (generalized) | `ai_generation_requests.qa_configuration_version_id`/`.document_template_version_id` | Trigger Generation (server-resolved template) (`ai.md`) | Pending |
| FR-RPT-003 | Report Approval (generalized) | `report_approval_records` (now references `qa_documents`) | Perform Workflow Action vs. Report Approval separation (`workflows.md`, `reports.md`) | Pending |

## Architecture Mapping for CHANGE-001 FR Modules

Per the architecture re-baseline (`architecture.md`'s "CHANGE-001 — Organisation QA Operating Model" section, `architecture-decisions.md` AD-014–026), each re-baselined FR module maps to exactly one owning architecture module — no fabricated per-FR-ID granularity, since architecture ownership is a module-level property, not a per-requirement one:

| FR Module | Owning Architecture Module |
|---|---|
| FR-QAOM-* | QA Configuration & Policy |
| FR-TPL-* | Template Engine |
| FR-WF-* | Workflow (+ Test Case Management / QA Documents for the denormalized state they own) |
| FR-POL-* | QA Configuration & Policy (merged, AD-015) |
| FR-QG-* | Quality Gate / Readiness |
| FR-TC-011 | Template Engine (Priority as a Dropdown field) + Test Case Management |
| FR-DEF-007, FR-DEF-008 | Defect Management (AD-016) |
| FR-RPT-005 | QA Documents |
| FR-DASH-004 | Reporting & Dashboards (embeds Quality Gate/Readiness, no independent calculation) |
| FR-AUD-005 | Audit/History (existing mechanism, extended event coverage) |
| FR-NOT-006, FR-NOT-007 | Notifications (existing mechanism, extended event coverage) |
| FR-AI-006 | AI Test Generation (+ Template Engine for validation) |
| FR-TC-005 (generalized) | Test Case Management + Workflow |
| FR-TC-008 (generalized) | Test Case Management + Template Engine |
| FR-AI-001 (generalized) | AI Test Generation + QA Configuration & Policy (Effective Configuration Resolver) + Template Engine |
| FR-RPT-003 (generalized) | QA Documents (BA/PO link approval, unchanged mechanism) + Quality Gate/Readiness (as an optional gate input only) |

## User Flow Mapping for CHANGE-001 FR Modules

Per the user-flow re-baseline (`docs/design/user-flows/13-qa-operating-model-and-governance.md` and the CHANGE-001 addenda in `01-`, `02-`, `04-`, `06-`, `07-`, `09-onboarding/test-case/execution/defect/reporting` files), each re-baselined FR module maps to the UXF ID(s) that represent it. Design (visual/screen) mappings remain **Pending — CHANGE-001** until the design re-baseline stage — not fabricated here.

| FR Module | UXF ID(s) |
|---|---|
| FR-QAOM-* | UXF-018, UXF-019, UXF-020 |
| FR-TPL-* | UXF-021, UXF-022 |
| FR-WF-* | UXF-023, UXF-029 |
| FR-POL-* | UXF-024 |
| FR-QG-* | UXF-025, UXF-027 |
| FR-TC-011 | UXF-022 (Priority as a configured field) |
| FR-DEF-007, FR-DEF-008 | UXF-011 addendum (Severity/Priority/release-blocking) |
| FR-RPT-005 | UXF-030 (Regression Report) |
| FR-DASH-004 | UXF-014 addendum (readiness summary tile) |
| FR-AUD-005 | UXF-015 (unchanged mechanism, extended coverage — no new flow) |
| FR-NOT-006, FR-NOT-007 | UXF-016 (unchanged mechanism, extended coverage — no new flow) |
| FR-AI-006 | UXF-028 |
| FR-TC-005 (generalized) | UXF-029 |
| FR-TC-008 (generalized) | UXF-021, UXF-022 |
| FR-AI-001 (generalized) | UXF-028 |
| FR-RPT-003 (generalized) | UXF-013 addendum, UXF-027 |
| FR-WF-004 (execution eligibility enforcement) | UXF-026 |

Design (visual/screen) mappings remain **Pending — CHANGE-001**, unaffected by this stage.

## Notes on Coverage

- **FR-AI-003** (optional per-project AI provider key configuration) has no documented endpoint or user flow — flagged consistently since the API design phase (`api-decisions.md` consistency review) and again in the user-flow gap analysis (`docs/design/user-flows/12-ux-gap-analysis-and-decisions.md`). Needs a small settings screen and a small API addition in a future pass — not invented here.
- **FR-NOT-002, FR-NOT-004, FR-NOT-005** have no dedicated endpoint or flow by design — they describe delivery-channel/background behaviour, not user-invokable actions.
- **FR-IMP-001–003** are correctly unbuilt and undesigned — Post-MVP, per approved scope.
- **UI** and **Tests** columns remain "Pending" — wireframe/visual design and test design have not started. This will be updated as those phases complete.
- **CHANGE-001 new/generalized FR IDs** (table above) now have DB Table and API Operation mappings (database and API re-baselines complete); user-flow mappings remain genuinely unmapped — this is expected at this stage of the re-baseline and is not a defect in this document.
- **`reports` → `qa_documents` DB Table references** in the main table above (FR-REQ-004, FR-RPT-001–004) have been corrected to reflect DBD-016's rename/generalization; the API operation names and paths for these rows (`reports.md`) are **unchanged** — see APID-016: the public `/reports` path was deliberately kept for Test Report, so no API-column correction was needed there, only the underlying DB Table name. FR-DASH-003 and FR-LNK-001/003/005 reference `access_links`/aggregated data, not `reports` directly, and were already accurate.
