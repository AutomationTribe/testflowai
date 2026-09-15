# API — Document Workflow

**Module:** WF. **New module document (CHANGE-001).** See `docs/technical/api-spec.md` for shared conventions. Workflow *shape configuration* (which of the three shapes applies to which document type) is set via `qa-configuration.md`'s draft/publish contract — this document covers the *instance-level actions* a Test Case or QA Document goes through once a shape is in effect.

**Core principle (§12 of the task):** this API is **not** a generic transition endpoint accepting arbitrary destination state names. Exactly three bounded actions exist — `submit`, `approve`, `reject` — and which of them is valid at any moment depends on the subject's current workflow shape, current meta-state, and the caller's role. Clients never construct a transition; they call the named action and the server enforces validity.

---

## Workflow Representation on a Subject

Every Test Case (`test-cases.md`) and QA Document (`reports.md`) response includes:

```json
{
  "workflowState": {
    "metaState": "draft",
    "displayLabel": "Draft",
    "shape": "no_approval"
  },
  "availableActions": ["approve"]
}
```

- `metaState` — the stable, TestFlow-controlled value (`draft` | `in_review` | `submitted_for_approval` | `approved` | `needs_review`). Gate evaluation, reporting, and AI validation key off this, never `displayLabel` (FR-WF-003).
- `displayLabel` — the organisation's configured label for this meta-state under its current published configuration (`workflow_state_labels`) — display only.
- `shape` — which of the three bounded shapes governs this subject (`no_approval` | `single_approval` | `review_approval`), resolved from the subject's project's effective configuration.
- `availableActions` — **the direct implementation of §12's explicit recommendation**: the exact subset of `submit`/`approve`/`reject` (plus, under `no_approval` only, `set_approved` — see below) that the *current caller*, given their role and the subject's current state, may perform right now. A frontend client renders exactly these as buttons — it never re-derives workflow authorization logic itself.

---

## Perform Workflow Action

**Requirement IDs:** FR-WF-001, FR-WF-002, FR-WF-004, FR-WF-006, FR-TC-005, FR-WF-005.
**Purpose:** Move a Test Case or QA Document through its configured workflow.
**Actor/Permission:** Depends on `shape` and the action, per FR-WF-006's role mapping:
- `no_approval`: any user with edit access to the subject may call `set_approved` (equivalent to today's direct self-service approval, PD-048/PD-049) — there is no `submit`/`approve`/`reject` under this shape, since there's nothing to hand off.
- `single_approval`: the author (or any editor) calls `submit`; the configured approver role (`qa_manager` or `admin`, per the workflow definition) calls `approve` or `reject`.
- `review_approval`: the author calls `submit`; the configured reviewer role calls `approve` (advances to `submitted_for_approval`) or `reject` (returns to `draft`); the configured approver role then calls `approve` (advances to `approved`) or `reject` (returns to `draft`).
**Method and Path:** `POST /test-cases/{testCaseId}/workflow/{action}`; `POST /qa-documents/{qaDocumentId}/workflow/{action}` — `{action}` is one of `set_approved` | `submit` | `approve` | `reject`.
**Request:** Path: subject ID, `action`. Body: `comment` (optional, stored on the resulting `workflow_transitions` row — most relevant for `reject`).
**Successful Response:** `200 OK` — the subject with its updated `workflowState`/`availableActions`.
**Business Rules:** The server independently re-validates that `action` is a member of the caller's current `availableActions` before applying it — never trusts a client's earlier read. Editing a Test Case/QA Document that is currently `approved` reverts it to `needs_review` regardless of which shape governs it (FR-TC-005) — this happens via the normal content-edit endpoint (`PATCH /test-cases/{id}`), not this action endpoint. Under `no_approval`, the equivalent of "edit reverts to needs_review, then any editor sets it back to approved" is unchanged from pre-pivot behaviour (PD-048/PD-049) — see `test-cases.md`.
**Error Conditions:** `403 forbidden` (wrong role for this action — `WORKFLOW_ACTION_NOT_ALLOWED`); `404 not_found`; `409 conflict` (`action` not valid from the subject's current `metaState` — also `WORKFLOW_ACTION_NOT_ALLOWED`, since an invalid-transition attempt and an unauthorized-actor attempt are both "this action isn't available to you right now," distinguished by `message`, not by a different error code); `422 validation_error` (missing required fields on the underlying document that the workflow shape requires before advancing — e.g. `single_approval` may require the Test Case to have no empty required template fields before `submit` succeeds).
**Side Effects:** Updates `workflow_instances.current_meta_state`, denormalizes onto the subject (`test_cases.current_meta_state`/`qa_documents.current_meta_state`), appends a `workflow_transitions` row, creates an audit entry, sends a `FR-NOT-007` notification to whichever role/user the next state requires action from (or to the author, on `reject`).
**Audit Behaviour:** Audited (FR-AUD-005).
**Security Considerations:** Never reachable via link-based access — BA/PO's report approval (`report_approval_records`, `links.md`) is a structurally separate, non-workflow concept (see Report Approval vs. Document Workflow below).

---

## Report Approval vs. Document Workflow (Explicit Separation)

**Requirement IDs:** PD-039, PD-050, FR-WF-005, FR-QG-001.
Two entirely separate mechanisms exist for a QA Document and must never be conflated in a client:
1. **This module's workflow actions** (`submit`/`approve`/`reject`) — internal, role-based, changes `workflowState.metaState`. Reachable only by organisation members.
2. **BA/PO link-based report approval** (`report_approval_records`, documented in `links.md`) — external, link-based, records a separate `approved`/`rejected` decision tied to the access link, with **no effect on `workflowState`** and no effect on anything else by default (PD-039/PD-050). An organisation may configure a Quality Gate (`quality-gates.md`) that reads *either* of these two signals as an input condition — the gate, not either mechanism itself, is what can make approval consequential.

A QA Document response therefore carries both, clearly separated:

```json
{
  "workflowState": { "metaState": "approved", "displayLabel": "Approved", "shape": "single_approval" },
  "availableActions": [],
  "linkApproval": { "decision": "approved", "decidedAt": "2026-09-04T10:00:00Z" }
}
```

`linkApproval` is `null` until a BA/PO has acted via their link.

---

## Unapproved Test Case Execution (FR-WF-004)

**Requirement IDs:** FR-WF-004.
**Purpose:** Preserve the approved enforcement point (result-recording time, not run-creation time) while giving clients enough information to avoid a doomed attempt.
This is not a new endpoint — it changes two existing responses:
- **Test Run item read** (`GET /test-runs/{runId}` / its items, `test-runs.md`): each `test_run_test_cases` snapshot item includes `"executionEligible": true|false` and, when `false`, `"executionBlockReason": "TEST_CASE_NOT_APPROVED"`. This is a UI convenience only, computed from the organisation's `no_approval_test_case_execution` setting × the snapshot's frozen approval state at run creation.
- **Record Execution Result** (`POST /execution-results`, `test-runs.md`/`execution.md`): remains the sole authoritative enforcement point. If the organisation's setting is `prohibited` and the snapshot's test case was not `approved` at run-creation time, this call returns `409 conflict`, `error: "invalid_state"`, code `APPROVAL_REQUIRED_FOR_EXECUTION`. **The authoritative check is never moved to run creation** — a run may always be created containing not-yet-approved test cases, per `database.md` §12/FR-WF-004's explicit enforcement-point decision.
