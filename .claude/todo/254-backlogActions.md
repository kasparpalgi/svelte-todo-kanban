> Run with: Sonnet 5.5 / medium

# Backlog: filters and acting on cards in place

## Original Requirement

[NEVER REMOVE]

Follow-up from #241. Original request: "other than kanban view option(s): research others;
combined all projects backlog; prioritise projects depending on sort order already on kanban"

#241 shipped `/[lang]/backlog`: every open card of the boards you own or belong to,
boards in switcher order, then lists, then cards, numbered 1…n (read-only; a row opens the
card on its board). Next, so it can be worked from without leaving the page:

- **Filters** (saved per user in `users.settings`): only cards assigned to me; hide lists by
  name (e.g. "Review", "Done") across all boards; collapse a board's section.
- **Act in place**: complete a card and change priority from the row, through
  `call('updateTodo', …)` with an optimistic update and rollback in `backlogStore`.
- **Open in place**: open the card dialog over the backlog instead of navigating to the
  board. `CardModal` reads `todosStore` and `listsStore.selectedBoard`; check what it needs
  before choosing between reusing it and a smaller read view.
- **Reorder projects here** (optional): move a board's section up / down, which writes
  `boards.sort_order` the way `BoardManagement.svelte` already does (owned boards only).
- If loading one request per board (`backlogStore.load`, 4 at a time) gets slow with many
  boards, add one server op that returns the open cards of every board. #242 (voice
  "what's urgent") plans one for its ranking, so share it.
