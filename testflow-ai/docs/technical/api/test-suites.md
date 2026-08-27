# API — Test Suite Management

**Module:** TS. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions.

---

## Create Test Suite

**Requirement IDs:** FR-TS-001.
**Purpose:** Create a named grouping of test cases within a project.
**Actor/Permission:** QA Tester, QA Manager, Admin (with project access).
**Method and Path:** `POST /projects/{projectId}/test-suites`
**Request:** Path: `projectId`. Body: `name`.
**Successful Response:** `201 Created` — the suite.
**Business Rules:** None beyond project access.
**Error Conditions:** `403 forbidden`; `422 validation_error`.
**Side Effects:** Creates data.
**Audit Behaviour:** Not audited.

---

## List Test Suites

**Requirement IDs:** FR-TS-001.
**Purpose:** List suites in a project.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /projects/{projectId}/test-suites`
**Request:** Path: `projectId`. Query: pagination, `?q=` (name search).
**Successful Response:** `200 OK` — list of suites.
**Business Rules:** None.
**Error Conditions:** `403 forbidden`.
**Side Effects:** None.

---

## View Suite Contents

**Requirement IDs:** FR-TC-009.
**Purpose:** List test cases assigned to a suite.
**Actor/Permission:** Any member with project access.
**Method and Path:** `GET /test-suites/{suiteId}/test-cases`
**Request:** Path: `suiteId`. Query: pagination.
**Successful Response:** `200 OK` — list of test cases in this suite.
**Business Rules:** A test case can belong to multiple suites (DBD-002) — this view shows only this suite's membership, not all suites a listed test case belongs to.
**Error Conditions:** `404 not_found`.
**Side Effects:** None.
**Notes:** Adding/removing a test case from a suite is documented in `test-cases.md` (`PUT`/`DELETE /test-cases/{id}/suites/{suiteId}`) — addressed from the test case side, not duplicated here.
