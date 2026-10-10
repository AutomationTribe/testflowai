# TestFlow AI — Project Status

This file is the single source of truth for "what's actually done, actually tested, and
actually deployed right now." It is updated after every coding task (CLAUDE.md rule 22) —
a Stop hook checks for this and blocks finishing a task that touched the repo without
updating it.

**Never mark work "complete" here unless its tests were actually run in this session and
passed.** Untested work is reported as untested, not as done.

This file is the **historical progress log**. The **current restart guide** for a new session or Claude account is `docs/HANDOFF.md` (CLAUDE.md rule 32); keep both up to date.

---

## Latest entry

### 2026-10-10 - Session handoff and non-iCloud workspace policy integrated (branch `docs/session-handoff-workspace-policy`; documentation only; PR below, not merged, nothing deployed)

**Source:** the framework repository's `main` @ `97800f8a8121ec0e1281817a8601365e581610c5` (PR #1 there, 2026-10-10), which adds `docs/SESSION-CONTINUITY-AND-WORKSPACE.md` (20 lines). Compared byte-for-byte with the v1.1.0
checkout we installed from: **every other framework file is identical** (`POLICY.md`, `VERSIONING.md`, `VALIDATION.md`, `ADOPTION.md`, `PROJECT-CONFIGURATION.md`, `README.md`, `CHANGELOG.md`, `VERSION`, `scripts/validate.py`, all ten agents, all
templates). **No official new release exists** (`VERSION` still `1.1.0`, only tag `v1.1.0`, changelog top entry `[1.1.0]`), so the **recorded framework version is unchanged** (1.1.0).

**Gap analysis (existing project instructions vs the new policy):** rule 22 called `PROJECT_STATUS.md` "the concise handoff/state record" (contradicts the policy: it is the historical log); there was no `docs/HANDOFF.md`; no rule required handoff updates
before usage limits/account switches/day end; no iCloud workspace rule existed in the repository (only in the Product Owner's personal Claude memory); the Stop hook enforces only `PROJECT_STATUS.md`.

**Changes (no project-specific rule overwritten):** canonical document installed byte-for-byte at `docs/framework/SESSION-CONTINUITY-AND-WORKSPACE.md`; `CLAUDE.md` rule 22 reworded (status = historical log, handoff = restart guide) and **rules 32
(session continuity/handoff: update after substantial tasks, at day end, before account switches/ending a session/approaching limits; required contents; start-of-session reading list; "never claim it was saved unless written to disk"; a handoff
update is not permission to commit/push/merge/deploy) and 33 (local non-iCloud workspace `~/dev/testflowai`) added**; **`docs/HANDOFF.md` created** with the verified state; `PROJECT_PROFILE.md` (handoff and workspace rows) and `ADOPTION_RECORD.md` (post-1.1.0 document
section and upgrade-history row) updated; a pointer added to this file's header.

**Workspace verification (read-only):** iCloud Drive syncs Documents and Desktop on this machine (`FXICloudDriveDocuments=1`, `FXICloudDriveDesktop=1`). **The project's active workspace is `~/dev/testflowai`** (real path outside iCloud; `node_modules`,
`.next`, builds and every test/E2E/backend run in this work happened there; database data is in a Docker named volume under the Docker VM, not a bind mount). **Not clean:** the legacy clone `~/Documents/Intello/Produts/testflow ai` (iCloud-synced; at
`d3686ba`, clean tree, backup stash intact) contains a stray `node_modules` (about 20 MB) and build output (`backend/dist`, `frontend/.next`, `e2e/test-results`) from before the policy, and **this Claude session itself was started from that path**
(git operations only; no installs/builds/tests there). Nothing was deleted or moved (needs authorisation). Claude's per-folder memory (seven files) sits under the Documents-based project folder; the `~/dev` project memory folder is empty.

**Handoff triggers:** enforced by instruction only (CLAUDE.md rule 32 and the header of `docs/HANDOFF.md`); no tool can detect usage limits, and the Stop hook was deliberately not changed (it still enforces `PROJECT_STATUS.md` only).
**Validation actually run:** `scripts/validate.py --project .` from the v1.1.0 checkout and from the framework `main` copy (identical script): **97 passed, 0 failed** each; a clause-by-clause check of the policy against `CLAUDE.md` rules 32-33: 18/18 clauses reflected; the only existing text removed from `CLAUDE.md` is the four lines of rule 22 that were deliberately reworded. **Tests:** documentation only; no application tests run in this task. **Deployment:** none; Render Auto-Deploy OFF (verified); both services unchanged (backend `9f7a910`, frontend `95da669`).
**Remaining/decisions:** authorise retiring the iCloud clone and copying Claude memory to the `~/dev` project folder; reopen Claude Code/VS Code at `~/dev/testflowai`; PR #7 (frontend headers/CSP) still awaits review. **Merge note:** PR #7 also edits this file's
top; whichever PR merges second needs a trivial rebase of the `Latest entry` section.

---

### 2026-10-10 - Frontend security headers + report-only CSP implemented (branch `security/frontend-headers-csp`, PR below; NOT merged, NOT deployed)

**Prior steps completed first:** PR #6 (status log) merged as merge commit `d3686ba8059650de76cca065ca7298b8cc9fe669` after confirming head `c797118` had four green checks, mergeable/clean and Render
Auto-Deploy `off` on both services (no deployment followed; backend still `9f7a910` / `dep-db4mnqrtqb8s7397hdp0`, frontend `95da669`). Both local clones fast-forwarded to `d3686ba` (clean trees; backup
stash `pre-sync PROJECT_STATUS local entry` intact). The backend security milestone (APID-022, TD-011) is closed in `TASKS.md` and the plan (`security-remediation-plan.md` progress section).

**Requirements and compatibility analysis first (CLAUDE.md rules 4-7):** `docs/technical/frontend-security-headers.md`. No requirement mandates headers/CSP (supports NFR-SEC-007/010/012); risk MEDIUM; no database/API/backend
impact. Findings: Next 15 inline hydration scripts and 336 inline `style` props need `'unsafe-inline'`; fonts are self-hosted by `next/font`; the only third-party resource is Paystack Inline
(script injected at runtime from `js.paystack.co`, popup iframe; hosts taken from static analysis of the script: `checkout.paystack.com`, `standard.paystack.co`, `api.paystack.co`,
`checkout-studio.paystack.com`, `studio-api.paystack.co`, plus Apple/Google Pay endpoints); the API is cross-origin with credentials at the build-time `NEXT_PUBLIC_API_BASE_URL`; `Permissions-Policy`
leaves `payment` default and COEP/CORP are not set because they break the Paystack iframe. **Decision AD-031.**

