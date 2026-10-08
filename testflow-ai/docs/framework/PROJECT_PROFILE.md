# Project profile - TestFlow AI

The framework's agents read this file to learn the project's choices and where its documents live. This
file is project-specific configuration; a framework upgrade never overwrites it. Blank means "not
applicable or not yet decided" - agents say so rather than guess.

## Profiles (chosen by the human - agents never choose these)

| Profile | Selected | Decided by / date |
|---|---|---|
| Project criticality | **PRODUCTION** | Product Owner, 2026-10-07 |
| Code readability | **MID-LEVEL** | Product Owner, 2026-10-07 |

Meanings: `docs/framework/POLICY.md` ("Project profiles"). The project's own record of these decisions is in
`docs/technical/engineering-framework.md` and `docs/technical/coding-standards.md`.

## Where things live

| What | Location |
|---|---|
| Requirements | `docs/product/functional-requirements.md` (+ `docs/product/`) |
| Product decisions | `docs/product/product-decisions.md` |
| Architecture / technology decisions | `docs/technical/architecture-decisions.md`, `docs/technical/architecture.md` |
| Database design and decisions; schema | `docs/technical/database.md`, `docs/technical/database-decisions.md`, `docs/technical/schema.sql` |
| API conventions and decisions | `docs/technical/api-spec.md`, `docs/technical/api-decisions.md` |
| API contract file | `docs/technical/api/openapi.yaml` |
| Security documentation | `docs/technical/security.md` |
| Coding standards (readability profile) | `docs/technical/coding-standards.md` |
| ADR directory | `docs/decisions/` (format: `docs/decisions/README.md`) |
| Technical-debt register | `docs/technical/technical-debt.md` |
| Status log | `docs/PROJECT_STATUS.md` |
| Testing strategy | `docs/technical/testing.md` |
| Deployment | `docs/technical/deployment.md`, `render.yaml` |
| Design tool and project | Google Stitch (project ID recorded in `docs/design/stitch-registry.md`) |
| Design registry (approved screen names <-> screen IDs) | `docs/design/stitch-registry.md` |
| Saved reference images of approved designs | `docs/design/approved/` |
| Design handoffs | `docs/design/handoffs/` |
| Design system / tokens | `docs/design/design-system.md`, `frontend/src/styles/tokens.css` |
| Project-specific framework policy detail (pre-adoption record) | `docs/technical/engineering-framework.md` (retained; canonical policy is `docs/framework/POLICY.md`) |

## How things run (from the project root, `testflow-ai/`)

| What | Command / procedure |
|---|---|
| Install dependencies | `npm install` |
| Typecheck / lint | `npm run typecheck`, `npm run lint` |
| Backend tests | `npm run test --workspace backend` (needs local Postgres: `docker compose up -d`) |
| Frontend tests | `npm run test --workspace frontend` |
| End-to-end tests | `npm run test:e2e:smoke`, `:critical`, `:regression`, `npm run test:e2e:normal` (`:slow`/`:fast`); headless `CI=true npm run test:e2e`; tags `@smoke` `@critical` `@regression` |
| Visual regression | `npm run test:visual` (not wired into CI) |
| Deploy | Not authorised unless the Product Owner says so in the current conversation; see `docs/technical/deployment.md` |

## Stack (informational - agents inspect the repository rather than trust this)

Next.js frontend, Node.js/TypeScript (Express) modular-monolith backend, PostgreSQL; GitHub Actions CI;
planned hosting on Render with a Neon PostgreSQL database.
