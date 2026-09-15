# Requirements Change Log

This log records major changes to TestFlow AI's approved product requirements — pivots, scope changes, and significant reversals — as distinct from the incremental decision-by-decision record kept in `product-decisions.md`. Each entry here corresponds to a body of related product decisions, not a single one.

---

## CHANGE-001 — Organisation QA Operating Model (Product Pivot)

**Date:** 2026-09-03

**Status:** Product-definition layer updated and approved (`vision.md`, `prd.md`, `product-decisions.md`). **Downstream artifacts are pending re-baseline** — see "Downstream Impact" below. Do not treat Functional Requirements, database, API, architecture, user flows, or design documentation as already reflecting this change; they still describe the pre-pivot model until explicitly re-baselined.

### Previous Model
TestFlow primarily used fixed QA semantics and a single hard-coded QA process. "Templates" existed only as an organisation-scoped, opaque pre-population structure (`test_case_templates`/`report_templates`, a single `default_structure` JSON blob) with no field-level schema, no versioning, and no distinction between system and configurable fields. Document/record status (test case approval, defect status) was a fixed system enum, identical for every organisation. Test case approval was self-service only, with no configurable alternative (PD-048). Report approval was record-only with no path to becoming consequential (PD-039). No concept of project policy, release/quality gates, document workflow configuration, or organisation-level QA governance existed. Roles were fixed and uniform across all organisations, with no permission checkpoints for configuration actions (none existed to gate).

### New Model
TestFlow retains stable, platform-controlled semantics where execution, traceability, historical integrity, AI validation, or reporting require them (the six first-class system entities: Requirement, Test Case, Test Suite, Test Run, Execution Result, Defect; execution result status; test run lifecycle status). Above that stable core, each organisation defines and governs its own **QA Operating Model**: a structured Template System (system vs. configurable fields, TestFlow-provided defaults), a bounded set of document-workflow shapes (No Approval / Single Approval / Review + Approval), organisation QA policy and project-level policy with governed, audited overrides, and a bounded Quality Gate catalogue for release readiness — all under a formal configuration hierarchy (TestFlow System Semantics → Organisation QA Operating Model → Project Effective QA Configuration → Document/Execution Instance). Test Report and Regression Report are added as built-in configurable QA document types. Published configuration is versioned and immutable. AI generation becomes template/configuration-aware. The existing three-role model is retained; configuration authority is layered on via permission checkpoints, not custom roles. Onboarding gains an Organisation QA Setup step, conceptually mandatory but instantly satisfiable via a TestFlow-provided starting preset (Standard QA, Lightweight QA, Controlled QA, or Custom Setup) — not a mandatory manual wizard.

### Reason
Product clarification established that QA organisations need to define and govern their own QA operating process — document requirements, templates, approvals, policies, and release readiness — rather than conform to a single QA process hard-coded into TestFlow. A comprehensive read-only impact analysis (performed prior to this change) confirmed the clarified principle is compatible with TestFlow's existing execution/traceability core, and identified the specific prior decisions (PD-039, PD-048) that needed explicit, non-silent resolution rather than either being ignored or being silently overwritten.

### Impact
**High/Fundamental** across product requirements, the template model, document workflow, project policy, database, API, AI integration, and UX. The execution/traceability core (Requirement → Test Case → Test Suite → Test Run → Execution Result → Defect, and its versioning/immutability guarantees) and the approved visual design foundation are **largely retained** — this is a major extension of the governance/configuration layer around a retained execution core, not a rebuild of the core itself. See the prior impact analysis for the full area-by-area breakdown (Impact Matrix) and the `docs/product/product-decisions.md` PD-049–PD-063 series for the resolved decisions.

### Superseded / Generalized Decisions
- **PD-048** (Test Case Approval Simplified) — **generalized by PD-049**. Self-service behaviour is retained as the default/lightweight workflow shape; it is no longer the only behaviour every organisation must use.
- **PD-039** (Report Approval Is Record-Keeping Only) — **generalized by PD-050**. The record-only default is retained; an organisation may now configure a Quality Gate that depends on this record, without report approval itself becoming a generic blocking mechanism.
- No other existing product decision was altered. PD-009 (Template Scope — organisation-scoped templates) remains valid and is extended, not superseded, by PD-053's structured field model.

