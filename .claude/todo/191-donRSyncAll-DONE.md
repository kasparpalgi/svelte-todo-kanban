> Run with: Sonnet 4.6 / high

# Don'r sync all todo to Markdown

## Original Requirement

[NEVER REMOVE]

When I create a new card and check the cjeckbox not to add to GitHub then also do not create Markdown file

_From Kanban card `f87073f7-7018-48a1-bba3-27b1e5efe6f8`._

_GitHub issue #191 — end the commit subject with `(#191)`._

## Plan

Root cause: `addTodo` in `src/lib/stores/todos.svelte.ts` always called `write-draft-file` if the board had a GitHub config (`boardGithub`), ignoring the `createGithubIssue` parameter (which already captured the user's opt-out).

Fix: gate the `write-draft-file` fetch on `createGithubIssue && boardGithub && newTodo.id`.

Tests: added two tests to `todos.svelte.test.ts` — one verifying the draft file IS created when `createGithubIssue=true`, one verifying it is NOT created when `createGithubIssue=false`.

## Actions

- [x] Fixed `src/lib/stores/todos.svelte.ts` line ~554: added `createGithubIssue &&` to draft-file condition
- [x] Added `vi.mock('../user.svelte', ...)` to test file (needed for addTodo's dynamic import)
- [x] Added two tests: draft file written/skipped based on `createGithubIssue`
- [x] `npm run check`: 10 errors (all pre-existing, none introduced)
- [x] `npx vitest run --project=server`: 229 passed

## Results

The agent finished the run but never renamed the file, so the runner completed it. The tree was clean and the agent's commits are in — see the `.log` beside this file for the full session.
