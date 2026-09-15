# API — Project Policy & Effective Configuration

**Module:** POL. **New module document (CHANGE-001).** See `docs/technical/api-spec.md` for shared conventions. Organisation-level configuration lives in `qa-configuration.md`; Quality Gate configuration/evaluation lives in `quality-gates.md` (a project's gate overrides are set here, but gate *evaluation* is a separate endpoint there).

**Core principle (§5 of the task):** a client must never reconstruct effective policy itself by fetching the organisation's configuration and a project's overrides separately and merging them client-side for ordinary UI use — this module's effective-configuration endpoint does that server-side and returns one coherent answer.

---

## Retrieve Effective Project Configuration

**Requirement IDs:** FR-POL-002, FR-POL-005.
**Purpose:** The single read a project settings screen needs — what applies to this project, where each value came from, and what could be overridden.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access) — read.
**Method and Path:** `GET /projects/{projectId}/effective-configuration`
**Request:** Path: `projectId`.
**Successful Response:** `200 OK`:
```json
{
  "qaConfigurationVersionId": "...",
  "qaConfigurationVersionNumber": 3,
  "organisationCurrentVersionNumber": 5,
  "templates": {
    "test_case": { "templateId": "...", "versionNumber": 2 },
    "test_report": { "templateId": "...", "versionNumber": 1 },
    "regression_report": { "templateId": "...", "versionNumber": 1 }
  },
  "workflows": {
    "test_case": { "shape": "single_approval", "overridable": false },
    "test_report": { "shape": "no_approval", "overridable": false },
    "regression_report": { "shape": "no_approval", "overridable": false }
  },
  "artifactPolicies": {
    "requirements": { "organisationValue": false, "override": null, "effectiveValue": false, "overridable": true },
    "test_cases": { "organisationValue": true, "override": null, "effectiveValue": true, "overridable": true },
    "test_report": { "organisationValue": true, "override": null, "effectiveValue": true, "overridable": true },
    "regression_report": { "organisationValue": false, "override": { "value": true, "overriddenBy": "...", "overriddenAt": "..." }, "effectiveValue": true, "overridable": true }
  },
  "qualityGates": {
    "no_unresolved_critical_defects": { "organisationValue": { "isEnabled": true, "parameters": {} }, "override": null, "effectiveValue": { "isEnabled": true, "parameters": {} }, "overridable": true }
  }
}
```
**Business Rules:** `templates`/`workflows` are **never overridable at MVP** (FR-POL-003) — their `overridable` field is always `false`, included for UI consistency rather than omitted, so a client doesn't need two different response shapes. `qaConfigurationVersionNumber` reflects the project's **pinned** version (FR-QAOM-012) — it is deliberately not always equal to `organisationCurrentVersionNumber`, which is included precisely so a client can show "your organisation has published a newer configuration; this project is still on an earlier one" without implying any migration action exists (none does — see `qa-configuration.md`).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None (read-only; this is a computed/joined view, not a stored resource — DBD-021's "on-demand, not persisted" principle applied consistently here too).

---

## Apply Project Artifact-Policy Override

**Requirement IDs:** FR-POL-003, FR-POL-004.
**Purpose:** Require or exempt a specific artifact type for this project, where the organisation permits it.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `PUT /projects/{projectId}/policy-overrides/artifacts/{artifactType}`
**Request:** Path: `projectId`, `artifactType` (`requirements`|`test_cases`|`test_report`|`regression_report`). Body: `{ "isRequired": true }`.
**Successful Response:** `200 OK` — the override record (`artifactType`, `isRequired`, `overriddenBy`, `overriddenAt`).
**Business Rules:** Rejected if the organisation has not marked this `artifactType` overridable (`PROJECT_SETTING_LOCKED`) — see the effective-configuration response's `overridable` flag, which a client should check before even offering the control.
**Error Conditions:** `403 forbidden`; `404 not_found`; `409 conflict` (`PROJECT_SETTING_LOCKED` — not overridable); `422 validation_error`.
**Side Effects:** Creates/replaces the `project_artifact_policy_overrides` row; creates an audit entry (FR-AUD-005, "project override").
**Audit Behaviour:** Audited — every override, permitted or not (rejections are not audited as overrides, only as standard `403`/`409` responses).

---

## Remove Project Artifact-Policy Override

**Requirement IDs:** FR-POL-004.
**Purpose:** Reset a project back to the organisation's value.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `DELETE /projects/{projectId}/policy-overrides/artifacts/{artifactType}`
**Successful Response:** `204 No Content`.
**Error Conditions:** `403 forbidden`; `404 not_found` (no override currently set — idempotent-friendly: a client that isn't sure whether an override exists can call this safely).
**Side Effects:** Removes the override row; the project's effective value reverts to the organisation's; creates an audit entry.
**Audit Behaviour:** Audited.

---

## Apply / Remove Project Quality-Gate Override

**Requirement IDs:** FR-POL-003, FR-POL-004, FR-QG-002.
**Purpose:** Same override mechanism as above, for a specific Quality Gate's enabled state/parameters.
**Actor/Permission:** QA Manager, Admin.
**Method and Path:** `PUT /projects/{projectId}/policy-overrides/gates/{gateType}` (apply); `DELETE /projects/{projectId}/policy-overrides/gates/{gateType}` (remove)
**Request:** `PUT` body: `{ "isEnabled": true, "parameters": { "thresholdPercent": 90 } }` — `parameters` shape is `gateType`-specific, identical to `quality-gates.md`'s configuration contract.
**Successful Response:** Same conventions as the artifact-policy override above.
**Business Rules:** Same locked/overridable check, same bounded `gateType` set (`quality-gates.md`).
**Error Conditions:** Same as artifact-policy override, plus `422 validation_error` for a `parameters` shape mismatch (`QUALITY_GATE_CONFIGURATION_INVALID`).
**Side Effects:** Same pattern as artifact-policy override.
**Audit Behaviour:** Audited.
