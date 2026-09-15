# TestFlow AI — Database Decisions

This log records **database design decisions** explicitly approved by the product owner during database discovery and logical design. It follows the same convention as `docs/product/product-decisions.md`: each entry reflects a decision actually approved, not an engineering recommendation alone. Recommendations that were **not** explicitly approved are not recorded here as decisions — they are flagged as open items in `docs/technical/database.md` instead.

---

## DBD-001 — User-to-Organisation Cardinality

**Decision:** A User account belongs to exactly one Organisation. A user cannot be a member of more than one organisation.

**Reason:** Keeps the identity model simple — no "current organisation context" switching, no cross-organisation membership table needed. Role and organisation membership can live directly on the User record rather than in a separate join entity.

**Alternatives Considered:** Many-to-many (one user account able to join multiple organisations, each with its own role), which was the initially recommended option for flexibility (e.g., a consultant working across multiple client organisations). Rejected in favor of the simpler model.

**Consequences:** Anyone needing access to two organisations (e.g., an external consultant) requires two separate accounts/logins, one per organisation. This is an accepted trade-off, not a gap.

**Status:** Approved

---

## DBD-002 — Test Case to Test Suite Cardinality

**Decision:** A Test Case can belong to multiple Test Suites, and a Test Suite can contain multiple Test Cases (many-to-many).

**Reason:** Supports reuse of a test case across more than one suite (e.g., a login test case relevant to both a Smoke suite and a Regression suite) without duplicating the test case.

**Alternatives Considered:** One suite per test case (simpler "folder" model, one-to-many). Rejected in favor of reuse.

**Consequences:** Requires a relationship entity (Test Suite Membership) between Test Case and Test Suite. Suite-level reporting/progress must account for a test case's results being relevant to more than one suite simultaneously.

**Status:** Approved

---

## DBD-003 — Test Case Versioning Granularity

**Decision:** Only "significant" edits to a Test Case create a new, immutable version record. Minor edits mutate the current version's content in place, with no historical trace of the pre-edit state.

**Reason:** Reduces storage/complexity from versioning every keystroke-level change; "significant" edits (the ones that matter for approval history and traceability) are what's preserved.

**Alternatives Considered:** Version every edit unconditionally (originally recommended, to avoid ambiguity and guarantee an exact content snapshot always exists for any approval decision). Rejected in favor of the lighter-weight approach.

**Consequences:**
- **Resolved:** a "significant" edit is defined as one that changes the entire test case (a full content replacement — steps and expected results wholesale), as opposed to a partial edit (e.g., a single step, a wording tweak), which mutates the current version in place with no history.
- A minor, unversioned edit still reverts an Approved test case to Needs Review (FR-TC-005, per PD-048 — this rule applies to *any* edit, not just significant ones). This means the content a test case is re-approved against is whatever is currently live at approval time, not necessarily a preserved historical snapshot of "what changed."
- This is independent of test run snapshots (FR-TC-004): a test run always captures a frozen copy of test case content at the moment the run is created, regardless of whether that moment coincides with a "significant" version. Historical execution results remain accurate even though general test case version history is sparse.

**Status:** Approved

---

## DBD-004 — Requirement Versioning

**Decision:** Requirements do not version. Only the current content of a requirement is stored; there is no historical record of prior requirement content.

**Reason:** Keeps the Requirement entity simple; requirement versioning was not called for by any approved functional requirement.

**Alternatives Considered:** Version requirements the same way test cases version (originally recommended, to preserve exactly what a requirement said at the moment a test case was approved against it). Rejected.

**Consequences:** The re-review trigger on requirement edit (PD-033, FR-REQ-002) can still fire correctly (it only needs to know *that* an edit occurred, via an edit timestamp/event), but it will not be possible to show a QA Manager or auditor "what the requirement said when this test case was originally approved" — only that it changed since. This is a traceability limitation accepted as a trade-off.

**Status:** Approved

---

## DBD-005 — Minimum-One-Admin Enforcement Scope

