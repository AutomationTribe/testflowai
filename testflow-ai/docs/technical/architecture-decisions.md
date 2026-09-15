# TestFlow AI — Architecture Decisions

This log records **architecture and technology decisions** explicitly approved by the product owner during the architecture and technology-options review. It follows the same convention as `docs/product/product-decisions.md` and `docs/technical/database-decisions.md`: each entry reflects a decision actually approved, not an engineering recommendation alone. Recommendations not explicitly approved are not recorded here — they are listed as "Decisions Deferred" in `docs/technical/architecture.md` instead.

---

## AD-001 — Application Architecture: Modular Monolith

**Status:** Approved

**Context:** TestFlow AI needed an overall application architecture style. The approved requirements include hard atomicity needs (cascade-archive across requirements, test cases, reports, and active test runs — NFR-DI-004) and an all-or-nothing payment/seat activation guarantee (NFR-REL-003), alongside a general instruction to avoid unnecessary enterprise complexity and stay maintainable by a small team.

**Decision:** Build the backend as a single modular monolith — one deployable application, one database, internally organized around the functional modules already defined in `functional-requirements.md` (ORG, PRJ, TC, TR, AI, SUB, LNK, etc., consistent with NFR-MAINT-001).

**Reason:** Nothing in the approved requirements demands independent scaling or independent deployment of any one module. A single transactional boundary makes the atomic cascade-archive and payment-activation guarantees straightforward; a microservices approach would work against both.

**Alternatives Considered:** Microservices (rejected — disproportionate operational overhead, and directly complicates the required atomic, multi-entity transactions).

**Consequences:**
- *Benefits:* Simple local development, one deployment, transactions stay simple, easy for a small team and for AI-assisted development to reason about.
- *Trade-offs:* The whole application scales and deploys together (not currently a real constraint given approved scope).
- *Future implications:* Clean internal module boundaries leave the option open to extract a specific module (e.g., AI generation) into its own service later, without a full rewrite, if usage ever justifies it.

---

## AD-002 — Backend Technology: Node.js with TypeScript

**Status:** Approved

**Context:** A backend language/runtime was needed to implement the modular monolith (AD-001).

**Decision:** Use Node.js with TypeScript for the backend.

**Reason:** The backend's workload (database queries, calls to an AI provider, calls to a payment provider, sending emails) is overwhelmingly I/O-bound, which is Node's strength. Using TypeScript, shared with the web frontend (AD-003), lets a small team and AI-assisted development work with one language and shared type definitions across the whole stack.

**Alternatives Considered:** Python (FastAPI/Django) — a reasonable second choice, but introduces a second language if paired with a TypeScript frontend. Java/Kotlin (Spring) — more mature for large enterprise systems, but heavier boilerplate and slower iteration than appropriate for this MVP.

**Consequences:**
- *Benefits:* One shared language across frontend and backend; strong ecosystem for I/O-heavy workloads; strong current AI-coding-assistant familiarity.
- *Trade-offs:* Requires care with type discipline (mitigated by TypeScript itself).
- *Future implications:* High switching cost once significant backend code exists, though not strictly irreversible.

---

## AD-003 — Web Frontend: React

**Status:** Approved

**Context:** TestFlow AI needed a web frontend framework, given the product is entirely web-based (PRD §1) with no approved mobile app.

**Decision:** Use React (with a metaframework such as Next.js for routing conveniences) for the web application.

**Reason:** TestFlow AI is a data-table- and dashboard-heavy B2B application (test case lists, run progress, defect boards, reports). React's ecosystem has the deepest bench of mature components for this pattern, strong accessibility tooling (relevant to NFR-ACC-001), and strong AI-coding-assistant familiarity.

**Alternatives Considered:** Vue (gentler learning curve, smaller ecosystem for complex data-heavy admin UIs). Svelte/SvelteKit (smaller bundle sizes, but a smaller ecosystem of mature components for this use case).

**Consequences:**
- *Benefits:* Deep component ecosystem for tables/dashboards, strong tooling, one language shared with the backend (AD-002).
- *Trade-offs:* Can accumulate boilerplate without discipline (a team/process concern, not an architectural one).
- *Future implications:* High switching cost once significant UI exists, though not strictly irreversible.

---

## AD-004 — Mobile Strategy: Postponed

**Status:** Approved

**Context:** The architecture review needed to confirm whether a mobile application (native or cross-platform) was in scope.

**Decision:** No mobile application (native or cross-platform) is built at this stage. The only mobile-adjacent requirement, NFR-MOB-001, requires a responsive *web* layout down to tablet width for link-based flows (BA/PO report approval, Stakeholder dashboard/report viewing) — this is satisfied by the responsive web application (AD-003), not a separate mobile codebase.

**Reason:** No approved functional or non-functional requirement calls for a native or cross-platform mobile app. Building one would add cost and complexity not justified by approved scope.

**Alternatives Considered:** React Native, Flutter, and native (iOS/Android) applications were all considered and explicitly not selected, since there is currently nothing to build toward.

**Consequences:**
- *Benefits:* No mobile development cost or complexity at MVP.
- *Trade-offs:* None at current approved scope.
- *Future implications:* If a genuine native mobile requirement is approved later, React Native would be a natural extension given the React web app (shared component/logic patterns) — but that evaluation is deferred until such a requirement exists.

