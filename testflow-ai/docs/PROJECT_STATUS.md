# TestFlow AI — Project Status

This file is the single source of truth for "what's actually done, actually tested, and
actually deployed right now." It is updated after every coding task (CLAUDE.md rule 22) —
a Stop hook checks for this and blocks finishing a task that touched the repo without
updating it.

**Never mark work "complete" here unless its tests were actually run in this session and
passed.** Untested work is reported as untested, not as done.

---

## Latest entry

### 2026-10-07 — Projects vertical slice: Create Project + Project List (awaiting Product Owner acceptance)

**Branch/commit:** `main` — see the commit that contains this entry (not deployed).

**Risk classification:** MEDIUM (new feature screens + additive migration; touches tenant isolation
and object-level authorization). Definition of Ready: met after Product Owner decisions PD-066
(project code), PD-067 (description), PD-068 (QA configuration pinning). PRODUCTION criticality /
MID-LEVEL readability applied (PD-065).

**Completed work:**
- **Database:** migration `0005_projects.sql` — `projects`, `project_memberships`,
  `organisations.next_project_number`, `uq_qa_config_versions_id_org`; composite FK so a project can
  never pin another organisation's QA configuration version (DBD-025).
- **API:** `POST` and `GET /v1/organisations/{orgId}/projects` (role-filtered list in SQL, cursor
  pagination, search, status and QA-configuration filters, real counts, per-organisation
  `PRJ-###` codes, creator membership, version pinning, subscription gate). OpenAPI,
  `api/projects.md`, `schema.sql`, `database.md`, DBD-025, PD-066/067/068, traceability updated.
- **Frontend:** `/projects` with the three approved screens (Empty State, List, Create Project);
  sidebar gains a real Projects link; unbacked design elements deliberately omitted and recorded in
  `docs/design/handoffs/projects.md`.
- **Tests added:** backend `projects.test.ts` (50), frontend `projects.test.tsx` + `projectFormat`
  + sidebar (new tests), E2E `flowG-projects.spec.ts` (5).
- Also: `.gitignore` (`.DS_Store`, `*.tsbuildinfo`) and untracked those two files; Stitch design
  registry + approved Create Project reference image; framework profile/principle recorded.

**Tests actually run and results (final run, this session):**
- Backend `vitest`: **117/117 passed** (10 files). `tsc --noEmit` and `eslint` clean.
- Frontend `vitest`: **101/101 passed** (15 files). `tsc --noEmit` and `eslint` clean.
- E2E Playwright (headless, flows A–G): **18/18 passed**.
- Environment notes: the repo sits in iCloud-managed Documents, and `node_modules` was full of
  evicted placeholder files; it was rebuilt with `npm ci`. Test commands only run with the shell
  sandbox disabled. One E2E run earlier in the session failed before any test ran because the
  backend process died after start-up (cause not found; not reproduced in later runs).
- **Intermittent failures seen and handled (be explicit):** `projects.test.ts` flaked about 1 run in
  4 (empty-body 404s / `socket hang up` from `supertest` opening a server per request); fixed in
  that file with one long-lived server (0 failures in 12 runs after). One failure in
  `workspace.test.ts` (existing file, same pattern) appeared once in a full run while another
  agent was running servers and did not recur (6 isolated runs + the final full run passed). Logged as
  TD-007; the other existing suites were not changed.

**Reviewer result:** Backend — first review **BLOCKED** (connection-pool deadlock in `createProject`
under ~10+ concurrent creates); fixed, re-reviewed **PASS WITH CHANGES** (docs only), those fixed.
Frontend — **PASS WITH CHANGES** (one race in "Load more", error handling, accessibility); all
actioned except hard-coded colours and a few NOTE items (left as-is).

**Design Conformance result:** final **MINOR DIFFERENCES** (no MATERIAL difference beyond the
documented omissions and the documented sidebar PRODUCT CONFLICT). Two MATERIAL style differences
and one layout regression were found and fixed over four rounds. **Caveat:** Projects — List and
Projects — Empty State were compared against their near-identical sibling screens (`project list`,
`project empty state`) because the approved originals' images need a Google login; Create Project
was compared against the approved original. Remaining minor: wider modal, `v1` vs `v1.0`, neutral
member chips, native select chevrons, shell proportions, ~13px horizontal table scroll at 1280.

**QA result:** **PASS WITH FINDINGS** — E2E 18/18; the only defects found were three locator bugs in
the new E2E spec (fixed by QA without weakening assertions). Findings: malformed JSON body returns
500 (pre-existing, TD-008); no UI-level QA Tester test, no E2E for search/filters/Load more.

