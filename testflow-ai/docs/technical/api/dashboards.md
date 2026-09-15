# API — Dashboards

**Module:** DASH. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions. Stakeholder viewing via a link is documented in `links.md`.

---

## View Project Dashboard

**Requirement IDs:** FR-DASH-001, FR-DASH-002, FR-DASH-004.
**Purpose:** Show aggregate testing progress for a project (reuses Test Run progress data, FR-TR-004 — not a separate underlying capability) plus, under CHANGE-001, current Quality Gate readiness.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `GET /projects/{projectId}/dashboard`
**Request:** Path: `projectId`.
**Successful Response:** `200 OK` — aggregate counts across the project's test runs, requirements traceability summary (traced vs. untraced test case counts), defect status summary, and (CHANGE-001, FR-DASH-004) a `readiness` field with **exactly** `quality-gates.md`'s `GET /projects/{projectId}/readiness` response shape.
**Business Rules:** None beyond project access. This endpoint is intentionally one reusable query capability rather than a separate endpoint per visual widget — the same response feeds every dashboard panel; the frontend composes the layout, not the API. `readiness` is computed by the same underlying evaluation as the dedicated readiness endpoint — never a second, independently-computed result (`quality-gates.md`).
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None (read-only).
**Audit Behaviour:** Not audited.
**Security Considerations:** Same tenant/project-access checks as any other project-scoped resource.
**Notes:** The Stakeholder-facing equivalent (`GET /links/{linkToken}/dashboard`, `links.md`) returns the same underlying data through a link-scoped, read-only path — not a separately maintained dashboard implementation. Whether the Stakeholder-facing response includes `readiness` follows the same visibility scope already approved for the rest of the dashboard data — no new visibility decision introduced here.
