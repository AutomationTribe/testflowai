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

## Known flaky test

`backend/tests/bruteForce.test.ts` uses a fixed test email shared across its three cases and is
DB-state-dependent (`login_attempts` table). Running it back-to-back across separate manual
`vitest run` invocations in rapid succession can occasionally leave residual lockout state from an
aborted prior run. If it fails, re-run it in isolation before treating it as a real regression —
see the `qa` agent's guidance on this.

## Coverage boundary

Avoid unnecessarily duplicating unit-test coverage at the integration/E2E layer. If a rule is
already thoroughly proven at the unit level (a pure validation function, a calculation), the
API/E2E test for that same change should verify the *integration* — the right status code, the
right UI state — not re-prove the underlying logic a second time.
