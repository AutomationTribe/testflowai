# API — Template System

**Module:** TPL. **Rewritten under CHANGE-001** — supersedes the pre-pivot narrow `test-case-templates`/`report-templates` endpoints (opaque `defaultStructure` pre-population). See `docs/technical/api-spec.md` for shared conventions. Organisation QA configuration (which template version is "applicable") lives in `qa-configuration.md`; how a Test Case/QA Document actually gets created from a template is documented in `test-cases.md`/`reports.md`.

**Core distinction:** a **template draft** is mutable and has no effect on any document. A **published template version** is permanently immutable — every Test Case or QA Document created against it keeps referencing that exact version forever (FR-TPL-009), regardless of later republishing.

---

## List Templates

**Requirement IDs:** FR-TPL-001.
**Purpose:** List the organisation's templates, optionally by document type.
**Actor/Permission:** Any organisation member.
**Method and Path:** `GET /organisations/{orgId}/templates`
**Request:** Path: `orgId`. Query: pagination, `?documentType=test_case|test_report|regression_report`.
**Successful Response:** `200 OK` — list of `{ id, documentType, name, currentPublishedVersion: { versionNumber, publishedAt } | null, hasDraft: boolean }`.
**Business Rules:** `documentType` is TestFlow-controlled and bounded to exactly these three values (PD-051) — no arbitrary/organisation-defined type.
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## Create Template

