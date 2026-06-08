# Agent Instructions

This repository keeps its development process in this file. Every agent must read this document before doing work in the repo, then append to the work log whenever it changes files.

## Required Start Procedure

Before making any code, content, or configuration change:

1. Read this full `AGENTS.md` file.
2. Review the latest entries in `Development Work Log` for project context.
3. Inspect the current workspace state with `git status --short`.
4. Preserve user changes that are already present in the worktree.
5. Keep changes scoped to the user's request unless the user explicitly expands the scope.

## Required Work Log Procedure

Whenever an agent changes, creates, deletes, formats, or generates any file in this repository, it must append a new entry to `Development Work Log` before finishing.

Each entry must include:

- Date and time, including timezone when available.
- Agent or tool name if known.
- User request or instruction being handled.
- Files changed.
- What changed and why.
- Verification performed, or a clear note that verification was not run.
- Current status, such as complete, partial, blocked, or needs review.

Use this entry format:

```md
### YYYY-MM-DD HH:mm TZ - Agent Name

- Request: ...
- Files changed:
  - `path/to/file`
- Changes:
  - ...
- Verification: ...
- Status: ...
```

## Development Work Log

### 2026-06-08 17:53 +08:00 - Codex

- Request: Create or edit the agent markdown file so future agents use it as a work log and read it for context before doing new work.
- Files changed:
  - `AGENTS.md`
- Changes:
  - Added root-level agent instructions requiring every future agent to read this file before work.
  - Added an append-only development work log procedure for documenting every file update.
  - Added the first work log entry to start the project history.
- Verification: Checked the repository root, confirmed no existing agent markdown file was present, and reviewed recent git history for context.
- Status: Complete.