### Downstream Impact (Pending Re-Baseline) — Updated After Stage 2
**Stage 1 (product-definition layer)** — complete: `vision.md`, `prd.md`, `product-decisions.md` (PD-049–PD-063).

**Stage 2 (Functional Requirements / User Stories / Non-Functional Requirements)** — complete as of this entry's update:
- `docs/product/functional-requirements.md` — new modules QAOM (12 FRs), TPL (9 FRs), WF (6 FRs), POL (5 FRs), QG (4 FRs); new FR-TC-011, FR-DEF-007/008, FR-RPT-005, FR-DASH-004, FR-AUD-005, FR-NOT-006/007, FR-AI-006; FR-TC-005, FR-TC-008, FR-AI-001, FR-RPT-003 generalized in place (IDs preserved, PD-049/PD-050/PD-060 applied). 144 total requirements (was 99).
- `docs/product/user-stories.md` — populated (was a placeholder) with 21 CHANGE-001-focused stories (US-QAOM-001–021); broader backfill of stories for pre-existing FR modules remains a separate future task, not attempted here.
- `docs/product/non-functional-requirements.md` — new categories CFG (Configuration Integrity, 4 NFRs) and DYN (Dynamic Field Validation & Performance, 2 NFRs); extended DI (+1), SEC (+1), AUD (+1), AI (+1), PERF (+1). 70 total requirements (was 59).
- `docs/product/requirements-traceability.md` — status banner updated to reflect Stage 2 completion; a dedicated table lists all 45 net-new/generalized FR IDs as explicitly unmapped (not fabricated) pending Stage 3.

**Stage 3 (Database — logical + physical)** — complete as of this entry's update:
- `docs/technical/database.md` — new §12 "CHANGE-001 — Organisation QA Operating Model (Database Re-Baseline)" (entity catalogue, changes to existing entities, configurable-field strategy, Step Table resolution, quality-gate parameter shapes, 2 new Mermaid ER diagrams, tenant-isolation and historical-integrity rules, explicit deferred-scope list). Pre-pivot §5 and the physical "Custom Fields and Templates" section marked superseded, retained for history.
- `docs/technical/database-decisions.md` — DBD-009 through DBD-023 (15 new decisions): structured template model, dynamic-field storage (hybrid typed-column + validated JSONB), system-field representation, aggregate configuration versioning, preset provenance (not a runtime dependency), project pinning (no migration at MVP), workflow storage (bounded shapes + shared instance model), `reports`→`qa_documents` generalization, test case approval status migration, defect status deliberately NOT made configurable (safeguard against over-applying the earlier impact analysis), defect severity (stable semantic + org label), priority model (template field for Test Case, dedicated table for Defect), quality gate configuration/results (bounded catalogue, on-demand evaluation, no results table), release-blocking-defect resolved as a gate parameter (no new Defect column), archive/deletion behaviour.
- `docs/technical/schema.sql` — 16 new tables; `reports` renamed/generalized to `qa_documents`; `test_case_templates`/`report_templates` removed; `test_cases`/`test_case_versions`/`test_run_test_cases`/`defects`/`projects`/`ai_generation_requests` modified; new indexes; execution-order note updated. Design/documentation only — not executed, no migrations created.
- `docs/product/requirements-traceability.md` — DB Table column now populated for all 45 CHANGE-001 FR IDs plus the 4 generalized ones; API/user-flow columns remain explicitly "Pending — CHANGE-001."

**No DATABASE-BLOCKING REQUIREMENTS GAP was found** — every schema question the task raised (release-blocking defect classification, regression-completion source) was resolvable directly from Stage 2's approved FR text.

