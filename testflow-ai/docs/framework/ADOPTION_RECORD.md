# Framework adoption record - TestFlow AI

| Field | Value |
|---|---|
| Framework | AI Software Delivery Framework (https://github.com/AutomationTribe/ai-software-delivery-framework) |
| Pinned version | **1.1.0** (`docs/framework/FRAMEWORK_VERSION`) |
| Pinned tag | `v1.1.0` (annotated tag object `8c3daf488c14faac6b1a8f98edc801cd7bb212a2`) |
| Pinned commit SHA | `31dd835e4854418a67b0e13b020b0a7b79c84cd2` |
| Adopted on | 2026-10-08 |
| Adoption status | **Adopted** - installed from the exact tag at a task boundary (clean tree; no implementation in progress; last commit was framework-only) |
| Applicable agents | design, database-architect, backend, backend-reviewer, frontend, frontend-reviewer, reviewer (cross-cutting only), qa, security, devops |
| Previously completed work | Not reopened; no retrospective reviews required. |
| Automated enforcement actually in place | Only the `docs/PROJECT_STATUS.md` Stop hook in `.claude/settings.json`, tested in a temporary git repo (see `docs/PROJECT_STATUS.md`). Review gates, the 20-step workflow, severity rules and acceptance/deployment gates are process rules, not tooling. Reviewers are read-only by tool allowlist; `Bash` is retained, so "do not modify code" is instruction-only. |

## Installed layout

- Canonical, not edited here: `docs/framework/POLICY.md`, `docs/framework/VERSIONING.md`, `docs/framework/FRAMEWORK_VERSION`; each `.claude/agents/<name>.md` **above** its addendum marker.
- Project-specific: `docs/framework/PROJECT_PROFILE.md`, this file, `CLAUDE.md`, and the **"PROJECT-SPECIFIC ADDENDUM (TestFlow)"** section appended below the marker line in each agent file.
- On upgrade: replace each agent file's content above the marker with the new canonical agent and keep the addendum; replace POLICY/VERSIONING/FRAMEWORK_VERSION; update this record.

## Reconciliation performed (pre-existing -> canonical)

- The framework text previously lived in project-edited copies (`.claude/agents/*.md`, `docs/technical/engineering-framework.md`, `docs/framework/VERSION.md`, `docs/framework/ADOPTING-1.1.md`), all derived from the same 1.1 change. The agents were replaced by the canonical agents plus a TestFlow addendum carrying every project-specific fact (rule references, test commands, file paths, Stitch registry, Paystack/Render/Neon context, fake-payment guard, known flaky test). The previous versions remain in git history (commit `20b02d6`).
- `docs/technical/engineering-framework.md`, `docs/framework/VERSION.md` and `docs/framework/ADOPTING-1.1.md` are **retained unchanged except for a pointer banner** (history and the Product Owner's profile decisions live there). Where they differ from `docs/framework/POLICY.md`, the canonical policy applies, except for project decisions.
- `CLAUDE.md`: project rules and numbering preserved; framework rules (20, 23, 24, 26, 28, 30) reworded only to point at the canonical policy; rule 31 added to record the pinned version.

## Compatibility exceptions

| Exception | Reason | Accepted by | Date |
|---|---|---|---|
| Agent files carry a TestFlow addendum below a marker line (canonical text above it is byte-identical to v1.1.0) | The framework installs one file per agent; project-specific rules, commands and paths must live somewhere | Recorded as an installation convention; no control weakened | 2026-10-08 |
| The previous project-edited policy document is retained beside the canonical one | Holds the Product Owner's profile decisions and history; deleting would lose project records | Recorded; no control weakened | 2026-10-08 |

## Upgrade history

| Date | From | To | Commit | Notes |
|---|---|---|---|---|
| 2026-10-07 | - | 1.0 (retroactive name) | `a7a285b` | initial, unnumbered adoption |
| 2026-10-08 | 1.0 | 1.1 (in-repo) | `20b02d6` | project-edited agents and policy |
| 2026-10-08 | 1.1 (in-repo) | 1.1.0 (canonical, tag `v1.1.0`) | see git log | independent framework installed from the exact tag |
