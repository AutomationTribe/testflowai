# API — Quality Gates & Project Readiness

**Module:** QG. **New module document (CHANGE-001).** See `docs/technical/api-spec.md` for shared conventions. Gate *configuration* at the organisation level is part of `qa-configuration.md`'s draft; project-level gate *overrides* are set via `project-policy.md`. This document defines the bounded gate-type contract those two reference, plus the readiness *evaluation* endpoint.

**Core principle (§22/§23 of the task):** exactly six `gateType` values exist, each with a small, typed `parameters` shape — never an arbitrary rule/expression language. Readiness is evaluated **on demand, at the Project level, against current live data** — there is no Release entity and no persisted/cached gate-result history (`database.md` DBD-021).

---

## Gate Type Catalogue

| `gateType` | `parameters` shape | Reads |
|---|---|---|
| `required_artifacts_completed` | `{}` | `qa_artifact_policies`/overrides × existence + workflow state of each required artifact |
| `required_approvals_completed` | `{}` | `workflowState.metaState === "approved"` for each in-scope Test Case/QA Document |
| `min_requirement_coverage` | `{ "thresholdPercent": 80 }` | Traced-vs-untraced Test Case computation (FR-TRACE-002) |
| `regression_activity_completed` | `{}` | Existence of a Regression Report QA Document, optionally requiring `workflowState.metaState === "approved"` |
| `no_unresolved_critical_defects` | `{}` | Defects with `severity.semantic === "critical"` and `status IN ("open","pending")` |
| `no_unresolved_release_blocking_defects` | `{ "blockingSeverities": ["critical", "high"] }` | Defects whose `severity.semantic` is in `blockingSeverities` and `status IN ("open","pending")` — this is how "release-blocking" is expressed; there is no separate per-defect flag (`database.md` DBD-022) |

This table is the complete, bounded set — no `gateType` outside it is ever accepted by `qa-configuration.md`'s draft update or `project-policy.md`'s gate override endpoint (`422 validation_error`, `QUALITY_GATE_CONFIGURATION_INVALID`, on anything else).

---

## Evaluate Project Readiness

**Requirement IDs:** FR-QG-003, FR-QG-004, FR-DASH-004.
**Purpose:** Compute the project's current release/quality readiness against its enabled gates and current data.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `GET /projects/{projectId}/readiness`
**Request:** Path: `projectId`.
**Successful Response:** `200 OK`:
```json
{
  "overallReadiness": "not_ready",
  "evaluatedAt": "2026-09-04T10:15:00Z",
  "qaConfigurationVersionId": "...",
  "gates": [
    {
      "gateType": "no_unresolved_critical_defects",
      "result": "fail",
      "explanation": "2 unresolved Critical defects (DEF-102, DEF-118)",
      "metric": { "unresolvedCriticalCount": 2 }
    },
    {
      "gateType": "regression_activity_completed",
      "result": "not_applicable",
      "explanation": "Regression Report is not required for this project"
    }
  ]
}
```
**Business Rules:** `overallReadiness` is `"ready"` only if every **enabled, non-`not_applicable`** gate result is `"pass"` (a project with zero enabled gates is always `"ready"` — nothing to fail, matching Standard/Lightweight QA's "no aggressive gates by default"). Per-gate `result` is one of `pass` | `fail` | `not_applicable` — **no `not_evaluable` or other state is introduced**: every gate in the bounded catalogue always has enough data to resolve to one of these three (a gate reading an artifact that doesn't exist yet resolves to `fail`, e.g. "Regression Report required but not yet created," not an ambiguous fourth state), so the task's caution against inventing states without justification is satisfied by simply not needing a fourth one. This endpoint **evaluates current data on every call** — the database stores no authoritative gate-result rows (DBD-021), so `evaluatedAt` is this response's generation time, not a cached computation time; do not imply or build client-side caching of this response as if it were historical record.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None — read-only, on-demand computation (NFR-PERF-005 sets the target: within 3 seconds for a typical project).
**Audit Behaviour:** Not audited (a read, not a mutation — consistent with the rest of the API's audit boundary).
**Security Considerations:** Standard project access; no gate condition ever exposes another project's or organisation's data.

---

## Dashboard Consumption (FR-DASH-004)

**Requirement IDs:** FR-DASH-004.
The project dashboard response (`dashboards.md`, `GET /projects/{projectId}/dashboard`) embeds a `readiness` field with **exactly this endpoint's response shape**, fetched server-side by the same underlying readiness evaluation — never a second, independently-computed readiness calculation (§24 of the task's explicit instruction against duplicated logic). A client that wants the dedicated `GET /projects/{projectId}/readiness` endpoint directly (e.g., for a standalone "Release Readiness" screen) gets an identical result to what the dashboard already showed, by construction.