**Decision:** The "an organisation must always retain at least one Admin" rule (PD-030) is enforced per organisation, independently for each organisation.

**Reason:** Consistent with PD-013, which already establishes that the Admin role is scoped per organisation, not system-wide. Also consistent with DBD-001 (one user belongs to exactly one organisation), which makes a global interpretation moot in practice.

**Alternatives Considered:** A global, per-user interpretation of "last Admin" was raised during discovery but conflicted with PD-013 and was not adopted.

**Consequences:** None beyond confirming existing product decisions; this is a low-risk clarification rather than a new behavioural choice.

**Status:** Approved

---

## DBD-006 — Archive / Status Pattern

**Decision:** A single, consistent status/archive pattern (active vs. archived) is used across entities that support archiving, rather than each entity inventing its own bespoke status vocabulary.

**Reason:** Consistency across the schema simplifies reasoning about "is this record live or retired" and reduces the chance of inconsistent archive semantics between modules.

**Alternatives Considered:** Entity-specific status enums tailored to each entity's actual state machine (e.g., Test Run having more than two states). This was the initially recommended approach specifically because Test Run's lifecycle is not a simple active/archived binary.

**Consequences:** Applying this decision literally to **Test Run** created a tension: Test Run requires at least three distinct states (Open, Closed, Cancelled-and-Archived-via-cascade — see FR-TR-003, PD-034, PD-037), which do not fit a two-value active/archived pattern without losing meaningful information. **Resolved:** the three-value model (`open`/`closed`/`cancelled_archived`) is confirmed as correct and final for Test Run, as an approved exception to the otherwise two-value pattern used elsewhere.

**Status:** Approved (including the confirmed three-value exception for Test Run)

---

## DBD-007 — Identifier Strategy

**Decision:** Every table's primary key is a UUID, generated via PostgreSQL's `gen_random_uuid()` (pgcrypto extension). No auto-incrementing integer keys are used.

**Reason:** Approved during physical database design as the strategy for all tables. UUIDs avoid leaking business information through sequential IDs (e.g., inferring total organisation or user counts) and are the standard approach for multi-tenant SaaS on PostgreSQL. They are also relevant to the Access Link mechanism (PD-043), where the identifier itself functions as an unguessable credential — an auto-incrementing integer would be trivially enumerable.

**Alternatives Considered:**
- Auto-incrementing integer (bigserial) — simpler, more compact, marginally faster joins/indexes, but sequential and guessable, which is a real weakness given Access Links have no identity verification.
- Hybrid (UUID for tenant-facing/security-sensitive entities, bigserial for high-volume internal tables like Audit Log Entry/Notification) — rejected in favor of a single, consistent strategy across all tables, avoiding the added complexity of two identifier types.

**Consequences:** Slightly larger storage footprint and index size per row compared to integers (not a meaningful concern at MVP scale). All 29 tables use the same identifier pattern, simplifying schema generation and reasoning about foreign keys throughout.

**Status:** Approved

---

## DBD-008 — Defect Status Vocabulary

**Decision:** A defect's status is one of exactly four values: `Open`, `Pending`, `Closed`, `Removed`.

**Reason:** Resolves the placeholder vocabulary used during physical database design (previously `open`/`in_progress`/`resolved`, explicitly flagged as unconfirmed).

**Alternatives Considered:** The placeholder set used during initial physical design — superseded, not a real alternative under consideration.

**Consequences:** `defects.status` CHECK constraint and the corresponding API contract both use this exact four-value set. A defect starts in `Open` when logged (FR-DEF-001).

**Status:** Approved

---

# CHANGE-001 — Organisation QA Operating Model: Database Decisions (DBD-009 through DBD-023)

The decisions below re-baseline the physical/logical database design against PD-049–PD-063 and the Stage 2 FR modules (QAOM, TPL, WF, POL, QG) and related FRs (FR-TC-005/008/011, FR-DEF-007/008, FR-RPT-003/005, FR-AI-001/006). See `docs/technical/schema.sql` for the resulting DDL and `docs/technical/database.md` for the full logical model and ER diagrams.

