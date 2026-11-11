> Run with: Opus 5.5 / high
> Machine: mac

# Light board query: load comments on card open

## Original Requirement

[NEVER REMOVE]

Follow-up from #209.

The full board query is still heavy whenever it runs: on `tekdok` (334 active + 187 completed cards) GetTodos returns 2.25 MB + 1.27 MB (\~10 s), mostly every card's comments (932 KB) and content (812 KB) from `TodoFields`. Since #209 the 30 s poll only pays this when the board's fingerprint changed (or every 5 min), but the first load and every change still do.

- Load the board with a light card fragment (what the card face shows + comment/upload counts) and fetch comments and full content when a card opens — `loadTodoDetails` exists for that.
- Keep search and filters working (check what they read).
- Add a `set_updated_at` trigger on `comments`: an edited comment doesn't change the board fingerprint today, so others see it only on the 5-min full refresh.

Measure before/after on tekdok.

_From Kanban card `3daf5515-3a52-4d2e-a657-df12a33274b3`, moved to the agent list._

_GitHub issue #211 — end the commit subject with `(#211)`._

## Results

**Summary** — The board now loads a light card fragment; the full body is fetched when a card opens.

- `TodoFields` (the board/poll fragment) dropped `content` and `comments`. It now has
  `content_preview` (a new Hasura computed field, first 300 chars of the body, for the card face's
  ~50-char preview) and `comments_aggregate.count` (for the card's comment icon).
- New `TodoDetailFields` = `TodoFields` + `content`, served by `GET_TODO_DETAILS`. `CREATE_TODO` and
  `UPDATE_TODOS` return it too. Comments were never needed on the card object: an open card already
  loads them through `commentsStore`.
- `loadTodoDetails` (unused until now) uses it. `CardModal` awaits it alongside the comments before the
  editor mounts. Inline edit (`TodoItem.startEdit`) awaits it before opening the form; without that,
  saving the form would have wiped the body. `refreshTodo` goes through it.
- Board loads and polls keep a body already loaded for a card, as long as the card's `updated_at`
  hasn't changed (`keepLoadedContent`).
- Search: title search is unchanged. "Search also content" now runs in Postgres
  (`SEARCH_TODO_CONTENT`, `content _ilike %term%` with LIKE wildcards escaped, debounced 300 ms) through
  the new `contentSearch` store. The filter also still matches any body that's loaded locally. All other
  filters read only fields the light fragment still has (list, board, due date, priority, assignees,
  labels, completed).
- Migration `1811000000000_light_board_query`: `todo_content_preview(todos)` and the
  `set_public_comments_updated_at` trigger, so an edited comment now changes the board fingerprint.
  Applied to the live Hasura by version only (1807–1809 show as untracked there and were left alone),
  and the metadata was applied after `hasura metadata diff` showed only this change.
- OG tags and the OG image read `content_preview`.

**Measured on tekdok** — GetTodos as the board owner, active + completed, as `refreshBoardTodos` runs it:

| | active (349) | completed (188) | total |
| --- | --- | --- | --- |
| before | 2368 KB | 1271 KB | 3639 KB |
| after | 669 KB | 380 KB | 1049 KB (−71 %) |

Server time from here dropped from ~225–380 ms to ~105–190 ms. The ~10 s seen in the browser was
mostly transfer and parsing of the 3.6 MB, which shrinks in proportion. The biggest remaining field is
`list.board`, which repeats the same board on every card (193 KB). Filed as Backlog follow-up
`222-boardOnceNotPerCard.md`.

**Files changed**
- Created: `hasura/migrations/default/1811000000000_light_board_query/{up,down}.sql`,
  `src/lib/stores/contentSearch.svelte.ts`, `src/lib/stores/__tests__/lightBoard.svelte.test.ts`,
  `.claude/todo/222-boardOnceNotPerCard.md` (Backlog follow-up)
- Modified: `hasura/metadata/databases/default/tables/public_todos.yaml`, `src/lib/graphql/documents.ts`
  (+ generated), `src/lib/types/todo.ts` (`BoardTodo` type), `src/lib/stores/todos.svelte.ts`,
  `src/lib/stores/todoFiltering.svelte.ts`, `src/lib/components/todo/TodoItem.svelte`,
  `src/routes/[lang]/[username]/[board]/CardModal.svelte`, `…/+page.server.ts`,
  `…/og-image.png/+server.ts`, locales (`todo.load_failed` in en/et/cs), 3 store test mocks,
  `package.json` (0.27.2)

**Verification**
- `npm run check`: 0 errors, 0 warnings
- `vitest run` (all projects): 43 files, 429 tests pass. New: body kept/dropped across polls, LIKE
  escaping, debounced server content match. Playwright e2e was not run (#212 tracks the stale e2e suite).
- Svelte autofixer: clean on `contentSearch.svelte.ts` and the `TodoItem` changes. On `CardModal` it only
  flags the existing `$effect` that syncs `todo`, which this task didn't touch.
- Live check on the dev server, signed in as the test user, with a temporary list, card and comment
  (deleted afterwards). The card face showed the preview and the comment icon. Opening the card showed
  the full body, including text past the 300-char preview, and the comment. Searching for a word found
  only at the end of the body hid the card with title-only search and found it with "Search also
  content". The inline edit form received the full body.
- Live DB: the trigger exists on `comments`, and Hasura metadata is consistent.

**Deviations**
- Content search moved to the server instead of downloading the bodies. Loading every body for a local
  search would have brought back the 800 KB this task removes.
- The detail fragment holds only `content`, not comments: `commentsStore` already loads an open card's
  comments.
