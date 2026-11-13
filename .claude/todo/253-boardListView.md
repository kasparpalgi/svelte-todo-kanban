> Run with: Sonnet 5.5 / medium

# Board: list view next to the kanban

## Original Requirement

[NEVER REMOVE]

Follow-up from #241. Original request: "other than kanban view option(s): research others;
combined all projects backlog; prioritise projects depending on sort order already on kanban"

#241 compared Trello, Linear, Asana, Jira, ClickUp, Notion, GitHub Projects and Todoist.
Every one of them pairs the board with a **list** layout of the same cards; Linear toggles
the two with Cmd/Ctrl+B and keeps the filters. This slice adds that toggle to one board.

- A `Board | List` switch in the board header (`src/routes/[lang]/[username]/[board]/+page.svelte`).
  Remember the choice per user (`users.settings`, like `lastBoardAlias`), not in the URL.
- List view = the board's open cards grouped by list (list order, then card order), one
  row each: title, priority, due date, estimate, assignee avatar. Same filters as the kanban
  (`todoFilteringStore`), same card modal (`?card=`).
- Reuse the row markup from `src/routes/[lang]/backlog/+page.svelte` (#241): extract it
  into `src/lib/components/todo/CardRow.svelte` and use it in both places.
- Moving cards stays a kanban-only action in this slice: no drag in the list.
- i18n en / et / cs. Component test for the toggle.
