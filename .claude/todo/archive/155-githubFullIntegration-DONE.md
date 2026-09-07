> Run with: Sonnet 5 / medium

# Github full integration

## Original Requirement

[NEVER REMOVE]

Commit, notifications, comment, edit, change priority. If exists in our DB then don't duplicate from Github.

_From Kanban card `572843bd-ceec-49a4-9f02-c0191df16826`, moved to the agent list._

## Plan

Audited the existing GitHub integration (`src/routes/api/github/webhook/+server.ts`,
`src/lib/stores/todos.svelte.ts`, `src/lib/graphql/documents.ts`, `hasura/migrations/**`)
against the requirement: **commit, notifications, comment, edit, change priority — and
don't duplicate from GitHub if it already exists in our DB.**

Findings:
1. Comments and issue edit/close/reopen sync already work both ways (Phase 1-3, task 128).
2. Commit activity logging is **broken**: it calls `CREATE_ACTIVITY_LOG` with a `metadata`
   key that doesn't exist on `activity_logs` (column is `changes`), omits the NOT NULL
   `user_id`, and uses `action_type: 'github_commit'` which isn't in the DB check
   constraint — every commit webhook call throws server-side.
3. Priority is not synced in either direction: local priority changes never touch GitHub
   labels, and GitHub `labeled`/`unlabeled` issue events aren't handled at all.
4. No notifications are created for anything that originates from GitHub (comments,
   edits, close/reopen, priority, commits) — only in-app actions notify.
5. Duplicate-prevention exists for comments (`GET_COMMENT_BY_GITHUB_ID`) but not for
   commit activity logs (webhook retries would double-log the same commit).

Scope for this pass:
- [x] Migration: add `github_commit` to `activity_logs_action_type_check`.
- [x] Fix webhook's `CREATE_ACTIVITY_LOG` calls: use `changes` (not `metadata`), always
      pass a real `user_id`, dedupe commit logs by `commit_sha` already present in `changes`.
- [x] Priority sync GitHub → App: handle `labeled`/`unlabeled` issue actions, map
      `priority: high|medium|low` labels to `todos.priority`, log activity + notify.
- [x] Priority sync App → GitHub: `syncTodoToGithub` sends label diff to `update-issue`
      when `priority` changes; `update-issue` endpoint accepts/sets `labels`.
- [x] Notifications for GitHub-originated events: comment created/edited/deleted, issue
      edited, closed/reopened, priority changed — sent to `assigned_to` (or board owner),
      never to the mapped GitHub user themselves (self-notify not possible from webhook
      anyway since `triggered_by_user_id` is null for unmapped GitHub actors).
- [x] `npm run check` — clean on every file touched by this task (pre-existing, unrelated
      errors remain in `Line.svelte`, `penon/+page.svelte`, `podcasts/+page.svelte`, etc.
      from missing npm packages — see `007-npmCheckFix.md`).
- [x] `npm run test:unit:server` — 145/145 pass. Client-project tests
      (`test:unit:server` counterpart) and e2e couldn't run in this environment: the
      Playwright Chromium binary isn't installed here (`npx playwright install` needed) —
      pre-existing, unrelated to this change.
- Migration is written but **not applied** to the remote Hasura instance
  (`hasura/config.yaml` points at `todzz.admin.servicehost.io`) — needs explicit
  go-ahead before running `hasura migrate apply`/`metadata apply` against it.

## Result

Implemented. Files changed:
- `hasura/migrations/default/1793000000000_add_github_commit_action_type/{up,down}.sql` (new)
- `src/lib/graphql/documents.ts` — `GET_TODO_BY_GITHUB_ISSUE` now fetches `priority`,
  `assigned_to`, `board.user_id`; `GET_COMMENT_BY_GITHUB_ID` now fetches `user_id`; new
  `GET_ACTIVITY_LOG_BY_COMMIT_SHA` query for dedup.
- `src/routes/api/github/webhook/+server.ts` — fixed the broken `CREATE_ACTIVITY_LOG`
  calls (`metadata` → `changes`, added required `user_id`), added `labeled`/`unlabeled`
  handling to sync `priority: high|medium|low` labels ↔ `todos.priority`, added
  notifications for edits/priority/comments (create/edit/delete), deduped commit
  activity logs by SHA, replaced a string-interpolated GraphQL query with variables.
- `src/routes/api/github/update-issue/+server.ts` — accepts `priority`, diffs the
  issue's current labels against the new priority label instead of clobbering unrelated
  labels.
- `src/lib/stores/todos.svelte.ts` — `syncTodoToGithub` now includes `priority` in the
  diff it sends to `update-issue`.
- `src/lib/components/activity/BoardActivityList.svelte` + `src/lib/locales/{en,et,cs}/common.json`
  — render/describe the `github_commit` activity type.

Not done (out of scope for this pass, flagged for a follow-up task):
- Auto-creating a todo when a brand-new issue is `opened` on GitHub (still one-way:
  app → GitHub for issue creation).
- Branch filtering for commit logging is still hardcoded to `main`/`master`.

