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
