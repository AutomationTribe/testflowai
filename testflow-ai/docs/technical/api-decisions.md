# TestFlow AI — API Decisions

This log records **API design decisions** explicitly approved by the product owner during the API design and contract review. It follows the same convention as `product-decisions.md`, `database-decisions.md`, and `architecture-decisions.md`: each entry reflects a decision actually approved, not an engineering recommendation alone.

---

## APID-001 — API Versioning: `/v1/` Prefix From Day One

**Status:** Approved

**Context:** The API needed a decision on whether to introduce version prefixing immediately or defer it until a breaking change is actually needed.

**Decision:** Every API path is prefixed `/v1/` from the outset.

**Reason:** Retrofitting a version prefix after clients already depend on unversioned paths is significantly more disruptive than starting with one; the upfront cost is minimal.

**Alternatives Considered:** No versioning until a breaking change is actually needed (rejected — cheap now, expensive to retrofit).

**Consequences:** All endpoints documented in `docs/technical/api/` are shown without the prefix for readability, but it applies uniformly. No second version is planned or implied by this decision.

---

## APID-002 — Pagination: Cursor-Based

**Status:** Approved

**Context:** Every list endpoint needed a consistent pagination approach, and several result sets (test cases, execution history, audit log) can grow large.

**Decision:** All list endpoints use cursor-based pagination (`?cursor=...&limit=...`, response includes `nextCursor`).

**Reason:** Offset/page-based pagination degrades in performance and becomes unstable under concurrent inserts as a table grows — a real concern for execution history and audit logs over a project's lifetime.

**Alternatives Considered:** Offset/page-based pagination (`page`/`pageSize`) — simpler to implement, but rejected due to the scaling and stability concerns above.

**Consequences:** Clients cannot jump to an arbitrary page number, only page forward via a cursor — an acceptable trade-off, since no approved requirement calls for arbitrary page-jumping.

---

## APID-003 — Optimistic Concurrency on Test Case and Requirement Edits — **EXTENDED BY APID-013**

**Status:** Approved (extended, not superseded — see APID-013: the same pattern now also governs QA Configuration and Template drafts under CHANGE-001)

**Context:** Two users could edit the same Test Case or Requirement simultaneously; because edits to these two resources trigger meaningful side effects (test case approval-status reversion per PD-048, requirement-edit re-review cascade per PD-033), a silent last-write-wins overwrite is riskier here than in a typical CRUD resource.

**Decision:** `PATCH` requests to Test Case and Requirement must include a version token read from the most recent `GET` (Test Case: `currentVersionNumber`; Requirement: a response-only `revisionToken`). A mismatch is rejected with `409 conflict`.

**Reason:** Prevents one user's edit from silently discarding another's, specifically where the consequence of a silent overwrite (an incorrect approval-status transition, or a missed re-review trigger) is worse than in an ordinary field-level conflict.

**Alternatives Considered:** No concurrency protection (last write wins) — rejected as too risky given the side effects involved.

**Consequences:** Clients must re-fetch and retry on a `409`. No other resource (projects, test suites, templates) carries this mechanism at MVP, since no approved requirement flags a comparable risk there.

---

## APID-004 — No Bulk Operations at MVP

**Status:** Approved

**Context:** A decision was needed on whether to support bulk variants of write operations (e.g., adding many test cases to a suite in one call).

**Decision:** Every write operation acts on a single resource at a time; no bulk endpoints are built at MVP.

**Reason:** No approved functional requirement calls for bulk operations specifically, and bulk import/export (FR-IMP) is explicitly Post-MVP.

**Alternatives Considered:** Bulk variants for suite membership and test run creation — rejected as premature complexity not justified by approved scope.

**Consequences:** Operations on many items require multiple client-side calls; acceptable given current approved scope and volume.

---

## APID-005 — Asynchronous Pattern for AI Generation

**Status:** Approved

**Context:** AI generation can take up to the approved 60-second timeout (NFR-AI-002), too slow for a synchronous request/response held open.

**Decision:** AI generation uses `202 Accepted` plus a status-poll endpoint (`GET /ai-generations/{id}`), matching the background-job architecture already approved (AD-009).

**Reason:** Directly follows from the already-approved AI architecture; a synchronous call would be incompatible with the approved timing and background-processing design.

