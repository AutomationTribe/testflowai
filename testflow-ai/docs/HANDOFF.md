# TestFlow AI — Session handoff (current restart guide)

This is the **current restart guide** for Claude Code, independent of account or conversation history (CLAUDE.md rule 32;
`docs/framework/SESSION-CONTINUITY-AND-WORKSPACE.md`). `docs/PROJECT_STATUS.md` remains the **historical progress log**; this
file does not replace it. A handoff is a documentation step, **not** permission to commit, push, merge or deploy.

**Update this file:** after every substantial coding task · at the end of every active development day · **before** changing Claude
accounts, ending a session or approaching context/usage limits (checkpoint early; do not wait for a token count) · when a PR merges or
a deployment changes. Never say it was saved unless it is on disk. Never put credentials, tokens, secret values or customer data here.
If a session was cut off without a handoff, rebuild the state from `git status`, `git log`, the open PRs and `docs/PROJECT_STATUS.md`.

**Start of a new session / new Claude account — do this first**
1. Work from `~/dev/testflowai` (CLAUDE.md rule 33; there is no other clone any more). Read `CLAUDE.md`, this file, `docs/PROJECT_STATUS.md` (newest entry on top),
   `docs/framework/PROJECT_PROFILE.md`, then run `git status`, `git log --oneline -10`, `git branch -vv`, `git worktree list`.
2. Reconcile this file with reality before acting: open PRs (`https://github.com/AutomationTribe/testflowai/pulls`), CI on `main`, and Render
   (`render login` if the token expired; `render services -o json --confirm`, `render deploys list <service-id> -o json --confirm`).
3. A different Claude account does not remember earlier chats. Claude's per-project memory is keyed to the **git root**: the notes live in
   `~/.claude/projects/-Users-dimirage-dev-testflowai/memory/` (index + 6 notes, copied 2026-10-10). If a session's system prompt shows another memory path, copy them there. The preferences are also in section 5.

---

## 1. Snapshot (verified 2026-10-10 ~07:30 WAT)

