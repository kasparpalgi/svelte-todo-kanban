> Run with: Sonnet 5.5 / high

# Board query: send the board once, not on every card

## Original Requirement

[NEVER REMOVE]

Follow-up from #211.

After #211 the tekdok board load (349 active + 188 completed cards) is 669 KB + 380 KB.
The biggest remaining field is `list { board { … github settings user { claude_plan … } } }`
inside `TodoFields`: the same board JSON repeated on every card — 193 KB of the 669 KB.
`content_preview` (first 300 chars) is next at 104 KB.

- Drop `list.board` from `TodoFields`; read the board from `listsStore` (it already holds
  the boards) where code uses `todo.list.board` — the filter (`todoFiltering`), GitHub sync
  in `todos.svelte.ts`, `CardCostBadge` (claude plan), and anything else `npm run check`
  flags once the field is gone.
- Consider trimming `content_preview` to ~150 chars if the card preview still reads the same.

Measure before/after on tekdok the same way #211 did (GetTodos as the board owner).