**Alternatives Considered:** Synchronous long-poll — rejected as incompatible with the approved architecture and timing requirements.

**Consequences:** Clients must poll (or the frontend implements an equivalent UI pattern) rather than receiving an immediate result. No other approved operation needs this pattern — report generation remains synchronous (5-second target, NFR-PERF-003).

---

## APID-006 — Idempotency Keys on Payment-Like and Generation-Triggering Actions

**Status:** Approved

**Context:** Accidental duplicate submissions (double-click, retry after a timeout) could cause double-charging a customer or double-triggering an expensive AI generation or report compilation.

**Decision:** An `Idempotency-Key` request header is honored on: subscription actions (trial/monthly/yearly), seat purchases, AI generation triggers, test run creation, and report generation.

**Reason:** Standard, low-cost protection against a real customer-trust risk (double billing) and a real cost risk (duplicate AI/report generation).

**Alternatives Considered:** No idempotency protection — rejected given the double-charge risk specifically.

**Consequences:** Clients are expected to generate and retain an idempotency key per logical action attempt; the API returns the original result on a replayed key within a reasonable window.

---

## APID-007 — Shared Error Envelope

**Status:** Approved

**Context:** Consistency was needed across every endpoint's error responses.

**Decision:** One shared error envelope (`error`, `message`, optional `fields`) is used across all endpoints, with a fixed mapping of situations to HTTP status codes and `error` values (see `api-spec.md`).

**Reason:** Inconsistent per-module error shapes would complicate client handling and make security review harder (e.g., ensuring `401` vs. `403` is used consistently).

**Alternatives Considered:** Per-module ad hoc error shapes — rejected in favor of one consistent contract.

**Consequences:** All module documentation and any future new endpoint must conform to this shape.

---

## APID-008 — API Field Naming: camelCase

**Status:** Approved

**Context:** A decision was needed on JSON field naming, given the database uses `snake_case` column names (PostgreSQL convention) while the approved stack is TypeScript/React (AD-002/003).

**Decision:** All API request/response JSON fields use camelCase; the mapping to `snake_case` database columns happens at the data-access layer, not in the API contract.

**Reason:** camelCase is idiomatic for the approved JavaScript/TypeScript stack on both frontend and backend.

**Alternatives Considered:** snake_case matching the database directly — rejected as unidiomatic for a JSON API in this stack.

**Consequences:** A thin field-name mapping layer is needed between the API and the database — a standard, low-cost pattern.

---

## APID-009 — Security Concerns Confirmed as Contract Rules, No Further Decision Needed

**Status:** Approved

**Context:** During API design review, several security considerations were flagged (tenant isolation, object-level authorization, link-scope error codes, mass-assignment prevention, file access brokering, AI data minimization, report-comment exclusion). These were confirmed as already-settled design principles rather than open decisions requiring options/trade-offs.

**Decision:** All flagged security concerns are treated as mandatory contract rules, documented in `api-spec.md`'s Security Principles section and enforced per-operation in the module documents — not further options to choose between.

**Reason:** These are direct implications of already-approved decisions (NFR-SEC-003, NFR-SEC-005, NFR-SEC-006, PD-040, PD-043) rather than new trade-offs; no alternative was genuinely on the table.

**Alternatives Considered:** None — these are requirement-derived contract rules, not a choice between options.

**Consequences:** Every module document's Security Considerations field must reflect these rules where relevant; a future new endpoint must be checked against them before being added.

---

# CHANGE-001 — Organisation QA Operating Model: API Decisions (APID-010 through APID-020)

The decisions below re-baseline the API contract against PD-049–PD-063, DBD-009–023, and the Stage 2/3 requirements. See the new module documents (`qa-configuration.md`, `templates.md`, `workflows.md`, `project-policy.md`, `quality-gates.md`, `severity-priority.md`) for the full contracts.

## APID-010 — QA Configuration Draft/Publish Contract

**Status:** Approved

**Context:** The Organisation QA Operating Model needed an API shape distinguishing a mutable, in-progress draft from a permanently immutable published version, with presets that don't create a runtime dependency.

