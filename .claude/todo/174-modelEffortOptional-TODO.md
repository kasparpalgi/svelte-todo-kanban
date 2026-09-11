# Model / Effort optional

## Original Requirement

[NEVER REMOVE]

Like you can at board settings eg. turn on/off hour tracking, the same way make the model/effort dropdowns.

_From Kanban card `821e575b-4c39-429b-9857-38a07a5d5f8e`._

_GitHub issue #174 — end the commit subject with `(#174)`._

## Plan

Follow the existing `enable_hour_tracking` board-setting pattern:

1. `BoardManagement.svelte` — add a second `Switch` next to the hour-tracking one in the
   board dropdown menu, bound to `board.settings?.enable_model_effort` (default `true`,
   since agent model/effort selection already exists and should stay on unless a board
   owner turns it off). Reuse `handleUpdateBoardSettings`-style handler
   (`handleUpdateModelEffortSetting`) that patches `settings.enable_model_effort`.
2. `CardDetailView.svelte` — wrap the "Agent Model" and "Agent Effort" `<div>` blocks
   (lines ~615-651) in `{#if todo.list?.board?.settings?.enable_model_effort ?? true}`.
3. Locales — add `board.enable_model_effort` key to `en`, `et`, `cs` common.json (mirror
   `enable_hour_tracking` phrasing/placement).
4. `npm run check` must pass. No GraphQL schema change needed — `settings` is already a
   free-form jsonb column on `boards`.

## Log

- Explored existing `enable_hour_tracking` pattern in `BoardManagement.svelte` (lines
  ~300-315 handler, ~483-499 UI) and its consumer in `CardDetailView.svelte` (line 654).
- Found agent model/effort dropdowns in `CardDetailView.svelte` lines 615-651.
- Added `handleUpdateModelEffortSetting` + `Switch` UI in `BoardManagement.svelte` (below
  the hour-tracking switch), bound to `board.settings?.enable_model_effort ?? true`.
- Wrapped the "Agent Model"/"Agent Effort" `<select>` blocks in `CardDetailView.svelte`
  with `{#if todo.list?.board?.settings?.enable_model_effort ?? true}`.
- Added `board.enable_model_effort` i18n key to `en`, `et`, `cs` locales.
- `npm run check`: pre-existing 10 errors/6 warnings unrelated to these files (none in
  `CardDetailView.svelte` or `BoardManagement.svelte`).
- `vitest --project=server --run`: 201/201 tests pass. Client-project vitest run fails
  pre-existing (missing Playwright browser binary — environment issue, unrelated).
- Status: DONE.