**Security result:** **PASS WITH WARNINGS** — no Critical/High. Fixed: NUL byte in name/description/
search returned 500 (now 422, tested). Logged as debt: no rate limit/quota (TD-009), async auth
middleware without error handling (TD-010, pre-existing), no Origin check (TD-011), `npm audit`
runtime findings in existing deps (TD-012, none introduced), membership/org constraint for a future
slice (TD-013).

**Definition of Done:** met for implementation, tests, reviews, design conformance, QA, security,
OpenAPI, migration, docs. **Not done / open:** Product Owner acceptance; durable reference images for
Projects — List and Empty State (export to `docs/design/approved/projects/`); project creation is
logged, not written to an Audit Log Entry (TD-006); no deployment (not requested).

**Deployment/demo link:** unchanged; nothing deployed.

**Blockers:** none. Needs Product Owner acceptance.

**Next three tasks:**
1. Product Owner acceptance of the Projects slice (and export the List/Empty State reference images).
2. Fix TD-010 (async auth middleware error handling) and TD-008 (malformed JSON → 4xx).
3. Next feature selection (e.g. FR-PRJ-002/003/005–007 project update/archive/membership).

---

## Previous entry (Stitch design registry, 2026-10-07)

### 2026-10-07 — Projects slice: pre-coding gates (STOPPED at Definition of Ready)

**Branch/commit:** `main` (uncommitted at time of this entry)

**Completed work:**
- Recorded Product Owner decisions: Project Criticality = PRODUCTION, Code Readability =
  MID-LEVEL (engineering-framework.md, coding-standards.md, CLAUDE.md rule 25, PD-065).
- Persisted the "Independent Judgment — Evidence Over Agreement" principle
  (engineering-framework.md section + CLAUDE.md rule 28). The original wording was not in the
  repo or this session, so it is Claude's articulation — Product Owner to confirm or amend.
- Ran Requirements Checkpoint, Feature Entry Gate, risk classification (MEDIUM) and Definition
  of Ready: `docs/product/checkpoints/projects-create-and-list.md`. **DoR not met.**
- Saved the approved Create Project design at full resolution:
  `docs/design/approved/projects/create-project.png`.
- No backend/frontend code, migrations, or deployment — implementation not started.

**Tests actually run and results:** None — docs only.

**Deployment/demo link:** Unchanged; nothing deployed.

**Blockers:** (1) Stitch screenshots for Projects — List and Projects — Empty State are not
fetchable (Google sign-in redirect), so those designs cannot be viewed. (2) Product Owner
decisions needed on Description, project code, and list-design elements without backing
requirements (see checkpoint doc).

**Next three tasks:**
1. Product Owner supplies the two missing images and answers the four decisions.
2. Design agent handoff for the three Projects screens.
3. Start the backend slice (migration, endpoints, tests) once DoR passes.

---

## Previous entry (Stitch design registry)

### 2026-10-07 — Stitch design registry (Projects screens)

**Branch/commit:** `main` (uncommitted at time of this entry)

**Completed work:**
- Created `docs/design/stitch-registry.md`: canonical-name → Stitch project/screen ID registry,
  with approval status/date and requirement association. Registered
  `Projects — Empty State` (`585484247e73…`), `Projects — List` (`b2b302b72953…`) and the newly
  approved `Projects — Create Project` (`40ac626b6df0…`).
- Stitch MCP exposes no rename/update-title tool, so nothing was renamed or regenerated; the
  three Stitch titles already equal their canonical names.
- Added CLAUDE.md rule 27: designs need canonical names; approved designs are resolved from the
  registry by exact screen ID, never by "newest screen".
- Projects feature **not** implemented, per instruction.

**Tests actually run and results:** None — docs only, no application code changed.

**Deployment/demo link:** Unchanged; nothing deployed.

**Blockers:** Lowercase duplicates `project list` / `project empty state` also exist in Stitch;
their approval status needs the user's confirmation (listed as unregistered in the registry).

**Next three tasks:**
1. User confirms which Projects Stitch screens are canonical (see blocker).
2. Design agent handoff for the three Projects screens (before any implementation).
3. Requirements checkpoint / risk classification / Definition of Ready for FR-PRJ-001.

---

## Previous entry

### 2026-10-07 — AI Software Delivery Framework adoption (forward-only)

**Branch/commit:** `main` (pending this entry's own commit — see git status at time of this
entry)

**Completed work:**
- Adopted the framework forward-only, per explicit instruction: no stage redone, no screen
  redesigned, no product feature started, nothing deployed.
- Created `.claude/agents/frontend.md`, `.claude/agents/backend.md`,
  `.claude/agents/reviewer.md`. Preserved `design.md`, `qa.md`, `security.md`, `devops.md`
  unchanged.
