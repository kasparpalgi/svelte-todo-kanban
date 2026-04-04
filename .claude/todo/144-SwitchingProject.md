When I switch between projects then it will first fade in existing board's content and then spinner to load the board where I want to go. If we would cut off that slide in of current project it would be milliseconds faster and cleaner UX.

## Root Cause

When `BoardSwitcher.selectBoard()` is called:
1. `listsStore.setSelectedBoard(newBoard)` updates immediately
2. `goto()` changes the URL → `boardAlias` param changes
3. Svelte re-renders the page — `loading` is still `false`, `todosStore.todos` still has the old board's data → **old content briefly visible**
4. Only after render does the `$effect` fire and call `loadBoardData` → `loading = true` → spinner

The one-render-frame gap between `selectedBoard` changing and `loading = true` caused the old content flash.

## Fix

Added a `$derived` value `isSwitchingBoards` in `+page.svelte` that is `true` when `todosStore.initialized` is true but `todosStore.currentBoardId !== listsStore.selectedBoard?.id`. This is detectable immediately in the same render frame that `selectedBoard` changes, before the `$effect` fires.

Changed `{:else if loading}` to `{:else if loading || isSwitchingBoards}` in the template so the spinner shows instantly on board switch, with no old-board content flash.

## Changes

- `src/routes/[lang]/[username]/[board]/+page.svelte`: Added `isSwitchingBoards` derived and updated loading condition
