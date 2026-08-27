# API — Test Case & Report Templates

**Module:** Template Management. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions.

---

## Create Test Case Template

**Requirement IDs:** FR-TC-008, PD-009.
**Purpose:** Create an organisation-scoped, reusable test case structure.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `POST /organisations/{orgId}/test-case-templates`
**Request:** Path: `orgId`. Body: `name`, `defaultStructure` (structured content pre-populating new test cases created from it).
**Successful Response:** `201 Created` — the template.
**Business Rules:** Organisation-scoped only — never project-scoped, never shared across organisations (PD-009). No custom-field system exists beyond this pre-population structure; `defaultStructure` is not a user-definable schema (no approved requirement calls for one — see `database.md` §Custom Fields).
**Error Conditions:** `403 forbidden` (QA Tester); `422 validation_error`.
**Side Effects:** Creates data.
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** Standard tenant isolation.

---

## List Test Case Templates

**Requirement IDs:** FR-TC-008.
**Purpose:** List available templates for the organisation.
**Actor/Permission:** Any organisation member.
**Method and Path:** `GET /organisations/{orgId}/test-case-templates`
**Request:** Path: `orgId`. Query: pagination.
**Successful Response:** `200 OK` — list of templates.
**Business Rules:** None.
**Error Conditions:** None beyond standard auth.
**Side Effects:** None.

---

## Update / Delete Test Case Template

**Requirement IDs:** FR-TC-008.
**Purpose:** Modify or remove a template.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `PATCH /test-case-templates/{templateId}`; `DELETE /test-case-templates/{templateId}`
**Request:** Path: `templateId`. Body (`PATCH`): `name`/`defaultStructure`.
**Successful Response:** `PATCH`: `200 OK` — updated template. `DELETE`: `204 No Content`.
**Business Rules:** Editing a template never retroactively affects test cases already created from it — there is no persistent link from a created test case back to its originating template (`database.md` §Custom Fields and Templates). No template version history is modeled — an explicitly flagged open item, since no approved requirement calls for one.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** Changes/removes data. Deleting a template does not affect any test case previously created from it.
**Audit Behaviour:** Reasonable to log.
**Notes:** Whether templates need version history remains an open item carried from `database.md` — not resolved by this API design.

---

## Create / List / Update / Delete Report Template

**Requirement IDs:** PD-009 (PRD §13).
**Purpose:** Same shape as Test Case Templates, for reports.
**Actor/Permission:** QA Manager, Admin (create/update/delete); any organisation member (list).
**Method and Path:** `POST /organisations/{orgId}/report-templates`; `GET /organisations/{orgId}/report-templates`; `PATCH /report-templates/{templateId}`; `DELETE /report-templates/{templateId}`
**Request:** Same shape as Test Case Templates (`name`, `defaultStructure`).
**Successful Response:** Same conventions as Test Case Templates above.
**Business Rules:** Organisation-scoped only (PD-009); no version history modeled (same open item).
**Error Conditions:** Same as Test Case Templates.
**Side Effects:** Same as Test Case Templates.
**Audit Behaviour:** Reasonable to log.
