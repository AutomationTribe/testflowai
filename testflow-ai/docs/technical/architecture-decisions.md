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
