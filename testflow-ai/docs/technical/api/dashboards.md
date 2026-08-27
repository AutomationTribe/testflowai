# API — Dashboards

**Module:** DASH. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions. Stakeholder viewing via a link is documented in `links.md`.

---

## View Project Dashboard

**Requirement IDs:** FR-DASH-001, FR-DASH-002.
**Purpose:** Show aggregate testing progress for a project (reuses Test Run progress data, FR-TR-004 — not a separate underlying capability).
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `GET /projects/{projectId}/dashboard`
**Request:** Path: `projectId`.
**Successful Response:** `200 OK` — aggregate counts across the project's test runs, requirements traceability summary (traced vs. untraced test case counts), and defect status summary.
**Business Rules:** None beyond project access. This endpoint is intentionally one reusable query capability rather than a separate endpoint per visual widget — the same response feeds every dashboard panel; the frontend composes the layout, not the API.
**Error Conditions:** `403 forbidden`; `404 not_found`.
**Side Effects:** None (read-only).
**Audit Behaviour:** Not audited.
**Security Considerations:** Same tenant/project-access checks as any other project-scoped resource.
**Notes:** The Stakeholder-facing equivalent (`GET /links/{linkToken}/dashboard`, `links.md`) returns the same underlying data through a link-scoped, read-only path — not a separately maintained dashboard implementation.
