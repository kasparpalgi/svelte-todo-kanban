> Run with: Opus 5.5 / high

# Data API: cards, comments, uploads, activity, notifications (+ boards.changed_at)

## Original Requirement

[NEVER REMOVE]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`, section 3. Needs `dataApiBoards` first. If it
does not fit one session, ship the read path (GetTodos, GetTodoDetails, the poll) first and
file the write path as its own follow-up.

1. Ops for GetTodos, GetTodoDetails, SearchTodoContent, GetBoardTodosFingerprint,
   CreateTodo, UpdateTodos, DeleteTodos, UpdateTaskFilePath, GetTodoById, AssignUserToTodo,
   UnassignUserFromTodo, AddTodoLabel, RemoveTodoLabel, SubscribeToTodo,
   UnsubscribeFromTodo, GetTodoSubscribers, comments (GetComments, GetCommentsAggregate,
   Create, Update, Delete), CreateUpload, DeleteUpload, GetActivityLogs,
   CreateActivityLog, notifications (Get, Create, Update, MarkAsRead, Delete). The stores:
   `todos.svelte.ts`, `comments.svelte.ts`, `activityLog.svelte.ts`,
   `notifications.svelte.ts`.
2. **Activity logs and notifications are written by the server** inside the op that causes
   them, instead of the browser sending a second request (today anyone can create a
   notification for anyone).
3. **`boards.changed_at`**: a Hasura migration adds the column, and every card op bumps it.
   The `poll` op then compares one value instead of the per-card fingerprint, which read
   ≈ 1,500 rows per poll on a 334-card board and would use most of D1 Free's 5M reads a day
   later. Keep the fingerprint only as a fallback until this ships.
4. Keep `todos.svelte.ts`'s in-flight-write guard (#223, #225) intact.

**Done when (deploy + live check):** check and tests pass; e2e `card-detail`,
`todo-drag-reorder` and `todo-long-title` pass. Deployed to Vercel and the Worker. Live on
`/en/test/tests-board`: create, edit, drag, complete and delete a card; assign; label;
comment, edit, delete; attach an image; a second tab sees the change within one poll. The
board load makes no request to Hasura.

_GitHub issue #229 — end the commit subject with `(#229)`._