## DBD-009 — Structured Template Model: Shared Table Across Document Types, Real Columns for Execution Entities

**Decision:** Templates are modelled as a shared `document_templates` / `document_template_versions` / `document_template_fields` / `document_template_field_options` structure, used identically by Test Case, Test Report, and Regression Report (discriminated by a TestFlow-controlled `document_type` column). This supersedes the pre-pivot `test_case_templates`/`report_templates` tables and their opaque `default_structure` JSONB.

**Reason:** Template semantics (field definitions, draft/publish, versioning) are genuinely identical across the three document types (FR-TPL-001), so one shared model avoids duplicating that machinery three times. This does NOT genericize Test Case, Test Run, Execution Result, or Defect themselves — those remain first-class tables with real, typed columns; only their *template* (which governs presentation/configurable content, not execution semantics) is shared infrastructure.

**Alternatives Considered:** Separate template tables per document type — rejected as unnecessary duplication of identical machinery (PD-053 doesn't distinguish template mechanics by document type). A single table merging Template + Template Version — rejected; draft/publish/immutability requires the version to be a distinct, independently-referenceable row (see DBD-012's reasoning, same principle).

**Consequences:** `document_templates`, `document_template_versions`, `document_template_fields`, `document_template_field_options` in `schema.sql`. Step Table fields render the EXISTING `steps`/`expected_results` columns on Test Case (not dynamic content) — see DBD-010.

**Status:** Approved

## DBD-010 — Dynamic-Field Storage Strategy: Typed Columns for Recognized Concepts, Validated JSONB for the Rest

**Decision:** Configurable field VALUES are stored as: (a) a dedicated typed FK column (`priority_option_id`) for Test Case Priority specifically, because it is an explicitly recognized product concept (FR-TC-011) with real query/filter/gate needs (NFR-DYN-002, FR-QG-001); (b) a single `configurable_field_values jsonb` column per record (`test_cases`, `test_case_versions`, `test_run_test_cases`, `qa_documents`) for every other organisation-configured field, keyed by `document_template_fields.field_key`, validated at application-write-time against the record's `document_template_version_id`'s field definitions (NFR-DYN-001). System fields (title, requirement link, steps, etc.) remain real typed columns and are NEVER represented in this JSONB.

**Reason:** Pure EAV (one row per field value) was rejected as unjustified relational complexity and poor list/filter/sort performance at MVP scale (§8 of the task). Pure JSONB-for-everything was rejected because it would bury a recognized, gate-relevant concept (Priority) in unindexable content. The hybrid gives typed performance where it's actually needed and controlled flexibility everywhere else, with the applicable template version anchoring what schema governs the JSON at any point (satisfying "JSONB must not become an unvalidated dumping ground").

**Alternatives Considered:** EAV field-value rows — rejected (§8: list/filter/index complexity). Pure JSONB including Priority — rejected (§16: Priority is explicitly recognized, not arbitrary). Per-type nullable columns (`min_number`, `max_number`, `dropdown_options`, etc. as real columns on `document_template_fields`) — rejected in favour of the single `validation_config jsonb` column with a documented, field-type-scoped schema (see database.md), avoiding dozens of mostly-null columns.

**Consequences:** `configurable_field_values` on `test_cases`, `test_case_versions`, `test_run_test_cases`, `qa_documents`; `priority_option_id` on `test_cases`, `test_case_versions`, `test_run_test_cases`; `validation_config jsonb` on `document_template_fields` with the per-type schema documented in `database.md`. NFR-DYN-001/002 apply directly to this decision.

**Status:** Approved

## DBD-011 — Protected System Fields Represented as Flagged Template Rows, Never as the Source of Truth

**Decision:** Protected system fields (record identity, organisation, project, applicable version, created by/at, updated at, archive state, required execution/traceability relationships) MAY be represented as `document_template_fields` rows with `is_system_field = true`, for display ordering/positioning within a rendered template preview only. These rows never carry the authoritative value — that always lives on the owning table's real typed column (e.g. `test_cases.requirement_id`). `is_system_field` rows have no `default_value` (enforced by a CHECK) and their `field_key`/semantics cannot be edited by the organisation (application-enforced, since "prevent semantic redefinition" isn't expressible as a single-table constraint).