**Stage 4 (API contract re-baseline)** — complete as of this entry's update:
- `docs/technical/api-spec.md` — new CHANGE-001 error codes, filtering boundary (dynamic fields not filterable except Priority/Severity), concurrency extension (`If-Match` on config/template drafts), idempotency targets extended.
- `docs/technical/api-decisions.md` — APID-010 through APID-020 (11 new decisions): QA configuration draft/publish contract, effective-project-configuration read resource, structured template contract (supersedes the pre-pivot template API), concurrency extension, dynamic field value contract (typed, stable keys, no raw JSONB passthrough), bounded workflow-action API with `availableActions`, `reports`→`qa_documents` naming compatibility (kept `/reports`, added `/regression-reports`, no mechanical rename), Priority/Severity API representation (semantic vs. label), bounded project-override contract, on-demand Project-level readiness contract (no Release entity, 3-state result), AI server-resolved template (no client `templateId`).
- New module docs: `docs/technical/api/qa-configuration.md`, `templates.md` (rewritten, supersedes the pre-pivot version), `workflows.md`, `project-policy.md`, `quality-gates.md`, `severity-priority.md`.
- Updated existing module docs: `test-cases.md` (workflow state, priority, configurable fields, template resolution), `defects.md` (severity, priority), `reports.md` (retitled to cover Regression Report; `qa_documents` compatibility), `ai.md` (server-resolved template, FR-AI-006 validation), `dashboards.md` (embedded readiness).
- `docs/product/requirements-traceability.md` — API Operation column populated for all 45 CHANGE-001 FR IDs and the 4 generalized ones; stale `reports`→`qa_documents` DB Table references corrected across the main table.

**No API-BLOCKING REQUIREMENTS GAP was found** — every API design question the task raised was resolvable from the already-approved FR/DB layer.

**Stage 5 (Architecture re-baseline)** — complete as of this entry's update:
- `docs/technical/architecture.md` — new "CHANGE-001 — Organisation QA Operating Model" section: final module map (5 new/merged modules — QA Configuration & Policy, Template Engine, Workflow, Quality Gate/Readiness, QA Documents — layered onto the retained execution core), dependency-direction diagram (explicitly avoiding the Test Case↔Workflow cycle), Effective Configuration Resolver ownership, configuration publication/preset-materialization/template-validation/execution-eligibility/AI-convergence architecture, 5 sequence diagrams (Publish, Test Case Creation, Workflow Approval, Execution Result with eligibility, Readiness Evaluation), transaction-boundary table, concurrency/idempotency/authorization/tenant-isolation/security/observability sections. Modular monolith, single database, single deployable **all explicitly retained** — no new infrastructure introduced.
- `docs/technical/architecture-decisions.md` — AD-014 through AD-026 (13 new decisions), including the module-boundary reasoning (merge QA Configuration+Policy; keep Template Engine, Workflow, Quality Gate, QA Documents separate; Defect Severity/Priority stay in Defect Management) and the resolution of the technical-evaluator-failure-vs-business-FAIL question (existing `500` error envelope, no new `not_evaluable` state).
- `docs/product/requirements-traceability.md` — new module-level Architecture Mapping table for all CHANGE-001 FR modules.
- `docs/technical/security.md` — reviewed, left unchanged: it is a pre-existing placeholder ("pending definition"), and populating it fully would be a broad rewrite outside this task's bounded scope; CHANGE-001's actual security considerations (Rich Text/URL/Entity-Link/Attachment input, AI prompt exposure, publish authorization) are documented in `architecture.md`'s new Security subsection instead, where they have proper context.

**No ARCHITECTURE-BLOCKING REQUIREMENTS GAP, ARCHITECTURE/API CONSISTENCY GAP, or ARCHITECTURE/DATABASE CONSISTENCY GAP was found** — every architectural question the task raised (module boundaries, dependency cycles, evaluator-failure semantics, edit-after-approval interaction with historical runs) was resolvable directly from the already-approved FR/DB/API layers.

