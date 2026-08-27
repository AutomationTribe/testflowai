# TestFlow AI — API Specification (Shared Conventions)

**Source documents:** vision.md, prd.md, product-decisions.md, functional-requirements.md, non-functional-requirements.md, architecture.md, architecture-decisions.md, database.md, database-decisions.md, schema.sql (all approved), plus the API decisions approved during API design review (see `api-decisions.md`).
**Status:** Approved — reflects only explicitly approved decisions.
**Scope:** This document defines the rules shared by every TestFlow AI API. Individual endpoints are documented per module in `docs/technical/api/`. No backend code, controllers, routes, or middleware are implemented by this document.

---

## API Purpose

The API is the sole gatekeeper between the web application and the database (AD-001). Every business rule approved in `functional-requirements.md` and `product-decisions.md` — role permissions, the test case status model, cascade-archive behaviour, subscription/seat gating, link scoping — is enforced here, not in the frontend. The web application (and, for link-based roles, the emailed-link flow) is the only client; no other consumer is approved at this stage.

## API Style

Resource-oriented REST, per the approved API design review. Endpoints are named around nouns (resources), not verbs, except where an action has no natural resource shape (e.g., `POST /test-cases/{id}/archive`, `POST /requirements/{id}/archive`) — these are documented explicitly with their reasoning in the relevant module file. RPC-style endpoints are avoided elsewhere.

## Base Path and Versioning

**APID-001 (approved):** every path is prefixed `/v1/` from the outset (e.g., `/v1/projects/{projectId}/test-cases`), even though no breaking change is anticipated yet. This is cheap insurance against a costly later retrofit — introducing a version prefix after clients already depend on unversioned paths is far more disruptive than starting with one. Module documents in `docs/technical/api/` omit the `/v1` prefix for readability; it applies uniformly to every path shown.

## Authentication

Two distinct mechanisms, matching AD-006/AD-007:

- **Organisation members** (Admin, QA Manager, QA Tester) authenticate via session-based login (`POST /v1/auth/login`), established using standard credential-handling libraries. Subsequent requests carry the session; which organisation and role the session belongs to is resolved server-side, never trusted from client-supplied headers/body fields.
- **Link-based roles** (BA/PO, Developer, Stakeholder) never authenticate. Their "credential" is the Access Link identifier itself, included in the path (`/v1/links/{linkToken}/...`). There is no login step, no session, and — per PD-043 — no identity verification of who is holding the link.

Every endpoint in the module documents states which of these two mechanisms applies.

## Authorization

Authorization is checked at three layers, in order, for every request:
1. **Role** — does the authenticated user's organisation-level role (Admin/QA Manager/QA Tester) permit this action at all (per `functional-requirements.md`'s Actors on each requirement)?
2. **Project/object access** — for project-scoped resources, does the user have access to *this specific* project (via role-based organisation-wide visibility, or an explicit Project Membership grant, per FR-PRJ-004)? For a directly-addressed resource (`/test-cases/{id}`), does it belong to a project the user can access?
3. **Link scope** — for link-based requests, does the link's recorded scope match the exact action and target being requested (NFR-SEC-005), and is the link unexpired and unrevoked (NFR-SEC-006)?

This document does not restate which roles can perform which action — that is `functional-requirements.md`'s Actors/Permission field, referenced per-operation in the module documents, not duplicated here.

## Tenant Isolation

Every authenticated request resolves its target resource's Organisation ID server-side (never accepted as a client-supplied parameter that could be spoofed) and verifies it matches the caller's own organisation. This applies uniformly across every endpoint, including ones addressed by a bare resource ID with no `{orgId}` in the path — the organisation is always derived from the resource itself (e.g., a test case's project, and that project's organisation), never assumed from context. This is the single highest-priority cross-cutting rule in the entire API surface (NFR-SEC-003).

## Resource Naming