**Implemented:** `frontend/security-headers.js` (tested pure builder) + `frontend/next.config.js` `headers()` on every route: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Strict-Transport-Security: max-age=300`
(production only), `X-Powered-By` removed, and **`Content-Security-Policy-Report-Only`** (self, the API origin, `*.paystack.co/.com`, `'unsafe-inline'`; `'unsafe-eval'` + websockets in dev only;
`frame-ancestors 'none'`, `base-uri`/`form-action` self, `object-src 'none'`). **The enforcing CSP header is not sent.** No new dependency, no collector (would be new infrastructure).

**Tests actually run:** unit tests 12 new (frontend 123/123, 3 runs by QA); backend 204/204 (3 runs by QA on its own database); typecheck and lint clean; frontend and backend production builds OK; framework
validator 97 passed / 0 failed; new E2E journey Flow J (headers + `securitypolicyviolation` sweep over sign-up, trial, QA setup, Projects) passed on `next dev`. **Mutation checks:** dropping the API origin or switching to the
enforcing header fails 3 unit tests; removing `'unsafe-inline'` from `style-src` fails Flow J with the violations listed. **Production mode** (`next build` + `next start`, my run and QA's run): headers on `/`, `/login`,
`/signup`, `/projects`, a `/_next/static` asset and a 404 exactly as designed, `connect-src` contains the API origin from `NEXT_PUBLIC_API_BASE_URL`, no dev allowances, and Flow J raised zero violations;
`/login` and `/projects` are byte-identical to a build from `main`; embedding `/login` in a foreign-origin iframe is refused by `X-Frame-Options`. **Paystack under the production policy** (script loaded, popup iframe
rendered, lookup with an invalid access code reached `api.paystack.co`; no payment): no violation of OUR policy; the violations reported were Paystack's own page against Paystack's own policy (their Google Tag Manager,
Pusher and PostHog scripts). The valid-card test-key flow, 3-D Secure and Apple/Google Pay were **not** exercised.
**E2E reliability caveat:** the full local run by QA gave 26 passed, 1 failed (Flow E, `@critical`), 1 flaky (Flow H); Flow E passed 3/3 when re-run in isolation; the machine load average was 4.6-8.5 and the
security agent also ran a broad `pkill -f next-server` that may have overlapped; cause unproven, not attributable to this change (no 403/CSP involvement was observed). GitHub Actions on the PR is the reference
for the full E2E result (see PR).

**Independent reviews:** `frontend-reviewer` PASS (2 LOW); `security` PASS WITH WARNINGS (no Critical/High; W1 `*.paystack.*` wildcards to be tightened and W2 a build guard for `NEXT_PUBLIC_API_BASE_URL` before
enforcing; both recorded as exit criteria in the slice doc and TD-014); `qa` PASS.

**Deployment/state:** nothing deployed; Render Auto-Deploy OFF (re-verified at the start of this task); no staging data deleted; scratch databases and servers created for validation and reviews were removed.
**Remaining risks:** the headers take effect only after a frontend deploy (needs approval); CSP is report-only with `'unsafe-inline'` and no violation telemetry (TD-014); real Paystack card/3-D Secure/wallet flow
untested; Render/Cloudflare header behaviour unverified until a deploy; Flow J runs on `next dev` only; `SameSite=None`/third-party-cookie risk and deferred upgrades (vitest 5, `@typescript-eslint` 8, Next 16) unchanged.
**Next three tasks:** (1) Product Owner reviews the PR and decides on merge and a frontend deploy to staging (then `curl -sI` + a Paystack test-key checkout with the console open); (2) decide on the staging data
cleanup (extend the script first); (3) enforcement change once the exit criteria are met.

**Merge note (2026-10-10):** `origin/main` (PR #8, `6a36f11`) was merged into this branch; the only conflict was this file (two adjacent `Latest entry` blocks) and both entries were kept unchanged. No frontend, test or implementation file was touched by the merge.

---

### 2026-10-09 - Backend security update DEPLOYED to staging (`9f7a910`, backend only); PR #4 and PR #5 merged

**Merges (merge commits, on the Product Owner's approval; both PRs had green CI, mergeable/clean, Render Auto-Deploy `off` verified first):**
PR #4 (cleanup-SQL fix, docs) -> `3be326aeea655b10ce7ec43df524869ef5a9823b`; PR #5 (Origin allow-list, security headers, `no-store`; APID-022, TD-011) ->
`9f7a9101942c7be8126ae22cdd02cbf95071ff8e`, which is the final `main` commit. **CI on `9f7a910` (GitHub Actions run 37999441661, push to `main`): backend,
frontend, e2e, security-audit all success.** No deployment followed either merge.

**Release gates (all passed):** diff `95da669..9f7a910` = four backend source files only (`app.ts`, `lib/origin.ts`, `middleware/originCheck.ts`,
`middleware/securityHeaders.ts`) plus tests/docs: **no migrations, no frontend, no `render.yaml`, no dependency change**; Auto-Deploy `off` on both services;
backend environment (names/non-secret values via the Render API, no secret printed): `NODE_ENV=production`, **`CORS_ORIGIN` equals the frontend URL exactly**
(no trailing slash, lower case; the new Origin check depends on it), `E2E_FAKE_PAYMENTS=false`, `SWAGGER_UI_ENABLED` absent, `DATABASE_URL`, Paystack and Resend
variables present and non-empty; rollback target = previous backend deploy `dep-db4h9lbbc2fs73bpo5kg` (`95da669`), then `dep-db3pufff3r2c7388ro7g` (`453f3ca`).

**Deployment (manual, `render deploys create srv-dakmr89594qs73fi0eu0 --commit 9f7a910... --wait`):** backend deploy `dep-db4mnqrtqb8s7397hdp0`, commit `9f7a910`,
status **live** (finished 2026-10-09 22:36Z); boot log `[migrate] up to date` (no migration applied) and `server_started` (production). **The frontend was NOT
deployed**: still `dep-db4hahflk1mc7381mk40` on `95da669`. Auto-Deploy remains OFF on both services. No environment variable, schema or data change; nothing deleted.

**Verification against the live staging backend (API level, 34/34 passed):** headers on `/health` (nosniff, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`,
CSP `default-src 'none'; frame-ancestors 'none'`, HSTS `max-age=300`, no `X-Powered-By`); `/v1` responses `Cache-Control: no-store` (200/401/404/403 and preflight);
`/docs` and `/v1/test-support/*` -> 404. **CSRF:** forged logout refused with `403 forbidden_origin` for `Origin: https://evil.example`, `Origin: null`,
`Sec-Fetch-Site: cross-site` without Origin, `Referer: evil` without Origin, and a multi-valued Origin; forged QA publish (text body) and forged project create refused;
forged trial refused **and the trial was not started** (state checked); victim sessions survived every forged logout. **Legitimate traffic:** signup, login and trial
from the trusted frontend Origin work with `Access-Control-Allow-Origin` = frontend and credentials allowed; the same calls with no Origin (server-to-server) work;
preflight from the frontend 204, from an evil origin no ACAO. **Authentication:** unauthenticated `/v1/me` and project list -> 401. **Projects API:** create (PRJ-001/002),
list + counts, search, cursor pagination, organisation isolation (B reading/creating in A -> 404). **Paystack webhook compatibility:** `POST /v1/webhooks/payments`
without a signature -> 400 "Missing signature."; bad signature -> 400 "Invalid signature."; with a foreign Origin still handled by its own signature check (400, not
403). **Not verified:** a genuinely signed Paystack event (the signing secret was not used), so successful webhook processing is untested on staging; compatibility
is inferred from unchanged rejection behaviour and the webhook being mounted ahead of the check.

**Real-browser check (deployed frontend -> new backend, cross-origin with credentials): Playwright 6/6 passed** (sign-up + trial through the UI, UI login, empty state,
create projects, 12-project pagination, search by name and code, filters, organisation isolation, hardening endpoints). Console/network: only the three expected
`401 GET /v1/me` probes while signed out; **no 403/`forbidden_origin` reached the browser.** One earlier attempt failed on a `503` from the **frontend** `/login`:
the free-tier frontend was waking from idle (its log shows a fresh start; the first retry took 20 s, then 200); unrelated to this release (frontend unchanged).
Sign-up e-mails used Resend's test inbox (`delivered+...@resend.dev`), no real e-mail; no payment was exercised.

**Staging data created by this verification (not deleted; cleanup still pending approval):** organisations `SEC VERIFY A/B/C 1791585416` and `UI SMOKE A/B 1791585522127`
(and possibly a partial `UI SMOKE A 1791585476304` from the 503 attempt), in addition to the four organisations listed in `docs/technical/staging-smoke-cleanup.md`. That
script matches exact names, so it must be extended with these before any cleanup run.

**Local tests (before merge, on the PR head):** backend 204/204, frontend 111/111, typecheck/lint clean, validator 97/0; E2E 27/27 on `1f0743a` (me and QA), CI green on
the final commit. **Remaining risks:** frontend still lacks security headers/CSP (plan P1); `SameSite=None` and third-party-cookie blocking remain until a shared parent domain;
no-`Origin` requests are allowed by design; HSTS is only `max-age=300`; successful signed-webhook path untested on staging; staging smoke data accumulating;
deferred upgrades (vitest 5, `@typescript-eslint` 8, Next 16). **Rollback if needed:** redeploy backend deploy `dep-db4h9lbbc2fs73bpo5kg` (`95da669`) from the Render
dashboard or `render deploys create srv-dakmr89594qs73fi0eu0 --commit 95da669...`; this release has no schema change. **Next three tasks:** (1) Product Owner decides on the
frontend headers/CSP slice; (2) decide on the staging data cleanup (extend the script first); (3) decide on the deferred upgrades.

---

### 2026-10-09 - Security: Origin allow-list for state-changing requests + API security headers (PR #5, branch `security/origin-check-and-headers`; NOT merged, NOT deployed)

**Merged earlier this session:** PR #3 (docs) as merge commit `53eb2556970e102017e64c21a338b634a3f4f08e`, after confirming head `a4cc24b` had four green checks and Render Auto-Deploy `off` on both services; no deployment followed (newest deploys on both services still `95da669`). Both local clones synchronised to `53eb255` by fast-forward (backup stash `pre-sync PROJECT_STATUS local entry` intact in the Documents clone).

**Change (APID-022, closes TD-011; plan items P0-1/P0-2):** shared origin predicate (`backend/src/lib/origin.ts`) used by CORS and by a new CSRF check (`middleware/originCheck.ts`) on every non-GET/HEAD/OPTIONS `/v1` request, applied before body parsing and routing: `Origin` must be the configured frontend (non-production also localhost/127.0.0.1:port); `null`/foreign/multi-valued/look-alike origins -> `403 forbidden_origin` (shared envelope). **No-`Origin` handling is explicit:** allowed, unless `Sec-Fetch-Site: cross-site` or an untrusted/unparseable `Referer` (both 403); this lets server-to-server clients, curl, the Playwright API context and the Paystack webhook (mounted outside the check) work; they hold no ambient browser cookie and must still authenticate. Headers (`middleware/securityHeaders.ts`): nosniff, `Referrer-Policy: no-referrer`, CSP `default-src 'none'; frame-ancestors 'none'`, `X-Frame-Options: DENY` (Swagger `/docs` exempt), HSTS `max-age=300` in production only; every `/v1` response (including preflights, webhook, refusals) `Cache-Control: no-store`. No new dependency. Docs: APID-022, `security.md`, `openapi.yaml`, TD-011.

**Reviews (independent):** `backend-reviewer` PASS (2 LOW, fixed) and PASS on re-review of the follow-up commit; `security` PASS WITH WARNINGS - no Critical/High, about 60 crafted bypass requests against a local production-mode server all failed, 2 LOW (no-store outside `/v1`; dev-localhost relaxation whenever `NODE_ENV` is not production - documented: every deployed environment must set `NODE_ENV=production`, which `render.yaml` does) ; `qa` PASS. Not verified by anyone: a real browser performing a cross-site forged form POST, production-mode HSTS beyond unit tests, Swagger UI rendering.

