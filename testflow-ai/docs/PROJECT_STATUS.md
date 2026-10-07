# TestFlow AI — Project Status

This file is the single source of truth for "what's actually done, actually tested, and
actually deployed right now." It is updated after every coding task (CLAUDE.md rule 22) —
a Stop hook checks for this and blocks finishing a task that touched the repo without
updating it.

**Never mark work "complete" here unless its tests were actually run in this session and
passed.** Untested work is reported as untested, not as done.

---

## Latest entry

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