**Reason:** Chose Option A (protected rows in the same table) over Option B (system fields merged in purely by application logic, outside the table) because it gives clean, queryable support for template preview ordering (a QA Manager repositioning a system field alongside configurable ones) without a second, parallel "layout" table — while the CHECK constraint and the "never authoritative" rule prevent it from becoming a second source of truth for core data (§7 of the task's explicit concern).

**Alternatives Considered:** Option B (system fields exist only in application code, never as rows) — rejected; would require duplicating template-ordering logic outside the database and make "template preview including system fields" harder to query consistently.

**Consequences:** `ck_document_template_fields_protected_no_default` in `schema.sql`; documented in `document_template_fields`' table comment.

**Status:** Approved

## DBD-012 — Aggregate Organisation QA Configuration Versioning

**Decision:** Organisation QA configuration is versioned as a single aggregate `qa_configuration_versions` row per publish (identity = `organisation_id`, no separate "configuration identity" table), which child rows (`workflow_definitions`, `qa_artifact_policies`, `quality_gate_definitions`) and a junction table (`qa_configuration_version_templates`, for template versions) reference via foreign key. Independent versioning per template/workflow/policy/gate element is NOT used.

**Reason:** Directly adopts the simpler of the two models the task presented (Option B), sufficient for MVP reliability without the bookkeeping overhead of independent per-element version numbers and cross-referencing between them.

**Alternatives Considered:** Fully independent versioning per template/workflow/policy/gate (Option A) — rejected as unjustified complexity for MVP; nothing in the approved requirements calls for publishing (e.g.) a workflow shape change independently of the rest of the organisation's configuration.

**Consequences:** `qa_configuration_versions` is the single append-only, immutable-once-published anchor; `uq_qa_config_versions_one_draft_per_org` ensures at most one in-progress draft per organisation at a time (FR-QAOM-008).

**Status:** Approved

## DBD-013 — Preset Selection Is Provenance Only, Never a Runtime Dependency

**Decision:** `qa_configuration_versions.preset_origin` (`standard`/`lightweight`/`controlled`/`custom`) records which starting preset an organisation used, for display/audit purposes only. No code path may look up a global "Standard QA preset definition" at runtime to determine an organisation's behaviour — behaviour is fully and only determined by the actual rows (`workflow_definitions`, `qa_artifact_policies`, `quality_gate_definitions`, `qa_configuration_version_templates`) materialized into that organisation's published version at publish time.

**Reason:** Directly implements the task's explicit recommendation (§4) — prevents a future change to TestFlow's own preset definitions from silently altering the behaviour of organisations that picked that preset months earlier.

**Alternatives Considered:** Treating presets as a live, referenced definition (Option B in the task) — explicitly rejected per the task's own recommendation.

**Consequences:** `preset_origin` is documented in `schema.sql` as "PROVENANCE ONLY."

**Status:** Approved

## DBD-014 — Project Configuration Pinning, No Migration Capability at MVP

**Decision:** `projects.qa_configuration_version_id` is `NOT NULL`, set once at project creation to the organisation's then-current published version, and never automatically updated. A new organisation publish has zero effect on existing projects. No schema or mechanism exists for migrating an existing project onto a newer version at MVP.

**Reason:** Directly implements FR-QAOM-012's approved MVP-safe model — avoids the historical-consistency risk and complexity of an in-place migration mechanism, which is explicitly out of scope until separately approved.

**Alternatives Considered:** Deriving "effective configuration" from "organisation's latest published version" on every request — rejected per the task's explicit instruction (§17): this would silently reinterpret history and requires a fresh query/lookup on every access instead of a stable, explicit FK.

**Consequences:** `fk_projects_qa_configuration_version` in `schema.sql`. A future migration capability, if approved, would need its own decision and likely an audited "project configuration reassignment" table — not built here.

**Status:** Approved

## DBD-015 — Workflow Storage: Bounded Shapes, No Independent Lifecycle, Shared Instance Model

**Decision:** `workflow_definitions` stores exactly one row per (configuration version, document type), constrained to the three bounded shapes (`no_approval`/`single_approval`/`review_approval`, FR-WF-001) with role assignment appropriate to the shape. Workflow definitions have NO independent draft/publish lifecycle — they are immutable simply by virtue of belonging to an immutable `qa_configuration_versions` row. Current workflow state and its history are modelled ONCE, shared across Test Case and QA Documents, via `workflow_instances` (current state, one row per subject) and `workflow_transitions` (append-only history), rather than duplicating this machinery per document type.

**Reason:** Avoids both a generic BPM engine (explicitly out of scope) and unnecessary per-element lifecycle complexity, per the task's explicit guidance in §11/§24.

**Alternatives Considered:** A generic state-machine definition table with organisation-configurable states/transitions — rejected (would be a BPM engine). Separate workflow-instance tables for Test Case vs. QA Documents — rejected as needless duplication of identical state-tracking machinery.

**Consequences:** `workflow_definitions`, `workflow_state_labels`, `workflow_instances`, `workflow_transitions` in `schema.sql`. `workflow_transitions` generalizes the *concept* proven by the pre-pivot `report_approval_records` (efficient current state + auditable history) without merging with it — `report_approval_records` is retained separately for the structurally distinct BA/PO link-based decision (PD-039/FR-RPT-003), which is not an internal workflow transition.

**Status:** Approved

## DBD-016 — QA Document Storage: Generalize `reports` into `qa_documents`

**Decision:** The pre-pivot `reports` table is renamed and generalized to `qa_documents`, with a `document_type` column (`test_report`/`regression_report`, FR-RPT-005) and new columns for template/workflow linkage (`document_template_version_id`, `current_meta_state`, `configurable_field_values`). All existing Test Report semantics (`content_snapshot` including the Post-Deployment section, `generated_by_user_id`, `generated_at`, PD-038) are preserved unchanged. `report_approval_records`, `report_comments`, and `access_links` are updated to reference `qa_documents.id` (renamed from `report_id`); their own approved semantics (PD-039, PD-040) are unchanged.

**Reason:** Test Report and Regression Report are structurally identical configurable documents (both templated, both workflowed, both generated on-demand) — sharing one table avoids duplicating that machinery, consistent with PD-051's framing of them as two instances of one "built-in configurable QA document" concept, while remaining a real table, not a genericized catch-all (no arbitrary document types).

**Alternatives Considered:** A separate `regression_reports` table alongside the existing `reports` table — rejected as needless duplication of identical structure; would also require duplicating `report_approval_records`/`report_comments`-equivalent tables for Regression Report even though BA/PO's approval/comment mechanism is document-type-agnostic in the approved FRs.

**Consequences:** Every foreign key and index previously pointing at `reports`/`report_id` in `schema.sql` now points at `qa_documents`/`qa_document_id`. This is a rename+generalize, not a new, unrelated table — full continuity of the pre-pivot approved semantics for Test Report is preserved.

**Status:** Approved (supersedes the table name `reports`; PD-038/PD-039/PD-040 remain fully valid and unchanged in substance)

## DBD-017 — Test Case (and QA Document) Approval Status: Replace Fixed Enum with Workflow-Instance-Backed Meta-State

**Decision:** `test_cases.approval_status` (pre-pivot fixed enum: `draft`/`approved`/`needs_review`) is REMOVED and replaced by `test_cases.current_meta_state`, a denormalized read copy of the authoritative `workflow_instances.current_meta_state` for that test case, kept in sync by application logic on every workflow transition (the same denormalization pattern already established for `organisation_id` elsewhere in this schema). The same pattern applies to `qa_documents.current_meta_state`. Under the No Approval shape (Standard/Lightweight QA default), the three values a test case can hold (`draft`/`approved`/`needs_review`) are IDENTICAL to the pre-pivot enum's values and meaning — full backward compatibility with existing approved behaviour (PD-048/PD-049).

**Reason:** A redundant fixed enum column existing alongside the new workflow-instance model would create two sources of truth for the same fact. Denormalizing the workflow instance's current state onto the row itself (rather than requiring a join for every list/filter query) preserves the query efficiency the task explicitly required (§13: "common queries must remain efficient").

**Alternatives Considered:** Keep `approval_status` as-is, ignore workflow shape for storage purposes — rejected; would not represent Single Approval/Review + Approval's additional meta-states (`in_review`, `submitted_for_approval`) at all. Query `workflow_instances` directly on every list/filter request with no denormalized copy — rejected as a needless join on the hottest read path in the product (the Test Case list).

**Consequences:** `test_cases.current_meta_state`, `qa_documents.current_meta_state`, plus the full `workflow_instances`/`workflow_transitions` machinery (DBD-015). `idx_test_cases_current_meta_state` replaces the old `idx_test_cases_approval_status`.

**Status:** Approved (supersedes the `test_cases.approval_status` column; PD-048's behaviour is preserved exactly as the No Approval default, per PD-049)

## DBD-018 — Defect Status Remains Fixed, Non-Configurable (Deliberate Safeguard)

**Decision:** `defects.status` (Open/Pending/Closed/Removed, DBD-008) is UNCHANGED under CHANGE-001. Defect does NOT become a configurable document type, does NOT gain a workflow_instances row, and its lifecycle is NOT organisation-configurable.

**Reason:** The original impact analysis speculated that Defect status might become configurable, but Stage 2's actual approved Functional Requirements did not approve this — Defect remains explicitly listed as a first-class system entity (PD-051) and no FR-DEF requirement introduces configurable defect workflow. This decision is a deliberate safeguard against carrying an earlier analysis suggestion beyond what Stage 2 actually approved, per the task's explicit §14 instruction.

**Alternatives Considered:** Extending `workflow_instances`/`workflow_definitions` to cover Defect — rejected; not requested or approved by any Stage 2 FR, would be inventing scope.

**Consequences:** None beyond confirming no schema change was made here. If defect lifecycle configurability is wanted later, it requires its own Functional Requirements approval first (CLAUDE.md rule 3/6), not a database-layer decision.

**Status:** Approved

## DBD-019 — Defect Severity: Stable Semantic Column + Organisation Label Table

**Decision:** `defects.severity_semantic` is a fixed, TestFlow-controlled enum (`critical`/`high`/`medium`/`low`, FR-DEF-007), always present. `defect_severity_labels` holds exactly one row per (organisation, semantic_level) — 4 rows per organisation, seeded at organisation creation — carrying only the organisation's configured `display_label`. Quality Gate evaluation, filtering, and reporting query `severity_semantic` directly; `defect_severity_labels` is consulted only for display rendering.

**Reason:** Directly implements PD-055's requirement that Severity carry stable semantics with configurable display only — gates must never depend on organisation-editable label text (§15/§27 of the task's explicit warning).

**Alternatives Considered:** Storing only the display label on the defect (no stable semantic column) — rejected outright; would make gate evaluation dependent on mutable text, exactly what PD-055 forbids. Allowing organisations to add a 5th, unmapped severity level — rejected; not approved (FR-DEF-007 explicitly disallows this).

**Consequences:** `defects.severity_semantic`, `defect_severity_labels`, `ck_defect_severity_labels_level`, `uq_defect_severity_labels_org_level`.

**Status:** Approved

## DBD-020 — Priority Model: Test Case Priority as a Template Dropdown Field; Defect Priority as a Dedicated Organisation Option Set

**Decision:** Test Case Priority (FR-TC-011) is modelled as an ordinary Dropdown-type field on the Test Case template (`document_template_fields`/`document_template_field_options`), because Test Case is already a templated document type — but with a dedicated typed FK column (`test_cases.priority_option_id`) rather than being folded into `configurable_field_values`, for query/filter/gate performance (§16's explicit "recognized concept" guidance). Defect Priority (FR-DEF-008) is modelled as a dedicated `defect_priority_options` table, organisation-scoped, since Defect has no template to attach a field to. Both use stable option identities (`option_key`/`id`), never raw display text, so historical records remain interpretable if options are renamed or deactivated (soft-deprecation via `is_active`, never hard-deleted).

**Reason:** Test Case Priority and Defect Priority are structurally different situations — one has a template to live on, one doesn't — so they get different (but analogous) storage, rather than forcing an artificial shared table. Both are explicitly recognized product concepts per the task, justifying typed/indexed storage over generic JSONB.

**Alternatives Considered:** Storing Priority as free-text on the record — rejected; breaks historical interpretability when options are renamed (§16 explicit requirement for stable option identities). A single shared "priority option" table used by both Test Case and Defect — rejected; Test Case Priority's options are legitimately template-version-scoped (can differ between template versions), while Defect Priority's are organisation-wide with no template concept — conflating them would misrepresent that difference.

**Consequences:** `test_cases.priority_option_id` → `document_template_field_options`; `defects.priority_option_id` → `defect_priority_options`. Both frozen onto `test_case_versions`/`test_run_test_cases` for historical fidelity (same principle as `steps`/`expected_results`).

**Status:** Approved

## DBD-021 — Quality Gate Configuration: Bounded Gate-Type Enum with Typed Parameters; Results Computed On-Demand, Not Persisted

**Decision:** `quality_gate_definitions` supports exactly the six catalogue `gate_type` values (FR-QG-001), each with a `parameters jsonb` column whose shape is documented per gate_type (e.g. `{"threshold_percent": 80}` for coverage) — not an arbitrary expression language. Gate EVALUATION results are computed on demand against current live data (FR-QG-003) — no `quality_gate_results` table exists; nothing is cached or persisted at MVP.

**Reason:** A bounded enum + typed parameters delivers real configurability without an expression/rules engine (explicitly out of scope). On-demand evaluation was chosen over persisted/cached snapshots because Project readiness must reflect current data (FR-QG-003's explicit "current data, not a frozen snapshot" requirement) and because a caching layer's correctness (cache invalidation on every relevant data change) is disproportionate complexity for MVP — better addressed later at the architecture layer if dashboard-load performance data shows it's needed (NFR-PERF-005 sets the target this on-demand approach must meet).

**Alternatives Considered:** Persisted gate-result snapshots recomputed on a schedule/trigger — rejected for MVP; introduces staleness risk (a snapshot could show "Ready" after new Critical defects are logged) and cache-invalidation complexity disproportionate to MVP scale. Arbitrary expression storage for gate conditions — explicitly rejected (out of scope, §20).

**Alternatives Considered (release-blocking defect classification):** A new `defects.is_release_blocking` column — considered and rejected; FR-QG-001 itself defines "release-blocking" as "an organisation-configured defect classification (e.g., by Severity level)," which is exactly what `quality_gate_definitions.parameters` (`{"blocking_severities": [...]}`) already expresses without a new Defect column (see DBD-022).

**Consequences:** `quality_gate_definitions`, `project_quality_gate_overrides`. No `quality_gate_results` table. `NFR-PERF-005` governs the acceptable on-demand evaluation latency.

**Status:** Approved

## DBD-022 — Release-Blocking Defect Classification Resolved as a Gate Parameter, Not a New Defect Column

**Decision:** "No unresolved release-blocking defects" (FR-QG-001 condition 6) is evaluated using `quality_gate_definitions.parameters -> 'blocking_severities'` (an array of `severity_semantic` values the organisation has designated as release-blocking) joined against `defects.severity_semantic` and `defects.status` — NOT a new `is_release_blocking` column on `defects`.

**Reason:** FR-QG-001 itself already specifies the source: "an organisation-configured defect classification (e.g., by Severity level)." This is a gate-configuration concern, not a per-defect authoring concern — logging a defect doesn't require the author to decide whether it's "release-blocking"; the organisation's gate configuration decides which severities count, at evaluation time. This is NOT a DATABASE-BLOCKING REQUIREMENTS GAP — the requirement is fully specified by FR-QG-001's own text.

**Alternatives Considered:** A dedicated boolean/enum column on `defects` — considered per the task's explicit prompt to consider it, but rejected because it would duplicate what the Severity-based gate parameter already expresses, and would require every defect author to make a "is this release-blocking" judgment call that the approved requirement doesn't ask for.

**Consequences:** No schema change beyond `quality_gate_definitions.parameters`' documented shape for this gate_type (see `database.md`).

**Status:** Approved

## DBD-023 — Archive/Deletion Behaviour for New Configuration Entities

**Decision:** Published/historically-referenced configuration entities are never hard-deleted, consistent with the existing project-wide archive principle (PD-016 era decisions, `schema.sql`'s "ON DELETE RESTRICT everywhere" note). Specifically: `qa_configuration_versions`, `document_template_versions`, `document_template_fields`/`options` (once referenced by a published version) are immutable and permanent; deactivation is expressed via `is_active` (fields/options) or simply superseding with a newer published version (configuration/templates) — never a delete path. `defect_severity_labels` rows are never deleted (exactly 4 per organisation, permanently). `defect_priority_options` and `document_template_field_options` support `is_active = false` soft-deprecation.

**Reason:** Directly extends the schema's existing, already-approved deletion philosophy (archiving/deactivation over hard delete) to the new configuration layer, since historical documents may reference any of these rows indefinitely (PD-057).

**Alternatives Considered:** Allowing deletion of unpublished drafts — permitted implicitly (a draft `document_template_versions`/`qa_configuration_versions` row with no history depending on it may reasonably be deleted by application logic before publish; this is not restricted by the schema, though not explicitly modelled as a distinct capability here).

**Consequences:** No `ON DELETE CASCADE` introduced anywhere in the new tables; all new FKs use `ON DELETE RESTRICT`, consistent with the rest of `schema.sql`.

**Status:** Approved

## DBD-024 — Methodology-Neutral QA Scope: Nullable Columns, No New Entity (CHANGE-002)

**Decision:** Add three nullable columns to `qa_documents` — `scope_value text`, `scope_start_date date`, `scope_end_date date` (FR-RPT-006) — and one nullable column to `organisations` — `preferred_scope_terminology text` (FR-QAOM-013). No new table, no new enum type, no foreign key. `scope_end_date >= scope_start_date` is enforced by a `CHECK` constraint when both are present; either or both dates may be null independent of `scope_value`.

**Reason:** The CHANGE-002 impact analysis found no requirement that needs to query, join, filter, or manage lifecycle across "scopes" as a collection — the only need is for an individual QA Document to optionally display what period/slice of work it covers, and for an organisation to optionally set a display label. Nullable columns on the existing document row are the smallest correct representation; a new table/entity would require FKs, lifecycle, and RESTRICT semantics for a concept nothing else in the schema references.

**Alternatives Considered:** A `delivery_cycles`/`test_cycles` table with `qa_documents.delivery_cycle_id` FK (rejected — no requirement needs to enumerate, reuse, or manage cycles across documents; would reintroduce the Release-entity-shaped complexity FR-QG-003/AD-023 already deliberately rejected for Readiness). A `methodology` enum column on `organisations` (rejected — PD-064 explicitly rejects modelling methodology as a governed concept; no logic would ever read it). Storing scope only inside `qa_documents.content_snapshot` JSON with no dedicated column (rejected — would prevent even basic display/filtering and contradicts the repo's general preference for typed columns over JSONB for anything the application needs to read reliably, `database-decisions.md`'s dynamic-field-value precedent).

**Consequences:** `qa_configuration_versions` and all QA Operating Model versioning tables are untouched — scope is not versioned. `test_runs` is untouched — Test Run remains an independent execution container, never conflated with scope. No new readiness-related table or column — `FR-QG-003`'s on-demand, Project-level, no-persisted-result design (DBD-021) is unaffected.

**Status:** Approved