**Tests actually run:** typecheck clean; lint clean (`--max-warnings=0`); backend **204/204** (16 files; 5 consecutive QA runs at 189/189 before the follow-up commit); frontend 111/111 (3+ runs); builds OK; framework validator 97 passed / 0 failed; mutation check - disabling the origin check makes 13 of the new tests fail, including forged `trial`, `logout` and `draft/publish` (the cases that were exploitable). **Playwright E2E:** 27/27 (me) and 27/27 (QA) on `1f0743a`; on the final commit `1d4399f` one local run gave 25 passed + 2 flaky (retry passed; failures were a slow client redirect and a mid-load layout measurement, with no 403/`forbidden_origin` in the log) while the machine was at load average 6-8, a re-run was unusable at load average 17-20 (timeouts), so I stopped it; **GitHub Actions on `1d4399f` (clean runner): backend, frontend, e2e, security-audit all success** (run 37970842391, PR #5). Local E2E on the final commit is therefore not clean; CI is the evidence.

**Cleanup SQL validation (read-only; no staging access or credentials):** the staging smoke-data deletion SQL was run against the real schema on a local throwaway database populated by the real app (4 smoke orgs + a control org + a near-miss decoy). The draft was WRONG: trial signups create one free trial `seat_batches` row each, which its guard rejected and it never deleted, so it aborted on realistic data (safely). Fixed and re-validated: dry run 4/4/14/4/0/4; an unexpected extra user aborts with no change; the clean run removed exactly the four organisations and their rows; control and decoy kept all rows; a re-run aborts harmlessly. Fix is in PR #4 (docs only, not merged). Nothing was executed against staging; the four smoke organisations are still there.

**Deployment/state:** nothing deployed; Render Auto-Deploy OFF (verified at the start of this task); both services still on `95da669`. Scratch databases created for validation and reviews were dropped; `testflow_test` and `testflow_e2e` remain by design.

**Remaining risks:** this change is not deployed (staging still lacks the Origin check and headers until approved); no frontend security headers/CSP (plan P1); `SameSite=None` and third-party-cookie blocking remain until a shared parent domain; the no-`Origin` allowance is a deliberate residual; staging smoke data not cleaned; machine overload makes local E2E unreliable (CI is the reference); deferred upgrades (vitest 5, `@typescript-eslint` 8, Next 16). **Next three tasks:** (1) Product Owner reviews PR #5 and PR #4 and decides on merge; (2) if merged, approve a manual staging deploy (backend first) and re-run the smoke tests plus `curl -sI` header checks; (3) decide on the cleanup run and the frontend headers/CSP slice.

---

### 2026-10-09 - Post-deployment validation of staging `95da669`: browser smoke 6/6, PR #2 merged, cleanup and security plans proposed

**Documentation PR #2 merged** into `main` with a merge commit, SHA `e157d14176ef5430f194f4c03aaaf047d956d549`, after confirming its head `8504f6f`
had green CI (backend, frontend, e2e, security-audit), mergeable/clean, only the two expected docs files changed, and Auto-Deploy still `off` for
both services (Render CLI). No Render deployment was triggered by the merge (newest deploys still `95da669`: backend `dep-db4h9lbbc2fs73bpo5kg`,
frontend `dep-db4hahflk1mc7381mk40`). This follow-up documentation change is on branch `docs/post-deploy-validation` (not merged).

**Browser-driven Playwright smoke against the deployed staging frontend (`https://testflow-frontend.onrender.com`): 6 of 6 passed (1.4 min).**
Headless Chromium 1440x900, two isolated organisations created through the real UI with the free trial only (no payment, no Paystack). Sign-up
e-mails used Resend's documented test inbox (`delivered+smoke-ui-{a,b}-1791564118292@resend.dev`, simulated delivery, no real e-mail). Covered: public
login screen; sign-up + trial for A and B; UI login (after clearing the session); empty state; creating two projects through the dialog (codes PRJ-001
and PRJ-002, pinned to Standard QA v1, persisted across reload); 10 more via the API for data volume; pagination (12 projects: page 1 of 2 with 10
rows, page 2 with 2, Previous back, 25 rows per page); search by name (case-insensitive) and by project code; status tabs and counts (All 12 / Active
12 / Archived 0), Archived tab empty, status and QA-configuration filters; **organisation isolation** (B's list is the empty state; B listing or
creating in A's organisation and reading A's QA configuration -> 404; signed-out request -> 401); test-support endpoints (`simulate-payment`,
`reset-projects`, `set-project-status`) and Swagger `/docs` -> 404. Screenshots (13) are in `/tmp/staging-smoke/screenshots/` (not committed); the
throwaway spec is `/tmp/staging-smoke/staging-smoke.spec.ts` (not in the repo). **Console/network findings: only expected `401 GET /v1/me` responses
(3, each logged as a console error) when no session exists on the login/sign-up pages; no page errors, failed requests or 5xx.** Not covered: real
payments, real e-mail, Paystack checkout, other browsers, mobile widths, non-admin roles.
**Earlier note:** the API-level smoke test run before this task used `@example.com` addresses; the app attempted its normal welcome e-mails for
those two accounts through the live Resend integration, so that step may have sent (undeliverable) mail. This task used the Resend test inbox instead.

**Cleanup of the four staging smoke organisations: NOT performed.** Exact records, a dry-run query, a guarded single-transaction delete with
expected counts, a Neon restore-point precondition and rollback are proposed in `docs/technical/staging-smoke-cleanup.md`; awaiting Product Owner
approval. Two more organisations were created by the browser run (`UI SMOKE A/B 1791564118292`), so four now exist.

**Migration checklist wording corrected** in `docs/technical/deployment.md` (item 3): migrations are applied by the backend on boot, so the
snapshot/approval must come before the backend deploy; the diff command path is relative to the repo root; the expected post-deploy log is
`[migrate] up to date`. (Interpretation of the requested correction; tell me if a different wording was meant.)

**Security plan (agent `security`, read-only):** `docs/technical/security-remediation-plan.md`. P0: Origin allow-list on non-GET `/v1` requests (CSRF is
partly exploitable today: `POST .../subscription/trial` accepts an empty body, verified; `logout` and `draft/publish` by code reading) and hand-written
backend security headers + `Cache-Control: no-store`; P1: frontend baseline headers, CSP report-only then enforce, JSON content-type enforcement; P2: custom
domain + `SameSite=Lax`, nonce CSP. TD-011 updated (it understated the exposure). No application code was changed. SECURITY STATUS: PASS WITH WARNINGS.

**Tests run:** the Playwright staging smoke above (6/6); framework validator result below. No unit/E2E suites were re-run (no code changed). Render
Auto-Deploy stayed OFF; nothing deployed; no production or database change.
**Remaining risks:** staging data not yet cleaned; CSRF exposure above; no frontend security headers; browser coverage limited to Chromium/admin;
free-tier cold starts; deferred upgrades (vitest 5, `@typescript-eslint` 8, Next 16). **Next three tasks:** (1) approve/decline the cleanup; (2) approve the
first security slice (Origin check + backend headers) as a reviewed change; (3) decide on deferred upgrades.

---

### 2026-10-09 - Controlled STAGING release of `95da669` (backend, then frontend): deployed, smoke tests 24/24

**Release:** merge commit `95da6696681449b4a22e4408b29edf24f98d0954` (PR #1), deployed manually to the two Render **staging** services
with `render deploys create <service> --commit 95da669... --wait`, on the Product Owner's explicit approval. **No production
deployment** (staging/beta is the only environment); Auto-Deploy stayed OFF and was not changed.

**Gates (all passed before deploying):** (1) both services `autoDeployTrigger = off` (Render CLI); (2) `main` = `95da669`, CI run
37956067563 on that push: backend, frontend, e2e, security-audit all success; (3) environment verified through Render's API using the
Product Owner's CLI login, names and non-secret values only: backend `NODE_ENV=production`, `DATABASE_URL`, `CORS_ORIGIN` (= frontend
URL), `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` all present and non-empty, `E2E_FAKE_PAYMENTS=false`,
`SWAGGER_UI_ENABLED` absent (defaults off); frontend `NODE_ENV=production`, `NEXT_PUBLIC_API_BASE_URL` (= backend URL),
`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` present, `NEXT_PUBLIC_E2E_FAKE_PAYMENTS=false`, `NEXT_TELEMETRY_DISABLED=1`; no secret value was
printed or stored; (4) rollback target: previous live deploys `453f3ca` (backend `dep-db3pufff3r2c7388ro7g`, frontend
`dep-db3pufff3r2c7388ro2g`), then `20b02d6`, all present in Render's deploy history.

**Deployments:** backend `dep-db4h9lbbc2fs73bpo5kg` -> commit `95da669`, status live (finished 2026-10-09 16:24Z); boot log
`[migrate] up to date` (no migration applied) and `server_started`; `/health` -> `{"status":"ok"}` 200 on three consecutive checks;
then frontend `dep-db4hahflk1mc7381mk40` -> commit `95da669`, status live (finished 16:26Z), log `Ready in 3.7s`. The `453f3ca`
deploys are now `deactivated` (kept as rollback targets). **The deployed SHAs are Render's deploy records; the process itself was
not independently fingerprinted.**

**Smoke tests (API-level against the live backend, plus frontend route checks): 24/24 passed.** Frontend `/`, `/login`, `/signup`,
`/projects`, `/qa-setup`, `/subscription`, `/subscription-required`, `/app` all 200 with no error text. Projects: signup + trial for two
throwaway organisations; empty state in a fresh organisation; create (name only; with description, trimmed) with sequential codes
PRJ-001/PRJ-002; list + counts; search by name and by code; status filter; QA-configuration filter; cursor pagination;
**organisation isolation** (org B listing/creating in org A and reading A's QA configuration -> 404, not 403; unauthenticated -> 401;
cannot pin another organisation's QA configuration version -> 422); **fake-payment protection** (`POST /v1/test-support/simulate-payment`,
`/reset-projects`, `/set-project-status` -> 404; Swagger `/docs` -> 404). Not done: a browser-driven UI smoke test on staging (only
HTTP-level checks and route loads); real Paystack/email flows were not exercised.

**Data left in staging (no destructive operation was run):** two throwaway organisations named `SMOKE TEST A 1791563212` and
`SMOKE TEST B 1791563212` (users `smoke-a-1791563212@example.com`, `smoke-b-1791563212@example.com`), with 2 projects in A. They were
not deleted. No migration, no data deletion, no environment variable change.

**Local repos:** the Documents clone's stale 24-hour-old zero-byte `.git/index.lock` was removed after confirming no git process
was using that repo (the only other git processes were transient IDE ones and one in an unrelated repo); the clone was then
fast-forwarded to `95da669` (clean tree, 0 ahead / 0 behind); the backup stash `pre-sync PROJECT_STATUS local entry` is intact.
`~/dev/testflowai` `main` = `95da669`.

**Remaining risks:** staging only exercised through HTTP-level smoke tests; no browser UI pass on staging; deferred dependency
upgrades (vitest 5, `@typescript-eslint` 8, Next 16) and no frontend security headers; backend-test flake cause (TD-007) likely, not
proven; free-tier cold starts; rollback is code-level only (Render redeploy of `453f3ca`; no schema change in this release).
**Next three tasks:** (1) Product Owner reviews the documentation PR and decides on any browser-level staging pass; (2) decide on cleaning
up the two throwaway smoke organisations (needs a deliberate data decision); (3) schedule the deferred upgrades and security headers.

---

### 2026-10-09 - PR #1 merged into `main` (merge commit `95da669`); staging deployment NOT performed

**Merge:** PR #1 (`next15-upgrade`) merged with a **merge commit**, SHA `95da6696681449b4a22e4408b29edf24f98d0954`, on the Product
Owner's approval. Pre-merge checks: PR head `5f4cef2`, all four CI checks green (backend, frontend, e2e, security-audit), PR
mergeable/clean, `main` still at `453f3ca`, 18 commits / 59 files, only expected areas changed (the single backend non-test file
is `backend/vitest.config.ts`; no migrations, no backend `src`, no `render.yaml` change).

**Render auto-deploy - verified this time with the Render CLI** (after the Product Owner ran `render login`): `testflow-backend`
(srv-dakmr89594qs73fi0eu0) and `testflow-frontend` (srv-dakmr89594qs73fi0eug) both report `autoDeployTrigger = off`, branch `main`.
After the merge, Render's deploy list and GitHub's deployment records show **no new deployment**: both services' live deploy is
still `453f3ca` (2026-10-08 13:48Z), previous `20b02d6`. This also confirms the running build SHA for the first time. Live
`/health` -> `{"status":"ok"}` (200), frontend `/login` 200 (checked after the merge; the first check hit a free-tier cold start).

**Local clones:** `~/dev/testflowai` (active clone): `main` fast-forwarded to `95da669` (0 ahead / 0 behind); worktree
`~/dev/testflowai-next15` still on `next15-upgrade`. **`~/Documents/.../testflow ai` (old, iCloud-synced clone): NOT synced** -
its fetch completed (`origin/main` = `95da669`) but the fast-forward stalled on that slow folder and left a stale
`.git/index.lock`; HEAD is still `5ab2e2a` with a clean tree. Removing the lock and fast-forwarding needs approval. The backup
stash (`pre-sync PROJECT_STATUS local entry`) is untouched. This status entry is committed on the local branch
`docs/post-merge-status` (not pushed).

**Tests:** none run in this step (merge/sync/docs only). Last evidence: CI green on `5f4cef2`; local backend 140/140 (22
consecutive), frontend 111/111, E2E 27/27.

**Deployment:** none; no Render setting, environment variable or production data was changed or migrated. A staging deployment
checklist was added to `docs/technical/deployment.md` and awaits approval.

**Blockers:** Product Owner approval to deploy staging; approval to clear the Documents clone's lock. **Next three tasks:** (1) approve
and run the staging deployment checklist (manual deploy, backend first); (2) sync the Documents clone or retire it; (3) decide on the
deferred upgrades (vitest 5, `@typescript-eslint` 8, Next 16) and frontend security headers.

---

### 2026-10-09 - Integration: `next15-upgrade` pushed, PR #1 opened, first GitHub Actions run green (not merged, not deployed)

**Branch/commit:** `next15-upgrade` pushed to `origin` (HEAD `f846af4` at push time); PR #1 into `main`:
https://github.com/AutomationTribe/testflowai/pull/1 (17 commits, 59 files; GitHub reports mergeable/clean). The Product Owner stated
they disabled Auto-Deploy for both Render services before the push; this was **not independently verified** (Render CLI token
expired, no dashboard access). After the push, GitHub's deployment records showed no new deployment (latest is still `453f3ca`
from 2026-10-08 13:48Z), consistent with that, but a branch push would not have deployed `main` services either way.

