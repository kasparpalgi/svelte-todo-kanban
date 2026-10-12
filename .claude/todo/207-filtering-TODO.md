> Run with: Opus 5.5 / medium
> Machine: dell

# Filtering

## Original Requirement

[NEVER REMOVE]

1. When I click Ctrl + F then it opens right side drawer for filtering but also focust the search bar
2. When I have in the top of lists message that filters on then also let straight from there to clear filters
3. Filtering shall apply also to completed tasks
4. When changing board then filters shall not come over to that board.

_From Kanban card `b0062bfc-6499-49ce-bd54-5a984a3ba023`._

_GitHub issue #207 — end the commit subject with `(#207)`._

## Plan

Relevant files: `src/lib/stores/todoFiltering.svelte.ts`, `src/lib/components/todo/TodoFiltersSidebar.svelte`,
`src/lib/components/todo/TodoKanban.svelte`, `src/routes/[lang]/[username]/[board]/+page.svelte`, locales.

1. **Ctrl/Cmd+F** — in the board page global keydown, intercept Ctrl/Cmd+F (even while typing, overriding
   browser find), open the sidebar (not toggle) and focus the sidebar search input (`id="filter-search"`).
   Sidebar search input also autofocuses on mount when opened via Ctrl+F.
2. **Clear from banner** — the "Active filters:" banner above the lists gets a "Clear filters" button
   (`todoFilteringStore.clearAllFilters()`). Summary now also covers priority, labels and assignment so the
   banner appears for every active filter. `clearAllFilters` keeps `boardId` and cancels a pending search
   debounce; the sidebar's local search text syncs back to empty when the filter is cleared elsewhere.
3. **Completed tasks** — `getCompletedTodos` runs `filterTodos` before sorting, so the completed section
   respects search/priority/labels/assignee/due filters.
4. **Board change** — new store method `setBoard(boardId)`: when the board id differs from the stored one,
   filters reset to `{ boardId }`. `TodoKanban` uses it instead of `setFilter('boardId', …)`; this also
   handles persisted localStorage filters from a previous board.
5. Unit tests in `src/lib/stores/__tests__/todoFiltering.svelte.test.ts`; `npm run check`, `npm test`.

## Log

- **Store** (`todoFiltering.svelte.ts`): added `setBoard(boardId)` (resets filters to `{ boardId }` when the
  board changes), `getActiveFilterCount()`; `clearAllFilters()` now keeps `boardId` and cancels a pending
  search debounce; `getCompletedTodos()` now runs `filterTodos()` (req 3).
- **TodoKanban**: board effect uses `setBoard` (req 4); completed section passes the user id so
  "assigned to me" works there too; banner shows whenever any filter is active, lists priority / labels /
  assignment / search term, and has a "Clear filters" button (req 2). New i18n key `todo.clear_filters` (en/et/cs).
- **Board page**: Ctrl/Cmd+F (works even inside inputs, overrides browser find) opens the sidebar and sets
  `actionState.focusFilterSearch`; plain `F` toggle no longer fires on Ctrl/Cmd+F (req 1).
- **TodoFiltersSidebar**: search input `id="filter-search"` with `bind:ref`, focused + selected when
  `focusFilterSearch` is set; search text initialised from / synced to the store (clears when filters are
  cleared from the banner or by switching board); `searchContent` checkbox derived from the store.
- **Tests**: 6 new cases in `src/lib/stores/__tests__/todoFiltering.svelte.test.ts` (board reset, clear
  keeps board, count, completed filtering, debounce cancel). Installed Playwright Chromium locally (vitest
  browser project needed it).
- `npm run check`: 0 errors / 0 warnings. Vitest: 30 files, 346 tests passed.
- E2E (`playwright test`) **not run**: local Hasura isn't running (localhost:8080 unreachable), and the
  authenticated specs depend on it. UI behaviour (Ctrl+F focus, banner button) not verified in a browser.
