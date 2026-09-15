# API — Organisation QA Operating Model

**Module:** QAOM. **New module document (CHANGE-001).** See `docs/technical/api-spec.md` for shared conventions. Template contracts live in `templates.md`; workflow *action* endpoints (submit/approve/reject on a Test Case or QA Document) live in `workflows.md`; project-level effective configuration and overrides live in `project-policy.md`; Quality Gate configuration and readiness evaluation live in `quality-gates.md`. This document covers the organisation-level configuration lifecycle itself: presets, drafts, validation, and publish.

**Core distinction that governs this entire module (§1 of the task):** a **draft** (`GET/PATCH .../qa-configuration/draft`) is always mutable and has zero effect on any project. A **published version** (`GET .../qa-configuration/current`, `.../versions/*`) is permanently immutable the instant it publishes. No endpoint in this document allows a normal update against a published version — see Draft/Publish Contract below.

---

## List Available Presets

**Requirement IDs:** FR-QAOM-003.
**Purpose:** Let a QA Manager see the four starting options before choosing one.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `GET /organisations/{orgId}/qa-configuration/presets`
**Request:** Path: `orgId`.
**Successful Response:** `200 OK` — `[{ "presetOrigin": "standard", "name": "Standard QA", "description": "...", "recommended": true }, { "presetOrigin": "lightweight", ... }, { "presetOrigin": "controlled", ... }, { "presetOrigin": "custom", ... }]`. This list is served from TestFlow's own static preset definitions — it is descriptive/informational only.
**Business Rules:** Exactly these four (FR-QAOM-003) — no organisation-defined presets. **This endpoint's response is never a runtime dependency for any published configuration** — see "Preset Materialization" below (DBD-013).
**Error Conditions:** `403 forbidden`.
**Side Effects:** None (read-only).

---

## Start Configuration Draft (from Preset or Custom Setup)