- Created `docs/technical/engineering-framework.md` — Definition of Ready, Definition of Done,
  change-risk classification (LOW/MEDIUM/HIGH), updated vertical-slice and release workflows,
  output-review expectations, technology-decision/dependency-governance process, accessibility,
  observability, performance, threat-modeling, migrations/backward-compatibility, feature flags,
  reliability/SLO, production verification, and incident/postmortem guidance.
- Created `docs/decisions/README.md` — lightweight ADR/RFC process, integrated with (not
  replacing) the existing architecture/database/API/product decision logs.
- Created `docs/technical/technical-debt.md` — a lightweight register of 5 real, existing gaps
  found during review (no code changed to produce it): no connection timeout in `pool.ts`
  (TD-001), visual regression not wired into CI (TD-002, already a known deliberate choice),
  QA Operating Model Custom Setup has no full config screen (TD-003, already a known deferred
  item), no general-purpose rate limiting beyond login lockout (TD-004), Swagger UI's
  non-production default has no additional access control (TD-005).
- Updated `docs/technical/coding-standards.md` with the code-readability-profile decision point
  and the project's existing conventions.
- Updated `CLAUDE.md`: rule 20 now reflects the full updated vertical-slice/release workflow
  (Risk Classification → Definition of Ready → ... → Reviewer → ... → Definition of Done →
  ... → Production Smoke Verification → Monitoring); added rules 23–26 (Frontend/Backend must
  not self-certify; Reviewer is independent and returns PASS/PASS WITH CHANGES/BLOCKED; risk
  classification + Definition of Ready/Done; the two pending user decisions below; technology/
  dependency governance). Rules 1–22 preserved verbatim.
- Updated `docs/technical/testing.md` with a short section on the Frontend/Backend/Reviewer
  split, cross-referencing the engineering framework doc rather than duplicating it.
- Two decisions explicitly **not** made by Claude, recorded as pending in both
  `docs/technical/engineering-framework.md` and `docs/technical/coding-standards.md`:
  - **USER DECISION REQUIRED — TestFlow Project Criticality**: PROTOTYPE / MVP / PRODUCTION /
    HIGH-CRITICALITY.
  - **USER DECISION REQUIRED — TestFlow Code Readability**: MID-LEVEL / SENIOR.

**Tests actually run and results:**
- No application test suite applies — no product/application code was changed in this task
  (docs, agent definitions, and CLAUDE.md only).
- Verification actually performed: all 7 agent files confirmed present (4 preserved + 3 new);
  `.claude/settings.json` Stop hook re-validated with `jq -e` (still valid) and pipe-tested
  (still correctly returns a block decision when PROJECT_STATUS.md isn't part of a change,
  confirming the hook was not weakened); `git status --porcelain` confirmed no `backend/src` or
  `frontend/src` files were modified.

**Deployment/demo link:**
- Frontend: https://testflow-frontend.onrender.com
- Backend: https://testflow-backend-yhj7.onrender.com (health: `/health`)
- (Unchanged — nothing deployed this session, per explicit instruction.)

**Blockers:** None for this task. Two user decisions are outstanding (see above) and should be
made before they materially affect how much rigor future work applies.

**Next three tasks:**
1. Obtain the two pending user decisions (Project Criticality, Code Readability) so agents stop
   defaulting to conservative assumptions (MVP rigor / MID-LEVEL code).
2. Continue QA Operating Model work (e.g. the Custom Setup full configuration screen — now also
   tracked as TD-003) using the updated vertical-slice workflow.
3. Decide whether to push the local `main` commits and redeploy, or keep accumulating locally.

---

## Prior entry

### 2026-10-07 — Signup + login E2E verification

**Branch/commit:** `main` @ `949d3c7` (no code changes this session — test run only)

