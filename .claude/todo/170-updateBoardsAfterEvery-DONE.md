# Update boards after every reasonable amount of seconds

## Original Requirement

[NEVER REMOVE]

At the moment I have to refresh to see changes

_From Kanban card `f3e7954e-a8ff-4a44-9658-fa1c633daaf4`._

_GitHub issue #170 — end the commit subject with `(#170)`._

## Analysis

- The board view (`src/routes/[lang]/[username]/[board]/+page.svelte`) loaded todos/lists/boards
  once on mount and only re-fetched on explicit user actions (create/update/delete). Changes made
  by another user, another tab, or another device on the same board never appeared until a manual
  page refresh.
- Precedent already existed for polling: `UnifiedNotificationBell.svelte` polls
  `notificationStore.loadNotifications` every 30s via `setInterval` in `onMount`, cleaned up on
  unmount. Followed the same pattern for consistency.
- `todosStore.loading` is bound to a full-page spinner in the board page, so reusing
  `loadTodosInitial`/`loadTodos` for background polling would cause a visible flash every 30s.
  Needed a silent variant that refreshes data without touching `state.loading`.
- `listsStore.loading` is not read anywhere in the UI, so `loadLists()`/`loadBoards()` were safe to
  reuse directly for silent polling.

## Implementation Plan

1. Add `refreshBoardTodos(boardId)` to `src/lib/stores/todos.svelte.ts` — fetches active +
   completed todos for a board in parallel and replaces `state.todos`, without touching
   `state.loading`/`state.error`. Guards against a board switch happening mid-request.
2. Export `refreshBoardTodos` from the store's public API.
3. In the board page (`+page.svelte`):
   - Add `refreshBoardInBackground()` — silently re-fetches todos (via `refreshBoardTodos`), lists,
     and boards for the currently selected board, skipping when the tab is hidden.
   - Start a 30s `setInterval` in `onMount` calling it.
   - Add a `visibilitychange` listener to refresh immediately when the tab regains focus (covers
     the common "switched away and came back" case faster than waiting for the next tick).
   - Clean up both the interval and the listener in the `onMount` cleanup function.
   - Fixed a TS error from making `onMount`'s callback `async` while returning a cleanup function
     (not a valid `onMount` return type) by keeping the callback synchronous and firing the initial
     load as a non-awaited promise.

## Changes

- `src/lib/stores/todos.svelte.ts`: added `refreshBoardTodos(boardId)` — silent background refetch
  of a board's todos (active + completed), exported it from the store.
- `src/routes/[lang]/[username]/[board]/+page.svelte`: added `refreshBoardInBackground()` plus a
  30s poll (`setInterval`) and a `visibilitychange` listener in `onMount`, with cleanup on unmount.

## Verification

- [x] `npm run check` passes — no new errors introduced (same 10 pre-existing unrelated errors in
      `og-image/+server.ts` and 4 pre-existing a11y warnings remain; the board page is clean).
- [x] `npx vitest run --project=server` — all 201 existing unit tests pass.
- [ ] `npm run test:unit --project=client` / `npm run test:e2e` — could not run: Playwright's
      Chromium binary failed to download in this sandbox (network stalled during
      `npx playwright install chromium`, killed after ~10 min with no progress). This is a sandbox/
      environment limitation, not related to this change — no client-project or e2e tests exist for
      this specific board page's polling behavior anyway.
- [ ] Playwright MCP manual browser verification: not performed (same browser-binary limitation
      above prevents launching a controlled browser in this environment). Logic was reviewed
      carefully against existing store patterns and the established polling precedent instead.

## Results

- What works: Board page now silently re-fetches todos, lists, and boards every 30 seconds, and
  immediately on tab focus, without disturbing loading states or flashing spinners. Follows the
  same interval/cleanup pattern already used for notification polling.
- Known issues / follow-ups: Polling is board-page-only; the boards list on the home page
  (`src/routes/[lang]/+page.svelte`) still only loads once on mount. Not addressed here since the
  original complaint ("have to refresh to see changes") was reported from a board card, i.e. the
  board content view — can be extended later if the home page turns out to need it too.
