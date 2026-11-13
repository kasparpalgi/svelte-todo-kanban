> Run with: Opus 5.5 / high
> Machine: mac

# Data API: cards, comments, uploads, activity, notifications (+ boards.changed_at)

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# Data API: cards, comments, uploads, activity, notifications (+ boards.changed_at)

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`, section 3. Needs `dataApiBoards` first. If it does not fit one session, ship the read path (GetTodos, GetTodoDetails, the poll) first and file the write path as its own follow-up.

1. Ops for GetTodos, GetTodoDetails, SearchTodoContent, GetBoardTodosFingerprint, CreateTodo, UpdateTodos, DeleteTodos, UpdateTaskFilePath, GetTodoById, AssignUserToTodo, UnassignUserFromTodo, AddTodoLabel, RemoveTodoLabel, SubscribeToTodo, UnsubscribeFromTodo, GetTodoSubscribers, comments (GetComments, GetCommentsAggregate, Create, Update, Delete), CreateUpload, DeleteUpload, GetActivityLogs, CreateActivityLog, notifications (Get, Create, Update, MarkAsRead, Delete). The stores: `todos.svelte.ts`, `comments.svelte.ts`, `activityLog.svelte.ts`, `notifications.svelte.ts`.
2. **Activity logs and notifications are written by the server** inside the op that causes them, instead of the browser sending a second request (today anyone can create a notification for anyone).
3. `boards.changed_at`: a Hasura migration adds the column, and every card op bumps it. The `poll` op then compares one value instead of the per-card fingerprint, which read ≈ 1,500 rows per poll on a 334-card board and would use most of D1 Free's 5M reads a day later. Keep the fingerprint only as a fallback until this ships.
4. Keep `todos.svelte.ts`'s in-flight-write guard (#223, #225) intact.

**Done when (deploy + live check):** check and tests pass; e2e `card-detail`, `todo-drag-reorder` and `todo-long-title` pass. Deployed to Vercel and the Worker. Live on `/en/test/tests-board`: create, edit, drag, complete and delete a card; assign; label; comment, edit, delete; attach an image; a second tab sees the change within one poll. The board load makes no request to Hasura.

*GitHub issue #229 — end the commit subject with* `(#229)`*.*

_From Kanban card `55368534-884f-41e3-98fd-1cf7d337989b`, moved to the agent list._

_GitHub issue #229 — end the commit subject with `(#229)`._

## Results

**Summary** — Cards, comments, uploads, activity and notifications now go through
`POST /api/data/<op>`. The browser sends no card GraphQL. Shipped in `4b9b015` plus a
follow-up commit, live on www.todzz.eu (Vercel) and on the Worker.

- **22 new ops** in `src/lib/server/ops/`:
  - `todos.ts`: getTodos, getTodo, searchTodos, createTodo, updateTodo, deleteTodo
  - `cardPeople.ts`: assignUser, unassignUser, subscribeToTodo, unsubscribeFromTodo
  - `cardExtras.ts`: addTodoLabel, removeTodoLabel, createUpload, deleteUpload
  - `comments.ts`: getComments (page + total), createComment, updateComment, deleteComment
  - `notifications.ts`: getNotifications, markNotificationsRead, deleteNotification
  - `activity.ts`: getBoardActivity

  The server builds every filter; `updateTodo` takes a strict `set`, and an unknown column
  gets a 400. Card ops that change a card return the updated card, so the browser no longer
  needs a second fetch.
- **Access, from the owner's decisions:**
  - Anyone who can see the board reads its cards.
  - Only owners and editors change cards: create, edit, move, delete, assign, subscribe,
    labels and images. Moving a card also needs edit rights on the target board.
  - Viewers read comments and comment. Only the author edits a comment. The author, or an
    owner/editor, deletes it.
  - Public visitors see cards but not comments or activity. Strangers get 403.
  - An assignee or subscriber must be on the board. A label must be from the card's board.
- **Activity rows and notifications are written by the server** in the op that causes
  them (`written()` in `cardAccess.ts`), never by the browser:
  - one `CARD_WRITTEN` mutation (one transaction) stamps the board, inserts the activity
    rows and inserts the notifications;
  - the edit diff (`cardActivity.ts`) compares against the stored row;
  - assigning notifies the person assigned;
  - a comment notifies the card's assignees and subscribers, each once and never the author.

  Nobody can create a notification for someone else from the browser any more. The
  pointless "deleted" activity row is gone: `activity_logs` cascade away with their card.
- **`boards.changed_at`** (migration `1814000000000`, applied to production): card,
  comment, label and list ops all stamp it. The poll compares one board row instead of
  hashing ~1,500 rows on a 334-card board. Until the runner writes through the API (#231),
  the poll also reads one aggregate (card count plus newest `updated_at`), so the runner's
  direct Hasura moves still show within one poll. #231 has a note to remove it.
- **The board page's server load** (OG tags) and the OG image now use the `getBoard` op on
  the server (`src/lib/server/boardCard.ts`). They mint no Hasura JWT, and card aliases are
  looked up inside the board.
- **Found and fixed in the live check:** one board load sent the same first page about 9
  times in parallel, then the rest and the completed pages 9 times each (27 `getTodos`),
  because the page re-runs its load on every boards update. Identical in-flight loads now
  share one request: 3 `getTodos` per load.
- The #223/#225 in-flight-write guard is unchanged (`trackWrite` on create, update, delete,
  and now on the card-returning ops too). `todos.svelte.ts` went from 1,553 to 953 lines.

**Files changed**
- created:
  - ops: `src/lib/server/ops/{todos,cardAccess,cardActivity,cardPeople,cardExtras,comments,notifications,activity}.ts`
  - `src/lib/server/boardCard.ts`
  - `src/lib/server/ops/__tests__/cards.test.ts`
  - `hasura/migrations/default/1814000000000_boards_changed_at/{up,down}.sql`
  - `.claude/todo/239-viewerReadOnlyUi.md` (Backlog)
- modified:
  - `src/lib/server/access.ts` (`roleFrom`, `roleOf`, `primeRole`)
  - `src/lib/server/ops/{index,poll,lists,labels}.ts`
  - `src/lib/graphql/documents.ts`:
    - added `GET_CARD_ACCESS`, `CARD_WRITTEN`, `GET_COMMENT_ACCESS`, `GET_UPLOAD_TODO`,
      `MARK_MY_NOTIFICATIONS_READ`, `DELETE_MY_NOTIFICATION`
    - `POLL_BOARD` reads `changed_at` and the aggregate
    - removed `UPDATE_NOTIFICATION`, `MARK_NOTIFICATIONS_AS_READ`, `DELETE_NOTIFICATION`,
      `GET_TODO_SUBSCRIBERS` and two unused aggregate counts
  - `src/lib/graphql/generated/*`
  - stores: `todos`, `comments`, `notifications`, `activityLog`, `labels`, `contentSearch`
  - components: `CardAssignee.svelte` (the browser-side notification is gone),
    `CardImageManager.svelte`, `TodoItem.svelte`
  - routes: `[lang]/[username]/[board]/+page.server.ts`, `og-image.png/+server.ts`
  - tests: `todos.svelte.test.ts`, `todosConcurrency.svelte.test.ts`,
    `lightBoard.svelte.test.ts`, `ops.test.ts`
  - todo files: `.claude/todo/231-runnerAndExtensionApi.md` and `233-d1Ops.md`
    (handover notes)
  - `package.json` / `package-lock.json` (0.31.0 → 0.32.0)

**Verification**
- `npm run check`: 0 errors, 0 warnings.
- Server tests: 39 files, 444 passed. The new `cards.test.ts` covers:
  - every card write: an editor passes and the board is stamped; a viewer, a public
    visitor and a stranger get 403;
  - moving a card across boards, a foreign label, a non-member assignee, a column the app
    never writes;
  - the comment rules, notification fan-out and self-exclusion, owner-only notifications,
    assignee promotion, and the activity diff.
- Client tests: 12 files, 89 passed, including a new test that parallel loads share one
  request.
- Full `vitest --run`: 2 failures in `boardLoadRace.test.ts`, which are cold-import
  timeouts under load. Plain `main` fails the same way in a full run (checked in a clean
  worktree), and the file passes alone.
- ESLint is clean on the new op files. The rest are older `any`s.
- The Svelte autofixer reports no issues.
- **e2e** (`--project=authenticated`, build + preview against production): `card-detail`,
  `todo-drag-reorder` and `todo-long-title` all passed (7 tests).
- **Deploys:** pushed `4b9b015`; Vercel status "Deployment has completed". `wrangler deploy`
  uploaded version `18142bfe`. The dedupe fix shipped after that, the same way.
- **Live on www.todzz.eu/en/test/tests-board, as the test user:**
  - created two lists and three cards through the UI; the server assigned the creator;
  - a second tab showed the new cards, and later a new label, at its next poll;
  - dragged a card to the other list (logged `list_moved`);
  - edited the title and body (`title_changed`);
  - completed a card, deleted one through the confirm dialog;
  - unassigned and reassigned myself from the assignee menu; the server state followed
    each click. Assigning a non-member gave 400;
  - commented (`commented`) and deleted the comment in the UI;
  - edited a comment through the `updateComment` op (`comment_edited`): there is no edit
    button for comments in the UI;
  - added and removed a label through the API (the ops the label menu calls);
    `createUpload` and `deleteUpload` logged `image_added` and `image_removed`;
  - another board's cards gave 403, and `updateTodo` with `user_id` gave 400.

  During the board load and the card writes, the only requests to
  `todzz.admin.servicehost.io` were `GetUsers`, `UpdateUser` (locale), `GetClients` and
  `GetClaudeUsageMonth`. All four belong to #230.
- **Attaching a real image fails, and not because of this change.** `/api/upload` answers
  500 on Vercel, and locally R2 answers `NoSuchBucket` for bucket `todzz`. The app's R2
  bucket from #219 (still `-BLOCKED`) was never created, and the Worker has no R2 secrets.
  Image uploads have been broken since #219 shipped. The card side (`createUpload` /
  `deleteUpload`) works, as above. #219 is the open item for the owner.
