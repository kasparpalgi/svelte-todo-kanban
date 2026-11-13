> Run with: Sonnet 5.5 / medium

# Calendar of due cards across all boards

## Original Requirement

[NEVER REMOVE]

Follow-up from #241. Original request: "other than kanban view option(s): research others;
combined all projects backlog; prioritise projects depending on sort order already on kanban"

From #241's research: after a list, a calendar is the view that Trello (Workspace calendar,
cards from many boards, colour per board), Todoist, ClickUp, Notion and Asana all offer.
Cards here already have `due_on` + `has_time`.

- `/[lang]/calendar`: a month grid (week rows, Monday first) of open cards with `due_on`,
  from the same boards as the backlog (`backlogStore`, #241). The board's colour or icon
  (`getBoardCustomization`) on each chip; overdue chips stand out.
- Prev / next month and Today; a chip opens the card (`?card=` on its board).
- On a phone: an agenda list (day headings) instead of the grid.
- Rescheduling by drag is out of scope for this slice.
- Linked from the backlog page header. Dates through `date-fns` (already a dependency),
  i18n en / et / cs, unit test for the month-grid function.

_GitHub issue #251 — end the commit subject with `(#251)`._
