# Session continuity and macOS local workspace policy

These rules are mandatory for projects adopting the framework. They supplement the canonical delivery policy and must be copied into each project's `CLAUDE.md` during adoption or upgrade.

## Continuous handoff

- Maintain `docs/HANDOFF.md` as the **current restart guide** for Claude Code, independent of account or conversation history. `docs/PROJECT_STATUS.md` remains the historical progress log; do not replace it.
- Update the handoff after every substantial coding task, at the end of every active development day, and **before** changing Claude accounts, ending a session, or approaching context/usage limits. If a session is interrupted unexpectedly, reconstruct it from git and project files at the start of the next session. Review continuity weekly when active.
- Do not wait for an exact token threshold; proactively checkpoint when a limit is foreseeable. Never claim that the handoff was saved if it was not written to disk.
- Include: timestamp; repository and local workspace; branch and HEAD SHA; working tree/stash/untracked state; active objective and feature slice; completed work and evidence; test commands/results; decisions and approvals; blockers and risks; pending PRs and deployment state; **precise next three steps**, commands and relevant file paths; and any required human decision. Never include credentials, tokens, secret values or private customer data.
- At the start of a new Claude Code session/account, read `CLAUDE.md`, `docs/HANDOFF.md`, `docs/PROJECT_STATUS.md`, the project profile, and git status/log; reconcile stale or contradictory details with the repository before making changes. Do not assume that a different Claude account remembers previous chats.
- A handoff update is a documentation operation, **not** permission to commit, push, merge or deploy; obey project approval gates. If changes cannot be committed, keep the local handoff current and report its uncommitted state.

## macOS: never develop inside iCloud-synced directories

- For development on macOS, use a **non-iCloud local workspace**, preferably `~/dev/<project>`. Do not clone, initialize, install dependencies, run builds, create databases, or place caches, virtual environments, containers' bind-mounted data or generated artifacts in iCloud Drive, Desktop or Documents **when those folders are iCloud-synced**, or any other cloud-synced folder.
- Before creating a workspace or installing project tools, check that the target path is outside iCloud synchronization. Do not assume `~/Documents` or `~/Desktop` is local-only.
- Prefer toolchain/package-manager caches and temporary files on local non-synced storage. Keep Docker bind mounts and persistent database data outside synchronized directories.
- If a project currently resides in an iCloud-synced path, stop new installs/builds there; propose a safe move or fresh clone into `~/dev`. Preserve uncommitted work and stashes; do not delete or relocate files without authorization.
- This policy concerns development workspaces and generated data, not ordinary intentional document sharing or source-control remotes.
