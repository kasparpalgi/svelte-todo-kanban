> Run with: Opus 4.8 / high

# Assign to multiple users

## Original Requirement

[NEVER REMOVE]

Think and implement

_From Kanban card `1f04acfb-2af0-48c9-b10c-95b9756c7c96`, moved to the agent list._

_GitHub issue #130 — end the commit subject with `(#130)`._

---

## Analysis

Currently a todo has a **single** assignee: `todos.assigned_to uuid → users(id)` with an
`assignee` object relationship. Goal: let a todo be assigned to **multiple** users.

There is already a clean many-to-many precedent: `todo_subscribers (todo_id, user_id)` with
a `subscribers` array relationship + `subscriber`/`todo` object relationships and
`SUBSCRIBE_TO_TODO`/`UNSUBSCRIBE_FROM_TODO` mutations. I'll mirror it exactly.

**Design decision:** introduce a `todo_assignees (todo_id, user_id, created_at)` junction
table as the **sole source of truth**, backfill from `assigned_to`, then **drop the
`assigned_to` column** and its `assignee` object relationship. Dual source-of-truth (a
column + a junction) causes staleness bugs, so we remove the column.

### Readers of `assigned_to` / `assignee` to migrate
- `src/lib/components/todo/CardAssignee.svelte` — the assign UI (already a checkbox dropdown)
- `src/lib/components/todo/CardSubscribers.svelte` — excludes the single assignee
- `src/lib/stores/todos.svelte.ts` — optimistic create sets `assigned_to`; activity-log branch
- `src/lib/stores/todoFiltering.svelte.ts` — `assignedToMe` / `assignedTo` filters
- `src/lib/stores/comments.svelte.ts` — notifies the single assignee on new comment
- `src/routes/api/github/webhook/+server.ts` — `notifyUser` targets `assigned_to`
- `src/lib/graphql/documents.ts` — `TodoFields` fragment + `GET_TODO_BY_GITHUB_ISSUE`

### Environment note
Local dev Hasura (docker, port 3001) had no app tables tracked (only auth). `config.yaml`
+ `.env` point codegen at production. Plan: bring local dev up to date via the documented
docker-reset flow, apply the new migration locally, and run codegen against **local**
(`PUBLIC_API_ENV=development`) so nothing touches production. The migration + metadata land
in the repo for the deploy pipeline to apply to production.

## Implementation Plan
1. Bring local dev Hasura up to date (migrations + metadata) as codegen target.
2. Migration `create_todo_assignees_table`: create junction table + indexes + backfill from
   `assigned_to`; then drop `todos.assigned_to`. Down: re-add column, backfill first assignee, drop table.
3. Metadata: track `todo_assignees` (`public_todo_assignees.yaml`, perms mirror subscribers);
   add `assignees` array relationship on `todos`; remove `assignee` object rel + `assigned_to`
   from todos column perms.
4. `documents.ts`: replace `assigned_to`/`assignee` in `TodoFields` with `assignees { user_id, assignee { ... } }`;
   add `ASSIGN_USER_TO_TODO` / `UNASSIGN_USER_FROM_TODO` mutations; fix `GET_TODO_BY_GITHUB_ISSUE`. Run codegen.
5. Store `todos.svelte.ts`: add `assignUser`/`unassignUser` (optimistic, mirror subscribe);
   drop `assigned_to` from `updateTodo`/`addTodo`; move assign/unassign activity logging into the new methods.
6. `todoFiltering.svelte.ts`, `comments.svelte.ts`, webhook: read `assignees[]`.
7. UI: `CardAssignee.svelte` → multi-select toggling junction rows + notification per newly-added user;
   `CardSubscribers.svelte` → exclude all assignees; show assignee avatars/count.
8. i18n keys (en/et/cs). Tests. `npm run check` + `npm test`.

## Progress Log
- Explored codebase, confirmed subscribers pattern, wrote plan.
- Decisions (via user): apply migration to remote Hasura via CLI; **keep `assigned_to` as the
  primary assignee** and add `todo_assignees` for the full set (not a column drop).
- Migration `1798000000000_create_todo_assignees_table` written + applied to remote; metadata
  (`public_todo_assignees.yaml`, `assignees` array rel on todos) applied. Verified live via
  introspection: `todos.assignees` + `todo_assignees` type + mutations exist.
- `documents.ts`: added `assignees { user_id created_at assignee {…} }` to `TodoFields`;
  added `ASSIGN_USER_TO_TODO` / `UNASSIGN_USER_FROM_TODO`. Ran `npm run generate` (against
  remote) — types regenerated OK.
- Store: `assignUser` / `unassignUser` (optimistic, maintain `assigned_to` primary + activity
  log); `addTodo` seeds creator into `assignees` and persists the junction row.
- `todoFiltering`: assignment filters match the full `assignees[]` set. `comments`: comment
  notifications now go to **every** assignee (deduped with subscribers). Webhook unchanged
  (still uses the maintained `assigned_to` primary).
- UI: `CardAssignee` is now a multi-select with avatar stack + count; `CardSubscribers`
  excludes all assignees. i18n keys added (en/et/cs): `todo.assigned_success`,
  `todo.no_board_members`.
- Tests: added assignUser/unassignUser store tests + multi-assignee filtering tests. Updated
  mock factories with `assignees: []`.

## Results
- `npm run check`: **10 errors / 6 warnings — identical to clean `main` baseline** (verified by
  git-stash). Zero new type errors introduced; all pre-existing errors are in unrelated
  og-image/screenshot routes + partial test mocks.
- `npx vitest run src/lib/stores/__tests__/`: **94 passed** (incl. new assign/unassign +
  filtering tests).
- Semantics: `todo_assignees` = complete assignee set (source of truth for filtering/notify);
  `todos.assigned_to` = primary assignee, kept in sync by the store (first assignee added
  becomes primary; removing the primary promotes the next remaining one).
- Not done: live browser walkthrough (would need dev server + auth against prod Hasura);
  static compile (svelte-check) + unit tests cover the changed code.
