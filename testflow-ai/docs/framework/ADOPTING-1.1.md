# Adopting Framework 1.1

Forward-only and non-disruptive: **nothing here asks a project to redo completed work, change
application code, or interrupt a task in progress.** Policy lives in
`docs/technical/engineering-framework.md`; this file says how to adopt it and carries the reusable
migration prompt.

## What changes in 1.1

- Three new agents: `database-architect`, `backend-reviewer`, `frontend-reviewer`.
- Design conformance is verified by the `frontend-reviewer` (inside the frontend review); the separate
  mandatory design-conformance gate is removed. The `design` agent stays for consultation,
  interpretation and handoff.
- The workflow is the 20-step vertical slice; layers a task does not touch are skipped.
- Standard Review Report, severity rules, "Independent Judgment" and "all mandatory reviews before
  commit" apply to every reviewer.

## When to adopt (forward-only)

| Situation | What to do |
|---|---|
| **New project** | Start on 1.1: copy the files listed below, then fill in the project's own profiles/decisions. |
| **Existing project, between tasks** | Adopt now, at the next safe task or feature boundary. |
| **Work in progress** | Do **not** interrupt it. The task finishes under the previously approved workflow. Adopt at its end — unless the Product Owner explicitly authorises adopting mid-task. |
| **Previously completed work** | Leave it alone: no reopening, refactoring or retrospective reviews. |
| **Customised workflow** | Keep every project-specific requirement, agent, approval gate, engineering profile and architecture decision. Merge the new agents in; do not silently replace project rules. Record any mismatch as a compatibility exception. |

## The files (what to add or merge)

1. **Add** `.claude/agents/database-architect.md`, `backend-reviewer.md`, `frontend-reviewer.md`.
2. **Merge into the project's policy document** (here `docs/technical/engineering-framework.md`): the
   *Independent Judgment* seven points, the *Engineering workflow*, *Review and correction loops*,
   *Review standards*, the agent registry table, and the DoR/DoD bullets about specialist reviews. If the
   project's policy lives elsewhere, put them there — do not create a second competing source.
3. **Edit the existing agents' hand-off wording** (`backend`, `frontend`, `reviewer`, `design`) so that
   reviews go to the specialist reviewers, design conformance to the `frontend-reviewer`, and the
   general `reviewer` is cross-cutting only. Keep everything else in those files.
4. **Update `CLAUDE.md` additively:** reword the workflow rule and the "no self-certification" rule to
   match, and add a rule pointing at the Review standards (severity rules; no commit with unresolved
   HIGH, or MEDIUM without an authorised exception). Keep the project's own rule numbering.
5. **Add the adoption record** (copy `docs/framework/VERSION.md`'s record table) with version,
   date, status, applicable agents and any compatibility exceptions.
6. Update `docs/PROJECT_STATUS.md` (or the project's equivalent) per the repository's own rules.

Not required: any application code, schema, test or configuration change.

## New-project bootstrap

Copy the whole `.claude/agents/` directory, `docs/technical/engineering-framework.md`,
`docs/framework/`, and the framework rules from `CLAUDE.md`; then record the project's criticality and
readability profile decisions, its design integration (and design registry if it uses one), and its own
adoption record. Delete nothing project-specific.

## Verification checklist

- All three agent files exist; each has frontmatter with `name` (matching the filename), `description`,
  `tools`, `model`.
- Invocation rules are stated in each agent and in the agent registry; reviewers are independent of the
  implementer and cannot modify code.
- Design conformance is owned by the `frontend-reviewer`; no separate mandatory conformance gate remains.
- `qa`, `security`, human acceptance and deployment gates are unchanged.
- Workflow wording is the same in every document that restates it (or each one points at the policy
  document).
- Any modified JSON/config (e.g. `.claude/settings.json`) still parses.
- Do not claim automated enforcement unless a hook or check was actually added and tested.

## Rollback

Everything is documentation and agent files in one commit: revert that commit. Nothing runtime depends
on it.

## Reusable migration prompt

Give this to Claude Code **inside the project that is adopting the framework**. It does not modify any
other repository.

```text
Adopt AI Software Delivery Framework version 1.1 in THIS project, forward-only and without disrupting
existing work. This is a framework-only change: do not implement or modify product functionality.

SOURCE: the framework 1.1 files are provided at: <PATH-OR-REPO-OF-FRAMEWORK-1.1>. They are:
.claude/agents/database-architect.md, backend-reviewer.md, frontend-reviewer.md;
docs/technical/engineering-framework.md (sections: Independent Judgment, Engineering workflow,
Review and correction loops, Review standards, agent registry); docs/framework/VERSION.md and
docs/framework/ADOPTING-1.1.md. Read ADOPTING-1.1.md first and follow it.

FIRST, READ THIS PROJECT (do not change anything yet): CLAUDE.md, its agent definitions, its
engineering/workflow documentation, engineering standards, review gates, Definition of Ready/Done and
PROJECT_STATUS.md (or equivalents). Establish the project's current framework version (an unnumbered
adoption of the earlier framework counts as 1.0), its criticality and code-readability profiles, its
customised agents/gates, and whether any implementation task is in progress.

TIMING: if an implementation task is in progress, do NOT interrupt it. Report that, and stop unless I
explicitly authorise adopting mid-task. Otherwise proceed.

PRESERVE: project-specific requirements, agents, approval gates, engineering profiles and
architecture decisions; the existing division of responsibility (ChatGPT = process orchestrator,
Stitch = primary UI/UX designer, Claude Code = engineering implementor, specialist agents =
independent review and verification); completed work (do not reopen it, refactor it or require
retrospective reviews). Integrate the new agents without silently replacing project rules; record any
conflict as a compatibility exception instead of resolving it unilaterally.

DO: (1) add the three agent files, adapting only project-specific names/paths; (2) merge the workflow,
review standards, Independent Judgment points and agent registry into the project's single policy
document - reference, don't duplicate; (3) update the existing backend/frontend/reviewer/design agents'
hand-off wording and CLAUDE.md additively (design conformance moves into the frontend-reviewer; the
separate conformance gate is removed; the general reviewer is cross-cutting only; QA, Security, human
acceptance and deployment gates stay intact); (4) record the adoption (framework version 1.1, date,
status, applicable agents, compatibility exceptions); (5) verify: agent frontmatter valid, wording
consistent across documents, no separate design-conformance gate left, QA/Security/human/deploy gates
intact, any edited config still parses; (6) update PROJECT_STATUS per this repository's rules with
what you actually ran; (7) commit and push per this repository's established workflow. Do not claim
automated enforcement that was not actually implemented and tested. Do not deploy. Do not touch any
other repository. STOP afterwards and report: version, files changed, verification performed,
compatibility exceptions, commit SHA and push status, remaining issues.
```
