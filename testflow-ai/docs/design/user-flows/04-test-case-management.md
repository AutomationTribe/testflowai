# User Flows — Test Case Management

---

## CHANGE-001 Note on This File

- **UXF-006 — GENERALIZE.** Steps 2–4 below now read from the organisation's published, project-resolved Test Case Template (not a free-form/organisation-optional template) and the organisation-configured Priority field. Step 4's "self-service approval" is now only one of three possible configured modes — see the new **UXF-029** below, which supersedes step 4 whenever the project's workflow is Single Approval or Review + Approval. When the workflow is **No Approval**, UXF-006 exactly as written below still applies unchanged.
- **UXF-008 — SUPERSEDE.** Test Case & Report Template Management is replaced by `13-qa-operating-model-and-governance.md`'s UXF-021 (Template Management) and UXF-022 (Template Builder). Reason: CHANGE-001 makes templates organisation-governed with draft/publish/versioning and System Field protection, rather than simple immediately-live organisation lists with no publish step. The user goal ("create reusable structures") is preserved; the mechanism changed enough to warrant a new ID rather than an in-place edit.
- **UXF-007 — KEEP**, unaffected by CHANGE-001.

---

## UXF-006 — Manual Test Case Creation & Self-Service Approval

**Priority:** Critical MVP

**Actor:** QA Tester, QA Manager, Admin.

**Goal:** Author a test case and mark it ready for use.

**Entry Point:** Test Cases area within a project.

**Preconditions:** User has project access.

**Happy Path:**
1. User opens the Test Cases list, selects "Create Test Case."
2. Optionally starts from a template (pre-populates steps/expected results) and/or links a requirement.
3. Enters title, steps, expected results. Saves as **Draft**.
4. Reviews the content whenever ready, then sets status directly to **Approved** — any user with edit access can do this themselves, at any time; there is no reviewer to submit to and wait on.
5. Optionally assigns the test case to one or more suites (UXF-007).

**Decision Points:**
- Start from a template or from scratch.
- Link a requirement now, later, or never (optional).
- When to mark it Approved (self-paced, no external gate).