**Requirement IDs:** FR-TPL-005, FR-TPL-006.
**Purpose:** Start a new named template for a document type.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /organisations/{orgId}/templates`
**Request:** Path: `orgId`. Body: `documentType` (`test_case`|`test_report`|`regression_report`), `name`.
**Successful Response:** `201 Created` — the template identity, with an initial draft version already open, pre-populated with TestFlow's default fields for that document type (FR-TPL-005 — the client is never handed a genuinely blank canvas).
**Business Rules:** In practice, most organisations use the single default Test Case/Test Report/Regression Report template TestFlow provisions automatically at organisation creation, rather than creating additional ones — but nothing in the approved requirements limits an organisation to exactly one template per document type, so this endpoint is not artificially restricted to a singleton.
**Error Conditions:** `403 forbidden`; `422 validation_error` (invalid `documentType`).
**Side Effects:** Creates a `document_templates` row plus an initial draft `document_template_versions` row with default fields.
**Audit Behaviour:** Audited.

---

## Retrieve Template

**Requirement IDs:** FR-TPL-001.
**Purpose:** Get a template's identity and version summary.
**Actor/Permission:** Any organisation member.
**Method and Path:** `GET /templates/{templateId}`
**Successful Response:** `200 OK` — `{ id, organisationId, documentType, name, currentPublishedVersion, hasDraft }`.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None.

---

## Retrieve Template Draft

**Requirement IDs:** FR-TPL-006.
**Purpose:** Read the current draft version for editing.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `GET /templates/{templateId}/draft`
**Successful Response:** `200 OK` — the draft version: `{ id, versionNumber, status: "draft", fields: [ ...see Field Representation below ], version: <concurrency token> }`.
**Error Conditions:** `403 forbidden`; `404 not_found` (no draft currently open — client should call `POST /templates/{templateId}/draft` to start one from the current published version).
**Side Effects:** None.

---

## Start a New Draft (from Published)

**Requirement IDs:** FR-TPL-006.
**Purpose:** Begin editing, copying the currently published version's fields as the starting point.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /templates/{templateId}/draft`
**Successful Response:** `201 Created` — the new draft, a field-for-field copy of the current published version (or, if none is published yet, the default fields from creation).
**Business Rules:** At most one draft per template at a time (mirrors `qa_configuration_versions`' one-draft-per-org rule).
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (a draft already exists — `CONFIGURATION_DRAFT_ALREADY_EXISTS`).
**Side Effects:** Creates a draft `document_template_versions` row plus copied field rows.
**Audit Behaviour:** Audited.

---

## Add / Update / Remove Configurable Field

**Requirement IDs:** FR-TPL-003, FR-TPL-004.
**Purpose:** Manage a draft's configurable fields (system fields cannot be removed — see below).
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /templates/{templateId}/draft/fields` (add); `PATCH /templates/{templateId}/draft/fields/{fieldKey}` (update); `DELETE /templates/{templateId}/draft/fields/{fieldKey}` (deactivate)
**Request:**
- `POST` body: `fieldKey` (stable identifier, e.g. `"test_data"`), `label`, `helpText` (optional), `fieldType` (one of the 15 approved types — see Field-Type Contract below), `isRequired`, `defaultValue` (optional, type-appropriate), `validationConfig` (optional, type-appropriate — see below), `displayOrder`.
- `PATCH` body: any of `label`/`helpText`/`isRequired`/`defaultValue`/`validationConfig`/`displayOrder`/`isActive`. `fieldType` and `fieldKey` are **not** editable after creation (changing a field's fundamental type/identity is a remove-and-recreate, not an edit, to keep historical `configurableFieldValues` interpretable).
- `DELETE`: soft-deactivates (`isActive: false`) — never a hard delete, since historical documents may reference this `fieldKey` (FR-TPL-004).
**Successful Response:** `POST`: `201 Created` — the new field. `PATCH`: `200 OK` — updated field. `DELETE`: `200 OK` — the field with `isActive: false` (not `204`, so the client can confirm the deactivated state without a follow-up `GET`).
**Business Rules:** `fieldKey` must be unique within the draft version. A field with `isSystemField: true` (see below) can never be created, updated beyond display metadata, or removed via these endpoints — attempting to do so returns `403 forbidden` with a message identifying it as protected (not a generic validation error, since this is a permission/protection boundary, not malformed input).
**Error Conditions:** `403 forbidden` (non-QA-Manager/Admin, or attempted system-field mutation); `404 not_found` (no draft open, or unknown `fieldKey`); `422 validation_error` (invalid `fieldType`, `fieldKey` collision, `validationConfig` shape mismatch for the given `fieldType`).
**Side Effects:** Updates draft field rows.
**Audit Behaviour:** Audited.

---

## Reorder Fields

**Requirement IDs:** FR-TPL-004.
**Purpose:** Set the draft's field display order in one call, including protected system fields' positions.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `PUT /templates/{templateId}/draft/fields/order`
**Request:** Body: `{ "order": ["field_key_1", "system:title", "field_key_2", ...] }` — system fields are addressed by a stable `system:<name>` key (see System Field Representation below), configurable fields by their `fieldKey`.
**Successful Response:** `200 OK` — the draft's fields in the new order.
**Business Rules:** The full set of field identifiers must exactly match the draft's current active fields (system + configurable) — a partial reorder is rejected, avoiding an ambiguous "where do the omitted fields go" case.
**Error Conditions:** `403 forbidden`; `404 not_found`; `422 validation_error` (mismatched/incomplete field set).
**Side Effects:** Updates `displayOrder` on affected rows.

---

## Configure Field Options (Dropdown / Multi-Select)

**Requirement IDs:** FR-TPL-004, FR-TC-011 (Priority uses this exact mechanism).
**Purpose:** Manage the selectable options on a Dropdown/Multi-select field.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /templates/{templateId}/draft/fields/{fieldKey}/options` (add); `PATCH /templates/{templateId}/draft/fields/{fieldKey}/options/{optionKey}` (update/rename/reorder); `DELETE /templates/{templateId}/draft/fields/{fieldKey}/options/{optionKey}` (deactivate — never a hard delete, same soft-deprecation principle as fields)
**Request:** `POST` body: `optionKey` (stable), `label`, `displayOrder`. `PATCH` body: any of `label`/`displayOrder`/`isActive`.
**Successful Response:** `201 Created` / `200 OK` matching the field endpoints above.
**Business Rules:** Only valid for `fieldType IN ('dropdown', 'multi_select')` — `422 validation_error` otherwise. Deactivated options remain valid targets for existing documents' `configurableFieldValues`/`priorityOptionId` — they simply stop appearing as selectable in new authoring (enforced client-side by filtering `isActive: true`, and server-side by rejecting a *new* selection of an inactive option while still accepting reads of records that already reference it).
**Error Conditions:** `403 forbidden`; `404 not_found`; `422 validation_error`.
**Side Effects:** Updates `document_template_field_options` rows.
**Audit Behaviour:** Audited.

---

## Validate / Preview Draft

**Requirement IDs:** §26 of the task.
**Purpose:** Check a draft for structural errors, and see it rendered as it will appear to an author, before publishing.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /templates/{templateId}/draft/validate`; `GET /templates/{templateId}/draft/preview`
**Successful Response:** Validate: `200 OK` — `{ valid, errors, warnings }` (same shape as `qa-configuration.md`'s validate endpoint). Preview: `200 OK` — the draft's fields, system and configurable, merged and ordered exactly as an authoring form would render them (`isSystemField` clearly flagged per field, per §7 of the task).
**Business Rules:** Validation checks: no duplicate `fieldKey`; every `dropdown`/`multi_select` field has at least one active option; `validationConfig` matches the documented per-type shape (`database.md` §12.4); `entity_link` fields specify a valid, TestFlow-supported `targetType` (`requirement`|`test_case`|`defect`|`test_run`).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None (both read-only).

---

## Publish Template

**Requirement IDs:** FR-TPL-007.
**Purpose:** Make the draft the template's new current, immutable version.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /templates/{templateId}/draft/publish`
**Request:** Header: `Idempotency-Key`, `If-Match: <version>`.
**Successful Response:** `200 OK` — the newly published `document_template_versions` resource.
**Business Rules:** Runs the same validation as the validate endpoint; refuses on error. Publishing a new Test Case template version does **not** retroactively change any existing Test Case's `documentTemplateVersionId` (FR-TPL-009) — nor does it, by itself, become "applicable" to any project until an Organisation QA Configuration publish (`qa-configuration.md`) references this new version. **Publishing a template and publishing the organisation's QA configuration are two separate, sequential steps** — a QA Manager typically does both when rolling out a template change, but the API does not implicitly chain them.
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (`If-Match` mismatch); `422 validation_error` (`TEMPLATE_VALIDATION_FAILED`).
**Side Effects:** Publishes the version (permanently immutable from this point — `PUBLISHED_VERSION_IMMUTABLE` on any later attempt to mutate it directly); creates an audit entry; triggers `FR-NOT-006`-equivalent notification.
**Audit Behaviour:** Audited (FR-AUD-005).

---

## List / Retrieve Template Version History

**Requirement IDs:** FR-TPL-008.
**Purpose:** Inspect past published versions, including ones still referenced by existing Test Cases/QA Documents.
**Actor/Permission:** QA Manager, Admin (list/inspect); any organisation member (retrieve one specific version, needed to render a historical document correctly).
**Method and Path:** `GET /templates/{templateId}/versions` (list); `GET /templates/{templateId}/versions/{versionNumber}` (one, immutable, same field shape as the draft)
**Successful Response:** `200 OK` — version summaries or full version.
**Business Rules:** Every published version remains retrievable indefinitely (DBD-023) — this is how a historical Test Case's frozen `configurableFieldValues` remain interpretable (a client resolves `documentTemplateVersionId` on the Test Case, then fetches this endpoint to know what each `fieldKey` means).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None.

---

## Field Representation

Every field in a draft/version/preview response has this shape:

```json
{
  "fieldKey": "priority",
  "label": "Priority",
  "helpText": null,
  "fieldType": "dropdown",
  "isSystemField": false,
  "isRequired": false,
  "defaultValue": null,
  "validationConfig": {},
  "displayOrder": 4,
  "isActive": true,
  "options": [
    { "optionKey": "critical", "label": "Critical", "displayOrder": 1, "isActive": true },
    { "optionKey": "high", "label": "High", "displayOrder": 2, "isActive": true }
  ]
}
```

`options` is present only for `dropdown`/`multi_select` fields. No internal database-only metadata (row UUIDs beyond what's needed for the field/option identity, raw JSONB storage details) is exposed beyond this shape (§7 of the task).

### System Field Representation

A protected system field appears in the **same** field list, with `isSystemField: true` and `fieldKey: "system:<name>"` (e.g. `"system:title"`, `"system:requirement_link"`), so a client can render one unified, correctly-ordered template preview. Its `label` may be organisation-repositioned but its `fieldKey`, `fieldType`, and `isRequired` are server-fixed and rejected if a client attempts to change them via the field-update endpoint above (`403 forbidden`). The system fields present depend on `documentType`:

| `documentType` | System fields |
|---|---|
| `test_case` | `system:title`, `system:requirement_link`, `system:steps` (renders as `fieldType: "step_table"`), `system:created_by`, `system:created_at` |
| `test_report`, `regression_report` | `system:generated_by`, `system:generated_at`, `system:content_snapshot` |

**None of these carry authoritative data in this API's own storage layer** — they mirror the real typed column on the owning resource (Test Case / QA Document), per DBD-011. A client reads/writes them through the owning resource's own endpoint (`test-cases.md`/`reports.md`), never through this template API.

## Field-Type Contract

| `fieldType` | Value representation in `configurableFieldValues` | `validationConfig` shape |
|---|---|---|
| `short_text`, `long_text`, `rich_text` | string | `{ "maxLength": 500 }` (optional) |
| `number` | number | `{ "min": 0, "max": 100 }` (both optional) |
| `date` | `"YYYY-MM-DD"` string | `{ "min": "2020-01-01", "max": null }` (optional) |
| `date_time` | ISO 8601 string | same as `date` |
| `checkbox` | boolean | `{}` |
| `dropdown` | `optionKey` string | `{}` — options are on the field, not here |
| `multi_select` | array of `optionKey` strings | `{}` |
| `user` | user UUID string | `{}` — must resolve to an organisation member |
| `tags` | array of strings | `{ "maxTags": 10 }` (optional) |
| `attachment` | evidence/file reference UUID (same brokered-upload pattern as `api-spec.md`'s File Handling) | `{}` — size/type limits are the existing platform-wide NFR-FILE-001/002 rules |
| `url` | string, validated as a well-formed URL | `{}` |
| `entity_link` | UUID string, validated against `targetType` | `{ "targetType": "requirement" \| "test_case" \| "defect" \| "test_run" }` (required) |
| `step_table` | N/A — renders `system:steps`, never a `configurableFieldValues` key (§9 of the task; `database.md` §12.5) | `{}` |
| `section` | N/A — pure layout marker, no value | `{}` |

**Explicitly not supported (§8 of the task):** calculated fields, formulas, arbitrary scripting, field-level custom edit-permissions. No `fieldType` or `validationConfig` shape expresses any of these.