**Requirement IDs:** FR-QAOM-002, FR-QAOM-004–007, FR-QAOM-008.
**Purpose:** Begin the draft that Organisation QA Setup (or a later reconfiguration, FR-QAOM-011) will publish.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /organisations/{orgId}/qa-configuration/draft`
**Request:** Path: `orgId`. Body: `{ "presetOrigin": "standard" | "lightweight" | "controlled" | "custom" }`.
**Successful Response:** `201 Created` — the new draft, with its sections (`templates`, `workflows`, `artifactPolicies`, `qualityGates`) **already populated** to match the chosen preset's content (materialized immediately server-side — see below), ready to publish as-is or edit further via `PATCH` below.
**Business Rules:** **Preset Materialization (DBD-013):** choosing `standard`/`lightweight`/`controlled` copies that preset's concrete settings into this draft's rows at this moment — the draft does not "reference" a live preset definition. If TestFlow later changes what "Standard QA" means for new organisations, this organisation's already-materialized draft/published configuration is unaffected; `presetOrigin` is retained purely as provenance metadata. `custom` starts from an empty/default-system-fields-only draft.
**Error Conditions:** `403 forbidden`; `409 conflict` (a draft already exists for this organisation — `CONFIGURATION_DRAFT_ALREADY_EXISTS`; use `PATCH`/`GET` on the existing draft instead, matching the schema's one-draft-per-org constraint).
**Side Effects:** Creates a draft `qa_configuration_versions` row plus its materialized child rows.
**Audit Behaviour:** Audited (FR-AUD-005).
**Security Considerations:** Organisation-scoped; standard tenant isolation.

---

## Retrieve Current Draft

**Requirement IDs:** FR-QAOM-008.
**Purpose:** Read the in-progress draft for editing.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `GET /organisations/{orgId}/qa-configuration/draft`
**Request:** Path: `orgId`.
**Successful Response:** `200 OK` — the draft, including `presetOrigin`, `templates` (references to each document type's applicable template version — draft or published), `workflows` (shape per document type), `artifactPolicies`, `qualityGates`. Also returns a `version` field (see Concurrency below).
**Business Rules:** None beyond standard read access.
**Error Conditions:** `403 forbidden`; `404 not_found` (`CONFIGURATION_NOT_PUBLISHED` does not apply here — this specifically means no draft is currently open; a `404` on this endpoint is the client's signal to call `POST .../draft` instead).
**Side Effects:** None.

---

## Update Configuration Draft

**Requirement IDs:** FR-QAOM-007, FR-QAOM-010, FR-QAOM-011.
**Purpose:** Edit the bounded governance catalogue (FR-QAOM-010) within the draft.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `PATCH /organisations/{orgId}/qa-configuration/draft`
**Request:** Path: `orgId`. Body: any of `workflows` (per-document-type shape + approver/reviewer role, from the bounded set — see `workflows.md`), `artifactPolicies` (per-artifact-type required/not-required), `qualityGates` (per-gate-type enabled + typed parameters — see `quality-gates.md`). Template selection/editing happens in `templates.md`, not here (a draft references whichever template version is currently the org's draft/published one for each document type — this endpoint does not itself edit template fields). Header: `If-Match: <version>` (concurrency, APID-003-style — see below).
**Successful Response:** `200 OK` — updated draft.
**Business Rules:** Only the settings in FR-QAOM-010's bounded catalogue are accepted; any other field is rejected as `validation_error`. Workflow shapes/gate types/artifact types are all validated against their respective bounded enums (`WORKFLOW_ACTION_NOT_ALLOWED` does not apply here; use `validation_error` for an out-of-enum value).
**Error Conditions:** `403 forbidden`; `404 not_found` (no draft open); `409 conflict` (`If-Match` version mismatch — concurrent edit, see Concurrency below); `422 validation_error` (out-of-catalogue setting, invalid gate parameter shape).
**Side Effects:** Updates draft rows.
**Audit Behaviour:** Audited.
**Security Considerations:** Standard tenant isolation; this endpoint must never accept `status` or `publishedAt`/`publishedBy` — those are set only by `POST .../draft/publish`.

---

## Validate Configuration Draft

**Requirement IDs:** §26 of the task (Configuration Validation API).
**Purpose:** Let a QA Manager check a draft for errors before attempting to publish, without side effects.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /organisations/{orgId}/qa-configuration/draft/validate`
**Request:** Path: `orgId`. No body.
**Successful Response:** `200 OK` — `{ "valid": true|false, "errors": [{ "section": "qualityGates", "resource": "min_requirement_coverage", "code": "INVALID_GATE_PARAMETER", "message": "thresholdPercent must be between 0 and 100" }], "warnings": [] }`.
**Business Rules:** Validates: every referenced template version exists and belongs to this organisation and is published-or-this-draft; every workflow definition has a shape-appropriate role assignment (`ck_workflow_definitions_role_presence`, DBD-015); every enabled gate's `parameters` matches its type's bounded shape (§12.6 of `database.md`); Priority/Severity references (if any gate uses `blocking_severities`) are valid semantic levels. This is bounded validation against the approved catalogue, not open-ended policy linting (§26 explicit instruction).
**Error Conditions:** `403 forbidden`; `404 not_found` (no draft open).
**Side Effects:** None — read-only check. `POST .../draft/publish` re-runs this same validation and refuses to publish on failure; calling this endpoint first is a convenience, not a required step.

---

## Publish Configuration