**Stage 6 (User flow re-baseline)** — complete as of this entry's update:
- `docs/design/user-flows/13-qa-operating-model-and-governance.md` (new) — UXF-018 through UXF-028: QA Setup during onboarding, QA Operating Model Workspace + preset comparison, Configuration draft/validate/publish, Template Management, Template Builder, Workflow Configuration, Project Policy (org + project QA Settings), Quality Gate Configuration, Execution Eligibility (addendum to UXF-010), Project Readiness, AI Generation template-aware addendum (to UXF-009). 7 Mermaid diagrams included (onboarding+QA Setup, publish lifecycle, workflow shapes, policy inheritance, readiness, AI generate→validate→review→save).
- `docs/design/user-flows/00-user-flow-index.md` — catalogue updated with all new UXF IDs and a KEEP/GENERALIZE/MODIFY/SUPERSEDE/NEW classification per existing flow; navigation-areas list updated to include the QA Operating Model workspace and Project QA Settings/Readiness; new UXF-029 (Test Case Approval, three modes) and UXF-030 (Regression Report) added.
- `docs/design/user-flows/01-onboarding-and-subscription.md` — UXF-001 MODIFY (now routes into QA Setup, not directly to the project list).
- `docs/design/user-flows/02-project-setup.md` — UXF-003 MODIFY (project creation now auto-pins the published QA configuration; no manual version selection).
- `docs/design/user-flows/04-test-case-management.md` — UXF-006 GENERALIZE (organisation template/priority; self-service approval now conditional on configured workflow); UXF-008 SUPERSEDE by UXF-021/UXF-022; new UXF-029 (approval modes) added in-file.
- `docs/design/user-flows/06-test-execution.md` — UXF-010 GENERALIZE, cross-referencing new UXF-026 (execution eligibility); Test Case workflow state vs. execution result distinction reaffirmed.
- `docs/design/user-flows/07-defect-management.md` — UXF-011 GENERALIZE (Severity/Priority/release-blocking now three distinct fields).
- `docs/design/user-flows/09-reporting-and-dashboards.md` — UXF-013 GENERALIZE (template-driven); UXF-014 GENERALIZE (readiness summary tile); new UXF-030 (Regression Report) added in-file.
- `docs/product/requirements-traceability.md` — new User Flow Mapping table for CHANGE-001 FR modules (module-level, alongside the existing Stage 5 Architecture Mapping table).
- `docs/design/design-system.md`, `docs/design/design-direction.md` — **not modified**, per this stage's explicit boundary (context only); visual system remains as approved.

**No UX-BLOCKING PRODUCT GAP, UX/API CONSISTENCY GAP, or UX/REQUIREMENTS CONSISTENCY GAP was found.** One **UX PRODUCT ENHANCEMENT CANDIDATE** was recorded (Approval Inbox / consolidated work queue) — existing list+filter/saved-view surfaces were judged adequate for MVP; not designed, not blocking.

**Still not updated (Stage 7 — final):**
- `docs/design/design-system.md`, `docs/design/design-direction.md` — visual/component design for the ~11 new/modified screens identified in the Design Impact Inventory (QA Operating Model Workspace, Template Builder, Workflow Configuration, Project Policy, Quality Gates, Configuration Versions, Project Readiness, plus semantic updates to Test Case Management, Dashboard, Reports, Defects).
- `TASKS.md` — no implementation tasks created; none should be, until design is re-baselined (CLAUDE.md rule 10).

**Recommended next step:** re-baseline design (`design-system.md`/`design-direction.md`) to define the visual/component treatment for the new governance screens and the semantic updates to existing screens, per the Design Impact Inventory — the final CHANGE-001 re-baseline stage.

---

## CHANGE-002 — Methodology-Neutral QA Scope

**Problem:** In-progress visual design of the Test Report workspace exposed an accidental Scrum/Sprint assumption ("Sprint 17," "Sprint Test Report," "Sprint Readiness," "sprint sign-off," "sprint regression," "target sprint/release").