**Alternative Paths:**
- QA Manager leaves an optional comment on a test case as feedback — this does not block or gate approval in any way (it's just feedback).
- Editing an Approved test case reverts it to **Needs Review** automatically; the user reviews and re-approves it themselves, the same self-service way.
- A linked requirement being edited can also push an Approved test case to Needs Review, from outside this flow entirely (see UXF-004) — the test case's own screen should surface this if it happens.

**Error / Failure Paths:**
- Validation failure (missing title/steps/expected results).
- Concurrent-edit conflict (APID-003): another user changed this test case since it was loaded.
- Editing an archived test case: blocked.

**Successful Outcome:** The test case shows status **Approved** and is available to include in a test run and/or a suite.

**Related Requirements:** FR-TC-001–010, PD-048.

**Related APIs:** `POST /projects/{projectId}/test-cases`, `PATCH /test-cases/{testCaseId}`, `GET /test-cases/{testCaseId}/versions`, `POST /test-cases/{testCaseId}/comments` (`test-cases.md`).

```mermaid
flowchart TD
    A[Create Test Case] --> B{Start from template?}
    B -- Yes --> C[Pre-populated content]
    B -- No --> D[Blank content]
    C --> E[Enter/edit title, steps,\nexpected results]
    D --> E
    E --> F{Link a requirement?}
    F -- Yes --> G[Select requirement]
    F -- No --> H[Save as Draft]
    G --> H
    H --> I[User reviews when ready]
    I --> J[Set status: Approved\n— self-service, any editor]
    J --> K{Edited later?}
    K -- Yes --> L[Reverts to Needs Review]
    L --> I
    K -- No --> M[Assign to suite(s) — optional]
```

---

## UXF-007 — Test Suite Organization

**Priority:** Supporting MVP

**Actor:** QA Tester, QA Manager, Admin.

**Goal:** Group related test cases for organized execution.

**Entry Point:** Test Suites area within a project, or from a test case's own screen.

**Preconditions:** User has project access.

**Happy Path:**
1. User creates a named suite.
2. Adds test cases to it, from either the suite's screen or a test case's own screen.
3. A test case can belong to more than one suite at once — this is expected, not a conflict to resolve.

**Decision Points:** Which test cases belong in which suite(s) — no restriction to one suite per test case.

**Alternative Paths:** Removing a test case from one suite has no effect on its membership in any other suite.

**Error / Failure Paths:** Adding a test case from a different project: not offered (suites and their test cases share the same project).

**Successful Outcome:** The suite's contents reflect the intended grouping, ready to be used as the basis for a test run (UXF-010).

**Related Requirements:** FR-TS-001, FR-TC-009.

**Related APIs:** `POST /projects/{projectId}/test-suites`, `GET /test-suites/{suiteId}/test-cases`, `PUT /test-cases/{testCaseId}/suites/{suiteId}`, `DELETE /test-cases/{testCaseId}/suites/{suiteId}` (`test-suites.md`, `test-cases.md`).

---

## UXF-008 — Test Case & Report Template Management

**Priority:** Supporting MVP

**Actor:** QA Manager, Admin.

**Goal:** Create reusable structures to speed up future authoring.

**Entry Point:** Templates area (organisation-level, not project-level).

**Preconditions:** User is QA Manager or Admin.

**Happy Path:**
1. User opens the organisation's Templates area.
2. Creates a new Test Case Template (or Report Template), defining its default content structure.
3. Template becomes available across every project in the organisation immediately.
4. When someone later creates a test case (or generates a report) and selects this template, its content pre-populates.

**Decision Points:** Test Case Template vs. Report Template (two separate lists).

**Alternative Paths:** Editing an existing template — this never retroactively changes test cases/reports already created from it.

**Error / Failure Paths:** QA Tester attempting to create/edit a template: permission denied (view/use is fine, authoring is not).

**Successful Outcome:** The template appears in the relevant creation flow's "start from template" option, organisation-wide.

**Related Requirements:** FR-TC-008, PD-009.

**Related APIs:** `POST /organisations/{orgId}/test-case-templates`, `GET /organisations/{orgId}/test-case-templates`, `PATCH/DELETE /test-case-templates/{templateId}`, and the equivalent report-template endpoints (`templates.md`).

> **Superseded by CHANGE-001.** See `13-qa-operating-model-and-governance.md` UXF-021/UXF-022. This entry is retained for history; do not build against it.

---

## UXF-029 — Test Case Approval (Three Configured Modes)

**Priority:** Critical MVP.

**Actor:** Author (QA Tester/Manager/Admin), Reviewer, Approver (roles configured per UXF-023).

**Goal:** Move a Test Case through exactly the approval process the organisation configured — no more, no less.

**Entry Point:** A Test Case's own screen, once its content is ready for the next step beyond Draft.

**Preconditions:** Project's effective workflow configuration is Single Approval or Review + Approval (if No Approval, UXF-006 applies unchanged).

**Happy Path — Single Approval:**
1. Author completes the Test Case, selects **Submit**.
2. Test Case enters a pending-approval state; the server-computed `availableActions` for the Approver role now include Approve/Reject (and exclude them for everyone else).
3. Approver reviews, selects **Approve** or **Reject** (with optional comment on rejection).
4. Approved → usable in runs per UXF-026; Rejected → returns to the Author as Draft with the rejection comment visible.

**Happy Path — Review + Approval:**
1. Author submits. Test Case enters pending-review.
2. Reviewer reviews, selects **Approve to next stage** or **Send back**.
3. If advanced: Test Case enters pending-approval; Approver does the same Approve/Reject step as above.
4. Approved → usable in runs; rejected/sent-back at either stage → returns to Author as Draft with feedback.

**Decision Points:** Approve vs. reject/send-back, at whichever checkpoint the actor holds.

**Alternative Paths:** Editing an Approved Test Case reverts it to Needs Review/pending-approval automatically, re-entering the same configured checkpoint sequence from the top (consistent with UXF-006's existing "editing an Approved test case" behavior, now routed through whichever mode is configured rather than always self-service).

**Error / Failure Paths:**
- Actor attempts an action not present in the server-provided `availableActions` for their role/the Test Case's current state (e.g., Author tries to Approve): action not offered — the UI never implies an arbitrary status change is possible (§20 constraint, AD-022).
- Concurrent action (two Approvers act near-simultaneously): transactionally protected, second actor sees the already-updated state, not a silent double-approval.

**Successful Outcome:** The Test Case reaches Approved only via the exact configured checkpoint sequence, with a clear, role-correct set of available actions at every stage.

**Related Requirements:** FR-WF-001–00x, FR-TC-* (approval-state interaction).

**Related APIs:** `GET /test-cases/{testCaseId}` (includes `availableActions`), `POST /test-cases/{testCaseId}/workflow-actions/{action}`.

**Architecture/module dependency:** Workflow module (subject-agnostic, AD-021); `computeAvailableActions` shared between GET and POST (AD-022).