- **Live on the Worker:** list, card (with assignee), comment, poll, delete; a stranger's
  board gave 403.
- All test cards, lists and labels were deleted afterwards (0 `zz229*` left).
- `/verify` was not invoked as a skill; the checks above are the ones that match.

**Deviations**
- **Viewer UI hiding is not done.** The server already refuses viewers' writes; hiding the
  controls is filed as Backlog `239-viewerReadOnlyUi.md`.
- **Subscribing yourself needs edit rights.** Following the owner's "nothing else" for
  viewers, a viewer can't subscribe themselves, so they are notified only when assigned.
  Say if viewers should be able to follow cards.
- `createTodo` needs a list: a card without a list showed on no board.
- `getTodoSubscribers`, `bulkUpdateTodos`, `refreshTodo`, `createActivityLog` and
  `createNotification` (store) are removed, because nothing called them.
- **Stamping `changed_at` also moves `boards.updated_at`** (the existing trigger). Nothing
  reads it as "settings changed".
- Comments that the GitHub webhook or the runner add directly show on other tabs at the
  5-minute full refresh (noted in #231).
- **Free-plan card cap:** the per-board card cap is still checked only in the browser.
- **Lost handover notes:** the Kanban overwrite of this file dropped the #227/#228 handover
  notes (they are in `5ba3ddd:.claude/todo/229-dataApiCards.md`). The ones that mattered
  are done here or in `239`.
