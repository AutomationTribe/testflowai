# Coding Standards

## Code readability profile

See `docs/technical/engineering-framework.md` for what each profile means. The `frontend`,
`backend`, and `reviewer` agents read this file to know which profile to apply.

> Selected profile: **MID-LEVEL** (Product Owner decision, 2026-10-07)

### MID-LEVEL

Code should be explicit, straightforward, easy to follow and debug, conservative with
abstraction, and understandable by a competent mid-level developer without additional context.

### SENIOR

Code may use stronger abstractions, patterns, and more advanced structural approaches — but only
when justified by a real, explainable need. Readability and maintainability remain mandatory
under this profile too; cleverness for its own sake and unnecessary abstraction remain prohibited
regardless of which profile is selected.

## Existing conventions (unchanged)

These reflect decisions already made and approved for TestFlow and apply regardless of which
readability profile is eventually selected:

- Plain `pg` + hand-written SQL migrations — no ORM (AD-005).
- A custom, dependency-free inline-SVG icon set (`frontend/src/components/Icon.tsx`) instead of
  an icon library.
- A minimal, dependency-free structured JSON logger (`backend/src/lib/logger.ts`) instead of a
  logging framework, for the project's current scale (AD-012).
- Shared error envelope and cursor pagination for every API endpoint (CLAUDE.md rule 11).

See `docs/technical/engineering-framework.md`'s dependency-governance section before introducing
anything that would reverse one of the above.