**Finding (read-only impact analysis performed prior to this change):** The approved underlying TestFlow model — requirements, database, API, architecture, and CHANGE-001's re-baselined user flows — was already methodology-neutral: a repository-wide search found no Scrum/Kanban/Waterfall/methodology concept anywhere, "release" was already used only as a plain-English readiness concept with an explicit no-Release-entity decision (FR-QG-003, AD-023), and the single literal "sprint" occurrence was one line of illustrative prose in `design-direction.md`, not a modelled requirement. The real, narrower gap: QA Documents (Test Report, Regression Report) had no neutral concept at all for what period/slice of work they cover, which is what led the in-progress design work to reach for "Sprint" by default.

**Resolution:** Introduce lightweight, methodology-neutral **QA Scope** metadata — optional `scopeValue`/`scopeStartDate`/`scopeEndDate` on Test Report and Regression Report (FR-RPT-006) — and an optional organisation **preferred scope terminology** setting (FR-QAOM-013), which is descriptive UI copy only and never alters application behaviour. Do **not** model Scrum/Kanban/Waterfall/Agile/SAFe as governed system concepts; do **not** introduce a Delivery Cycle, Sprint, Iteration, Phase, Release, or Test Cycle entity. Project Readiness remains Project-level and is not made scope-aware (PD-064).

**Classification:** **Bounded Requirement Change** — not a pivot. Confirmed by scope: one new PD (PD-064), two new FRs, three nullable columns on one existing table (`qa_documents`) plus one nullable column on `organisations`, no new table, no new API resource, no architectural change, and only small/copy-level user-flow and design-governance updates.