---

## AD-005 — Database Technology: PostgreSQL

**Status:** Approved

**Context:** The logical database design (`database.md`) defines 29 entities, three explicit many-to-many relationship entities, and hard requirements for atomic multi-table cascades and immutable audit/history records. A database technology was needed to support this.

**Decision:** Use PostgreSQL as the database technology.

**Reason:** The logical model is strictly relational. PostgreSQL provides strong relational integrity (foreign keys, transactions), native structured-data (JSON) column support (fitting "structured data" attributes like Test Case Steps or Report Content Snapshot without a second data store), and mature row-level security features relevant to tenant isolation (NFR-SEC-003).

**Alternatives Considered:** MySQL (also relational, viable, but historically weaker structured-data/JSON support and fewer advanced row-level security features). A NoSQL document store such as MongoDB (rejected — would actively work against the approved model's enforced foreign keys, atomic multi-table transactions, and many-to-many joins).

**Consequences:**
- *Benefits:* Direct fit for the approved logical data model; no second data store needed for structured fields.
- *Trade-offs:* None identified relative to the approved model.
- *Future implications:* This is the most costly decision to reverse later; moving between a relational and non-relational store would require significant schema/data rework.

---

## AD-006 — Authentication for Organisation Members: Built Internally

**Status:** Approved

**Context:** Admin, QA Manager, and QA Tester need conventional login/authentication. A choice was needed between building this internally versus using a third-party authentication platform.

**Decision:** Build organisation-member authentication internally, using standard, well-established libraries for credential handling (not custom cryptography) — not a third-party authentication platform.

**Reason:** TestFlow AI's role model (exactly one role per user, assigned at the organisation level, with an organisation-scoped minimum-one-Admin rule) is specific enough that a generic third-party auth platform's user/role model would need to be worked around rather than used directly. Building internally also avoids a recurring per-user vendor cost.

**Alternatives Considered:** A third-party authentication platform (e.g., Auth0/Clerk/Supabase Auth-style service) — faster to stand up and offloads password/session security, but adds recurring per-user cost and friction against the specific approved role model. A hybrid approach was also considered and not selected.

**Consequences:**
- *Benefits:* No recurring per-user auth vendor cost; full fit with the approved organisation-scoped role model.
- *Trade-offs:* The team is responsible for getting password hashing, session security (NFR-SEC-002), and brute-force protection (NFR-SEC-001) right, using standard libraries rather than a specialist vendor.
- *Future implications:* None identified that would block a future move to a third-party platform if ever needed, though not currently planned.

---

## AD-007 — Link-Based Access: Custom-Built Access Link Mechanism

**Status:** Approved

**Context:** BA/PO, Developer, and Stakeholder roles require access with no account, no login, and no identity verification (PD-018, PD-043) — a fundamentally different mechanism from conventional authentication.

**Decision:** Build a dedicated, custom Access Link mechanism (scoped, expiring, revocable, no identity check) as a first-class product feature, architecturally separate from the organisation-member authentication system (AD-006).

**Reason:** This is not "authentication" in the conventional sense (there is deliberately no identity check), so no authentication platform or library models it out of the box. It must be purpose-built to match the approved product decisions.

**Alternatives Considered:** None — no viable off-the-shelf alternative exists for a no-identity-verification, link-as-credential access model; this was confirmed as a required custom component, not a comparison between vendor options.

**Consequences:**
- *Benefits:* Directly matches PD-018/PD-042–PD-046 (expiry default/configurability, named/generic recipients, multi-use, free sharing).
- *Trade-offs:* Expiry and revocation are the only real security controls, since there's no identity check (an accepted, approved trade-off — PD-043).
- *Future implications:* None identified.

---

## AD-008 — File Storage: Cloud Object Storage

**Status:** Approved

**Context:** Evidence attachments (screenshots, PDFs) need to be stored and referenced, per NFR-FILE-001/002.

**Decision:** Use cloud object storage (an S3-compatible service) for attachment files; the database stores only a reference to each file, not the file content itself.

**Reason:** Standard, low-cost pattern for binary file storage; avoids the well-known anti-pattern of storing binary content inside a relational database (bloats backups, slows queries).

**Alternatives Considered:** Storing files directly in the database (rejected). A self-hosted file server (not selected — no reason to operate this manually when managed object storage is cheap and simple at MVP scale).

**Consequences:**
- *Benefits:* Keeps the database lean; cheap at MVP attachment volume (images/PDF only, 10MB cap).
- *Trade-offs:* None significant at current approved scope (no video support, which is deferred).
- *Future implications:* None identified; any S3-compatible provider is interchangeable.

---

## AD-009 — AI Integration Architecture

**Status:** Approved

**Context:** AI test case generation (FR-AI-001) needed an architectural pattern connecting the user's request, the backend, an external AI provider, and the mandatory human review step (FR-AI-002, NFR-AI-004).

**Decision:** The backend calls the configured AI provider (platform-provided key or project-supplied key) from a background job, behind an internal provider-abstraction interface. AI-generated candidates are never persisted as saved Test Case records until a human explicitly completes review and saves them — there is no "draft AI output" table.

**Reason:** Generation can take up to the approved 30–60 second window (NFR-AI-001/002), too slow for a held-open request. Abstracting the provider call behind an internal interface avoids the specific provider being woven throughout the codebase. Not persisting unreviewed AI output as real Test Case data enforces the mandatory-review rule (NFR-AI-004) as a structural fact rather than a UI convention.

**Alternatives Considered:** A synchronous request/response call to the AI provider (rejected — incompatible with the approved generation time window). Persisting AI drafts as a distinct "pending" Test Case status (considered and rejected in the logical database design, `database.md` §7, in favor of not persisting unreviewed output as Test Case data at all).

**Consequences:**
- *Benefits:* Meets the approved timing requirements; structurally enforces mandatory human review; keeps provider selection swappable later.
- *Trade-offs:* Requires a background job/status-check (or equivalent) mechanism for the user to learn when generation completes.
- *Future implications:* No AI provider or model has been selected — this remains a deferred, separate decision (see `architecture.md`, Decisions Deferred).

---

## AD-010 — Background Jobs: Database-Backed Simple Queue

**Status:** Approved

**Context:** Approved workloads (AI generation calls, email/notification delivery with retry per FR-NOT-005, payment webhook processing) require asynchronous processing outside the normal request/response path.

**Decision:** Implement background jobs using a simple, database-backed job queue processed by a lightweight worker process — not a separate managed queue service.

**Reason:** MVP volume does not justify the operational cost and complexity of a managed queue platform. A jobs table in the same database keeps the system to "one database, one application, one small worker."

**Alternatives Considered:** A managed queue/pub-sub service (rejected for MVP — better durability/scaling at high volume, but not justified at current approved scope; may be revisited later).

**Consequences:**
- *Benefits:* Minimal added infrastructure; simple to reason about.
- *Trade-offs:* Less built-in durability/retry sophistication than a managed service (acceptable at MVP volume).
- *Future implications:* May be revisited once real usage volume exists (listed as deferred in `architecture.md`).

**Related clarification (not a separate alternative path, but an explicit scope boundary on this decision):** the cascade-archive operation (requirement → test cases → reports → active test runs, NFR-DI-004) is executed as a single atomic database transaction, not routed through this background job queue, because atomicity is a transactional property that a job queue would not strengthen.

---

## AD-011 — Hosting: Single Platform-as-a-Service (PaaS)

**Status:** Approved

**Context:** An MVP hosting/deployment approach was needed for the backend application, background worker, and database.

**Decision:** Host the backend application, background worker process, and a managed PostgreSQL instance together on a single Platform-as-a-Service.

**Reason:** Fast to set up, low operational burden, predictable pricing, and appropriate for a small team — avoids the disproportionate setup/operational overhead of a self-assembled multi-service cloud deployment at MVP scale.

**Alternatives Considered:** A full cloud provider (AWS/GCP/Azure) self-assembled from individual services (rejected for MVP — significant setup/operational overhead not justified yet). A serverless-first approach (rejected — fits awkwardly with the background-job/long-running-AI-call pattern established in AD-009/AD-010, due to typical serverless execution time limits).

**Consequences:**
- *Benefits:* Low operational burden and predictable cost at MVP scale.
- *Trade-offs:* Some ceiling on very large scale (not a near-term concern given approved scope).
- *Future implications:* No specific PaaS vendor has been selected — remains a deferred, implementation-time choice.

---

## AD-012 — Observability: Standard Error Tracking, Uptime Monitoring, and Structured Logging

**Status:** Approved

**Context:** Approved non-functional requirements call for availability monitoring (NFR-AVAIL-001), AI generation failure monitoring (NFR-OBS-002), and payment/subscription event monitoring (NFR-OBS-003).

**Decision:** Use a standard, mainstream error-tracking tool, basic uptime monitoring, and structured application logging — no custom-built monitoring platform.

**Reason:** These NFRs are satisfied by widely available, low-cost tooling; building custom monitoring infrastructure would not be justified at MVP scale.

**Alternatives Considered:** Building custom logging/monitoring infrastructure (rejected — unnecessary complexity and cost for MVP).

**Consequences:**
- *Benefits:* Satisfies the approved monitoring NFRs at low cost.
- *Trade-offs:* None significant.
- *Future implications:* No specific vendor has been selected — remains a deferred, implementation-time choice.

---

## AD-013 — Cascade-Archive Executed as a Single Atomic Database Transaction

**Status:** Approved

**Context:** The requirement archive cascade (requirement → linked test cases → linked reports → any active, unclosed test run, per PD-016/PD-034) must leave no partially-archived state if interrupted (NFR-DI-004). An architectural decision was needed on whether this cascade runs synchronously within the backend/database, or is routed through the background job queue (AD-010) alongside other asynchronous work.

**Decision:** The cascade-archive operation executes as a single atomic database transaction, initiated directly by the backend at the moment of archiving — not as a background job.

**Reason:** Atomicity ("all changes commit, or none do") is a transactional guarantee. Routing this through an asynchronous job queue would not strengthen that guarantee and could introduce a window where a partial cascade is visible or where job failure/retry semantics complicate an operation that needs to be all-or-nothing.

**Alternatives Considered:** Processing the cascade as a background job like AI generation and email delivery (rejected — asynchronous processing is a poor fit for an operation whose core requirement is transactional atomicity, not offloading slow work).

**Consequences:**
- *Benefits:* Directly and simply satisfies NFR-DI-004's atomicity requirement.
- *Trade-offs:* The archiving request itself may take slightly longer to respond if the cascade touches many records, since it happens within the request rather than being offloaded (acceptable given approved scope and volume).
- *Future implications:* None identified at current approved scale.

---

# CHANGE-001 — Organisation QA Operating Model: Architecture Decisions (AD-014 through AD-026)

The decisions below re-baseline the architecture against PD-049–PD-063, DBD-009–023, and APID-010–020. See `architecture.md`'s "CHANGE-001 — Organisation QA Operating Model" section for the full module map, dependency diagram, and flow diagrams these decisions summarize.

## AD-014 — Modular Monolith Retained; No New Infrastructure

**Status:** Approved

**Context:** CHANGE-001 introduces several new internal domain capabilities (configuration, templates, workflow, quality gates). A decision was needed on whether this justifies microservices, a second deployable/database, or other new infrastructure.

**Decision:** The modular monolith (AD-001), single PostgreSQL database (AD-005), single PaaS hosting (AD-011), and database-backed job queue (AD-010) are all retained unchanged. No microservices, second deployable, second database, distributed transactions, event streaming, Kubernetes, service mesh, external workflow engine, external rules engine, or external form-builder engine is introduced.

**Reason:** None of the new capabilities require independent scaling, independent deployment, or a second data store — every one of them is bounded (3 workflow shapes, 6 gate types, 15 field types, 2 configurable document types) and fits comfortably within ordinary application-service composition over one database, exactly as the rest of the approved system already works.

**Alternatives Considered:** Extracting Workflow or Quality Gate into a separate service — rejected; no approved requirement demands independent scaling of either, and doing so would reintroduce distributed-transaction complexity (e.g., a Test Case create needing to coordinate across a network boundary with a Workflow service) that a single-transaction design avoids entirely. An external workflow/rules engine (e.g., a BPM product) — rejected; explicitly out of scope (PD-052/PD-058), and would be significant, unjustified operational complexity for 3 shapes and 6 gate types.

**Consequences:** No `ARCHITECTURE-BLOCKING DECISION REQUIRED` was identified anywhere in this re-baseline.

---

## AD-015 — Module Map: QA Configuration & Policy Merged, Template Engine and QA Documents Kept Separate

**Status:** Approved

**Context:** CHANGE-001's new capabilities could be organized as anywhere from one to six new modules. A decision was needed to avoid both under-modularization (a "God module") and over-modularization (a module per database table).

**Decision:** Five new/merged modules: **QA Configuration & Policy** (merges the Organisation QA Operating Model and Project Policy into one module, since Project Policy is structurally just bounded overrides on QA Configuration's own settings), **Template Engine** (kept separate from QA Documents — a shared, reusable capability consumed by both Test Case Management and QA Documents), **Workflow** (kept separate — a thin, shared instance-state tracker with no domain knowledge of its subjects), **Quality Gate/Readiness** (kept separate from QA Configuration & Policy — evaluating gates is a different capability from configuring them), **QA Documents** (Test Report + Regression Report, one module parameterized by document type).

**Reason:** See `architecture.md`'s "Why These Boundaries" for the full per-pair reasoning. In summary: module boundaries follow business capability and shared-vs-exclusive consumption, not table count — QA Configuration+Policy share one invariant and one transaction (merge); Template Engine has two independent consumers with no domain overlap (separate); Workflow's value is precisely that it has *no* domain knowledge (separate, and this is what prevents the Test Case↔Workflow cycle); Quality Gate reads many modules but owns none of their data (separate, pure aggregator).

**Alternatives Considered:** One combined "QA Governance" module for everything (Configuration + Templates + Workflow + Gates + Policy) — rejected as a God-module that would make Test Case Management depend on one large, low-cohesion module instead of several small, single-purpose ones. One module per table (7+ new modules) — rejected; several tables (e.g., `qa_artifact_policies` and `project_artifact_policy_overrides`) are one business capability split across two tables for versioning/override reasons, not two capabilities.

**Consequences:** `architecture.md`'s Final Module Map and dependency diagram. Defect Severity/Priority stay in Defect Management (AD-016 covers this specifically).

---

## AD-016 — Defect Severity/Priority Owned by Defect Management, Not Centralized

**Status:** Approved

**Context:** Defect Severity (stable semantic + org label) and Defect Priority (org-configurable) are both organisation-scoped configuration, which could plausibly live in QA Configuration & Policy alongside templates/workflow/gates.

**Decision:** Both remain owned by Defect Management as its own small, bounded classification sub-capability, exposed via `severity-priority.md`'s endpoints. Quality Gate/Readiness reads them through a narrow port (`getUnresolvedDefectsBySeverity`), never raw table access.

**Reason:** These concepts have no meaning outside a Defect, unlike templates/workflow/gates which govern documents in general. Centralizing them in QA Configuration & Policy would start that module toward becoming a generic "classification engine" (explicitly warned against, §19 of the task) for no cohesion benefit.

**Alternatives Considered:** Centralizing all organisation-level configurable classification (Severity, Priority, future similar concepts) into QA Configuration & Policy — rejected as premature generalization with no current second use case to justify it.

**Consequences:** `architecture.md`'s Defect Severity/Priority Architecture section.

---

## AD-017 — Effective Configuration Resolver as an Internal Application Service, Not a Separate Module

**Status:** Approved

**Context:** APID-011 requires server-side resolution of a project's effective configuration (org value + overrides). This could be a new module, a shared library, or an internal service owned by an existing module.

**Decision:** The resolver is an internal application service owned by QA Configuration & Policy, called both by the API layer directly (for `GET .../effective-configuration`) and internally by Test Case Management, QA Documents, AI Test Generation, and Quality Gate/Readiness — one implementation, multiple callers.

**Reason:** Avoids both a "God service" spanning module boundaries (§6's explicit caution) and duplicated merge logic if each consuming module implemented its own resolution. QA Configuration & Policy already owns every table this resolution reads, making it the natural owner.

**Alternatives Considered:** A separate "Configuration Resolution" module — rejected as unnecessary fragmentation; a standalone module with no data of its own and one method would violate the same "module per capability, not per table" principle guiding AD-015. Each consuming module re-implementing its own resolution query — rejected; would risk the merge logic drifting out of sync across callers.

**Consequences:** `architecture.md`'s Effective Configuration Resolver section.

---

## AD-018 — Configuration/Template Publish as a Single Synchronous Database Transaction

**Status:** Approved

**Context:** Publishing a QA Configuration Version or Template Version must be validated, atomic, immutable, idempotent, and auditable (§7 of the task).

**Decision:** Validation runs read-only, before the transaction opens; the authoritative write (flip draft → published, freeze referenced rows) and the audit-entry write happen together in one short database transaction; notification delivery is enqueued via the existing background job mechanism (AD-010) only after commit succeeds.

**Reason:** Matches the existing cascade-archive precedent (AD-013) — atomicity is a transactional guarantee, not something a background job or orchestration layer would strengthen. Keeping the transaction short (no external calls inside it) avoids the long-transaction risk explicitly flagged in §28 of the task.

**Alternatives Considered:** A multi-step orchestrated "saga" (draft → validate → resolve → persist → notify) coordinated outside the database — rejected; unnecessary complexity for an operation that fits entirely within one transactional boundary given the single-database architecture (AD-005).

**Consequences:** `architecture.md`'s Configuration Publication Architecture sequence diagram. Idempotency-key handling reuses the existing pattern (AD-010-adjacent), extended per APID-006/013.

---

## AD-019 — Presets as Application-Owned Static Definitions, Materialized by Copy

**Status:** Approved

**Context:** TestFlow's four starting presets need to live somewhere, without becoming a live runtime dependency for organisations that chose one (DBD-013).

**Decision:** Preset definitions are a small, static, codebase-owned data structure inside QA Configuration & Policy — not a database reference table, not a remote/external preset service. Selecting a preset copies its concrete settings into the new draft's rows at that moment; the definition is never consulted again for that organisation afterward.

**Reason:** Simplest maintainable approach (§8's explicit instruction) — a static, versioned-with-the-codebase definition is trivially reviewable in code review and requires no additional schema or service, while still guaranteeing "no runtime dependency on a mutable global definition" by construction (materialization is a one-time copy).

**Alternatives Considered:** A database reference table for presets — rejected as unnecessary indirection for four fixed, code-reviewed definitions; a remote preset service — explicitly rejected (§8: "do not create a remote preset service").

**Consequences:** `architecture.md`'s Preset Materialization section. A future TestFlow change to what "Standard QA" means only affects newly created drafts, never existing organisations' already-published configuration.

---

## AD-020 — Template Engine Validation Is the Authoritative Boundary for Dynamic Field Values

**Status:** Approved

**Context:** Configurable field values need validation somewhere in the stack — frontend, API, Template Engine, or the database's JSONB column.

**Decision:** Template Engine's semantic validation (required/type/option/entity-link/active-field checks against the resolved template version) is the single authoritative validation boundary, always re-run server-side regardless of client-side checks. PostgreSQL's JSONB column enforces no shape of its own — it is deliberately not relied upon as a validation boundary (DBD-010).

**Reason:** "Never rely solely on frontend validation, never rely solely on JSONB shape" (§10's explicit instruction) — Template Engine is the one place that actually has the resolved template version's field definitions in hand, making it the natural and only correct authority.

**Alternatives Considered:** Database CHECK constraints encoding field-type rules — rejected as impractical; per-template-version, per-field-type validation rules are inherently dynamic data, not expressible as static SQL constraints, and would need to change on every template publish.

**Consequences:** `architecture.md`'s Template Validation Architecture section; NFR-DYN-001 is directly implemented by this decision.

---

## AD-021 — Workflow Is a Thin, Subject-Agnostic Module (No Test Case ↔ Workflow Cycle)

**Status:** Approved

**Context:** §5 of the task explicitly warned against a Test Case → Workflow → Test Case → Configuration → Test Case dependency cycle.

**Decision:** Workflow's entire contract operates on a generic `(subjectType, subjectId)` pair — it has no knowledge of Test Case or QA Document's actual domain content, and never calls back into either. The calling module (Test Case Management or QA Documents) is responsible for denormalizing Workflow's returned state onto its own table, in its own transaction.

**Reason:** This is the structural mechanism that prevents the cycle — Workflow only ever receives calls, never initiates one back into a module that called it.

**Alternatives Considered:** Workflow directly writing `test_cases.current_meta_state` itself (would require Workflow to depend on Test Case Management's schema/table) — rejected in favor of Workflow returning the new state and the calling module writing its own denormalized column, keeping Workflow schema-agnostic about its subjects.

**Consequences:** `architecture.md`'s Dependency Direction diagram and rules; Workflow Approval Flow diagram.

---

## AD-022 — `availableActions` and Execution Eligibility Computed Once, Called from Every Consumer

**Status:** Approved

**Context:** Both `availableActions` (APID-015) and execution eligibility (FR-WF-004) need to be consistent between a read-side representation and a write-side authorization check, without duplicating logic.

**Decision:** `computeAvailableActions(shape, currentMetaState, actorRole)` and `canExecute(snapshot, effectiveConfiguration)` are each a single pure function, called identically by the relevant `GET` representation and the relevant `POST` action/write handler. The write handler never trusts a previously computed read-side value.

**Reason:** Directly satisfies §15/§16's explicit "do not duplicate transition/eligibility logic between GET and POST" and "do not rely on a previously returned value" instructions — a single function, called twice, structurally cannot drift out of sync with itself.

**Alternatives Considered:** Separate authorization logic in the read path (for display) and the write path (for enforcement) — rejected as the exact duplication risk the task warned against.

**Consequences:** `architecture.md`'s Workflow Architecture and Execution Eligibility Architecture sections; Execution Result sequence diagram.

---

## AD-023 — Quality Gate Evaluation: Fixed Evaluator Registry, On-Demand, No New Failure State

**Status:** Approved

**Context:** The six bounded gate types need an evaluation strategy that cannot silently grow into an expression language, and a defined behaviour when an evaluator itself fails (as opposed to legitimately resolving to a business "fail").

**Decision:** A fixed `Record<GateType, GateEvaluator>` registry (six entries, no plugin mechanism) evaluates on demand against current data — no persisted/cached authoritative result (matching DBD-021). If an evaluator throws, the entire readiness evaluation request fails with the existing `500 internal_error` envelope — it is never silently mapped to a business `fail`, and no new `not_evaluable` business state is added to the `pass`/`fail`/`not_applicable` enum.

**Reason:** Directly implements §21's bounded-registry instruction and resolves §40/§41's evaluator-failure question using an existing convention (the standard error envelope already distinguishes "the operation failed" from "the operation succeeded with an unfavorable result") rather than inventing new API surface.

**Alternatives Considered:** A `not_evaluable` fourth business state — considered and rejected; every gate condition in the bounded catalogue has a well-defined `fail` interpretation for its "not yet satisfied" case, so a technical failure is categorically different and already has a home (`500`) — adding a state would blur that distinction rather than clarify it.

**Consequences:** `architecture.md`'s Quality Gate Evaluation Architecture section and Project Readiness Evaluation sequence diagram. This resolves what the task flagged as a required §40/§41 analysis — documented here as **no gap**, not escalated.

---

## AD-024 — AI Test Generation Converges on Test Case Management's Normal Creation Path

**Status:** Approved

**Context:** AI-generated candidates must not bypass Template Engine validation, Workflow initialization, or permissions when saved.

**Decision:** AI Test Generation has no independent persistence capability for Test Cases. The save step (`POST /ai-generations/{id}/test-cases`) calls Test Case Management's normal creation service directly — the exact same one manual authoring uses, including its own Template Engine validation and Workflow initialization.

**Reason:** Structurally guarantees the "AI must not bypass X" requirements (§24) — there is no second code path into `test_cases`/`test_case_versions` to audit for divergence, because none exists.

**Alternatives Considered:** A parallel "AI Test Case Save" service duplicating Test Case Management's validation/persistence logic — rejected; would require the two paths to be kept in permanent lockstep by convention, exactly the failure mode CLAUDE.md rule 13/16 (AD-009) already guards against for the "no draft AI output table" rule, extended here to "no parallel save path" too.

**Consequences:** `architecture.md`'s AI ↔ Test Case Convergence sequence diagram.

---

## AD-025 — QA Documents: One Module, Parameterized by Document Type, No Parallel Service Duplication

**Status:** Approved

**Context:** Test Report and Regression Report are two document types sharing the same lifecycle (template, workflow, content snapshot) but exposed at different, product-friendly API paths (APID-016).

**Decision:** One `QaDocumentService` (and one QA Documents module) handles both, parameterized by `documentType`. Both `/reports` and `/regression-reports` API adapters call the same internal service. Test Report's Post-Deployment section is conditional content within the shared flow, not a reason to fork the service.

**Reason:** Directly implements §18's explicit "avoid duplicating business logic... do not create separate TestReportService and RegressionReportService unless meaningful domain differences require it" — no such meaningful difference exists beyond content shape, which the Template Engine already parameterizes per document type.

**Alternatives Considered:** Separate services per document type — rejected; would duplicate creation/workflow/template-integration logic for no behavioural benefit, and would risk the two drifting apart over time for no product reason.

**Consequences:** `architecture.md`'s QA Document Architecture section.

---

## AD-026 — No New Observability Stack; Extend Existing Logging/Error-Tracking Coverage

**Status:** Approved

**Context:** CHANGE-001 introduces new failure modes (configuration publish failure, template validation failure, workflow transition rejection, readiness evaluation latency, AI template-validation failure) that need operational visibility.

**Decision:** All new signals extend the existing structured logging / error-tracking / uptime stack (AD-012) — no new observability tool or stack is introduced. Configurable field values are not logged in full by default, only field keys and validation outcomes.

**Reason:** None of the new failure modes require a fundamentally different kind of observability than what AD-012 already provides (structured logs + error tracking + uptime); introducing a second stack would be unjustified operational complexity.

**Alternatives Considered:** A dedicated configuration-change audit/monitoring tool separate from the existing stack — rejected; the existing append-only Audit Log (unchanged mechanism, extended event coverage per FR-AUD-005) already serves the durable-record need, and AD-012's stack already serves the operational-alerting need — no gap exists that would justify a third mechanism.

**Consequences:** `architecture.md`'s Observability and Failure Handling section.

---

## AD-027 — Payment Provider: Stripe (Slice 1)

**Status:** Superseded by AD-028 — Stripe does not support payouts to Nigeria-based merchants, which was discovered after this decision was recorded. The reasoning below (webhook-driven, backend-authoritative-amount, no-raw-card-storage pattern) is preserved as historical record and carried forward unchanged in AD-028 — only the vendor changed.

**Context:** `architecture.md` and `architecture-decisions.md` (AD-009-adjacent context) name only a generic "external payment provider" for subscription/seat billing (FR-SUB-004/005, NFR-SEC-012, NFR-REL-003) — no specific vendor was ever selected. Slice 1's implementation-readiness audit flagged this as a blocking decision (SLICE1-DEC-001) before checkout/webhook code could be written.

**Decision:** Use Stripe as TestFlow's external payment provider, integrated via Stripe's PaymentIntents API (server creates a PaymentIntent with a backend-calculated amount; the frontend confirms payment client-side using Stripe.js/Elements; Stripe's webhook confirms the outcome asynchronously). All Stripe-specific code is isolated behind `backend/src/lib/stripe.ts` — domain/route code calls only that boundary, never the Stripe SDK directly.

**Reason:** Stripe is the de facto standard for this exact pattern (card-present checkout + asynchronous webhook confirmation), has first-class idempotency and webhook-signature-verification support that directly satisfies NFR-REL-003 and the approved "duplicate payment submission protected" / "webhook authenticity verified" requirements, and requires no raw card data to ever reach TestFlow's own servers (NFR-SEC-012) — Stripe Elements collects card details directly into Stripe's own iframe.

**Alternatives Considered:** A different named provider (e.g., Braintree, Adyen) — no functional requirement favors one over another; Stripe was chosen for tooling/documentation maturity and lowest integration risk for an MVP-stage team. A custom-built card-handling flow — rejected outright, would violate NFR-SEC-012 and duplicate work a payment provider already solves.

**Consequences:** `backend/src/lib/stripe.ts` (provider boundary), `backend/src/modules/subscription/webhook.routes.ts` (signature-verified, idempotent webhook handler), `.env.example` (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET). No change to `schema.sql`'s approved `payments`/`seat_batches`/`subscriptions` tables — Stripe's own PaymentIntent ID is not persisted in this slice (see `requirements-change-log.md`'s Slice 1 entry for the reasoning); webhook idempotency instead uses an implementation-level `processed_stripe_events` table.

---

## AD-028 — Payment Provider: Paystack (replaces Stripe)

**Status:** Approved

**Context:** Stripe does not support payouts to Nigeria-based merchants. AD-027's choice is unusable for this business and must be replaced before any real payment can be processed.

**Decision:** Use Paystack instead of Stripe, called directly via its REST API (`fetch`, no SDK dependency needed — Paystack's API is plain JSON over HTTPS). Same pattern as before: backend calculates the authoritative amount and calls `POST /transaction/initialize` (returns a `reference`/`access_code`); the frontend collects payment via Paystack's Inline popup, resuming that same server-created transaction (`access_code`) rather than re-specifying the amount client-side; Paystack's webhook (`charge.success`/`charge.failed`, verified via HMAC-SHA512 of the raw body using the secret key, header `x-paystack-signature`) is the sole authoritative activation trigger — identical role to Stripe's webhook in AD-027. No raw card data reaches TestFlow's servers (NFR-SEC-012) — Paystack's popup collects it directly.

**Reason:** Same reasoning as AD-027 (backend-authoritative amount, webhook-driven activation, no raw card storage) — only the vendor changes, because Stripe doesn't support Nigerian payouts.

**Alternatives Considered:** Flutterwave — another Nigeria-capable provider, not chosen simply because Paystack was the one specified. Paystack's redirect-based "Standard Checkout" instead of Inline popup — rejected to preserve the approved Checkout screen's in-page layout (Order Summary alongside the payment step) rather than navigating away to a hosted page.

**Consequences:** `backend/src/lib/paystack.ts` replaces `lib/stripe.ts`. `backend/src/modules/subscription/webhook.routes.ts` verifies Paystack's signature scheme instead of Stripe's. `.env.example` now has `PAYSTACK_SECRET_KEY` (backend, also used for webhook verification — Paystack needs no separate webhook secret) and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (frontend). The `stripe` npm dependency is removed (no SDK needed). No change to `schema.sql` — same reasoning as AD-027 for not persisting a provider transaction ID.

**Addendum (2026-09-12) — USD/NGN currency handling:** The merchant's actual Paystack account only settles in NGN (Paystack rejects `currency: "USD"` with `unsupported_currency` for this account; USD requires a separate multi-currency approval from Paystack that had not been granted at implementation time). Rather than changing TestFlow's approved USD pricing (FR-SUB-004/005), `lib/paystack.ts` converts the backend-calculated USD amount to NGN kobo using a fixed exchange-rate constant (`USD_TO_NGN_RATE`) only at the point of calling Paystack's `/transaction/initialize` — the UI, `calculateAmountCents`, and billing history all remain USD-denominated throughout, unaffected. The original USD amount is carried through as `usdAmountCents` in the transaction's metadata so the webhook reconciles billing history against the true quoted price, never against the NGN amount Paystack actually settled (which will drift from the live market rate since the constant is not fed by a live FX feed). If/when USD is enabled on the account, the conversion step can be removed and `currency` reverted to `USD` with no other change.

---

## AD-029 — Email Delivery Provider: Resend

**Status:** Approved

**Context:** `lib/email.ts`'s `sendEmail()` (Step 5 / AD-010) was always a deliberately named stub — it logs and records to an in-memory array for test assertions, with no real provider named anywhere in `architecture.md`/`architecture-decisions.md`. As a result, welcome (FR-AUTH-004) and payment-confirmation (FR-SUB-006) emails were never actually delivered to a real inbox in any environment. A real provider is now needed.

**Decision:** Use Resend, called directly via its REST API (`fetch`, no SDK dependency — same "boring, explicit infrastructure" pattern as `lib/paystack.ts`: `POST https://api.resend.com/emails` with an `Authorization: Bearer` header). `lib/email.ts`'s `sendEmail()` keeps recording to `sentEmails` unconditionally (test assertions/observability are unchanged) and additionally calls Resend for real delivery — skipped when `NODE_ENV=test` (Vitest's default) so the automated suite never makes a real network call or needs a real API key. A real delivery failure is left to propagate up to `jobs.ts`'s existing `processPendingJobs()` try/catch (AD-010's own retry/failed-marking path) rather than being swallowed inside `sendEmail()` itself — informational-only (FR-AUTH-004/FR-SUB-006) means a failure never blocks login or subscription access (the job-processing call sites already isolate that), not that the failure should go unrecorded as `status = 'done'`.

**Reason:** Resend needs only a single API key (no domain/sender verification required to start sending from its shared `onboarding@resend.dev` sender), fitting this project's pattern of minimal-setup, plain-`fetch` provider integrations (mirrors AD-028's reasoning for Paystack). No functional requirement favors a specific provider — this is purely an infrastructure choice.

**Alternatives Considered:** SendGrid — comparable API shape, more enterprise-oriented dashboard; not chosen only because Resend was specified. AWS SES — cheapest at scale, but requires AWS account setup and starts in a sandbox mode restricted to verified recipient addresses, adding local-dev friction with no corresponding benefit at this project's stage.

**Consequences:** New `backend/src/lib/resend.ts` (the provider boundary, mirroring `lib/paystack.ts`'s shape). `backend/src/config/env.ts` gains `resendApiKey` and `emailFromAddress` (defaults to `TestFlow <onboarding@resend.dev>`, Resend's no-verification-needed sender). `.env.example` documents `RESEND_API_KEY`. No change to `jobs.ts`'s enqueue/retry mechanics or to any call site — `sendEmail()`'s signature and the `sentEmails` test-assertion array are both unchanged, so this is purely additive within the existing email boundary.

**Addendum (2026-09-14) — sandbox-mode recipient restriction:** Resend accounts without a verified sending domain (still using the default `onboarding@resend.dev` sender) can only deliver to the account owner's own verified email address — any other recipient is rejected with a 403 (`"You can only send testing emails to your own email address..."`). This is a Resend account-level restriction, not an integration bug: real signup/payment-confirmation emails to actual users' addresses will silently fail to arrive until a real domain is verified at resend.com/domains and `EMAIL_FROM_ADDRESS` is updated to use it. Discovered when a real signup to a non-owner address produced no delivered email; the job was still marked `status = 'done'` because `sendEmail()` was swallowing the Resend error internally (fixed in this same change — see Decision above) rather than letting `jobs.ts`'s existing retry/failed-marking handle it, so this restriction is now at least observable via the `jobs` table (`status = 'failed'`, `payload`/error visible via the job-failure log line) instead of silently hidden.