**CI (first ever GitHub Actions run, workflow `CI`, run 37953945638, event `pull_request`):** `backend` success, `frontend`
success, `e2e` success, `security-audit` success. Note: `security-audit` is `continue-on-error`, so its "success" does not mean
zero advisories (local audit: backend 2 critical/10 high, frontend 2 critical/13 high, e2e 0 - dev/build tooling plus the
bundled postcss). No CI failures to fix; no required check bypassed (no branch protection was inspected).

**Not done:** merge, deployment, any Render or production change. **Remaining risks:** as in the previous entry (deferred vitest 5,
@typescript-eslint 8, Next 16; no frontend security headers; E2E only a few Next 15 runs - CI adds one more green run;
backend flake cause is TD-007, likely not proven; code-level rollback only; running Render build SHA still unconfirmed).
**Next three tasks:** (1) Product Owner: review PR #1 and decide on merge; (2) after any merge, deployment is a separate manual
approval (Auto-Deploy off); (3) schedule the deferred dependency upgrades and consider frontend security headers.

---

### 2026-10-09 - Release-readiness remediation, part 2: isolated test database, Next.js 15 upgrade (local branch `next15-upgrade`; not pushed, not deployed)

**Branches/commits (`~/dev/testflowai`, worktree `~/dev/testflowai-next15`):** `test-db-isolation` (guarded test DB, shared test server,
TD-007) -> `next15-upgrade` (Next 15.5.27 / React 19.3.0, e2e fix, merged from the former). **Nothing pushed. Render auto-deploy
status could NOT be verified (CLI token expired, no dashboard access) and is assumed ON; do not push until the Product Owner
confirms both services show Auto-Deploy = Off.**

**Completed:** (1) Backend tests run only against a local `*_test` database (default `testflow_test`, auto-created), guard enforced
in global setup/setup/reset and unit-tested (14 tests), session advisory lock allows one run per database; `backend-reviewer`
found a real hole (`?host=` query override) - fixed - re-review PASS (+ whitespace hardening). (2) Intermittent backend failures
(empty-body 404 on signup, missing cookie, unrelated assertions) matched TD-007; all suites now use one long-lived server per file.
(3) Next 14.2.35 -> 15.5.27, React 19.3.0 (AD-030). Reviews: `frontend-reviewer` PASS; `security` PASS WITH WARNINGS; `qa` PASS.

**Tests actually run:** typecheck clean (backend, frontend, e2e); lint clean (backend, frontend, `--max-warnings=0`); frontend 111/111
(3+ runs); **backend 140/140 in 17 consecutive runs by me plus 5 by QA (own database) = 22 consecutive clean runs after the
TD-007 fix** (before it: about 5 failures in 28 runs, so this is evidence, not proof - 22 clean runs bound the failure rate
below about 14% at 95% confidence); Playwright E2E 27/27 (me) and 27/27 (QA) on Next 15 (one earlier run had 1 failure: the
dev-only Next.js dev-tools button counted by Flow C - test corrected); production builds OK (13 static pages); `next start`
served /, /login, /signup, /projects with HTTP 200. Visual regression (login): fails on both Next 14 (2,844 px) and Next 15
(3,695 px) against the stored baseline - pre-existing, machine-sensitive baseline; Next 14 vs Next 15 renders differ only in the
74x59 dev-indicator region. Framework validator (v1.1.0): 97 passed, 0 failed.

