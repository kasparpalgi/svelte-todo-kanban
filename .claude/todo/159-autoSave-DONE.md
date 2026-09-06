> Run with: Sonnet 4.6 / low

# Auto save

## Original Requirement

[NEVER REMOVE]

Sonnet 4.6 / medium
Make when the card is open to auto-save the card when there's changes made to the card.

Also, one session ended like this:
One thing I did not do: apply the new migration to Hasura. hasura/config.yaml points at a remote instance (todzz.admin.servicehost.io), so I left hasura migrate apply --database-name default for you to run explicitly rather than pushing a schema change to what looks like your live server.

Remember to always use Hasura CLI to first pull latest metadata from the server and then make all up to date in the hosted Hasura.

## Results (2026-09-06)

### Plan
- No schema/migration changes needed for this task — it's pure UI/client behavior, so the Hasura note above doesn't apply here.
- Target component: `src/lib/components/todo/CardDetailView.svelte` — this is the "open card" detail/edit view (title, rich-text content, due date, priority, hour tracking, images, comments).
- Reused the existing auto-save pattern already present in `src/lib/components/notes/NoteEditor.svelte` (debounced save on change via a `setTimeout`, `hasUnsavedChanges` flag, tiptap `editor.on('update', ...)` listener).

### Changes
- `CardDetailView.svelte`:
  - Added `hasUnsavedChanges` / `autoSaveTimeout` state and a `markDirtyAndScheduleAutoSave()` helper that debounces a call to `saveTodo({ isAuto: true })` by 1.5s.
  - Added a `$effect` that snapshots the plain fields (title, due_on, has_time, priority, min/max/actual hours, comment_hours) and triggers auto-save when they change. Uses an `onMount` tick to capture the baseline snapshot *after* the existing due-date-derivation effect settles, so opening the card doesn't itself look like an edit.
  - Added a tiptap `editor.on('update', ...)` listener (mirrors NoteEditor) to trigger auto-save on rich-text content edits.
  - `saveTodo()` now takes `{ isAuto?: boolean }`. Auto-triggered saves: skip the Google Calendar event creation, skip the AI "plan pass", skip new-image upload, skip the success toast, and skip closing the card — they only persist the text/date/priority/hour fields. This avoids duplicate calendar events / uploads firing repeatedly while the user is still typing. Explicit "Save" clicks keep the full original behavior (uploads, calendar, toast, closes the card).
  - If a save is already in-flight when an auto-save fires, it reschedules itself shortly instead of dropping the change.
  - Added `handleClose()` (wired to the header `X` and footer "Close" buttons): flushes any pending auto-save before closing so edits aren't lost if the user closes without hitting Save.
  - Added a small status indicator in the card header ("Unsaved changes" / "Saving…" / "All changes saved").
- Added new i18n keys `card.unsaved_changes`, `card.all_changes_saved`, `card.auto_saving` to `src/lib/locales/{en,et,cs}/common.json`.

### Verification
- `npm run check`: passes for the touched files (0 errors on `CardDetailView.svelte`). Remaining 19 pre-existing errors in the repo are unrelated missing deps (`d3-shape`, `layercake`, `d3-scale`, `marked`) in other files, not touched by this change.
- `npm test`: could not complete in this sandbox — `vitest`'s browser-mode project fails immediately because Playwright's Chromium binary isn't installed here (`chromium_headless_shell` missing), which is an environment limitation unrelated to this change. Recommend running `npx playwright install` and re-running `npm test` in an environment with network access before merging, or verify manually in the browser (open a card, edit the title/description/due date, wait ~1.5s, confirm the status pill flips to "All changes saved" and the change persists after a page reload).
- No database/migration changes were needed.

### Completion note

The run itself stopped after writing this log: the task file was never renamed and
nothing was committed, so the card and its GitHub issue stayed open and the repo went
`⛔ blocked — dirty working tree` on the next runner tick. Verified and finished by hand
in the 027 follow-up session: `npm run check` shows `CardDetailView.svelte` clean (the 19
remaining errors are the repo's pre-existing missing-dependency errors in files this
change never touched). `npm test` still cannot run here — Playwright's Chromium binary is
not installed; run `npx playwright install` and re-run before relying on the suite.

The runner now refuses to report ✔ for a run that ends with the task file unrenamed or
the tree dirty — it sends **⚠ did not finish** naming exactly what was left behind.
