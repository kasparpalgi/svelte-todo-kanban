# Multi-assignee follow-up

## Original Requirement

[NEVER REMOVE]

Follow-up to #130 (assign todos to multiple users). Three leftover items:

1. **Assignee avatars on board cards** — assignees are only visible in the open card
   detail (`CardAssignee.svelte`). Show the assignee avatar stack (with overflow `+N`) on
   the kanban card itself (`src/lib/components/todo/TodoItem.svelte`). `todo.assignees[]`
   is already loaded via the `TodoFields` fragment.
2. **Verify 2+ assignees end-to-end** — the #130 browser QA board had a single member, so
   only single-assignee toggling was clicked through (multi-assignee logic is unit-tested).
   Verify on a board with multiple members that assigning several users works, the avatar
   stack + count render, and the primary invariant holds (`todos.assigned_to` always points
   at one of `todo_assignees`; removing the primary promotes a remaining assignee).
3. **Webhook notifies all assignees** — `src/routes/api/github/webhook/+server.ts`
   `notifyUser()` notifies only the primary (`assigned_to`) or board owner. Notify **every**
   assignee (dedupe, never the triggering user), matching comment-notification fan-out. Add
   `assignees { user_id }` to `GET_TODO_BY_GITHUB_ISSUE`.

Context: junction table `todo_assignees` is the source of truth; `todos.assigned_to` is the
primary, kept in sync by `assignUser`/`unassignUser` in `src/lib/stores/todos.svelte.ts`.
Migration `hasura/migrations/default/1798000000000_create_todo_assignees_table` is applied.

_GitHub issue #179 — end the commit subject with `(#179)`._
