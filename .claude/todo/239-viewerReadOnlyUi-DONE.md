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

_GitHub issue #239 — end the commit subject with `(#239)`._

_From Kanban card `b2d7cd7c-7a2e-4666-aa7c-f488147e9575`, moved to the agent list._

## Results

**Summary** — `listsStore.canEditSelectedBoard` (owner, or `board_members` role owner/editor; pure helper `canEditBoard`). For viewers: no add-card inputs, list rename/delete menu, add-list card, GitHub import button, card drag / Ctrl+arrow moves, card edit/delete/complete buttons. Opening a card shows the new `CardReadOnlyView` (fields, labels, assignees, attachments read-only) with the comment box; viewers can delete only their own comments (`CardComments readOnly`). `CardImageManager readOnly` hides upload/delete. New i18n key `card.read_only_notice` (en, et). Board menu needed no change: shared boards already expose only view-members/visibility, owner-only controls show on owned boards.

**Files changed** — created: `CardReadOnlyView.svelte`, `stores/__tests__/canEditBoard.test.ts`. Modified: `listsBoards.svelte.ts`, `KanbanColumn`, `TodoItem`, `TodoKanban`, `CardImageManager`, `CardComments`, `CardModal`, board `+page.svelte`, `types/todo.ts`, `types/comments.ts`, locales en/et.

**Verification** — `npm run check` 0 errors; `npm test` 582 pass (one unrelated logs test flaked once, passed on rerun). Not verified live: deploy and the viewer/editor browser check need a human after push.

**Deviations** — Card detail for viewers is a separate read-only component rather than disabling fields in the 895-line `CardDetailView`. Description shows as plain text.