| Item | Value |
|---|---|
| Repository | `https://github.com/AutomationTribe/testflowai` (root has `.claude/`, `package.json`, `testflow-ai/`; the application is in `testflow-ai/`) |
| **Active (and only) workspace** | `~/dev/testflowai` — real path outside iCloud. Worktrees `~/dev/testflowai-docs` and `~/dev/testflowai-next15` are leftovers of merged branches (safe to remove with `git worktree remove`; optional) |
| **iCloud clone** | **Retired and deleted 2026-10-10** (`~/Documents/Intello/Produts/testflow ai`, 25 MB). Preconditions verified immediately before deletion: its HEAD `d3686ba` is on `origin/main`, no commit existed only there, clean tree, one stash. Preserved first in `~/dev/backups/testflow-icloud-retire-2026-10-10/` (private, outside iCloud): the stash as a patch, and the five gitignored local-only files with a checksum manifest. Four of them (`.env.local`, `.mcp.json`, `.neon`, `frontend/.env.local`) were restored in `~/dev/testflowai/testflow-ai`. **`backend/.env` in `~/dev` has placeholders; the real Paystack test secret and Resend key exist only in that backup (and in Render)** — copy `backup/local-only/backend/.env` over it only if you need real keys locally. iCloud keeps deleted files recoverable for about 30 days |
| `main` | `2e03894` (merge of PR #7). CI on `main`: backend, frontend, e2e, security-audit all success |
| Open PRs | **#10** `fix(webhooks): safe handling of signed Paystack events (TD-015)`: head `06713d7`, mergeable/clean, CI green (4/4), **not merged — awaiting the Product Owner**. A docs PR for this handoff and the next-slice preparation (see the PR list) |
| Framework | AI Software Delivery Framework **v1.1.0** (tag `v1.1.0`, commit `31dd835`); the unreleased session-continuity document from framework `main` `97800f8` is installed; version unchanged |
| Profiles | PRODUCTION / MID-LEVEL (Product Owner, 2026-10-07) |

### Deployment state (staging only; no production environment exists)
- Render: `testflow-backend` `srv-dakmr89594qs73fi0eu0` (`https://testflow-backend-yhj7.onrender.com`), `testflow-frontend` `srv-dakmr89594qs73fi0eug` (`https://testflow-frontend.onrender.com`), Neon PostgreSQL. **Auto-Deploy is OFF on both** (verified 2026-10-10); deploys are manual and need explicit approval (`render deploys create <service-id> --commit <sha> --wait`, backend first).
- **Live backend:** `dep-db4mnqrtqb8s7397hdp0` = `9f7a910` (Origin allow-list, API headers, `no-store`). Rollback target `dep-db4h9lbbc2fs73bpo5kg` (`95da669`). **It does not yet contain the TD-015 webhook fixes (PR #10).**
- **Live frontend:** `dep-db4hahflk1mc7381mk40` = `95da669` (Next.js 15.5.27 / React 19.3.0). **It does not yet send the frontend security headers** (merged in PR #7, not deployed).
- Migrations 0001-0005 applied; none pending. Free tier: first request after idle can return a transient 503.

## 2. Release blockers vs optional work (the Product Owner wants product work, not more infrastructure)

**Mandatory release blockers** (each needs the Product Owner's approval to execute; none needs new infrastructure):
1. **Merge PR #10 and deploy the backend** — it fixes a crash path (validly signed Paystack events without `data`/`reference` raised unhandled rejections), a double-payment-on-retry risk and the `500` retry loop seen on staging. Until deployed, staging runs the old handler.
2. **One real Paystack TEST-key payment on staging with webhook-driven activation confirmed** — in the retained staging logs no webhook delivery has ever returned `200`, so this has never been confirmed end to end. Someone should also look at the Paystack dashboard once to confirm the webhook URL is `https://testflow-backend-yhj7.onrender.com/v1/webhooks/payments` (Paystack's API cannot read it; deliveries to that endpoint were observed in the logs on 2026-10-06/07).
3. **Deploy the frontend** (merged headers, PR #7) and confirm on the live site with `curl -sI https://testflow-frontend.onrender.com/login` plus a test-key checkout with the browser console open (zero CSP violations). This completes the security slice; it is not a functional blocker.

**Optional improvements (NOT blockers; do not start without a decision):** enforcing the CSP (needs exact Paystack hosts, an `NEXT_PUBLIC_API_BASE_URL` build guard, test-key checkout evidence — TD-014); a Paystack "verify transaction" reconciliation call; an alert on `webhook_unattributable`; staging smoke-data cleanup (extend the script first); deferred upgrades (vitest 5, `@typescript-eslint` 8, Next 16); custom domain with `SameSite=Lax`; removing the leftover worktrees.
**No Critical or High infrastructure risk is open.** (The webhook crash path was High and is fixed in PR #10, pending merge/deploy.)

## 3. Active objective
Stabilisation is finished except the approvals above. **Next product feature (prepared, awaiting Product Owner decisions): Projects — Update Project and Archive Project (FR-PRJ-002, FR-PRJ-003)** — checkpoint, risk class MEDIUM, Definition of Ready and four decisions (D1 updatable fields, D2 how archive is audited, D3 no un-archive, D4 designs) in `docs/product/checkpoints/projects-update-and-archive.md`. No implementation has started.

## 4. Tests and how to run them (all from `~/dev/testflowai/testflow-ai`; local Postgres via `docker compose up -d`)
| What | Command | Last verified |
|---|---|---|
| Typecheck / lint | `npm run typecheck --workspaces --if-present`, `npm run lint --workspace backend` / `frontend` | clean on `main` and PR #10 |
| Backend | `npm run test --workspace backend` (own `testflow_test` database; refuses non-`*_test`; one run at a time) | 204/204 on `main`; **253/253 on PR #10** |
| Frontend | `npm run test --workspace frontend` | 123/123 |
| E2E | `CI=true npm run test:e2e` (ports 3100/4100, database `testflow_e2e`) | 28/28 (QA, PR #10) and CI green; on a loaded machine Flow E/H have flaked — **CI is the reference** |
| Framework validator | `python3 -I ~/dev/framework-v1.1.0-checkout/scripts/validate.py --project .` | 97 passed, 0 failed |
Machine note: Docker's VM, VS Code and Chrome keep the load average high; check `uptime` before blaming a flaky E2E.

## 5. Decisions and approvals in force
- Merges as merge commits; every merge, deploy and push to `main`-bound branches needs the Product Owner's explicit approval (PR #7 was pre-approved and merged); **Render Auto-Deploy stays OFF**; never run real payments, destructive database operations or staging data deletion without approval.
- Kept: Next.js 15.5.27 + React 19.3.0. **Deferred (not approved):** vitest 5, `@typescript-eslint` 8, Next 16. CSP stays report-only. Backend allows requests with no `Origin` by design (APID-022).
- Webhook rule (TD-015): acknowledge-and-log what can never succeed on retry, `500` only for genuine failures with nothing committed; reconciliation = structured `webhook_*` logs (`docs/technical/deployment.md`).
- Staging smoke data (organisations `SMOKE TEST A/B 1791563212`, `UI SMOKE A/B 1791564118292`, `SEC VERIFY A/B/C 1791585416`, `UI SMOKE A/B 1791585522127`, maybe a partial `UI SMOKE A 1791585476304`) is **not deleted**; the validated SQL is in `docs/technical/staging-smoke-cleanup.md` and must be extended with the newer names before use.
- Use Resend's test inbox (`delivered+<label>@resend.dev`) for staging sign-ups; never send real e-mail or exercise real payments.
- Product Owner working preferences: match Stitch designs closely; never implement fabricated content from screenshots (product docs win); E2E tests start as the dedicated tester (new accounts only for sign-up/login/onboarding); never develop in iCloud-synced folders; "stop spending time on infrastructure and resume product development" (2026-10-10): do not create new infrastructure tasks unless a genuine Critical/High risk appears.

## 6. Completed in the 2026-10-10 stabilisation cycle (evidence in `docs/PROJECT_STATUS.md`)
PR #7 merged (`2e03894`) after resolving the TD-014/TD-015 documentation conflict (both entries kept); frontend security validation on the merged code (production build: headers on `/`, `/login`, `/signup`, `/projects` and a 404, report-only CSP with the API origin, no enforcing header, zero violations on the main journeys, 123/123 unit tests, CI green); TD-015 implemented and independently reviewed (PR #10); workspace/handoff/memory verified sufficient to resume (a session now starts in `~/dev/testflowai/testflow-ai`); iCloud clone retired and deleted after backup; next feature prepared.

## 7. Required human decisions
1. PR #10 (TD-015): merge, and approve the backend deploy to staging; then approve a real test-key payment test and the one-off look at the Paystack dashboard webhook URL.
2. Approve the frontend deploy (PR #7 headers) to staging.
3. Answer D1-D4 for Update/Archive Project (or choose a different next feature), so implementation can start.

## 8. Next three steps
1. **PR #10:** confirm CI green and Auto-Deploy OFF, merge as a merge commit on approval, `git fetch && git merge --ff-only origin/main` in `~/dev/testflowai`; on approval deploy the backend (`render deploys create srv-dakmr89594qs73fi0eu0 --commit <merge-sha> --wait`), verify `/health`, the boot log (`[migrate] up to date`) and the new `webhook_*` log lines, then update this file and `PROJECT_STATUS.md`.
2. **Frontend deploy** on approval (`srv-dakmr89594qs73fi0eug`), then `curl -sI` the headers and run the test-key payment with the console open.
3. **Start the Update/Archive Project slice** once D1-D4 are answered: design handoff (if D4 needs designs), backend + tests first, then the review gates in `docs/framework/POLICY.md`.

## 9. Resume check (run from `~/dev/testflowai/testflow-ai`)
`git status --short` (expect clean) · `git log --oneline -3` · `docker compose ps` (Postgres healthy) · `npm run typecheck --workspaces --if-present` · `npm run lint --workspace backend && npm run lint --workspace frontend` · `npm run test --workspace frontend` · `npm run test --workspace backend` · the validator command in section 4 · `render services -o json --confirm` (Auto-Deploy `off`). E2E: rely on CI.

## 10. Key files and commands
- `CLAUDE.md` (rules 1-33), `docs/PROJECT_STATUS.md`, `docs/framework/{POLICY,PROJECT_PROFILE,ADOPTION_RECORD,SESSION-CONTINUITY-AND-WORKSPACE}.md`, `docs/product/checkpoints/projects-update-and-archive.md`, `docs/technical/{security,security-remediation-plan,frontend-security-headers,deployment,staging-smoke-cleanup,technical-debt,architecture-decisions,api-decisions}.md`, `TASKS.md`.
- Webhook: `backend/src/modules/subscription/webhook.routes.ts`, `backend/src/lib/paystack.ts`; headers/CSRF: `backend/src/{app.ts,lib/origin.ts,middleware/originCheck.ts,middleware/securityHeaders.ts}`, `frontend/{security-headers.js,next.config.js}`; CI: `.github/workflows/ci.yml` (repo root).
- Git: `git fetch origin && git status && git log --oneline -10`; PRs via the GitHub web UI or API (no `gh` CLI); Render CLI `render` (login is interactive: `render login`).
