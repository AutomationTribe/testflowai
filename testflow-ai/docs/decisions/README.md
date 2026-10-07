# ADR / RFC Process

A lightweight record of meaningful technical decisions — introduced as part of the 2026-10-07
engineering-framework adoption (see `docs/technical/engineering-framework.md`). This process is
for cross-cutting decisions; it does not replace the existing per-domain decision logs:

- `docs/technical/architecture-decisions.md` — architecture/technology decisions
- `docs/technical/database-decisions.md` — database decisions
- `docs/technical/api-decisions.md` — API convention decisions
- `docs/product/product-decisions.md` — product decisions

Use an ADR here when a decision is genuinely cross-cutting, significant, or difficult/expensive
to reverse, and doesn't fit cleanly into one of the logs above — e.g. a decision that spans
architecture and product, or a new process/tooling decision like this framework adoption itself.
When a decision fits cleanly into one of the existing logs, record it there instead, using that
log's own format, to avoid two conflicting sources of truth for the same kind of decision.

**Use an ADR for:** significant architecture changes, major technology adoption, important
data-model decisions, significant integration decisions, major deployment/infrastructure changes,
decisions that are difficult or expensive to reverse.

**Do not require an ADR for:** trivial implementation details, anything already covered by an
existing approved decision, or routine work that doesn't change a standing decision.

## Format

Create `docs/decisions/NNNN-short-title.md` (four-digit sequence, e.g. `0001-...`):

```markdown
# NNNN — Title

**Status:** Proposed | Approved | Superseded by NNNN

**Context:** What prompted this decision — the problem, constraint, or question.

**Decision:** What was decided.

**Reason:** Why this option, in terms of the actual requirements/constraints involved.

**Alternatives considered:** What else was weighed, and why it wasn't chosen.

**Consequences:** Benefits, trade-offs, and any future implications worth flagging.
```

This mirrors the format already used in `docs/technical/architecture-decisions.md` and
`docs/technical/database-decisions.md` so the project has one consistent decision-record shape
across all of these logs.
