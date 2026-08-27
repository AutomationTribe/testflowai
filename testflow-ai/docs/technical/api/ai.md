# API — AI Test Generation

**Module:** AI. See `docs/technical/api-spec.md` for shared conventions, especially the async pattern (APID-005).

**Core distinction that governs this entire module:** AI-generated candidates are **draft content**, held only in the generation request's result, until a human explicitly reviews and saves them. They are never TestFlow **saved test cases** until that save step completes (FR-AI-002, NFR-AI-004). There is no API path that persists draft output automatically.

---

## Trigger Generation

**Requirement IDs:** FR-AI-001, FR-AI-005, NFR-AI-001, NFR-AI-007.
**Purpose:** Ask the AI to draft a full set of test cases from a requirement.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /requirements/{requirementId}/ai-generations`
**Request:** Path: `requirementId`. Body: none beyond the requirement reference — no free-text task description field is accepted; generation is requirement-scoped only for MVP (FR-AI-005). Header: `Idempotency-Key` (APID-006).
**Successful Response:** `202 Accepted` — `{ "id": "...", "status": "requested" }`. Generation is asynchronous, not returned synchronously (APID-005).
**Business Rules:** Only the selected requirement's content is sent to the configured AI provider (platform key or project key, FR-AI-003/FR-AI-004) — no other project data is included in the generation request (NFR-AI-007).
**Error Conditions:** `403 forbidden`; `404 not_found` (requirement); `409 conflict` (requirement archived); `503 internal_error`-equivalent (no AI provider configured/available — degrades gracefully per NFR-AI-003, does not 500).
**Side Effects:** Schedules a background job (AD-009); creates an AI Generation Request record.
**Audit Behaviour:** Not on the strict minimum list; reasonable to log the trigger event.
**Security Considerations:** No customer data beyond the requirement's own content is transmitted to the provider (NFR-PRIV-001).

---

## Check Generation Status / Retrieve Drafts

**Requirement IDs:** NFR-AI-002, FR-AI-002.
**Purpose:** Poll for completion and retrieve draft candidates for review.
**Actor/Permission:** Same as trigger.
**Method and Path:** `GET /ai-generations/{generationId}`
**Request:** Path: `generationId`.
**Successful Response:** `200 OK` — `status` (`requested` | `succeeded` | `failed` | `timed_out`) and, if `succeeded`, the array of draft test cases (`title`, `steps`, `expectedResults`) — returned in the response body only, **never persisted as real Test Case rows** at this point.
**Business Rules:** A request exceeding 60 seconds is surfaced as `timed_out` with a retry option (NFR-AI-002), not left pending indefinitely.
**Error Conditions:** `404 not_found`; `403 forbidden`.
**Side Effects:** None (read-only poll).
**Notes:** Drafts are visibly/textually distinguishable from saved test cases wherever the client displays them (NFR-AI-005) — a client-side/UX concern noted here for traceability, not something this endpoint's contract itself enforces beyond simply never mixing draft and saved data in the same resource shape.

---

## Save Selected Drafts as Test Cases

**Requirement IDs:** FR-AI-002, NFR-AI-004, FR-TC-010, NFR-AI-006.
**Purpose:** The mandatory human-review gate — convert reviewed (and possibly edited) drafts into real, saved test cases.
**Actor/Permission:** Same as trigger.
**Method and Path:** `POST /ai-generations/{generationId}/test-cases`
**Request:** Path: `generationId`. Body: array of drafts to keep, each with final (possibly human-edited) `title`/`steps`/`expectedResults`. Drafts not included in this array are implicitly discarded — no separate "reject" call is needed or provided.
**Successful Response:** `201 Created` — the newly created Test Case resources (`isAiGenerated: true`, `currentVersionNumber: 1`).
**Business Rules:** This is the **only** path by which AI-generated content becomes a real Test Case (NFR-AI-004, structurally enforced, matching AD-009 — there is no shortcut). Discarded drafts are never persisted anywhere, in any table.
**Error Conditions:** `422 validation_error` (malformed draft content); `403 forbidden`; `404 not_found` (generation not found, or already fully consumed); `409 conflict` (generation not yet `succeeded`).
**Side Effects:** Creates one or more Test Case rows, each retaining a permanent link back to this Generation Request (NFR-AI-006 — source traceability survives later edits).
**Audit Behaviour:** Reasonable to log (test case creation).
**Security Considerations:** The response never includes internal provider details (raw prompt text, if ever logged internally) — only the fields the approved data model stores.

---

## View Generation History

**Requirement IDs:** NFR-AI-006.
**Purpose:** View past generation attempts for a requirement, for traceability and troubleshooting.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `GET /requirements/{requirementId}/ai-generations`
**Request:** Path: `requirementId`. Query: pagination.
**Successful Response:** `200 OK` — list of past Generation Requests (`status`, `providerUsed`, `requestedAt`, `completedAt`, and the resulting test case IDs where `succeeded` and saved).
**Business Rules:** Rejected (discarded) drafts are not retained anywhere and so cannot appear in this history beyond the fact that a generation occurred and its outcome status — no per-draft acceptance/rejection record exists (an explicitly flagged open item in `database.md` §7, not resolved by this API design).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None (read-only).

---

## Failures and Usage Limits

**Requirement IDs:** NFR-AI-002, NFR-AI-003, NFR-AI-008, NFR-SEC-013.
- A generation exceeding 60 seconds is marked `timed_out` and surfaced with a retry option (checked via the status-poll endpoint above) — there is no separate "retry" endpoint; retrying is simply triggering generation again.
- If the configured AI provider (platform or project key) is unavailable, `POST /requirements/{requirementId}/ai-generations` returns an error clearly, without degrading any other part of the API (NFR-AI-003) — all non-AI endpoints remain fully functional regardless of AI provider status.
- **Usage/rate limiting is not yet implemented in this API design** — the approved non-functional requirements flag this as an open decision (NFR-AI-008: no specific cap defined, blocked on the platform AI cost model). Once a limit is approved, it will surface here as a `429 rate_limited` response on the trigger endpoint; this document does not invent a limit in the meantime.
