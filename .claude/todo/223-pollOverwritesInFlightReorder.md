> Run with: Sonnet 5.5 / medium

# Board poll can overwrite an in-flight card reorder

## Original Requirement

[NEVER REMOVE]

Follow-up from #212. `todo-drag-reorder.spec.ts › reorders a card to the top with a mouse drag`
still failed about 1 in 26 runs after the spec was fixed. Each time the drop looked complete in the
UI, but the list came back in its pre-drag order.

Suspected cause (not yet proven): `refreshBoardTodosIfChanged` → `refreshBoardTodos` in
`src/lib/stores/todos.svelte.ts` replaces `state.todos` with the server's copy, even while
`updateTodo(sort_order)` writes from a drag or Ctrl+Arrow move are in flight. If a poll (30 s, or
on visibilitychange) fetches before those writes commit and lands after the optimistic update, the
card jumps back to where it was until the next poll. Parallel e2e workers change the board
fingerprint all the time, so they hit this more often than real use does.

Confirm the race (for example, delay one `updateTodo` response in a unit test while a refresh
resolves). If it is real, skip or merge a refresh while card writes are pending, the way
`pendingCreates` already guards creates. Then run the drag spec with `--repeat-each=20`.