**Decision:** `POST .../draft` (start, from preset or custom), `GET`/`PATCH .../draft` (read/edit), `POST .../draft/validate` (bounded validation, read-only), `POST .../draft/publish` (validates then publishes atomically, `Idempotency-Key` + `If-Match`), `GET .../current` / `.../versions` / `.../versions/{n}` (immutable, no write routes). Presets are served from a static, descriptive list (`GET .../presets`) and materialize concrete settings into the draft at creation time — never referenced live afterward (DBD-013).

**Reason:** Mirrors the database's draft/publish/immutable-version model (DBD-012) directly in the API surface, giving clients an unambiguous mental model: editing a draft is always safe, publishing is the one irreversible action.

**Alternatives Considered:** A single mutable "configuration" resource with a `status` field toggled by `PATCH` — rejected; makes it too easy for an update call to accidentally target a published version, and doesn't naturally support "at most one draft" or bounded validation-before-publish.

**Consequences:** `qa-configuration.md`. At most one draft per organisation at a time (`409 conflict`, `CONFIGURATION_DRAFT_ALREADY_EXISTS`, if violated).

---

## APID-011 — Effective Project Configuration as a Dedicated Read Resource

**Status:** Approved

**Context:** A project's effective policy is organisation value + optional override, per setting category. Requiring clients to fetch both and merge client-side for ordinary UI use was explicitly flagged as undesirable (§5 of the task).

**Decision:** `GET /projects/{projectId}/effective-configuration` returns one coherent, server-computed answer — organisation value, override (if any), effective value, and overridable flag, per setting — computed on demand, not a stored resource.

**Reason:** Removes an entire class of client-side bugs (a UI that gets the override-precedence logic wrong) and matches the on-demand-computation principle already established for Quality Gate readiness (DBD-021).

**Alternatives Considered:** Requiring clients to call `qa-configuration.md`'s `current` endpoint plus `project-policy.md`'s override list separately — rejected as the exact anti-pattern the task warned against.

**Consequences:** `project-policy.md`. No new stored resource — this endpoint is a read-only, computed join.

---

## APID-012 — Structured Template Contract Replacing `defaultStructure`

**Status:** Approved (supersedes the pre-pivot template contract in the original `templates.md`)

**Context:** The pre-pivot Template API exposed a single opaque `defaultStructure` JSON blob with no field-level structure. The new Template System (database.md DBD-009/010) requires a real field-CRUD contract.

