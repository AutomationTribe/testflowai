# TestFlow AI — Session handoff (current restart guide)

This is the **current restart guide** for Claude Code, independent of account or conversation history (CLAUDE.md rule 32;
`docs/framework/SESSION-CONTINUITY-AND-WORKSPACE.md`). `docs/PROJECT_STATUS.md` remains the **historical progress log**; this
file does not replace it. A handoff is a documentation step, **not** permission to commit, push, merge or deploy.

**Update this file:** after every substantial coding task · at the end of every active development day · **before** changing Claude
accounts, ending a session or approaching context/usage limits (checkpoint early; do not wait for a token count) · when a PR merges or
a deployment changes. Never say it was saved unless it is on disk. Never put credentials, tokens, secret values or customer data here.
If a session was cut off without a handoff, rebuild the state from `git status`, `git log`, the open PRs and `docs/PROJECT_STATUS.md`.

**Start of a new session / new Claude account — do this first**
1. Work from `~/dev/testflowai` (never from the iCloud-synced `~/Documents/...` clone). Read `CLAUDE.md`, this file, `docs/PROJECT_STATUS.md` (newest entry on top),
   `docs/framework/PROJECT_PROFILE.md`, then run `git status`, `git log --oneline -10`, `git branch -vv`, `git worktree list`.
2. Reconcile this file with reality before acting: open PRs (`https://github.com/AutomationTribe/testflowai/pulls`), CI on `main`, and Render
   (`render login` if the token expired; `render services -o json --confirm`, `render deploys list <service-id> -o json --confirm`).
3. A different Claude account does not remember earlier chats. Claude's per-project memory is keyed to the **git root**: the notes were copied (2026-10-10) to
   `~/.claude/projects/-Users-dimirage-dev-testflowai/memory/` (index + 6 notes; originals under the `...-Documents-Intello-Produts-testflow-ai` folder are untouched). If a session's
   system prompt shows a different memory path, copy those files there; the preferences are also summarised in section 5.

---

## 1. Snapshot (verified 2026-10-10 ~06:00 WAT / ~05:00 UTC, after PR #8 merged)

