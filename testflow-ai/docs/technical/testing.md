# Testing Strategy

This document is the reusable, project-level testing standard referenced by CLAUDE.md rule 19/20.
It's intended to persist across slices and sessions, not just describe Slice 1.

## Layers

| Layer | Tool | Location | Purpose |
|---|---|---|---|
| Unit | Vitest | `backend/tests/`, `frontend/tests/` | Fast, isolated checks of a single function/component/module. |
| API/integration | Vitest + Supertest | `backend/tests/` | Real HTTP requests against `createApp()`, real Postgres — status codes, error envelope, tenant isolation, auth. |
| UI/E2E | Playwright | `e2e/tests/` | Full browser, real frontend + backend + database, critical user journeys end-to-end. |

## Unit-test requirement (CLAUDE.md rule 19)

Every implementation, change, or bug fix — frontend or backend — must include appropriate unit
tests, covering:
- all new functionality
- existing functionality when modified
- bug fixes (the test must reproduce the original bug's conditions, not just assert the fix works)

Work is not complete until its unit tests have been **run**, and the results **reported**
(pass/fail/count) — not merely written.

## Implementation agents and independent review

Implementation itself is owned by the `frontend` (`.claude/agents/frontend.md`) and `backend`
(`.claude/agents/backend.md`) agents, each of which writes and runs its own unit/integration
tests but must never certify its own work complete or correct. Independent review is by the
specialist reviewers, **before commit**: the `backend-reviewer` for backend work, the
`frontend-reviewer` for frontend work (engineering review plus design conformance against the
approved designs), the `database-architect` for database design (before implementation), and the
general `reviewer` for cross-cutting concerns. Each returns the Standard Review Report (PASS / PASS
WITH CHANGES / BLOCKED, with HIGH/MEDIUM/LOW findings); a reviewer must not certify tests it did not
execute. These all run before QA and Security. See `docs/technical/engineering-framework.md`
("Engineering workflow", "Review standards") for the full workflow these agents sit inside.

## QA agent workflow

After an implementation or fix is completed, Claude invokes the `qa` subagent
(`.claude/agents/qa.md`) before considering the work done. The user can also invoke it manually
by saying "QA". See that file for its full responsibilities; in short, it:

- verifies the implementation against the actual requirement, not its own assumption
- creates/updates API and UI/E2E tests as needed (without duplicating unit-test coverage)
- runs the appropriate existing test suites
- verifies positive/negative scenarios, validation, auth/authz, and tenant isolation
- classifies E2E tests `@smoke` / `@critical` / `@regression` and reports against those categories
- returns a QA report ending in `QA STATUS: PASS | FAIL`

## Test classifications (E2E)

Playwright tests are tagged via the `tag` test option:

```ts
test('...', { tag: ['@critical', '@smoke'] }, async ({ page }) => { ... });
```

- `@smoke` — smallest set proving the system is alive. Run constantly, fast.
- `@critical` — a critical user journey. Must maintain **permanent** E2E coverage.
- `@regression` — proves a specific past bug/edge case stays fixed.

## Running tests

```bash
# Fast checks
npm run typecheck
npm run lint

# Unit/integration
npm run test --workspace backend    # needs local Postgres: docker compose up -d
npm run test --workspace frontend
npm run test                        # both, from repo root

# E2E — developer default is HEADED, at normal speed
npm run test:e2e:normal             # headed, normal speed
npm run test:e2e:slow               # headed, slower (slowMo) — good for watching/debugging
npm run test:e2e:extraslow          # headed, slowest (slowMo) — deliberate step-by-step observation
npm run test:e2e:fast               # headed, no slowMo — fastest headed run

# E2E — by classification (headed by default too; add CI=true for headless)
npm run test:e2e:smoke
npm run test:e2e:critical
npm run test:e2e:regression

# E2E — full suite, headless (what CI runs)
CI=true npm run test:e2e
```

Playwright's `headless` mode is derived from the `CI` environment variable
(`e2e/playwright.config.ts`) — GitHub Actions sets `CI=true` automatically, so CI never needs an
explicit flag, and a developer running any of the above locally sees the real browser by default.

## Evidence on UI-test failure

`e2e/playwright.config.ts` captures, on failure only:
- **Screenshot** (`screenshot: 'only-on-failure'`)
- **Trace** (`trace: 'retain-on-failure'`) — open with `npx playwright show-trace <path>`
- **Video** (`video: 'retain-on-failure'`)

Artifacts land under `e2e/test-results/`; a full HTML report (`e2e/playwright-report/`) is
generated and uploaded as a CI artifact on failure (see `.github/workflows/ci.yml`).

## Backend test database isolation

Backend tests run only against a dedicated local `*_test` database (default `testflow_test`, created by
`backend/tests/globalSetup.ts`; override with `TEST_DATABASE_URL`). `backend/tests/testDatabaseGuard.ts`
refuses destructive operations unless the host is local, the database name ends in `_test` and `NODE_ENV` is
not `production`; it is checked in global setup, in `setupTestDatabase` and in `resetTestDatabase`, and is itself
unit-tested. A session-level Postgres advisory lock allows one run per test database at a time: a concurrent run
fails immediately instead of corrupting the other (the suite truncates all tables between tests). The dev
database (`testflow`) and the E2E database (`testflow_e2e`, rebuilt by `e2e/prepare-db.js`) are never used by it.

## Known flaky test

`backend/tests/bruteForce.test.ts` uses a fixed test email shared across its three cases and is
DB-state-dependent (`login_attempts` table). Running it back-to-back across separate manual
`vitest run` invocations in rapid succession can occasionally leave residual lockout state from an
aborted prior run. If it fails, re-run it in isolation before treating it as a real regression —
see the `qa` agent's guidance on this.

## Design agent workflow (handoff) and design conformance

When an approved design (e.g. a Google Stitch export) exists for a screen, Claude invokes the
`design` subagent (`.claude/agents/design.md`) for a **handoff** before implementation (layout,
components, states, interactions, and an explicit split between real product behaviour and
decorative/sample content); the user can also invoke it by saying "Design" for consultation or
interpretation. **Design conformance is verified by the `frontend-reviewer`** as part of its
pre-commit review — it is not a separate gate — using the method documented in `design.md`
(screenshot comparison; differences classified `MATCH` / `MINOR` / `MATERIAL` / `PRODUCT CONFLICT`;
MATERIAL and PRODUCT CONFLICT must be reported before the feature is accepted, never silently
resolved in either direction). See `docs/technical/design-handoff.md` for the underlying
design-to-code conversion contract the handoff format extends.

## Visual regression testing

A separate Playwright config, `e2e/playwright.visual.config.ts`, adds pixel-comparison visual
regression on top of the existing functional E2E suite — deliberately isolated from it:

- Specs live under `e2e/tests/visual/*.visual.spec.ts` and are excluded from the default
  `playwright.config.ts` (`testIgnore: [/visual\//]`), so adding visual coverage never changes what
  `npm run test:e2e` or CI's `e2e` job runs.
- Fixed 1440×900 viewport, animations disabled, `maxDiffPixels: 150` (an **absolute** pixel count,
  not a ratio — a 1% ratio tolerance at this viewport is ~13,000px, large enough that a verified
  one-word heading change passed silently under it during setup; don't revert to a ratio without
  re-verifying the same way).
- Baselines are OS/font-rendering-sensitive and are **not** wired into CI — generating/reviewing a
  baseline is a deliberate local action by whoever owns that screen's visual conformance.

```bash
npm run test:visual             # run visual suite against existing baselines
npm run test:visual:update      # regenerate baselines (review the diff before committing)
```

A foundation example lives at `e2e/tests/visual/login.visual.spec.ts` (the Login screen — chosen
because it has zero dynamic content, so it needs no masking). It does not establish a baseline for
any other screen; adopting visual regression for a given screen is a deliberate per-screen decision
— see the `design` agent for the masking/stable-region conventions to use when a screen does have
dynamic content.

## Coverage boundary

Avoid unnecessarily duplicating unit-test coverage at the integration/E2E layer. If a rule is
already thoroughly proven at the unit level (a pure validation function, a calculation), the
API/E2E test for that same change should verify the *integration* — the right status code, the
right UI state — not re-prove the underlying logic a second time.

## E2E default user: the dedicated tester

Playwright tests (`e2e/`) start signed in as one dedicated tester account, so most tests do not sign
up first (CLAUDE.md rule 29).

- `e2e/testerUser.ts` — the account's credentials (throwaway, for the disposable `testflow_e2e` database).
- `e2e/global-setup.ts` — after the servers are up and the database is rebuilt, signs the tester up (or logs
  in if it exists), starts the trial, and saves the session to `e2e/.auth/tester.json` (git-ignored).
- `playwright.config.ts` — uses that file as the default `storageState`.
- Opt out with `test.use(NO_SESSION)` (from `tests/helpers.ts`) only for tests about creating or entering an
  account or needing a signed-out/unsubscribed browser: flows A–F (sign-up, trial, payment, login, QA-setup
  onboarding) and the "no subscription" and "registered user logs in" Projects tests. Say why in a comment.
- Need a clean data state? Call `resetTesterProjects(page)` (E2E-only endpoint `POST /v1/test-support/reset-projects`,
  double-gated like the payment simulator: `E2E_FAKE_PAYMENTS=true` and never production) and create bulk data with
  `createProjectsViaApi(page, names)`.
- Do not sign the shared tester out inside a test that uses the saved session — that would end the session for
  every later test. Tests that log in or out use `NO_SESSION` and their own session.
- Visible-run speed presets (`PW_SPEED`): `extraslow` 8000 ms, `slow` 2000 ms, `normal` 200 ms, `fast` 0 ms
  between actions.