**Decision:** Templates are draft/publish resources (mirroring APID-010's pattern) with sub-resource endpoints for individual fields (`POST/PATCH/DELETE .../draft/fields/{fieldKey}`) and field options (`.../fields/{fieldKey}/options/{optionKey}`), a bounded 15-value `fieldType` enum, and a documented `validationConfig` shape per type. System/protected fields appear in the same field list (`isSystemField: true`) for unified ordering/preview, but are read-only through this API — their real value lives on the owning resource (Test Case/QA Document), never here.

**Reason:** Directly implements PD-053/PD-054's structured field model and DBD-011's "protected rows never become the source of truth" boundary, while giving a client a single, coherent "render this template" call (`GET .../draft/preview`).

**Alternatives Considered:** Keeping `defaultStructure` as a single JSON blob and layering field-level validation only in documentation, not the contract — rejected; would not give clients a way to discover field definitions/options programmatically, undermining the entire Template System's purpose.

**Consequences:** `templates.md` rewritten in full; old `test-case-templates`/`report-templates` paths (`POST/GET/PATCH/DELETE /organisations/{orgId}/test-case-templates`, etc.) are **removed**, replaced by `/organisations/{orgId}/templates?documentType=...` and the template-ID-addressed sub-resource paths above. This is a breaking API change to that one narrow surface, judged acceptable since no client beyond the (not-yet-built) frontend exists yet (AD-001) and the old contract was explicitly a placeholder pending exactly this kind of requirement.

---

## APID-013 — Concurrency Extension to Configuration/Template Drafts

**Status:** Approved (extends APID-003, does not replace it)

**Context:** QA Configuration and Template drafts face the same "two QA Managers editing simultaneously" risk APID-003 already addresses for Test Case/Requirement.

**Decision:** The same optimistic-concurrency principle applies, using an `If-Match: <version>` request header (rather than a body field, since these resources are edited via sub-resource calls, not a single `PATCH`). A mismatch returns `409 conflict`, identically to APID-003.

**Reason:** Reuses an already-approved pattern rather than inventing a second concurrency mechanism (§28/§29 of the task's explicit instruction).

**Alternatives Considered:** No concurrency protection on drafts — rejected; configuration/template drafts are exactly the kind of infrequent-but-high-stakes edit APID-003 was designed for. Live collaborative editing — explicitly out of scope (§28).

**Consequences:** `api-spec.md` Concurrency section; every write in `qa-configuration.md`/`templates.md` documents its `If-Match` requirement.

---

## APID-014 — Dynamic Field Value Contract: Stable Keys, Typed Client Contract, No Raw JSONB Passthrough

**Status:** Approved

**Context:** The database stores organisation-configurable values in `configurableFieldValues jsonb` (DBD-010). The API needed to decide whether to expose this as a raw, unvalidated JSON passthrough or own a typed contract.

**Decision:** The API owns a fully typed contract: clients submit/receive values keyed by stable `fieldKey` (never mutable `label`), with per-`fieldType` value shapes and `validationConfig` documented explicitly (`templates.md`'s Field-Type Contract). Every write is validated server-side against the record's resolved `documentTemplateVersionId` before acceptance, with specific, named error codes (`REQUIRED_FIELD_MISSING`, `INVALID_FIELD_VALUE`, `INVALID_FIELD_OPTION`, `INVALID_ENTITY_REFERENCE`, `UNKNOWN_FIELD`, `FIELD_NOT_ACTIVE`, `FIELD_NOT_PERMITTED_ON_TEMPLATE_VERSION`) rather than one generic "invalid JSON" response.

**Reason:** The database using JSONB internally is an implementation detail (DBD-010); the API's job is to present a stable, typed domain contract regardless of storage mechanism (§9/§2's explicit "don't expose database implementation details" principle).

**Alternatives Considered:** Passing `configurableFieldValues` through as opaque, client-validated JSON with a single generic `validation_error` on any problem — rejected; would push validation logic into every client and produce unhelpful, undifferentiated errors.

**Consequences:** `templates.md`, `test-cases.md`, `defects.md` (Priority), `reports.md`/regression reports. NFR-DYN-001 is directly implemented by this decision.

---

## APID-015 — Bounded Workflow-Action API with `availableActions`

**Status:** Approved

**Context:** Document workflow needed an API shape that couldn't be misused to construct an arbitrary state machine, while still giving a frontend enough information to render correct, role-aware controls without re-implementing authorization logic.

**Decision:** Exactly four named actions exist (`set_approved`, `submit`, `approve`, `reject`), invoked via `POST /{resource}/{id}/workflow/{action}` — never a generic `PATCH workflowState` accepting an arbitrary target state. Every workflow-governed resource's response includes `availableActions`, the exact subset of actions the *current caller* may perform right now, computed server-side from shape + current meta-state + caller's role.

**Reason:** Directly implements §12's explicit recommendation and its stated purpose: prevents frontend clients from recreating workflow authorization logic, and makes an invalid-transition or wrong-actor attempt structurally impossible to construct by accident (only possible by deliberately ignoring `availableActions`, which the server re-validates anyway).

**Alternatives Considered:** A generic `PATCH /{resource}/{id}` accepting `{ "workflowState": "approved" }` — explicitly rejected (§12: "do not implement arbitrary transition endpoints accepting arbitrary destination state names").

**Consequences:** `workflows.md`. `test-cases.md`'s existing `PATCH` retains a narrow `setApproved: true` shortcut, but **only** under the `no_approval` shape — under any configured stronger shape, the client must use the workflow-action endpoints instead (`WORKFLOW_ACTION_NOT_ALLOWED` otherwise).

---

## APID-016 — `reports` → `qa_documents`: Keep Product-Friendly Paths, No Mechanical Rename

**Status:** Approved

**Context:** The database renamed/generalized `reports` to `qa_documents` (DBD-016). The API needed to decide whether to follow that rename publicly.

**Decision:** **Option A** — existing `/projects/{projectId}/reports` and `/reports/{reportId}` paths are kept **unchanged** for Test Report. A parallel `/projects/{projectId}/regression-reports` and `/regression-reports/{id}` path family is added for the new Regression Report document type. Both are the same underlying `qa_documents` resource server-side, filtered by `documentType`. No public `/qa-documents` collection endpoint is introduced at MVP.

**Reason:** Table naming must not dictate API naming (§15's explicit instruction) — `reports` is the product-meaningful, already-documented, zero-breaking-change name for Test Report specifically; renaming it to `/qa-documents/{id}?documentType=test_report` for the sake of database-naming symmetry would be a pure, unjustified breaking change with no product benefit, and would be less clear to API consumers than the current name.

**Alternatives Considered:** Option B, moving everything to `/qa-documents` with `/reports` as a deprecated compatibility alias — rejected; no existing client depends on `/reports` yet (AD-001, no frontend built), so there is no actual deprecation need to manage, and introducing one anyway would add complexity with no corresponding benefit at this stage.

**Consequences:** `reports.md` (retitled "Reporting (Test Report & Regression Report)"), covers both paths. If a genuine cross-type need emerges later (e.g., "show me all QA documents pending my approval across types"), that would be a new, separately-justified endpoint, not a reason to revisit this naming decision.

---

## APID-017 — Priority/Severity API Representation: Semantic vs. Label, Stable Option IDs

**Status:** Approved

**Context:** Defect Severity has TestFlow-controlled stable semantics with organisation-configurable display labels (PD-055); Priority (both Test Case and Defect) is fully organisation-configurable with stable option identity.

**Decision:** Severity is represented as `{ "semantic": "critical", "label": "S1 - Showstopper" }` in every response — `semantic` is the only value ever accepted as request input or used in filters/gate logic; `label` is resolved server-side and is display-only. Priority is represented by a stable `optionId` (plus resolved `label` in responses) — never raw text — referencing `document_template_field_options` (Test Case) or `defect_priority_options` (Defect).

**Reason:** Directly implements §17/§18's explicit requirement that gate/filter/business logic never depend on mutable label text, and that historical records remain interpretable if options are renamed.

**Alternatives Considered:** Accepting/returning severity as organisation label text with server-side resolution to semantic — rejected; would make the stable/mutable distinction ambiguous at the API boundary exactly where it matters most (a client could accidentally submit a label as if it were the semantic).

**Consequences:** `defects.md`, `severity-priority.md`, `templates.md` (Test Case Priority uses the same `optionKey`-based pattern as any Dropdown field).

---

## APID-018 — Project Override Contract: Bounded, Typed Endpoints per Category

**Status:** Approved

**Context:** Only two setting categories are overridable at MVP (required artifacts, enabled quality gates — FR-POL-003). The API needed to decide between a generic `setting_name`/arbitrary-value override mechanism and bounded, typed endpoints.

**Decision:** Two small, typed endpoint families: `PUT/DELETE /projects/{id}/policy-overrides/artifacts/{artifactType}` and `PUT/DELETE /projects/{id}/policy-overrides/gates/{gateType}` — each with a fixed, documented request/response shape. No generic `POST /projects/{id}/overrides { key, value }` endpoint exists.

**Reason:** A generic key/value override mechanism would silently make *any* future setting overridable the moment a client sent it, defeating FR-POL-003's deliberately narrow MVP override surface — the bounded-endpoint approach makes "what can be overridden" a property of the API surface itself, not just documentation.

**Alternatives Considered:** Generic `setting_name`/arbitrary-JSON-value override endpoint — explicitly rejected (§18 of the task: "avoid a generic setting_name/arbitrary JSON value system if a safer typed/bounded model is practical").

**Consequences:** `project-policy.md`. Adding a new overridable category later requires a new typed endpoint (or an extension to these two), not merely a documentation update — a deliberate friction point protecting the MVP boundary.

---

## APID-019 — Readiness Evaluation Contract: On-Demand, Project-Level, Three-State Result

**Status:** Approved

**Context:** Stage 2 selected Project-level readiness with no Release entity (FR-QG-003). The API needed a contract for retrieving it.

**Decision:** `GET /projects/{projectId}/readiness` evaluates current live data on every call (no caching/persistence implied — DBD-021) and returns `overallReadiness` plus a per-gate array, each with `result: pass | fail | not_applicable`. No fourth state (e.g. `not_evaluable`) is introduced — every gate in the bounded catalogue always resolves to one of the three, since a missing-artifact case resolves to `fail` with an explanatory reason rather than an ambiguous state. The Dashboard endpoint (`dashboards.md`) embeds the identical response shape rather than computing readiness a second, independent way.

**Reason:** Matches the database's explicit on-demand-evaluation decision (DBD-021) and avoids inventing a fourth result state without a concrete need for one (§23's explicit caution against casually adding states).

**Alternatives Considered:** A persisted/cached "last known readiness" resource — rejected; would imply staleness risk and cache-invalidation complexity out of proportion to MVP needs, consistent with DBD-021's database-layer reasoning. A `not_evaluable` state for "gate enabled but insufficient data" — considered and rejected; every gate condition in the bounded catalogue has a well-defined `fail` interpretation for its "not yet satisfied" case, so a fourth state would add complexity without resolving genuine ambiguity.

**Consequences:** `quality-gates.md`, `dashboards.md`. No Release resource/entity exists anywhere in the API.

---

## APID-020 — AI Generation: Server-Resolved Template, No Client-Supplied Template ID

**Status:** Approved

**Context:** AI generation must target the project's applicable Test Case template (FR-AI-001/006). Since template selection is not project-overridable at MVP (FR-POL-003), the API needed to decide whether clients supply a template/version ID or the server resolves it.

**Decision:** `POST /requirements/{id}/ai-generations` accepts no `templateId`/`templateVersionId` field at all — the server resolves Project → pinned QA Configuration Version → applicable Test Case template version itself, identical to `test-cases.md`'s Create Test Case resolution. The resolved `documentTemplateVersionId` is returned in the poll response for transparency (NFR-AI-010) but was never a client input.

**Reason:** Since the client has no legitimate choice to make here (template selection isn't overridable), exposing a parameter for it would be unnecessary client freedom inviting misuse (a client could otherwise attempt to request generation against an arbitrary, possibly wrong-organisation template version) — directly per §10/§25's explicit guidance to avoid this.

**Alternatives Considered:** Accepting an optional `templateVersionId` override "for advanced use" — rejected; no approved requirement calls for per-generation template selection, and it would reopen exactly the override-surface question FR-POL-003 deliberately closed for templates.

**Consequences:** `ai.md`. Consistent with `test-cases.md`'s identical server-side resolution for manually created test cases — one resolution rule, applied uniformly regardless of authoring path.

---

## APID-021 — Methodology-Neutral QA Scope: Optional Fields on Existing Resources, No New Endpoints (CHANGE-002)

**Status:** Approved

**Context:** CHANGE-002 (PD-064, FR-RPT-006, FR-QAOM-013) introduces methodology-neutral QA Scope metadata. The API needed a contract for exposing it without implying a methodology/delivery-cycle API surface.

**Decision:** `scopeValue` (string), `scopeStartDate` (date), `scopeEndDate` (date) are added as optional fields to the existing Generate/View/List Report and Regression Report request/response bodies (`reports.md`) — all settable at generation time and editable afterward via the existing document update path; none required. `preferredScopeTerminology` (string, optional) is added to the existing `GET/PATCH /organisations/{orgId}` Organisation Settings resource (`users.md`) — no separate endpoint. No `/methodologies`, `/delivery-cycles`, or `/scopes` resource is introduced anywhere.

**Reason:** Both fields are inert metadata on resources that already exist; giving them dedicated endpoints would imply a collection/lifecycle ("list all scopes," "list all methodologies") that no approved requirement calls for, directly contradicting PD-064's rejection of a methodology/delivery-cycle system concept.

**Alternatives Considered:** A dedicated `/organisations/{orgId}/delivery-context` or `/methodology` endpoint (rejected — implies a governed concept beyond one descriptive text field; the existing Organisation Settings resource is the natural, sufficient home). A dedicated `/scopes` collection resource independent of documents (rejected — no requirement needs to list/manage scopes across documents; scope is a property of one document, not a first-class resource).

**Consequences:** `reports.md`, `users.md`. `GET /projects/{projectId}/readiness` (APID-019) and `dashboards.md` are **unchanged** — readiness is not scope-aware. No new module/service is implied.