**Dependency state (exact):** next 15.5.27, react/react-dom 19.3.0, @types/react(-dom) 19.3.0, eslint-config-next 15.5.27,
proxy-addr 2.0.8, source-map-js 1.2.2, postcss 8.5.29 (vite) / 8.4.31 (bundled in next), vitest 2.1.9, @typescript-eslint 7.18.0,
express 4.22.2. **Audit:** backend 2 critical/10 high; frontend 2 critical/13 high; e2e 0. Remaining critical/high are dev/build
tooling except the bundled postcss (Low in practice).

**Outstanding risks / blockers:** Render auto-deploy unverified; CI workflow (now at repo root) has never run on GitHub; E2E only
run twice on Next 15 (no multi-run reliability data); vitest 5 / `@typescript-eslint` 8 / Next 16 not approved or done; no
security headers on the frontend (pre-existing); pre-existing visual baseline mismatch; rollback is code-level only (no down
migrations; migrations unchanged in this work). The flaky-test cause is the most likely explanation (TD-007), not proven.

**Next three tasks:** (1) Product Owner: confirm/disable Render auto-deploy for both services; (2) review and approve push of the
two branches (and merge to `main`); (3) first GitHub Actions run, then decide on vitest 5 / `@typescript-eslint` 8.

---

### 2026-10-09 - Release-readiness remediation (branch `release-readiness`, local only; not pushed, not deployed)

**Branch/commit:** `release-readiness` in `~/dev/testflowai` (from `main` + the three local doc commits): `5ab2e2a` docs,
`d3ad6a3` CI move + test diagnostic, `c3cc5ed` CI fixes + lockfile security updates. Nothing pushed; Render
auto-deploy is still ON (Phase 1 blocked, see below).

