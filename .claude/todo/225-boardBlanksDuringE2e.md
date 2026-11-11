> Run with: Sonnet 5.5 / medium

# Board goes blank / quick-add drops a card under parallel e2e load

## Original Requirement

[NEVER REMOVE]

Follow-up from #223. With the poll-vs-write race fixed, `e2e/todo-drag-reorder.spec.ts`
was run 4 × `--repeat-each=20` (4 workers on the same test board). Three failures were
left, none of them the poll overwriting a reorder:

1. **Whole board blank.** At the start of the mouse-drag test the board rendered no list
   columns at all (only "Add new list"); the toast "Task added successfully" was still up.
   Ctrl+ArrowDown had just passed in the same page. Something replaced or filtered away
   every list: suspect the 30 s poll's `listsStore.loadLists()` / `loadBoards()` in
   `refreshBoardInBackground` (`src/routes/[lang]/[username]/[board]/+page.svelte`)
   changing `selectedBoard` or the lists the kanban filters on.
2. **Quick-add Enter ignored.** In `addCards` (`e2e/board.ts`) the first card's title stayed
   in the input and the list showed "0 tasks" after Enter, so no optimistic card appeared.
3. **Drag drop landed wrong or not at all** (1 in 80): `Bravo` stayed first instead of
   `Charlie`. The snapshot was taken after cleanup, so it doesn't show the order. Other
   workers adding or deleting lists can shift the columns mid-drag. Run with
   `--trace=retain-on-failure` to capture the next one.

Reproduce with `npx playwright test e2e/todo-drag-reorder.spec.ts --project=setup
--project=authenticated --repeat-each=20 --trace=retain-on-failure`, find the cause of (1)
first, then decide whether (2) and (3) are app bugs or spec flakes.
