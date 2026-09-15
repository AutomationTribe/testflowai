# API — Test Case Management

**Module:** TC. See `docs/technical/api-spec.md` for shared conventions. The Template System is documented in `templates.md`; workflow shape configuration and action endpoints in `workflows.md`; Test Suites in `test-suites.md`; AI generation in `ai.md`.

**CHANGE-001 summary:** `approvalStatus` is replaced by `workflowState`/`availableActions` (see `workflows.md`); `templateId` selection on create is removed (the server resolves the project's applicable Test Case template automatically, since template selection is not project-overridable, FR-POL-003); `priority` and organisation-configurable fields are added.

---

## Create Test Case

**Requirement IDs:** FR-TC-001, FR-TC-006, FR-TC-008, FR-TC-010, FR-TC-011, FR-TPL-009.
**Purpose:** Author a new test case, manually or from AI-generated content, against the project's applicable Test Case template.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /projects/{projectId}/test-cases`
**Request:** Path: `projectId`. Body: `title`, `steps` (structured), `expectedResults` (structured), `requirementId` (optional), `priorityOptionId` (optional — must be an active option on the field the applicable template defines for Priority, `templates.md`), `configurableFieldValues` (optional object, keyed by `fieldKey`, validated against the applicable template version — see `templates.md`'s Field-Type Contract). **No `templateId` field is accepted** — the server resolves the project's currently applicable, published Test Case template version itself (via the project's pinned `qaConfigurationVersionId`, `project-policy.md`), since template selection is not a client choice at MVP (FR-POL-003).
**Successful Response:** `201 Created` — the test case, including `documentTemplateVersionId` (the resolved version, for client transparency — see `templates.md` to fetch its field definitions if needed), `workflowState`/`availableActions` (`workflows.md`), `currentVersionNumber: 1`, `isAiGenerated: false`.
**Business Rules:** Requirement link is optional (PD-005). `configurableFieldValues` is validated field-by-field against the resolved template version before creation succeeds — an unknown `fieldKey`, an inactive field, a missing required field, a wrong-shaped value, or an invalid dropdown/entity-link reference all reject the whole request (no partial creation) — see Error Conditions.
**Error Conditions:** `403 forbidden`; `404 not_found` (project/requirement); `409 conflict` (project archived); `422 validation_error` with `fields` identifying each problem, using the field-value error codes below.
**Side Effects:** Creates data.
**Audit Behaviour:** Reasonable to log (not on the strict FR-AUD-001 minimum list).
**Security Considerations:** `workflowState`, `currentVersionNumber`, `isAiGenerated`, `documentTemplateVersionId` are never client-writable on create — server-computed only.

### Configurable Field Value Errors

`422 validation_error`, `fields` entries use these codes (§9 of the task):

| Code | Meaning |
|---|---|
| `REQUIRED_FIELD_MISSING` | A required configurable field (per the applicable template version) was omitted |
| `UNKNOWN_FIELD` | `configurableFieldValues` includes a `fieldKey` not defined on the applicable template version |
| `FIELD_NOT_ACTIVE` | The field exists but is deactivated (`isActive: false`) on the applicable template version |
| `INVALID_FIELD_VALUE` | Wrong type/shape for the field's `fieldType` (e.g. a string where `number` is expected) |
| `INVALID_FIELD_OPTION` | `dropdown`/`multi_select` value (or `priorityOptionId`) references an unknown or inactive `optionKey` |
| `INVALID_ENTITY_REFERENCE` | `entity_link` value doesn't resolve to an existing, same-organisation record of the field's `targetType` |
| `INVALID_STEP_TABLE_STRUCTURE` | (Applies to `steps`/`expectedResults` directly, not `configurableFieldValues` — `step_table` fields render these system columns, `templates.md` §Field-Type Contract) malformed step structure |
| `FIELD_NOT_PERMITTED_ON_TEMPLATE_VERSION` | A value was supplied for a field that exists on a *different* template version than the one resolved for this record (stale client state — re-fetch the applicable template) |

---

## List / Search Test Cases

**Requirement IDs:** FR-TC-001.
**Purpose:** List and filter test cases within a project.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /projects/{projectId}/test-cases`
**Request:** Path: `projectId`. Query: pagination, `?metaState=draft|in_review|submitted_for_approval|approved|needs_review` (CHANGE-001: renamed from `status`, same underlying filter concept, now spanning all workflow shapes — not just the pre-pivot 3-value set), `?requirementId={id}|none` (traced/untraced filter), `?suiteId={id}`, `?priorityOptionId={id}` (CHANGE-001, FR-TC-011), `?q=` (title search).
**Successful Response:** `200 OK` — list of test cases.
**Business Rules:** None beyond project access. `metaState` and `priorityOptionId` are filterable because both are typed, indexed columns (`test_cases.current_meta_state`, `test_cases.priority_option_id` — `database.md` §12, NFR-DYN-002); no other configurable field is filterable at MVP (see §34 of the task's boundary, restated in `api-spec.md`'s Filtering section).
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## View Test Case (Current)

**Requirement IDs:** FR-TC-002.
**Purpose:** Retrieve current live content and status.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-cases/{testCaseId}`
**Request:** Path: `testCaseId`.
**Successful Response:** `200 OK` — the test case, including `currentVersionNumber` (used as the concurrency token for edits, APID-003).
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## Edit Test Case

**Requirement IDs:** FR-TC-002, FR-TC-003, FR-TC-005, FR-TC-011.
**Purpose:** Update a test case's content, priority, or configurable field values. Under the `no_approval` workflow shape only, also set its status directly (self-service, PD-048/PD-049); under a stronger shape, status changes go through `workflows.md`'s bounded action endpoints instead.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `PATCH /test-cases/{testCaseId}`
**Request:** Path: `testCaseId`. Body: any of `title`/`steps`/`expectedResults` (content edit), `priorityOptionId`, `configurableFieldValues` (partial — only the keys being changed), or — **only when the project's Test Case workflow shape is `no_approval`** — `setApproved: true` (direct self-service approval, equivalent to the pre-pivot `approvalStatus: "approved"` PATCH). `currentVersionNumber` (required, APID-003 concurrency token).
**Successful Response:** `200 OK` — updated test case, reflecting the new `workflowState`/`availableActions` (`workflows.md`) and, if a "significant" content edit occurred (a full replacement of `steps` and `expectedResults` together — DBD-003), an incremented `currentVersionNumber`.
**Business Rules:**
- If the test case is currently `approved` (any shape) and its content is edited, it reverts to `needs_review` (PD-048/PD-049) — regardless of edit size or workflow shape.
- A "significant" edit (full content replacement) creates a new Test Case Version, freezing `documentTemplateVersionId`/`priorityOptionId`/`configurableFieldValues` at that moment; a partial edit mutates the current version in place with no history (unchanged from pre-pivot).
- `setApproved: true` is rejected with `422 validation_error` (`WORKFLOW_ACTION_NOT_ALLOWED`) if the project's Test Case workflow shape is `single_approval` or `review_approval` — the client must use `POST /test-cases/{id}/workflow/submit`/`approve` instead (`workflows.md`). This is the direct implementation of §10's "do not let clients directly set protected workflow meta-state" beyond the one shape where it's genuinely equivalent to today's approved self-service behaviour.
- `priorityOptionId`/`configurableFieldValues` are validated against the test case's `documentTemplateVersionId` exactly as at creation (same error codes as Create Test Case above).
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (`currentVersionNumber` mismatch — concurrent edit; or test case archived); `422 validation_error` (content/field-value errors, or `setApproved` attempted under a shape that doesn't support it).
**Side Effects:** Changes data; may create a Test Case Version; may change `workflowState`; creates an audit entry.
**Audit Behaviour:** Audited (status changes are explicitly a minimum action, FR-AUD-001).
**Security Considerations:** `isAiGenerated`, the AI generation link, and `documentTemplateVersionId` are never client-writable via this endpoint.

---

## List Test Case Versions

**Requirement IDs:** FR-TC-003.
**Purpose:** List historical versions (only "significant" edits produce one — a gap between version numbers is normal).
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-cases/{testCaseId}/versions`
**Request:** Path: `testCaseId`. Query: pagination.
**Successful Response:** `200 OK` — list of version summaries (`versionNumber`, `createdAt`).
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## View Test Case Version

**Requirement IDs:** FR-TC-003.
**Purpose:** View one historical version's frozen content.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-cases/{testCaseId}/versions/{versionNumber}`
**Request:** Path: `testCaseId`, `versionNumber`.
**Successful Response:** `200 OK` — read-only version snapshot (`steps`, `expectedResults`, `documentTemplateVersionId`, `priorityOptionId`, `configurableFieldValues`, `createdAt`) — no `workflowState` (that belongs to the live test case, not a frozen version, same principle as the pre-pivot `approvalStatus` exclusion here).
**Business Rules:** None.
**Error Conditions:** `404 not_found` (test case or that specific version number).
**Side Effects:** None.

---

## Add Test Case Comment

**Requirement IDs:** FR-TC-007.
**Purpose:** Leave feedback on a test case (optional, not a gate — PD-048).
**Actor/Permission:** QA Manager.
**Method and Path:** `POST /test-cases/{testCaseId}/comments`
**Request:** Path: `testCaseId`. Body: `text`.
**Successful Response:** `201 Created` — the comment.
**Business Rules:** None — commenting has no effect on `approvalStatus`.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Creates data; may notify the test case's creator (out of scope for this endpoint's own contract).
**Audit Behaviour:** Not audited (feedback, not a key action).

---

## List Test Case Comments

**Requirement IDs:** FR-TC-007.
**Purpose:** View comments on a test case.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-cases/{testCaseId}/comments`
**Request:** Path: `testCaseId`. Query: pagination.
**Successful Response:** `200 OK` — list of comments.
**Business Rules:** None.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.

---

## Archive Test Case

**Requirement IDs:** — (direct archiving; cascade archiving is documented in `requirements.md`).
**Purpose:** Retire a test case from active use, preserving history.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /test-cases/{testCaseId}/archive`
**Request:** Path: `testCaseId`.
**Successful Response:** `200 OK` — test case with `recordStatus: archived`.
**Business Rules:** Archiving is separate from `workflowState` — an archived test case retains whatever workflow meta-state it last had.
**Error Conditions:** `403 forbidden`; `409 conflict` (already archived).
**Side Effects:** Test case becomes read-only.
**Audit Behaviour:** Reasonable to log.

---

## Add / Remove Test Case from Suite

**Requirement IDs:** FR-TC-009.
**Purpose:** Manage a test case's suite membership (many-to-many, DBD-002).
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `PUT /test-cases/{testCaseId}/suites/{suiteId}` (add); `DELETE /test-cases/{testCaseId}/suites/{suiteId}` (remove)
**Request:** Path: `testCaseId`, `suiteId`.
**Successful Response:** `PUT`: `201 Created` (membership created) or `200 OK` (already existed — idempotent by design, since `PUT` is naturally idempotent here). `DELETE`: `204 No Content`.
**Business Rules:** A test case may belong to multiple suites simultaneously (DBD-002); removing it from one suite has no effect on its membership in others.
**Error Conditions:** `403 forbidden`; `404 not_found` (test case or suite not in the same project).
**Side Effects:** Creates/removes a Test Suite Membership row.
**Audit Behaviour:** Not audited.