| Item | Value |
|---|---|
| Repository | `https://github.com/AutomationTribe/testflowai` (root contains `.claude/`, `package.json`, `testflow-ai/`; the application is in `testflow-ai/`) |
| **Active workspace** | `~/dev/testflowai` (`/Users/dimirage/dev/testflowai`), real path, **outside iCloud**; `node_modules`, builds and test runs live here |
| Other worktrees | `~/dev/testflowai-next15` (branch `next15-upgrade`, merged), `~/dev/testflowai-docs` (branch `docs/cleanup-sql-validated`, merged). Safe to remove later (`git worktree remove`), not yet done |
| **Legacy clone (iCloud-synced, do not use)** | `~/Documents/Intello/Produts/testflow ai` — Documents sync is ON. Left untouched at `d3686ba` (behind `main`; do not sync it), clean tree, holds the backup stash `stash@{0}: pre-sync PROJECT_STATUS local entry` (an old status text; superseded, kept on purpose). Contains a stray `node_modules` (about 20 MB) and build output (`backend/dist`, `frontend/.next`, `e2e/test-results`) created before the policy: **no new installs/builds/tests there; deletion needs the Product Owner's authorisation** |
| `main` | **`6a36f11`** (merge of PR #8: session handoff + non-iCloud workspace policy); CI on `main`: backend, frontend, e2e, security-audit all success; local `~/dev/testflowai` `main` is fast-forwarded to it (0 ahead / 0 behind) |
| This handoff update | branch `docs/handoff-after-pr8`, cut from `main` `6a36f11`, **committed locally; not pushed, no PR yet** (needs the Product Owner's go-ahead) |
| Working tree (`~/dev/testflowai`) | clean when this was written (before this branch's own edits); no stash in this clone |
| Open PRs | **#7** `security: frontend security headers and report-only CSP (AD-031, TD-014)`, head `bae2b33`, CI was green (4/4) but it is now **not mergeable (`dirty`)**: it was cut from `d3686ba` and `main` has moved on by PR #8, which also edited the top of `docs/PROJECT_STATUS.md`. Only that file conflicts. **Not merged — awaiting the Product Owner.** Fix (non-destructive, no force-push): in a separate worktree `git merge origin/main` into `security/frontend-headers-csp`, keep both `Latest entry` blocks, push, wait for CI. PR #8 is merged (`6a36f11`). |
| Framework | AI Software Delivery Framework **v1.1.0** (`docs/framework/FRAMEWORK_VERSION`, tag `v1.1.0`, commit `31dd835`). The framework's `main` (`97800f8`) adds only the session-continuity/workspace policy document, installed byte-for-byte at `docs/framework/SESSION-CONTINUITY-AND-WORKSPACE.md`; **version unchanged** (no new official release exists) |
| Criticality / readability profile | PRODUCTION / MID-LEVEL (Product Owner decision 2026-10-07; `docs/framework/PROJECT_PROFILE.md`) |

### Deployment state (staging only; there is no production environment yet)
- Render services: `testflow-backend` `srv-dakmr89594qs73fi0eu0` (`https://testflow-backend-yhj7.onrender.com`), `testflow-frontend` `srv-dakmr89594qs73fi0eug`
  (`https://testflow-frontend.onrender.com`), Neon PostgreSQL. **Auto-Deploy is OFF on both** (`autoDeployTrigger = off`, verified 2026-10-10); deploys are manual and need explicit approval
  (`render deploys create <service-id> --commit <sha> --wait`, backend first).
- **Live backend:** deploy `dep-db4mnqrtqb8s7397hdp0` = commit `9f7a910` (Origin allow-list, API security headers, `no-store`; deployed 2026-10-09). Rollback target: `dep-db4h9lbbc2fs73bpo5kg` (`95da669`).
- **Live frontend:** deploy `dep-db4hahflk1mc7381mk40` = commit `95da669` (Next.js 15.5.27 / React 19.3.0). **It does not have the frontend security headers** (PR #7 is not merged or deployed).
- Migrations: 0001-0005, all applied on staging; none pending. Free tier: cold starts can return a transient 503 on the first request.

## 2. Active objective and slice
Release-hardening of the accepted Projects slice is complete on staging. The current work item is the **frontend security headers + report-only CSP** (AD-031; analysis and verification in
`docs/technical/frontend-security-headers.md`) — **implemented, reviewed, in PR #7**. This handoff/workspace-policy change is a small documentation-only task requested by the Product Owner.

## 3. Completed work and evidence (newest first; full detail in `docs/PROJECT_STATUS.md`)
- **PR #8 (merged `6a36f11`):** `docs/framework/SESSION-CONTINUITY-AND-WORKSPACE.md` installed byte-for-byte (framework `main` `97800f8`, framework version unchanged at 1.1.0), `CLAUDE.md` rules 32-33, this file, profile/adoption-record updates.
- **PR #7 (open, needs `main` merged into it):** frontend headers (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP `same-origin-allow-popups`, HSTS 300 s in production, no `X-Powered-By`) and
  `Content-Security-Policy-Report-Only` (the enforcing header is **not** sent). Reviews: frontend-reviewer PASS, security PASS WITH WARNINGS (tighten `*.paystack.*` wildcards and add a
  `NEXT_PUBLIC_API_BASE_URL` build guard before enforcing), qa PASS. Tests: frontend 123/123, backend 204/204, typecheck/lint clean, builds OK, framework validator 97/0, Flow J E2E passes; CI green on GitHub.
  Real Paystack card/3-D Secure/wallet flow **not** exercised.
- **Backend security release (merged `9f7a910`, deployed to staging):** Origin allow-list for non-GET `/v1` (403 `forbidden_origin`), API headers, `no-store`; verified 34/34 on the live backend and 6/6 in a real browser; TD-011 resolved (APID-022).
- **Release readiness (merged):** isolated guarded backend test database (`*_test` only, one run at a time), shared test server (TD-007), Next 14 → 15.5.27 + React 19.3.0 (AD-030), CI moved to the repo-root `.github/workflows/ci.yml` (first GitHub run green).
- **Cleanup SQL for staging smoke data: validated locally against the real schema and fixed (merged, PR #4); never run on staging.**

## 4. Tests and how to run them (all from `~/dev/testflowai/testflow-ai`; local Postgres via `docker compose up -d`)
| What | Command | Last verified |
|---|---|---|
| Typecheck / lint | `npm run typecheck --workspaces --if-present`, `npm run lint --workspace backend` / `frontend` | clean on `main` and PR #7 |
| Backend | `npm run test --workspace backend` (uses its own `testflow_test` database; refuses non-`*_test`; one run at a time) | 204/204 |
| Frontend | `npm run test --workspace frontend` | 111/111 on `main`; 123/123 on PR #7 |
| E2E | `CI=true npm run test:e2e` (headless, ports 3100/4100, database `testflow_e2e`) | CI green; on a heavily loaded machine Flow E/H have flaked locally — **CI is the reference** |
| Framework validator | `python3 -I ~/dev/framework-v1.1.0-checkout/scripts/validate.py --project .` (from `testflow-ai/`) | 97 passed, 0 failed |
Machine note: Docker's VM, VS Code and Chrome keep the load average high; check `uptime` before blaming a flaky E2E.

## 5. Decisions and approvals in force
- Merges: merge commits; every merge, deploy and push to `main`-bound branches needs the Product Owner's explicit approval; **Render Auto-Deploy stays OFF**.
- Kept: Next.js 15.5.27 + React 19.3.0. **Deferred (not approved):** vitest 5, `@typescript-eslint` 8, Next 16.
- CSP stays **report-only**; enforcing is a later, separate change (criteria in `frontend-security-headers.md`). Backend allows requests with no `Origin` by design (APID-022).
- Staging smoke test data (organisations named `SMOKE TEST A/B 1791563212`, `UI SMOKE A/B 1791564118292`, `SEC VERIFY A/B/C 1791585416`, `UI SMOKE A/B 1791585522127`, possibly a partial
  `UI SMOKE A 1791585476304`) is **not deleted**; `docs/technical/staging-smoke-cleanup.md` must be extended with the newer names before any cleanup run, and needs approval.
- Tests must use Resend's test inbox (`delivered+<label>@resend.dev`) for sign-ups on staging; never exercise real payments or send real e-mail.
- Paystack webhook URL: an older note said local Cloudflare quick tunnels were used until deployment; staging is now on Render and `docs/technical/deployment.md` says to register `https://<backend>/v1/webhooks/payments` in the Paystack dashboard. **Which URL the Paystack dashboard currently holds was not verified** (that older note was judged stale and not carried over). Ask the Product Owner before relying on a webhook-driven payment test.
- Working preferences (Product Owner, from earlier sessions): match Stitch designs closely; never implement fabricated content from screenshots (product docs win); E2E tests start as the dedicated tester
  (new accounts only for sign-up/login/onboarding); never develop in iCloud-synced folders; webhook tunnels are quick tunnels for now.

## 6. Blockers and risks
- No hard blocker. PR #7 needs a merge of `main` before it can be merged (docs-only conflict). Open risks: CSP report-only with `'unsafe-inline'` and no violation telemetry (TD-014); frontend headers need a frontend deploy to take effect; `SameSite=None` / third-party-cookie blocking until a
  shared parent domain exists; real Paystack flow untested against the CSP; staging data accumulating; stray `node_modules`/build output in the iCloud clone (kept on purpose, nothing deleted).
- Sessions up to 2026-10-10 were started from the iCloud path (git commands only there; all builds/tests ran in `~/dev`). **Start the next one from `~/dev/testflowai`.**

## 7. Required human decisions
1. Review PR #7 (frontend headers/CSP) and decide on merge; then separately approve a manual **frontend** deploy to staging (then `curl -sI` the headers and run a Paystack test-key checkout with the console open).
2. Authorise (or not) retiring the iCloud clone (export or keep the backup stash first). Say whether to push the `docs/handoff-after-pr8` branch and open a PR. (Claude memory was already copied to the `~/dev` memory folder, 2026-10-10.)
3. Decide on the staging smoke-data cleanup (extend the script first) and on the deferred dependency upgrades.

## 8. Next three steps
1. **PR #7:** first resolve its conflict (merge `origin/main` into `security/frontend-headers-csp` in a worktree; only `docs/PROJECT_STATUS.md` conflicts), wait for green CI, then — on the Product Owner's approval — merge as a merge commit after confirming Auto-Deploy OFF; sync (`git fetch && git merge --ff-only origin/main` in `~/dev/testflowai`); on explicit approval deploy the
   frontend only (`render deploys create srv-dakmr89594qs73fi0eug --commit <merge-sha> --wait`), verify headers with `curl -sI https://testflow-frontend.onrender.com/login`, then update this file and `PROJECT_STATUS.md`.
2. **Workspace hygiene (after approval):** retire the iCloud clone (keep or export the backup stash first); remove merged worktrees (`~/dev/testflowai-next15`, `~/dev/testflowai-docs`) and merged local branches; confirm the Paystack webhook URL.
3. **Next hardening slice (after approval):** CSP enforcement prerequisites (exact Paystack hosts, `NEXT_PUBLIC_API_BASE_URL` build guard, test-key checkout) **or** the staging cleanup, **or** the deferred dependency upgrades — the Product Owner chooses; do not start unrelated feature work.

## 9. Resume check (proves a fresh session can restart from this file; run from `~/dev/testflowai/testflow-ai`)
`git status --short` (expect clean) · `git log --oneline -3` (expect `6a36f11` or newer on `main`) · `docker compose ps` (Postgres healthy) · `npm run typecheck --workspaces --if-present` · `npm run lint --workspace backend && npm run lint --workspace frontend` ·
`npm run test --workspace frontend` · `npm run test --workspace backend` · `python3 -I ~/dev/framework-v1.1.0-checkout/scripts/validate.py --project .` · `render services -o json --confirm` (Auto-Deploy `off`). E2E: rely on CI.

## 10. Key files and commands
- `CLAUDE.md` (project rules 1-33), `docs/PROJECT_STATUS.md`, `docs/framework/{POLICY,PROJECT_PROFILE,ADOPTION_RECORD,SESSION-CONTINUITY-AND-WORKSPACE}.md`, `docs/technical/{security,security-remediation-plan,frontend-security-headers,deployment,staging-smoke-cleanup,technical-debt,architecture-decisions,api-decisions}.md`, `TASKS.md`.
- Backend headers/CSRF: `backend/src/{app.ts,lib/origin.ts,middleware/originCheck.ts,middleware/securityHeaders.ts}`; frontend headers: `frontend/{security-headers.js,next.config.js}`; CI: `.github/workflows/ci.yml` (repo root).
- Git: `git fetch origin && git status && git log --oneline -10`; PRs via the GitHub web UI or API (no `gh` CLI installed); Render CLI is `render` (login is interactive: `render login`).
