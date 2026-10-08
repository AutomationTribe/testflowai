# AI Software Delivery Framework — Version and Adoption Record

> **Framework note (2026-10-08):** the canonical framework policy is now `docs/framework/POLICY.md`
> (AI Software Delivery Framework 1.1.0, pinned in `docs/framework/ADOPTION_RECORD.md`). This document is
> retained as the in-repo history of the 1.0 -> 1.1 change. The pinned version and adoption record are in
> `docs/framework/ADOPTION_RECORD.md` and `docs/framework/FRAMEWORK_VERSION`.
> Where it differs from the canonical policy, the canonical policy applies, except for project decisions.

The framework's policy lives in `docs/technical/engineering-framework.md` (single source of truth),
its enforceable rules in `CLAUDE.md`, and its agents in `.claude/agents/`. This file records **which
version this project follows**, what changed between versions, and this project's adoption status.
It does not restate policy.

## Versioning rule

`MAJOR.MINOR.PATCH`.

- **MINOR** — adds or reassigns agents, gates or policies **without removing any control**; fully
  backward compatible; adopted forward-only at the next safe boundary.
- **MAJOR** — removes or weakens a control, or changes something existing projects must re-approve.
- **PATCH** — wording/clarification only; no behavioural change.

*Note on numbering:* no version number was recorded before 1.1. The framework as first adopted here
(2026-10-07) is therefore named **1.0** retroactively, purely so that upgrades have a baseline. Any
project that adopted the framework from that unnumbered baseline is treated as **1.0**. This is the
only versioning convention in the repository; nothing else was renumbered.

## Version history

### 1.1 — 2026-10-08 (minor, backward compatible)

**Change summary:** three specialist review agents are added; design conformance moves from a
separate mandatory gate into the frontend review; review reporting and severity rules are
standardised; all mandatory reviews must complete before commit; the workflow is restated as a
20-step vertical slice.

**New agents** (`.claude/agents/`):
- `database-architect` — reviews proposed schema/migration designs **before** implementation (required
  only when database structures are introduced or materially changed).
- `backend-reviewer` — independent review of Backend Engineer output before commit.
- `frontend-reviewer` — independent review of Frontend Engineer output before commit; owns **both** the
  frontend engineering review and the design conformance review (MATCH / MINOR / MATERIAL /
  PRODUCT CONFLICT) against the approved designs.

**Updated workflow:** `engineering-framework.md` → "Engineering workflow (framework 1.1)" — 20 steps;
layers a task does not touch are skipped; the separate Design Conformance gate is removed (the `design`
agent remains for consultation, interpretation and handoff); the general `reviewer` handles
cross-cutting/integration concerns only; review-and-correction loops per layer.

**Review policies** (defined once, `engineering-framework.md` → "Review standards"): Standard Review
Report (Review Scope / Verdict / Findings / Verification / Final Recommendation); severity rules
(HIGH blocks progression and commit; MEDIUM must be resolved before commit unless the authorised human
explicitly accepts an exception; LOW may be fixed or logged as technical debt); PASS WITH CHANGES does
not by itself authorise commit; reviewers must not certify tests they did not execute; reviewer
expertise is senior-level but reviews respect the project's code-readability profile; "Independent
Judgment — Evidence Over Agreement" (7 points) applies to every reviewer.

**Unchanged (explicitly):** the `qa` agent still independently validates functionality; the `security`
agent keeps its responsibility (risk-based); human/Product Owner acceptance and deployment
authorisation gates; criticality and readability profiles; project-specific decisions and rules.

**Compatibility requirements:**
- Needs the `.claude/agents/` convention (markdown + YAML frontmatter: `name`, `description`, `tools`,
  `model`) and a `CLAUDE.md` that holds the project's rules.
- Presumes a `docs/technical/engineering-framework.md` equivalent as the policy source; if a project
  keeps its policy elsewhere, apply the same changes there (see the guide).
- The `frontend-reviewer` uses the project's design integration where one exists (e.g. Stitch MCP, with
  recorded screen names/IDs) and falls back to saved reference images; a project without a design tool
  keeps its own design source and the reviewer says what it compared against.
- No application code, schema or configuration change is required.

**Adoption instructions:** `docs/framework/ADOPTING-1.1.md` (forward-only; includes the reusable
migration prompt).

### 1.0 — 2026-10-07 (baseline, named retroactively)

Initial adoption of the framework in this project (commit `a7a285b`): Frontend/Backend/Reviewer agents
alongside the existing Design/QA/Security/DevOps agents, Definition of Ready/Done, change-risk
classification, technology/dependency governance, ADR/RFC process, migration and observability
guidance, technical-debt register, forward-only adoption.

## This project's adoption record

| Field | Value |
|---|---|
| Framework version | **1.1** |
| Adopted on | 2026-10-08 |
| Adoption status | **Adopted** — applied as a framework-only change at a task boundary (the Projects slice had been accepted; no implementation in progress) |
| Applicable agents | `design`, `database-architect`, `backend`, `backend-reviewer`, `frontend`, `frontend-reviewer`, `reviewer` (cross-cutting only), `qa`, `security`, `devops` |
| Compatibility exceptions | None. Preserved as-is: PRODUCTION criticality and MID-LEVEL readability profiles; CLAUDE.md rule numbering (rules 20 and 23 reworded, rule 30 added); the Stitch design registry and approved reference images; the dedicated E2E tester rule (29); the `PROJECT_STATUS.md` Stop hook. |
| Previously completed work | Not reopened. No retrospective reviews required. |
| Automated enforcement | Only the existing `PROJECT_STATUS.md` Stop hook (unchanged). The new reviewer gates are **process rules enforced by CLAUDE.md and the agents' instructions, not by tooling** — nothing blocks a commit automatically. |