**Files changed:**
- `docs/product/product-decisions.md` — PD-064 (methodology-neutral QA Scope; supersedes nothing, extends PD-056/PD-057/PD-063/FR-QG-003's existing no-Release-entity posture).
- `docs/product/vision.md`, `docs/product/prd.md` — one-paragraph methodology-neutral principle statement each, referencing PD-064.
- `docs/product/functional-requirements.md` — FR-RPT-006 (Optional QA Scope on Test Report/Regression Report), FR-QAOM-013 (Organisation Preferred Scope Terminology, descriptive only); module index table updated; no existing FR modified.
- `docs/product/user-stories.md` — US-RPT-006, US-QAOM-022 added.
- `docs/technical/database.md`, `docs/technical/database-decisions.md` (DBD-024), `docs/technical/schema.sql` — `qa_documents.scope_value`/`.scope_start_date`/`.scope_end_date` (all nullable, one CHECK constraint for date order), `organisations.preferred_scope_terminology` (nullable). No new table; `test_runs` and readiness-related tables untouched.
- `docs/technical/api-decisions.md` (APID-021), `docs/technical/api/reports.md`, `docs/technical/api/users.md` — optional `scopeValue`/`scopeStartDate`/`scopeEndDate` on Generate/View/List Report & Regression Report; optional `preferredScopeTerminology` on Organisation Settings. No new endpoint/resource. `GET /projects/{projectId}/readiness` (APID-019) unchanged.
- `docs/technical/architecture.md` — one-sentence note that CHANGE-002 was reviewed and requires no architectural change; no new architecture-decisions.md entry needed.
- `docs/design/user-flows/09-reporting-and-dashboards.md` (UXF-013/UXF-030 addenda), `docs/design/user-flows/13-qa-operating-model-and-governance.md` (UXF-019 addendum), `docs/design/user-flows/00-user-flow-index.md` (catalogue notes) — optional QA Scope field added to report creation; optional org preferred-terminology field added to the QA Operating Model Overview. Test Run flows and Project Readiness flow (UXF-027) explicitly untouched.
- `docs/design/design-system.md` §17.1 (new) — design-governance rule against hard-coding Sprint/Iteration/Phase/Release/Cycle as universal terminology.
- `docs/design/design-direction.md` — one copy/sample-data correction ("project/sprint context" → "project/QA Scope context"); explicitly not a redesign.
- `docs/product/requirements-traceability.md` — two new rows (FR-QAOM-013, FR-RPT-006); all CHANGE-001 mappings undisturbed.

**No new methodology enum, methodology engine, Sprint/Delivery Cycle/Test Cycle/Release entity was introduced.** Project Readiness remains Project-level; Test Runs remain independent execution containers; Quality Gates are unchanged; CHANGE-001 behaviour is fully preserved.

**Recommended next step:** none required to close this change — it is complete as a documentation-only bounded requirement change. The previously recommended Stage 7 (design re-baseline for CHANGE-001's governance screens) remains the next substantive product work; §17.1's new terminology rule should simply be applied when that stage's Test Report/Regression Report/QA Operating Model screens are specified.

---

## CHANGE-003 — Payment Provider: Paystack replaces Stripe

**Problem:** Stripe does not support payouts to Nigeria-based merchants, discovered after AD-027 (Stripe, Slice 1) was already implemented and shipped.

**Resolution:** Replace Stripe with Paystack as the payment provider, end-to-end (backend integration, webhook verification, frontend checkout UI, tests, docs). No product/functional requirement changes — FR-SUB-001/004/005/012 and NFR-REL-003/NFR-SEC-012 are unaffected; only the implementing vendor changes. Recorded as **AD-028** in `docs/technical/architecture-decisions.md`, which supersedes AD-027 (AD-027's reasoning — webhook-driven activation, backend-authoritative amount, no raw card storage — is preserved and carried forward unchanged).

**Classification:** **Technology decision, not a requirement change** — no PD/FR/user-story/database-schema-column change. Recorded here only because it touches a broad set of implementation files and is worth a permanent record of *why* the swap happened.

**Files changed:** `backend/src/lib/paystack.ts` (new, replaces `lib/stripe.ts`), `backend/src/config/env.ts`, `backend/src/modules/subscription/subscription.routes.ts`, `backend/src/modules/subscription/webhook.routes.ts`, `backend/migrations/0003_paystack_provider.sql` (renames `processed_stripe_events` → `processed_payment_events`), `backend/.env.example`/`.env`, `backend/package.json` (removes `stripe` dependency), `backend/tests/paystackMock.ts` (new, replaces `stripeMock.ts`), `backend/tests/subscription.test.ts`, `backend/tests/testUtils.ts`; `frontend/src/lib/paystackClient.ts` (new, replaces `stripeClient.ts`), `frontend/src/components/CheckoutForm.tsx`, `frontend/src/app/subscription/checkout/page.tsx`, `frontend/package.json` (removes `@stripe/*` dependencies), `frontend/.env.example`/`.env.local`, `frontend/tests/checkoutForm.test.tsx`; `e2e/playwright.config.ts`; `README.md`, `TASKS.md`.

**No change to `schema.sql`'s `payments`/`seat_batches`/`subscriptions` tables** — same reasoning as AD-027 for not persisting a provider transaction ID.

**Recommended next step:** none required to close this change. A real Paystack test-mode secret/public key pair must still be configured (`backend/.env`'s `PAYSTACK_SECRET_KEY`, `frontend/.env.local`'s `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`) before real Monthly/Yearly checkout can be exercised manually.

**Addendum (2026-09-12) — USD/NGN currency:** With real test-mode keys configured, real checkout surfaced a further constraint: this merchant's Paystack account only settles in NGN — `currency: "USD"` is rejected outright (`unsupported_currency`); USD requires Paystack's own multi-currency approval, not yet granted. Rather than changing the approved USD pricing (FR-SUB-004/005), a fixed USD→NGN exchange-rate constant was added in `backend/src/lib/paystack.ts` (`USD_TO_NGN_RATE`) that converts the amount only at the point of calling Paystack — the UI, backend amount calculation, and billing history all remain USD throughout; the original USD amount travels through as `usdAmountCents` in the transaction metadata so the webhook reconciles against the quoted price, not the NGN amount actually settled. Documented as an addendum to AD-028 rather than a new decision, since it changes an implementation detail, not the provider choice. **Known limitation:** the exchange rate is a manually-set constant, not a live FX feed — it will drift from the real market rate over time and needs periodic manual updates until USD is enabled on the account (at which point this conversion step can simply be removed).