- Tables/resources are plural, kebab-case in URLs: `/test-cases`, `/test-runs`, `/access-links` (matching the database's `snake_case` table names, translated to URL-appropriate kebab-case).
- Organisation and Project are the two real hierarchy anchors (see §5 of the API design review): organisation-scoped resources nest under `/organisations/{orgId}/...` (members, invitations, templates, subscription, audit log); project-scoped resources nest under `/projects/{projectId}/...` only for creation and listing, and are addressed directly by ID thereafter (`/test-cases/{testCaseId}`, not a fully nested path) — a resource's own UUID is already globally unique and sufcient for direct access, and deep nesting adds no real information.
- Sub-resources that have no independent identity outside their parent nest under it: `/test-runs/{runId}/items/{itemId}`, `/test-cases/{testCaseId}/versions/{versionNumber}`.

## Request Conventions

- **Path parameters:** always the resource's UUID (per DBD-007); never a sequential/guessable identifier.
- **Query parameters:** used only for list/search endpoints — pagination (`cursor`, `limit`), sorting (`sort`), and the specific approved filters per resource (documented per module; see Filtering below). No query parameter is added "just in case."
- **Request bodies:** JSON, camelCase field names (APID-008 — see below), containing only the fields the caller is allowed to set. Status/workflow fields (e.g., a test case's `approvalStatus`) are never accepted in a generic update body — they change only through the specific transition the business rule requires (e.g., a direct `status` field is allowed on Test Case since approval is now self-service and unconditional, per PD-048, but fields like `currentVersionNumber` or `isAiGenerated` remain server-computed and are rejected if present in a request body).
- **Optional fields:** omitted entirely from the request body when not provided (not sent as `null`), and the response never fabricates a value for a field the caller didn't set.
- **Dates/times:** ISO 8601, UTC, in both requests and responses (e.g., `2026-08-27T14:30:00Z`) — matching `timestamptz` throughout the schema.
- **Identifiers:** UUID strings everywhere, matching DBD-007.

## Response Conventions

- **Single resource:** the resource object directly, with `id`, relevant timestamps, and shallow references to related resources (e.g., a test case response includes `requirementId` if linked, not the full requirement object).
- **List response:** `{ "items": [ ... ], "nextCursor": "string | null" }`.
- **Successful mutation:** the created/updated resource's current state (not just a bare `{ "success": true }`), so the caller never needs an immediate follow-up GET.
- **Asynchronous operations** (AI generation — the only approved async pattern, APID-005): `202 Accepted` with `{ "id": "...", "status": "requested" }`; the caller polls `GET /v1/ai-generations/{id}` for completion. No webhook/callback mechanism to the frontend is approved.

## Pagination

**APID-002 (approved):** cursor-based pagination on every list endpoint — `?cursor=...&limit=...`, response includes `nextCursor`. Chosen over offset/page-based pagination because several list resources (test cases, execution history, audit log) can grow large and offset pagination degrades and becomes unstable under concurrent inserts at that scale.

## Filtering

Only filters with clear approved meaning are supported, and only on indexed fields (matching `database.md`'s Index Strategy):
- Test cases: `status` (`draft`/`approved`/`needs_review`), `requirementId` (traced/untraced), `suiteId`.
- Test runs: `status` (`open`/`closed`/`cancelled_archived`).
- Defects: `status` (`open`/`pending`/`closed`/`removed`).
- Requirements: `status` (`active`/`archived`).

No filter is provided for concepts that don't exist in the approved model (priority, assignee, tags) — adding one would be inventing scope.

## Sorting

`?sort=<field>:<asc|desc>`, restricted to fields with a supporting index (`createdAt` on most resources; composite-indexed fields where documented per module). Arbitrary sort-by-any-field is not supported.

## Search

Simple case-insensitive substring match on a resource's `title`/`name` field only (`?q=...`), where listing that resource is already supported. No full-text search infrastructure is approved (per `architecture.md`'s explicit exclusion of a dedicated search engine).

## Error Format

**APID-007 (approved):** one shared envelope across every endpoint:

```json
{
  "error": "validation_error | unauthorized | forbidden | not_found | conflict | invalid_state | rate_limited | internal_error",
  "message": "Human-readable explanation",
  "fields": { "steps": "required" }
}
```

`fields` is present only for `validation_error`. Mapping:

| Situation | HTTP Status | `error` value |
|---|---|---|
| Malformed/invalid request body | 422 | `validation_error` |
| Not authenticated (no/invalid session, or invalid/expired/revoked link) | 401 or 403 (link-specific — see `links.md`) | `unauthorized` |
| Authenticated but not permitted (wrong role, no project access, wrong link scope) | 403 | `forbidden` |
| Resource does not exist, or caller has no visibility into it (tenant/project isolation — see Security Principles) | 404 | `not_found` |
| Resource exists but conflicts with the request (e.g., duplicate trial activation) | 409 | `conflict` |
| Business-rule violation not fitting the above (e.g., recording a result on a closed run) | 409 | `invalid_state` |
| An approved usage/rate limit is exceeded (AI generation, once a limit is defined — currently an open item, see `non-functional-requirements.md`) | 429 | `rate_limited` |
| Unexpected server-side failure | 500 | `internal_error` |

`401` vs. `403` are always kept distinct (never collapsed), since the system has both login-based and link-based access and the distinction matters for both client handling and security review.

## Concurrency

**APID-003 (approved):** optimistic concurrency on Test Case and Requirement edits — the two resources whose edits trigger meaningful side effects (approval-status reversion, PD-048; re-review cascade, PD-033), making a silent overwrite worse than an ordinary CRUD conflict. Every `GET` of a Test Case or Requirement returns a `version` field (Test Case: `currentVersionNumber`, already part of the resource; Requirement: a new response-only `revisionToken` derived from `lastEditedAt`, since requirements don't version per DBD-004). The corresponding `PATCH` must include the same value it read; a mismatch returns `409 conflict` rather than silently applying the edit over someone else's. Other resources (test suites, templates, projects) do not carry this mechanism at MVP — no approved requirement flags a comparable risk there, and adding it everywhere would be unjustified complexity.

## Idempotency

**APID-006 (approved):** an `Idempotency-Key` request header is honored on: `POST /v1/organisations/{orgId}/subscription/*`, `POST /v1/organisations/{orgId}/seats`, `POST /v1/requirements/{id}/ai-generations`, `POST /v1/projects/{id}/test-runs`, `POST /v1/projects/{id}/reports`. If the same key is replayed within a reasonable window, the original result is returned rather than the action repeating. This protects against double-charging a customer (subscription/seat purchases) and against double-triggering an expensive AI generation or report compilation on a retried/double-clicked request.

## Asynchronous Operations

**APID-005 (approved):** AI generation is the only approved long-running, asynchronous operation (NFR-AI-001/002 allow up to 60 seconds). It follows the `202 Accepted` + poll pattern described under Response Conventions above. No other approved operation is async: report generation targets 5 seconds (NFR-PERF-003) and is handled synchronously; there is no approved bulk import/export to make async (FR-IMP is Post-MVP).

## File Handling

Evidence attachment uploads/downloads never carry raw binary data in a JSON body. Per the approved File and Attachment Architecture (AD-008): the client requests upload authorization, receives a short-lived signed URL to cloud object storage, uploads directly to it, then confirms completion with the API (which records the `Evidence` metadata row). Downloads work in reverse — the API authorizes access (verifying project access, same as viewing the parent execution result) and returns a short-lived signed URL, never a permanent public link. Uploads are validated against the approved 10 MB cap and MIME-type allowlist (NFR-FILE-001/002) before the metadata record is confirmed.

## Audit Behaviour

Every mutation the functional requirements or non-functional requirements identify as a "key action" creates an Audit Log Entry (FR-AUD-001): role changes, member removal, project/requirement archiving (including cascades), test case status changes, defect status changes, and all link-based actions (report approval/rejection, defect status updates via link). Purely informational reads never create audit entries. Each module document states, per operation, whether it is audit-worthy — this is not restated in full here to avoid duplicating `functional-requirements.md`.

## Security Principles

- **Tenant isolation is checked before anything else** on every request (see above) — a resource belonging to another organisation returns `404 not_found`, not `403 forbidden`, so as not to confirm the resource's existence to a caller who shouldn't know about it at all.
- **Object-level authorization is mandatory on every bare-ID endpoint** — an authenticated session is never sufficient on its own; project/object access is re-checked per request, not cached from login.
- **Link-scope errors return `403`, not `404`** — a link used against the wrong action/resource type reveals that the link *exists* but is being misused, which is an acceptable disclosure (the caller already possesses the link), whereas inventing a `404` here would create an inconsistent signal compared to genuinely-expired/revoked links (which also return a uniform "invalid or expired" `401`/`403` regardless of the underlying reason — see `links.md`).
- **Mass assignment is prevented per-endpoint** — every request body's allowed fields are documented explicitly per operation; server-computed or transition-only fields are never client-writable.
- **File access is always brokered**, never a raw permanent object-storage URL.
- **AI data exposure is minimal** — generation responses never include raw prompt text or unrelated project data (NFR-AI-007, NFR-PRIV-001).
- **Report comments are structurally excluded from report content** at the query level (PD-040), not filtered client-side.

## API Naming Convention

**APID-008 (approved):** JSON request/response fields use camelCase, matching the approved TypeScript stack (AD-002/003); the mapping to the database's `snake_case` columns happens at the data-access layer, not in the API contract.

## Bulk Operations

**APID-004 (approved):** not supported at MVP. Every write operation acts on one resource at a time (e.g., adding a test case to a suite is one call per test case). No approved requirement calls for bulk operations, and bulk import/export (FR-IMP) is explicitly Post-MVP.