**Requirement IDs:** FR-QAOM-008, FR-QAOM-009.
**Purpose:** Make the draft the organisation's new current, immutable QA Operating Model.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /organisations/{orgId}/qa-configuration/draft/publish`
**Request:** Path: `orgId`. Header: `Idempotency-Key` (APID-006 — publishing is exactly the kind of action a double-click/retry must not duplicate), `If-Match: <version>` (concurrency).
**Successful Response:** `200 OK` — the newly published `qa_configuration_versions` resource (`versionNumber`, `status: "published"`, `publishedBy`, `publishedAt`).
**Business Rules:** Runs the same validation as `POST .../draft/validate`; refuses to publish on any error (`422 validation_error`, code `CONFIGURATION_INVALID`). On success: the draft row transitions to `published` (immutable from this instant — DBD-012), a new empty draft is **not** automatically started (the next `POST .../draft` call starts one when needed), and every currently-open project remains pinned to whatever version it already had (FR-QAOM-012 — this publish has **zero** effect on existing projects). Repeated publish requests with the same `Idempotency-Key` return the original published version, not a new one.
**Error Conditions:** `403 forbidden`; `404 not_found` (no draft open); `409 conflict` (`If-Match` mismatch — `PUBLISHED_VERSION_IMMUTABLE` does not apply here, since we're publishing a draft, not editing a published version; the conflict here is a stale *draft* read); `422 validation_error` (`CONFIGURATION_INVALID`, with the same structured errors as the validate endpoint).
**Side Effects:** Publishes the version; every project created after this point resolves to it (FR-QAOM-012); creates an audit entry; triggers `FR-NOT-006` notification to Admin/QA Manager.
**Audit Behaviour:** Audited (FR-AUD-005).
**Security Considerations:** Only QA Manager/Admin — never reachable via link-based access (NFR-SEC-014).

---

## Retrieve Current Published Configuration

**Requirement IDs:** FR-QAOM-009.
**Purpose:** Read the organisation's current effective QA Operating Model (what new projects will use).
**Actor/Permission:** Any organisation member (read-only).
**Method and Path:** `GET /organisations/{orgId}/qa-configuration/current`
**Request:** Path: `orgId`.
**Successful Response:** `200 OK` — same shape as the draft resource, plus `versionNumber`, `publishedBy`, `publishedAt`. Immutable — no `PATCH`/`PUT`/`DELETE` exists for this resource (`PUBLISHED_VERSION_IMMUTABLE` is the error a client would get if it tried, though no such route is even registered).
**Business Rules:** This is **not** necessarily the version any given existing project is pinned to — see `project-policy.md`'s effective-configuration endpoint for that.
**Error Conditions:** `403 forbidden`; `404 not_found` (should not occur in practice — FR-QAOM-001 guarantees a published version always exists once the organisation exists).
**Side Effects:** None.

---

## List / Retrieve Configuration Version History

**Requirement IDs:** §27 of the task (historical version retrieval).
**Purpose:** Let an authorized user inspect past published versions, including ones still referenced by pinned projects (FR-QAOM-012).
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `GET /organisations/{orgId}/qa-configuration/versions` (list, paginated, newest first); `GET /organisations/{orgId}/qa-configuration/versions/{versionNumber}` (one specific version, same shape as "current" above).
**Request:** Path: `orgId`, optionally `versionNumber`. Query (list): pagination.
**Successful Response:** `200 OK` — list of version summaries (`versionNumber`, `presetOrigin`, `publishedBy`, `publishedAt`), or the single full version.
**Business Rules:** Every published version remains retrievable indefinitely — never deleted (DBD-023).
**Error Conditions:** `403 forbidden`; `404 not_found` (unknown version number).
**Side Effects:** None.

---

## Concurrency

Configuration drafts use the same `If-Match: <version>`-header optimistic-concurrency pattern APID-003 already establishes for Test Case/Requirement, extended here rather than inventing a second mechanism (§28/§29 of the task): every `GET` of a draft returns a `version` field; `PATCH`/`POST .../publish` must echo it via `If-Match`; a mismatch returns `409 conflict`. Two QA Managers editing the same draft simultaneously: the second writer's stale `If-Match` is rejected, exactly as a stale Test Case edit is today — the client re-fetches and reapplies. No live-collaboration/co-editing feature is introduced (§28 explicit instruction). A `publish` request repeated with the same `Idempotency-Key` (APID-006) returns the original result rather than attempting to publish a second time, even if the underlying draft has since changed — this is the standard idempotency contract, not new behaviour invented for this endpoint.
