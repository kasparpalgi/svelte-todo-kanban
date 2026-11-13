> Run with: Sonnet 5.5 / medium

# Hide the edit controls from board viewers

## Original Requirement

[NEVER REMOVE]

Follow-up from #229 (and #228). Owner decision, 2026-11-12: "Viewers are read-only and can
only comment: they can read the board and cards, add comments, and edit or delete their own
comments. Nothing else; the API returns 403. The UI hides the edit controls for viewers
(create card, drag, edit fields, labels, assign, uploads, list and board settings)."

The server half is done: since #228 (boards, lists, labels) and #229 (cards, assignees,
subscribers, labels on cards, uploads) every write op answers a viewer with 403, and comments
follow the rule above (`src/lib/server/ops/comments.ts`). Today a viewer still sees every
control and gets an error toast when they use one.

1. One derived flag, e.g. `listsStore.canEditSelectedBoard`: the owner, or a `board_members`
   row with role `owner`/`editor` for the current user (`BoardFields` already carries
   `board_members { user_id role }`).
2. Hide or disable for viewers: the add-card inputs (board page, `KanbanColumn`), dragging and
   Ctrl+arrow moves (`TodoKanban`, `TodoItem`), the card's edit fields, priority, due date,
   hours and agent settings (`CardDetailView`, `TodoItem` edit mode), labels, assignees,
   subscribers and image upload/delete, the list create/rename/delete menu, and the board menu
   (settings, visibility, GitHub, archive). Keep the comment box and the edit/delete buttons
   on the viewer's own comments.
3. i18n for any new text (en, et); dark mode and mobile as everywhere else.

**Done when:** check and tests pass; deployed. Live: a viewer on a test board sees no edit
control, can comment and edit/delete their own comment; an editor still sees everything.