**Completed work:**
- Ran the existing signup and login E2E specs on request ("run the UI test for sign up and
  login"), headed mode, `PW_SPEED=normal`. No product code changed.
- Diagnosed and worked around a local environment issue: Docker Desktop had been restarted
  mid-session, and the machine is memory-constrained (8GB total RAM, ~98MB free at one point),
  which caused `next dev`/backend startup and one test's `page.goto('/app')` to intermittently
  stall or exceed timeouts. Not an application defect — confirmed by re-running the one failing
  test in isolation once memory pressure eased (passed in 6.8s vs. the original 36s timeout).

**Tests actually run and results:**
- `tests/flowA-trial.spec.ts` + `tests/flowE-login-routing.spec.ts` (headed, `PW_SPEED=normal`):
  5/5 passed (one initial run had 1/5 fail on a navigation timeout caused by system memory
  pressure, not a code defect; isolated re-run of that same test passed cleanly).
- Same two specs re-run headed at `PW_SPEED=slow`: 5/5 passed (2.4m total).
- No other suites run this session.

**Deployment/demo link:**
- Frontend: https://testflow-frontend.onrender.com
- Backend: https://testflow-backend-yhj7.onrender.com (health: `/health`)
- (Unchanged — nothing deployed this session.)

**Blockers:** None for the app itself. Note for future sessions: this development machine has
only 8GB RAM and can run low on free memory (Chrome + VSCode + Docker Desktop + Claude Code
together), which can make local dev-server startup and E2E runs slow or flaky — not a code issue
when it happens again, but worth checking `top -l 1 -n 0 | grep PhysMem` if servers seem stuck.

**Next three tasks:**
1. Continue QA Operating Model work (e.g. the Custom Setup full configuration screen,
   explicitly deferred in `c0239ef`/`4426e70`).
2. Decide whether to push the local `main` commits (currently ahead of `origin/main`) and
   redeploy, or keep accumulating locally.
3. Consider wiring `e2e/playwright.visual.config.ts` into CI once a consistent rendering
   environment is chosen (currently local-only by design — see `docs/technical/testing.md`).

---

## Prior entry

### 2026-10-07 — Project status tracking + Stop hook

**Branch/commit:** `main` @ `949d3c7` (this entry's own file/hook changes not yet committed —
see git status at time of this entry)

**Completed work:**
- Added `docs/PROJECT_STATUS.md` (this file).
- Added CLAUDE.md rule requiring this file to be updated after every coding task.
- Added a project-level Stop hook (`.claude/settings.json`) that blocks finishing a turn
  if the repo has uncommitted changes and this file wasn't part of them.
- No product feature implemented or deployed in this task, per explicit instruction.

**Tests actually run and results:**
- No application test suite applies — no product code changed in this task.
- The Stop hook itself was verified directly (not just written and assumed to work): JSON
  schema validated with `jq -e`; the exact command extracted from `.claude/settings.json` was
  piped a synthetic Stop event and confirmed to return `{}` (allow) with this file present in
  `git status`, and to return `{"decision":"block",...}` when this file was temporarily moved
  aside and restored afterward. Both outcomes matched expectations.

**Deployment/demo link:**
- Frontend: https://testflow-frontend.onrender.com
- Backend: https://testflow-backend-yhj7.onrender.com (health: `/health`)
- (Unchanged by this task — nothing was deployed.)

**Blockers:** None.

**Next three tasks:**
1. Continue QA Operating Model work (e.g. the Custom Setup full configuration screen,
   explicitly deferred in `c0239ef`/`4426e70`).
2. Decide whether to push the local `main` commits (currently ahead of `origin/main`) and
   redeploy, or keep accumulating locally.
3. Consider wiring `e2e/playwright.visual.config.ts` into CI once a consistent rendering
   environment is chosen (currently local-only by design — see `docs/technical/testing.md`).

---

## Prior context (as of the last session before this entry)

Summarized from the session history; not independently re-verified in this entry.

- **Slice 1 (Account & Subscription)** — signup, login, trial, Paystack checkout
  (monthly/yearly), webhook reconciliation, billing history. Live on Render + Neon.
- **Engineering workflow agents** (`.claude/agents/`): `devops`, `qa`, `security`, `design`.
  CLAUDE.md rule 20 encodes the full gate: Requirements → Approved Design → Design Handoff →
  Implementation + Unit Tests → Design Conformance Review → QA → Security → Human Acceptance →
  DevOps → Deployment.
- **OpenAPI**: `docs/technical/api/openapi.yaml`, Swagger UI at `/docs` (non-production only).
- **QA Operating Model Setup** screen: four presets (Standard/Lightweight/Controlled/Custom),
  auto-published Standard QA on signup, draft/publish backend, rebuilt to match the approved
  Stitch design (verified by screenshot comparison).
- **Visual regression testing foundation**: `e2e/playwright.visual.config.ts`, isolated from
  the main E2E suite, one working example (Login screen).
- **Last known test health** (end of prior session): 67 backend unit, 59 frontend unit,
  13 E2E — all green. Not re-run in this entry since no application code changed here.

---

## How to fill this in for a new entry

Prepend a new `### <date> — <short title>` section under **Latest entry**, above the previous
one (keep history, don't overwrite it). Required fields, in order:

- **Branch/commit** — `git branch --show-current` + `git log --oneline -1`.
- **Completed work** — what actually changed, in plain terms.
- **Tests actually run and results** — the literal pass/fail counts from this session (e.g.
  "backend 67/67, frontend 59/59, E2E 13/13"), or "N/A — no application code changed" when
  true. Never write "tests passed" without having run them in this session.
- **Deployment/demo link** — the real, current URLs, and whether this task changed what's
  live there.
- **Blockers** — anything actually stopping progress right now, or "None."
- **Next three tasks** — the next three concrete things to do, in priority order.