**Phase 1 - Render auto-deploy: NOT DONE.** CLI token expired (`render login` needs the Product Owner's browser). No
Render setting or `render.yaml` change was made. **Do not push until both services show Auto-Deploy = Off.**

**Phase 2 - CI:** `.github/workflows/ci.yml` moved to the repository root (it was at `testflow-ai/.github/`, so GitHub
ran nothing: 0 workflows/0 runs). Inner paths were already `testflow-ai/`-relative. Independent `reviewer`: PASS WITH
CHANGES; fixed the MEDIUM (e2e CI now emits the HTML report the upload step expects), added `permissions: contents:
read`, corrected the README; re-review of the fixes and the lockfile-only dependency change: **PASS**. YAML parses; actionlint unavailable; **the workflow has not run on GitHub yet.**

**Phase 3 - flaky backend test:** root cause NOT proven. Intermittent failures seen: 3 of 21 full backend runs (2x
`qaConfiguration` "Controlled", 1x `bruteForce`), 18 clean (incl. 3 under CPU stress, 3 on fresh databases, 5 in a row
at the end). `backend-reviewer` reproduced the exact symptom (signup 500 -> no Set-Cookie -> `TypeError ... '0'`) when two
test processes share one database (tests TRUNCATE the whole DB; all use `admin@example.com`), the leading hypothesis
(H1); whether that caused the original failures is unverified. Change made: the helper now fails with signup status/body.
**Proposed, needs approval:** run backend tests on a dedicated guarded test database (changes CI env and local setup).

**Phase 4 - security (agent `security`, dependency posture): SECURITY STATUS FAIL.** Production-path: `next@14.2.35`
(critical per audit; no 14.x fix, fixes need 15.5.27+/16; reachable risk is mostly DoS/cache issues, no tenant-data path
found; AVIF image-optimizer RCE judged unlikely, not tested) and `proxy-addr` (not reachable: no `trust proxy`/`req.ip`).
Everything else is dev/build-only. Applied (lockfile only): proxy-addr 2.0.8, source-map-js 1.2.2, brace-expansion
1.1.21/2.1.7, postcss 8.5.29. Audit now: backend 2 critical/10 high (was 3/12), frontend 3 critical/14 high (was 3/16),
e2e 0. **Major upgrades NOT applied, need separate approval + a decision record:** next 15.5.27+, vitest 4+,
@typescript-eslint 8, eslint-config-next.

**Tests actually run after the changes (clone `~/dev/testflowai`, local Postgres, throwaway DB):** typecheck OK; lint OK
(backend, frontend); frontend 111/111; backend 125/125 in the final consecutive runs (one earlier post-update run had the
known `bruteForce` flake, 124/125, that file passes 3/3 alone); Playwright E2E (`CI=true`, flows A-I) **27/27**.
`scripts/validate.py` result recorded below.

**Blockers:** Render auto-deploy still ON; Next.js critical advisory unresolved pending upgrade decision; CI unproven on
GitHub; flaky-test root cause unproven. **Next three tasks:** (1) Product Owner: `render login` / disable auto-deploy for
both services; (2) decide on the Next 15 upgrade and the dedicated test database; (3) push `release-readiness` only after
(1), then confirm the first GitHub Actions run.

---

### 2026-10-08 - Synchronised local `main` with GitHub `main` @ `453f3ca` (no product code changed)

**Branch/commit:** `main` fast-forwarded `5e3f47a` -> `453f3ca` (`git merge --ff-only`; no reset, rebase,
force-pull or overwrite). Local = origin/main (0 ahead / 0 behind) before this entry. After the sync:
`.claude/settings.json` stays uncommitted (pre-existing local change, preserved); this file is committed on its own
(docs-only commit, local only, not pushed).

**Why:** local `main` was 8 commits behind GitHub, so `docs/framework/` (canonical framework v1.1.0), `CLAUDE.md`
rules 20/23/30/31 and the canonical agent files were absent locally. Earlier agent-roster findings below were made
on that stale checkout and are superseded.

**Completed work:**
- Backed up the affected local state first (outside the repo): this file, `.claude/settings.json`, the three agent
  files and the full local diff.
- A stale `.git/refs/remotes/origin/main.lock` (15:15, no git fetch process running) blocked `git fetch`; removed
  with Product Owner approval, then fetched.
- Removed the three untracked agent files only after confirming each was byte-identical to GitHub's copy; the
  fast-forward then brought them in as tracked files.
- Stashed this file's local entry, fast-forwarded, and preserved that entry below (not discarded).
- The `.claude/settings.json` change (`mcp__claude-in-chrome__tabs_context_mcp` allow entry) was untouched.

**Verification actually run:**
- `.claude/agents/` has 10 files; `backend-reviewer`, `database-architect`, `frontend-reviewer` are byte-identical
  to GitHub `453f3ca`.
- `docs/framework/` contains `ADOPTING-1.1.md`, `ADOPTION_RECORD.md`, `FRAMEWORK_VERSION` (`1.1.0`), `POLICY.md`,
  `PROJECT_PROFILE.md`, `VERSION.md`, `VERSIONING.md`; `POLICY.md` and `VERSIONING.md` are byte-identical to the
  v1.1.0 checkout (`~/dev/framework-v1.1.0-checkout`, commit `31dd835e`).
- `python3 -I scripts/validate.py --project .` (v1.1.0 checkout) -> **97 passed, 0 failed**.
- Not run: backend/frontend/E2E suites (no product code changed); registration of the agents in a *new* session
  was not re-checked after the sync.

**Follow-up (same day, after the sync):**
- Committed only this file as `08f1ca6` (docs-only; local, **not pushed**; local `main` was 1 ahead of `origin/main` at that point; 2 ahead once this follow-up is committed).
  `.claude/settings.json` was deliberately not staged and remains uncommitted and unchanged. The backup stash is retained.
- Read-only status review of the Projects Create + List feature from the canonical docs (no code run, no tests run this
  step): FR-PRJ-001, FR-PRJ-004, FR-PRJ-008 and FR-QAOM-012 are accepted by the Product Owner (2026-10-08) and not
  deployed. Last recorded results (from earlier entries, not re-run here): backend 125/125, frontend 111/111, E2E 27/27.
- Noted, not changed: `TASKS.md` still lists "Slice 2 ... then Project creation" as unapproved/unchecked, which is out of
  date; updating it needs Product Owner approval. Open on the slice: deployment decision, approved List/Empty State
  reference images (Google login), TD-006/007/009/011/012/013.
- This update was made because the Stop hook blocked on the uncommitted `.claude/settings.json` change; the hook was not
  modified or bypassed.

**Follow-up 2 (same day):**
- Committed the previous follow-up as `fbe6d2c` (this file only; local, **not pushed**; `main` is 2 ahead of `origin/main`).
  `.claude/settings.json` was uncommitted at that point (resolved in Follow-up 3); backup stash retained.
- Read-only audit of `TASKS.md` against the requirements, traceability table and this log: it is out of date (no
  entries for the built QA Operating Model Setup and Projects slices; "Slice 2 ... then Project creation" still listed
  as not started; Deployment phase wording). Corrections were **proposed only; `TASKS.md` was not edited**, pending
  Product Owner approval. Also found: `requirements-traceability.md` still shows FR-QAOM-001-003 and FR-QAOM-012 as
  "Pending" although FR-QAOM-012 was accepted; no Product Owner acceptance of the QA Setup slice is recorded.
- Produced a staging-deployment readiness checklist (tests, security, migrations, configuration, rollback) in the
  conversation only. No tests were run, nothing was deployed, and the live commit on Render was not verified.
- This entry was needed because the Stop hook blocks while `.claude/settings.json` is the only uncommitted change.

**Follow-up 3 (same day) - documentation corrections approved by the Product Owner (docs only; committed together with Follow-up 2):**
- `TASKS.md`: Testing phase marked "ongoing per feature slice"; Deployment phase reworded (staging/beta exists, Projects
  slice not deployed); UX note narrowed to the pending Custom Setup screen; added Slice 3 (Projects Create + List,
  accepted 2026-10-08) and Slice 2 (QA Operating Model Setup: **implemented and E2E-verified, Product Owner acceptance
  not recorded**); the stale "Slice 2 ... then Project creation" item is kept as a history note.
- `requirements-traceability.md`: added an implementation-status note under the CHANGE-001 table (FR-QAOM-001-009
  implemented, acceptance not recorded; FR-QAOM-012 accepted; FR-QAOM-010/011/013 no implementation recorded). The
  existing "Pending" cells were not altered. Not fixed (out of scope): the main traceability table still shows "Pending"
  UI/Tests for many already-built FRs (e.g. FR-AUTH-*).
- Validation: documentation only; no tests run (no code changed). `scripts/validate.py` (v1.1.0) re-run: **97 passed, 0 failed**.
- Product Owner approved reverting the repo-root `.claude/settings.json`. Verified first that its only difference from
  `HEAD` was the added `mcp__claude-in-chrome__tabs_context_mcp` allow entry; reverted with `git checkout` of that
  file only. The Stop hook (in `testflow-ai/.claude/settings.json`) was not modified. Stop-hook root cause: it blocks
  whenever any file is dirty but the status file is not itself among the dirty files; with the tree now clean it
  returns `{}`. The backup stash is retained. Nothing pushed or deployed.

**Follow-up 4 (same day) - correction: staging deployment history (verified, read-only):**
- **Correction:** earlier entries (including Follow-ups 2-3 and `TASKS.md` as committed in `a94de90`) said the Projects
  slice was "not deployed". That was wrong. GitHub deployment records (`/repos/AutomationTribe/testflowai/deployments`)
  show both Render services deployed with status `success` for `5e3f47a` (the Projects slice, 2026-10-07 22:26Z) and for
  every later commit up to **`453f3ca` (2026-10-08 13:48Z), the latest successful deployment**. So **Projects Create +
  List is already deployed to staging.** Earlier "nothing deployed" lines referred to what that task deployed, not to
  what was live.
- **Not confirmed:** the actual running build SHA. `/health` returns only `{"status":"ok"}` (HTTP 200 at 14:56Z) and no
  Render dashboard access was available, so "deployed" means the last successful deployment record. GitHub Actions
  results for `453f3ca` could not be retrieved.
- **Render auto-deploys every push to `main`** (observed from the deployment records; `render.yaml` sets no
  `autoDeploy`/`autoDeployTrigger`). A push is therefore a deployment.
- **Unpushed:** three local documentation commits (`08f1ca6`, `fbe6d2c`, `a94de90`, plus this entry's commit once
  made); local `main` is ahead of `origin/main`. Pushing them would redeploy both services.
- Fixed wording: "three local documentation commits" = `08f1ca6`, `fbe6d2c`, `a94de90` (unpushed).
- No Render setting, code, push or deployment was changed. Auto-deploy-off proposal pending Product Owner approval.

**Phase 1 (Render auto-deploy) - BLOCKED on authorization:** the Render CLI token is expired (`render whoami`: "your
token is expired; run `render login`") and `api.render.com` / `render.com` docs are unreachable from this environment
(`render blueprints validate` -> 401). Auto-deploy is therefore **still ON**; nothing may be pushed until the Product
Owner disables it for both services. The Render CLI binary (v2.28.0) lists the values `commit`, `off`, `checksPass`
and the API field `autoDeployTrigger`, which supports `autoDeployTrigger: off`; the exact `render.yaml` key was not
validated against Render's Blueprint validator and `render.yaml` was not edited.

**Readiness checks actually run (read-only; commit `453f3ca`, clone `~/dev/testflowai`, throwaway local database
`testflow_readiness`, dropped afterwards):**
- `tsc` typecheck (backend, frontend, e2e) and `eslint --max-warnings=0` (backend, frontend): clean. Migrations 0001-0005
  applied cleanly to an empty database.
- Frontend `vitest`: **111/111**. Backend `vitest`: three full runs - run 1 **124/125**, run 2 failed again (one test in
  `qaConfiguration.test.ts`, "materializes Controlled QA settings", `TypeError: Cannot read properties of undefined`),
  run 3 **125/125**; that file alone passes 16/16. Intermittent, unexplained, not the known `bruteForce` flake.
- `npm audit`: backend 3 critical / 12 high; frontend 3 critical / 16 high (e.g. direct `next`, transitive `proxy-addr`,
  `vitest`/`tinypool`). Not triaged here; relates to TD-012.
- **Finding:** `testflow-ai/.github/workflows/ci.yml` is not at the repository root, so GitHub runs no workflow
  (GitHub API: 0 workflows, 0 runs). CI has never run on GitHub; any "CI green" claim is unsupported.
- E2E not run in this step.

**Deployment/demo link:** none; nothing deployed or pushed.

**Blockers:** none. A git stash (`pre-sync PROJECT_STATUS local entry`) remains as an extra backup; it can be
dropped once this entry is accepted.

**Next three tasks:** (1) Product Owner decides whether to push this commit (committed locally, not pushed); (2) choose the next feature and
run the first slice under the adopted framework; (3) verify in a live session that the Stop hook blocks as expected.

---

### 2026-10-08 - Agent roster verification (SUPERSEDED - made on a stale checkout, kept for the record)

> **Correction:** the findings below were made when local `main` was at `5e3f47a`, 8 commits behind GitHub. On
> GitHub (`453f3ca`) all 10 agents exist (including `database-architect`, `backend-reviewer`, `frontend-reviewer`,
> and `security` as the tenth), `reviewer` is already scoped to cross-cutting review, and `docs/framework/` is
> present. The "roster NOT met" and "tenth agent not identified" statements no longer apply.

**Branch/commit (at the time):** `main` @ `5e3f47a`. Uncommitted: `.claude/settings.json` only (plus this file).

**Completed work (at the time):**
- Verified the project subagent roster. `.claude/agents/` held 7 files: `backend`, `design`, `devops`, `frontend`,
  `qa`, `reviewer`, `security`; all 7 were registered in the session.
- Recorded the pre-existing uncommitted change to `.claude/settings.json` (not made by that session): one entry
  added to `permissions.allow`, `mcp__claude-in-chrome__tabs_context_mcp`. The Stop hook was unchanged.
- Updated only this file, with the Product Owner's explicit authorization.

**Tests actually run and results:** None; verification was `ls`, `git status`/`git diff` and the session's agent list.

---

### 2026-10-08 - Adopted the canonical AI Software Delivery Framework v1.1.0 (framework-only change)

**Branch/commit:** `main` - see the commit containing this entry (not deployed). No product functionality,
application code, schema, tests or product configuration were changed.

**Completed work:**
- Installed framework **1.1.0** from the independent repository at the exact tag `v1.1.0` (tag object
  `8c3daf4...`, commit `31dd835e4854418a67b0e13b020b0a7b79c84cd2`; checkout under `~/dev`, outside iCloud).
  Pre-adoption check: clean working tree, no implementation in progress, last commit was framework-only.
- Added `docs/framework/POLICY.md`, `VERSIONING.md`, `FRAMEWORK_VERSION` (canonical, unedited), plus
  `PROJECT_PROFILE.md` (PRODUCTION / MID-LEVEL preserved; document map; run commands) and
  `ADOPTION_RECORD.md` (pinned version/tag/SHA, reconciliation, compatibility exceptions, upgrade history).
- Replaced all 10 `.claude/agents/*.md` with the canonical agents; each keeps its TestFlow-specific guidance in
  a delimited "PROJECT-SPECIFIC ADDENDUM" section below the canonical text (canonical text above the marker is
  byte-identical to v1.1.0). Nothing project-specific was dropped (rule references, test commands, Stitch
  registry, fake-payment guard, Paystack/Render/Neon context, known flaky test). Prior versions: commit `20b02d6`.
- `CLAUDE.md`: all project rules and numbering preserved; rules 20, 24, 25, 26, 28, 30 now point at
  `docs/framework/POLICY.md`; rule 31 added (pinned version and the no-edit-canonical convention).
- `docs/technical/engineering-framework.md`, `docs/framework/VERSION.md`, `docs/framework/ADOPTING-1.1.md`
  retained with a pointer banner (they hold the profile decisions and history).
- `.claude/settings.json` Stop hook: added `-uall` to `git status --porcelain`. Found while testing: without
  it, a newly created, untracked directory collapses to one path and a status-log update inside it was not
  recognised. Behaviour otherwise unchanged.

**Review results:** n/a (framework-only change; no product code reviewed).

**Tests actually run and results:** `python3 <v1.1.0 checkout>/scripts/validate.py --project .` -> 97 passed,
0 failed (agent frontmatter, reviewer agents without write tools, references resolve, version files present,
no unfilled profile placeholders). Agent-file canonical prefixes compared byte-for-byte with v1.1.0: 10/10
identical. Settings JSON parses. Stop hook exercised in a temporary git repo: clean -> `{}`; changes without
status log -> block; status log inside a new directory -> `{}`. Fresh sessions in this project
(`claude -p --agent <name>`): the agents are discovered, and backend-reviewer, frontend-reviewer, reviewer,
database-architect and security each reported no Write/Edit tool (self-report, not an adversarial test). **No backend/frontend/E2E suites were run** - no product code
changed.

**Compatibility exceptions:** see `docs/framework/ADOPTION_RECORD.md` (addendum-below-marker convention;
retained earlier policy document). No control weakened or removed.

**Not verified / limits:** review gates and the workflow are process rules, not tooling; reviewers are
read-only by tool allowlist but keep `Bash`; a live session was not used to confirm the Stop hook is invoked;
the addendum content was written from the previous agents by hand and has not been exercised by running each
agent on a task.

**Deployment/demo link:** none. Nothing deployed.

**Blockers:** none.

**Next three tasks:** (1) Product Owner chooses the next feature; (2) run the first slice end to end under the
adopted framework, including a first real database-architect / backend-reviewer / frontend-reviewer pass;
(3) verify in a live session that the Stop hook blocks as expected.

---

## Previous entry (summary kept below)

### 2026-10-08 — AI Software Delivery Framework upgraded to 1.1 (framework-only change)

**Branch/commit:** `main` — see the commit that contains this entry (not deployed). No product functionality,
application code, schema, tests or configuration were changed.

**Framework changes completed:**
- **Three new specialist agents** (`.claude/agents/`): `database-architect` (reviews proposed schema/migration
  designs *before* implementation, only when database structures are introduced or materially changed),
  `backend-reviewer` (independent review of Backend Engineer output before commit), `frontend-reviewer`
  (independent review of Frontend Engineer output before commit; owns **both** the engineering review and the
  **design conformance** review, MATCH / MINOR / MATERIAL / PRODUCT CONFLICT). None may modify implementation
  code; all use the Standard Review Report.
- **Design conformance** moved from a separate mandatory gate into the `frontend-reviewer`. The `design` agent
  is retained for consultation, interpretation and handoff; its conformance *method* stays in `design.md` as the
  single authoritative description the reviewer follows.
- **Workflow** restated as the 20-step vertical slice (layers a task does not touch are skipped), with
  review-and-correction loops per layer and "all mandatory reviews before commit"; the general `reviewer` is now
  cross-cutting/integration only.
- **Review standards** defined once in `engineering-framework.md`: Standard Review Report, severity rules
  (HIGH blocks progression and commit; MEDIUM must be resolved before commit unless the authorised human
  explicitly accepts an exception; LOW fixed or logged as debt), PASS WITH CHANGES does not by itself authorise
  commit, reviewers must not certify tests they did not execute, senior-level expertise reviewed against the
  project's readability profile. **Independent Judgment — Evidence Over Agreement** expanded to the seven points.
- **Versioning and adoption:** `docs/framework/VERSION.md` (version rule, history, this project's adoption
  record) and `docs/framework/ADOPTING-1.1.md` (forward-only adoption guide, new-project bootstrap, rollback,
  and the reusable migration prompt).
- **Judgment call to confirm:** the repository had **no recorded framework version**. I named the 2026-10-07
  baseline **1.0** retroactively and this change **1.1** (a minor: it reassigns the conformance gate and adds
  agents without removing any control). If your other projects already use a different numbering, tell me and
  I will align `VERSION.md` rather than leave two conventions.
- Not present in this repository (so not created or edited): a "Master Bootstrap", a separate agent registry
  file, a prompt library. The agent registry is the table in `engineering-framework.md`; the new-project
  bootstrap and the prompt live in `docs/framework/ADOPTING-1.1.md`.

**Files created:** `.claude/agents/database-architect.md`, `backend-reviewer.md`, `frontend-reviewer.md`;
`docs/framework/VERSION.md`, `docs/framework/ADOPTING-1.1.md`.
**Files modified:** `CLAUDE.md` (version line; rules 20 and 23 reworded; rule 30 added), `docs/technical/
engineering-framework.md`, `docs/technical/testing.md`, `docs/technical/deployment.md`,
`docs/technical/design-handoff.md`, `docs/technical/coding-standards.md`, `.claude/agents/design.md`,
`backend.md`, `frontend.md`, `reviewer.md`, `docs/PROJECT_STATUS.md`. Unchanged on purpose: `qa.md`,
`security.md`, `devops.md`, `.claude/settings.json` (and its Stop hook).

**Verification actually performed:**
- A scripted check (42 checks, all passed): all 3 agent files exist; frontmatter valid (name = filename,
  description, tools, model) for all 10 agents; invocation rules, independence and "must not modify code" present;
  standard report shape, severities, verdicts and recommendations present; design conformance owned by
  `frontend-reviewer` and no stale separate-gate wording left in any policy/agent/process document; QA and
  Security untouched and still in the workflow; human acceptance and deployment gates present; CLAUDE.md rule 20
  lists the workflow steps in the framework's order; 20 numbered steps present; migration guide contains the
  forward-only / no-interruption / no-app-code-change language; version record complete; both
  `.claude/settings.json` files parse and were not modified.
- **Behaviour checks:** `database-architect` and `backend-reviewer` were each run (through general-purpose agents
  following their definition files) on a deliberately flawed toy input. Both produced the Standard Review Report,
  rated severities per the rules, found real defects (DB architect: a destructive DROP of an approved column,
  missing tenant foreign keys, `serial` keys against DBD-007, no index; backend reviewer: SQL injection, tenant
  taken from the request body, leaked connection, wrong error envelope, no tests, no OpenAPI update) with no
  invented ones, and listed what they had not verified.

**Not verified / limits (be explicit):**
- Named invocation (`subagent_type: database-architect`) is **not** available in this session — the agent list is
  fixed at session start (the pre-existing project agents are not listed either). It should work in a new session
  opened in `~/dev/testflowai`; I could not confirm that.
- `frontend-reviewer` was not behaviour-tested (it needs a running app and the design reference); only its
  definition was structurally checked.
- The new gates are **process rules** (CLAUDE.md + agent instructions). Nothing blocks a commit automatically;
  the only automated enforcement remains the existing `PROJECT_STATUS.md` Stop hook.
- The three agents each restate the severity one-liner next to the report skeleton so they are self-contained;
  the rules are *defined* only in `engineering-framework.md`, and a wording change there needs mirroring in them.

**Remaining issues:** none blocking. Deployment/demo link unchanged; nothing deployed.

**Next three tasks:**
1. Product Owner review of this framework upgrade (and confirm the 1.0/1.1 numbering).
2. Open a new session in `~/dev/testflowai` to confirm the new agents are invocable by name.
3. Next feature selection — the first task to use the 1.1 workflow (e.g. archive/update/membership, FR-PRJ-002/003/005-007).

---

## Previous entry (TD-008/TD-010 fixes and reference images, 2026-10-08)

### 2026-10-08 — Fixed TD-008 and TD-010; saved the Projects reference images

**Branch/commit:** `main` — see the commit that contains this entry (not deployed). Work paused here at the Product
Owner's request, who wants to update the workflow.

**Completed work:**
- **TD-008 fixed:** an unreadable request body (malformed JSON, over the size limit, bad charset/encoding) now returns the
  approved `422 validation_error` in the shared envelope instead of `500 internal_error` (no parser internals leaked).
- **TD-010 fixed:** `requireAuth` and `requireActiveSubscription` now pass a failing database lookup to `next(error)`;
  before, Express 4 left the request hanging and raised an unhandled rejection (which ends the Node process).
- Tests: `errorHandling.test.ts` (5) and `asyncMiddlewareErrors.test.ts` (3). **Verified they catch the original bugs:**
  run against the old middleware, 5 of the 8 fail (the other 3 assert behaviour that was already correct).
- **Reference images saved** in `docs/design/approved/projects/`: `create-project.png` (the approved original),
  `list.png` and `empty-state.png` — the **sibling** screens (`project list`, `project empty state`) the screens were built
  and checked against, because the approved originals' images need a Google login. `README.md` there and
  `stitch-registry.md` say so plainly.

**Tests actually run and results (from `~/dev/testflowai`):**
- Backend `vitest`: **125/125** (12 files); `tsc --noEmit` and `eslint` clean.
- E2E Playwright (headless, flows A-I): **27/27 passed** — run after the auth-middleware change.
- Frontend unchanged this entry (last run 111/111).

**Not done / open:** the approved originals of Projects - List / Empty State still cannot be fetched; deployment not
requested; TD-006/007/009/011/012/013 remain.

**Deployment/demo link:** unchanged; nothing deployed.

**Next three tasks:**
1. Product Owner workflow update (paused for it).
2. Decide whether to deploy the accepted Projects slice (needs an explicit instruction).
3. Next feature selection (e.g. archive/update/membership, FR-PRJ-002/003/005-007).

---

## Previous entry (Product Owner acceptance of the Projects slice, 2026-10-08)

### 2026-10-08 — Product Owner acceptance: Projects slice

**Accepted by the Product Owner (2026-10-08):** the Projects vertical slice — Create Project (FR-PRJ-001),
visibility by role (FR-PRJ-004), QA configuration pinning (FR-QAOM-012), and the list's search, filters,
counts and pagination (FR-PRJ-008). Traceability rows updated to "accepted". Acceptance covers what was
delivered and verified (final results in the entries below: backend 117/117, frontend 111/111, E2E 27/27).

**Not part of this acceptance / still open:** deployment (not requested — the Product Owner is the final authority
for deployment); reference images for Projects - List / Empty State; the design-conformance caveat (List/Empty State
were compared against sibling screens); technical debt TD-006/007/008/010.

**Deployment/demo link:** unchanged; nothing deployed.

**Next three tasks:**
1. Decide whether to deploy the Projects slice (needs an explicit instruction; security review is already done).
2. Fix TD-010 (async auth middleware error handling) and TD-008 (malformed JSON -> 4xx).
3. Next feature selection (e.g. archive/update/membership, FR-PRJ-002/003/005-007).

---

## Previous entry (FR-PRJ-008 + list filters E2E, 2026-10-08)

### 2026-10-08 — FR-PRJ-008 added to the requirements; list filters verified end to end

**Branch/commit:** `main` — see the commit that contains this entry (not deployed).

**Completed work:**
- **Requirements:** PD-069 is now **Approved** (Product Owner, 2026-10-08) and the behaviour is requirement
  **FR-PRJ-008 — Project List: Search, Filter, and Pagination** (`functional-requirements.md`, with acceptance
  criteria), listed in the FR index and the traceability matrix. `api-spec.md`'s approved filter list now includes
  Projects (`status`, `qaConfigurationVersionId`) plus the project-code search exception; `api/projects.md` no longer
  marks anything "pending". The implementation already matched the requirement; no product behaviour changed.
- **Test support:** E2E-only, double-gated `POST /v1/test-support/set-project-status` (caller's own organisation
  only) so the Archived tab/filter can be exercised before archiving (FR-PRJ-003) exists.
- **New E2E (`flowI-projects-list-filters.spec.ts`, 3 tests):** (1) status tabs show real counts and the Archived
  tab / status filter narrow the list; (2) search matches name (any case) or project code, "no match" state,
  Clear filters restores; (3) the QA-configuration filter lists only projects pinned to the chosen version (own
  fresh organisation, `NO_SESSION`, because publishing a second QA configuration changes the whole organisation).

**Tests actually run and results:**
- New spec: **3/3** at full speed, and **3/3 in `extraslow` mode** (headed, 8s per action, 3.6 min).
- Full E2E suite (flows A-I, headless): **27/27 passed**.
- Backend `tsc`/`eslint` clean; frontend and backend unit suites were last run before this change (111/111 and
  117/117) — this change touched docs, one test-support route and E2E only.

**Not done / open:** reference images for Projects - List / Empty State; acceptance of the Projects slice;
TD-006/007/008/010.

**Deployment/demo link:** unchanged; nothing deployed.

**Blockers:** none.

**Next three tasks:**
1. Product Owner acceptance of the Projects slice.
2. Fix TD-010 (async auth middleware error handling) and TD-008 (malformed JSON -> 4xx).
3. Next feature selection (e.g. archive/update/membership, FR-PRJ-002/003/005-007).

---

## Previous entry (dedicated E2E tester + list pagination, 2026-10-08)

### 2026-10-08 — Dedicated E2E tester, Projects list pagination, requirements-coverage review

**Branch/commit:** `main` — see the commit that contains this entry (not deployed).

**Completed work:**
- **Dedicated tester for E2E (CLAUDE.md rule 29):** `e2e/testerUser.ts` + `e2e/global-setup.ts` create the
  tester (org + trial) once per run and save the session as the default `storageState`; tests start signed in.
  Flows A-F (sign-up, trial, payment, login, QA-setup onboarding) and two Projects tests opt out with
  `test.use(NO_SESSION)` and say why. New helpers `resetTesterProjects` / `createProjectsViaApi`; new
  E2E-only, double-gated endpoint `POST /v1/test-support/reset-projects` (caller's own org only). Result: the
  Projects tests no longer sign up (about 1-2s each instead of ~5s).
- **Projects list pagination:** replaced "Load more" with Previous/Next, "Showing a-b of N projects",
  "Page X of Y" and Rows per page (10/25/50, default 10) on the approved cursor API (APID-002); the page keeps
  its cursors so Previous works; filter/search/page-size changes return to page 1. A new test caught and fixed a
  real bug (the search-debounce timer reset paging 300ms after load even when nothing was typed).
- **Requirements coverage review** (`docs/product/checkpoints/projects-list-requirements-coverage.md`): name
  search (api-spec "Search") and cursor pagination (APID-002) are covered at API level; the status filter/tabs/counts,
  QA-configuration filter, project-code search, default order and the pagination UI shape (page sizes) are NOT
  covered by any approved requirement. Proposed as **PD-069 — NOT approved**; `api/projects.md` marks them
  "pending PD-069". **Product Owner decision needed.**

**Tests actually run and results (this session, from `~/dev/testflowai`):**
- Frontend `vitest`: **111/111**; `tsc --noEmit` and `eslint` clean (includes 9 new pagination tests).
- Backend `vitest`: **117/117**; `tsc` and `eslint` clean (the test-support route has no unit test; E2E exercises it).
- E2E Playwright (headless, flows A-H): **24/24 passed**, incl. new pagination (12 projects, 10/page, Next/Previous,
  rows per page) and search-returns-to-page-1 scenarios; the sidebar-collapse test passes (E2E and 4 unit tests).
- Design conformance was not re-run for the pagination footer (it moves the list closer to the design, which shows
  rows-per-page and page controls).

**Not done / open:** PD-069 approval; reference images for Projects - List / Empty State; TD-006/007/008/010.

**Deployment/demo link:** unchanged; nothing deployed.

**Blockers:** none.

**Next three tasks:**
1. Product Owner decision on PD-069 (filters/counts/code search/page sizes) and acceptance of the Projects slice.
2. Fix TD-010 (async auth middleware error handling) and TD-008 (malformed JSON -> 4xx).
3. Next feature selection.

---

## Previous entry (responsive layout, 2026-10-08)

### 2026-10-08 — Responsive layout fix (all screens) + E2E window-size fix

**Branch/commit:** `main` — see the commit that contains this entry (not deployed).

**Problem reported:** in a visible (headed) Playwright run the pages did not fill the browser window.

**Root cause (verified by measurement, not assumed):** two separate things.
1. *Test config:* `e2e/playwright.config.ts` used the "Desktop Chrome" device preset, which pins the
   page to 1280x720 even inside a larger visible window. The app itself already filled any window
   from 900px to 2560px wide (measured: every screen's header/main reached the window's right edge,
   no horizontal scroll). Fixed: headed runs now use the real window size (page is 1440px wide on the
   1440px screen); CI/headless keeps the fixed 1280x720 for determinism.
2. *App layout below ~900px:* a real gap — authenticated screens overflowed horizontally on tablet/
   phone widths (fixed 268px sidebar; non-wrapping headers/rows). Fixed:
   - `AppSidebar` auto-collapses to its existing icon-only rail below 900px (and follows the window
     across the breakpoint; the manual toggle still works).
   - `MinimalHeader` (auth/subscription screens), the QA Setup header and its "Deterministic
     Governance" note, and the Projects status-filter row now wrap instead of overflowing.

**Tests actually run and results (this session):**
- Frontend `vitest`: **105/105** (adds 4 sidebar auto-collapse tests); `tsc --noEmit` and `eslint` clean.
- E2E Playwright (headless, flows A-H): **21/21 passed**. New `flowH-responsive-layout.spec.ts`:
  7 screens x 7 widths (375-2560px) must fill the window with no horizontal scroll; sidebar
  collapses on a narrow window and is open on a wide one.
- Headed run confirmed to use the real window size (inner width 1440 vs 1280 before).
- Backend unchanged this entry (last full run 117/117).

**Added later the same day:** E2E scenario "a registered user logs in, sees the empty state, creates
5 projects in one session and sees them all in the table" (in `flowG-projects.spec.ts`): signs up,
starts the trial and signs out, then logs in through the real login screen, opens Projects from the
sidebar, checks the empty state, creates 5 projects without logging out, and checks the table
(5 rows + header, newest first, codes PRJ-005..PRJ-001, descriptions, Standard QA v1, Active, creator,
"Showing 5 of 5 projects", tab count growing 1..5). Result: Projects spec **6/6 passed** headless
(the new test ~15s). Visible-run presets (`PW_SPEED`): extraslow 8000ms, slow 2000ms, normal 200ms,
fast 0 ms between actions — e.g. `npm run test:extraslow`.

**Not done / caveats:** the designs show a single desktop viewport, so the narrow-width behaviour
(collapsed sidebar, wrapping headers) is a sensible layout, not an approved design — Product Owner
may want to review it. Desktop (>=900px) appearance is unchanged. Design-agent conformance was not
re-run for this change.

**Environment change:** the working copy moved out of iCloud-synced `~/Documents` to
`~/dev/testflowai` (evicted placeholder files had been stalling every tool). Never use iCloud-synced
folders for this repo.

**Deployment/demo link:** unchanged; nothing deployed.

**Blockers:** none.

**Next three tasks:**
1. Product Owner acceptance of the Projects slice (see previous entry) and review of the narrow-width layout.
2. Export the Projects — List / Empty State reference images; fix TD-010 and TD-008.
3. Next feature selection.

---

## Previous entry (Projects slice, 2026-10-07)

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
