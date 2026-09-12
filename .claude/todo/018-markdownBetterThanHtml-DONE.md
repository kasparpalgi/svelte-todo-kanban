> Run with: Opus 5 / max

# Markdown better than HTML

## Original Requirement

[NEVER REMOVE]

Make wysiwy editor Md but still rich text

_From Kanban card `016443e0-0af2-4cfd-8f9d-4a41f7b0bb13`, moved to the agent list._

_GitHub issue #18 — end the commit subject with `(#18)`._

---

## Analysis

**Today the editor is HTML-native.** `RichTextEditor.svelte` builds a Tiptap editor and every
call site pulls `editor.getHTML()` and writes that string into the DB:

| Call site | Line | What it stores |
|---|---|---|
| `src/lib/components/todo/CardDetailView.svelte` | 204 | `todos.content` |
| `src/lib/components/todo/TodoEditForm.svelte` | 122 | `todos.content` |
| `src/lib/components/notes/NoteEditor.svelte` | 94 / 144 / 193 | `notes.content` |

Downstream, that HTML has to be un-HTML'd again everywhere it is used:

- `src/lib/utils/stripHtml.ts` → card preview text (`TodoItem.svelte:524`)
- `src/lib/server/taskfile.ts` `toText()` → `.claude/todo/NNN-*.md` task files
- `src/routes/api/ai/plan/+server.ts` `htmlToText()` → AI prompt context
- `src/routes/api/ai/task/+server.ts` → strips tags for context, and *asks the model for HTML*
- GitHub issue bodies (`todos.store.addTodo` → `/api/github/create-issue`) get raw HTML posted
  into a field GitHub renders as **Markdown** — so `<p>`/`<ul>` show up as literal tags.
- `/api/github/import-issues` already writes the issue's **Markdown** body straight into
  `todos.content`, so the column is *already* mixed HTML/Markdown today.

Markdown is the better storage format here: it is what GitHub, the task files and the agent
runner all actually consume, and it survives round-tripping through plain-text tools.

### Approach

Keep Tiptap (WYSIWYG stays WYSIWYG) and change only the **serialization boundary**, using
`tiptap-markdown` (`^0.9.0`, peer `@tiptap/core ^3.0.1`). It patches `setContent` /
`insertContentAt` to parse Markdown and adds `editor.storage.markdown.getMarkdown()`.
Note: upstream is in maintenance mode (README points at Tiptap's paid Conversion extension),
but it is MIT, stable, small in scope, and the only free Tiptap-v3 Markdown layer.

**Backwards compatibility** is the crux — the DB is full of HTML. `Markdown.configure({ html: true })`
makes markdown-it pass raw HTML straight through, so a legacy `<p>Do <b>this</b></p>` card still
loads into the editor exactly as before. The first save after opening rewrites it as Markdown.
No migration needed; no data loss either way.

## Implementation Plan

1. `npm i tiptap-markdown` — done.
2. `src/lib/components/editor/RichTextEditor.svelte`: register `Markdown.configure(...)`
   (`html: true` for legacy content, `linkify: false` so round-trips stay byte-stable and
   don't trigger phantom autosaves, `transformPastedText/transformCopiedText: true` so pasted
   Markdown becomes rich text and copied rich text comes out as Markdown).
3. New `src/lib/utils/markdown.ts` — pure, node-testable helpers:
   - `isHtmlContent(s)` — legacy detection
   - `markdownToPlainText(md)` — strip Markdown syntax
   - `toPlainText(s)` — dispatch HTML → `stripHtml`, else `markdownToPlainText`
   - `getEditorMarkdown(editor)` — `storage.markdown.getMarkdown()` with a `getHTML()` fallback
4. Swap `getHTML()` → `getEditorMarkdown()` at the three save sites above (5 occurrences).
5. `TodoItem.svelte` card preview: `stripHtml` → `toPlainText`.
6. AI endpoints emit/consume Markdown instead of HTML (`/api/ai/plan`, `/api/ai/task`).
7. `src/lib/server/taskfile.ts`: `toText()` keeps its HTML branch for legacy cards; Markdown
   passes through untouched (which is the point — task files finally get real Markdown).
8. Tests: unit tests for `markdown.ts`, update `taskfile.test.ts` expectations if needed.
9. `npm run check` + `npm test`.

## Changes

- `package.json` — added `tiptap-markdown@^0.9.0`.
- `src/lib/components/editor/extensions.ts` **(new)** — the Tiptap extension set, lifted out of
  the component so tests exercise exactly what the app mounts. Holds the `Markdown` config plus
  three fixes found while testing (below).
- `src/lib/components/editor/RichTextEditor.svelte` — now just mounts `createEditorExtensions()`
  (83 lines, down from 121).
- `src/lib/utils/markdown.ts` **(new)** — `isHtmlContent`, `markdownToPlainText`, `toPlainText`,
  `getEditorMarkdown`.
- `CardDetailView.svelte`, `TodoEditForm.svelte`, `NoteEditor.svelte` — save via
  `getEditorMarkdown()` instead of `getHTML()` (5 call sites).
- `TodoItem.svelte` — card preview uses `toPlainText` so Markdown bodies don't leak `##`/`**`.
- `src/lib/server/taskfile.ts` — `toText()` detects legacy HTML with `isHtmlContent`; Markdown
  bodies now reach task files verbatim instead of being run through the tag stripper.
- `src/routes/api/ai/plan/+server.ts`, `src/routes/api/ai/task/+server.ts` — prompt for Markdown
  instead of HTML; context flattening goes through `toPlainText`.
- Tests **(new)**: `src/lib/utils/__tests__/markdown.test.ts` (16),
  `src/lib/components/editor/__tests__/markdownRoundTrip.svelte.test.ts` (11, real Chromium),
  `RichTextEditor.svelte.test.ts` + `EditorHarness.svelte` (4, mounts the real component).
  Two cases added to `src/lib/server/__tests__/taskfile.test.ts`.

### Three bugs the round-trip tests turned up

1. **Checklists serialised loose.** tiptap-markdown only teaches `bulletList`/`orderedList` about
   tightness, so every save of a checklist inserted a blank line between items. Fixed with a
   `tight` global attribute for `taskList` (`TightTaskLists`).
2. **Mixed bullet/checkbox lists grew a phantom empty checkbox.** markdown-it flags the whole
   `<ul>` as a task list once any item is a checkbox, but Tiptap's `taskList` accepts only
   `taskItem`s, so ProseMirror wedged an empty `- [ ]` in front. Common shape in imported GitHub
   issue bodies. Fixed by splitting such a list into consecutive runs (`splitMixedTaskLists`).
3. **`insertContent` left a stray space in checklist items** (`- [ ]  step`). markdown-it renders
   `<input> text`; removing the checkbox leaves the separator, and `insertContentAt` parses with
   `preserveWhitespace`. Hits the AI button, voice input and markdown paste. Fixed in
   `markTaskItems`.

## Verification

- [x] `npm run check` — 10 errors, 6 warnings: **identical to the pre-change baseline**
      (measured by stashing the diff and re-running). None in the touched files.
- [x] `npx vitest run` — **269 passed / 21 files**, up from 263/20.
- [x] Real-browser verification: the round-trip and component suites run in headless Chromium
      against the actual `RichTextEditor` and the actual extension set, asserting the exact
      strings that get written to the DB.
- [x] `vite build` succeeds.
- [ ] Hasura console DB check — **not done, deliberately**: `PUBLIC_API_ENV="production"` in
      `.env`, so the local dev server talks to the production Hasura
      (`todzz.admin.servicehost.io`); the local Postgres container has no app tables. Writing a
      test card through the UI would have written to production, so I stopped. (The one write I
      attempted was rejected by a FK violation — the test session's user id doesn't exist there —
      so nothing was created.)
- [ ] `npm run test:e2e` — **4 pre-existing failures**, unchanged by this work. `auth.setup.ts`
      looks for the raw Auth.js `div.provider` "Sign in with Test Login" block, but `/` now
      renders the custom sign-in page, so the setup project fails and 38 authenticated specs
      never run. Confirmed identical on a clean tree (`git stash` + same run). Worth its own task.

### Bundle cost

The editor lives in a lazily-loaded route chunk. markdown-it + prosemirror-markdown +
markdown-it-task-lists add **+53 KB gzip** to it (198 KB → 251 KB gzip; 712 KB → 844 KB raw).
Nothing is added to routes that don't mount an editor.

## Results

**What works**
- Card and note bodies save as Markdown; the editor stays fully WYSIWYG.
- Legacy HTML bodies still open correctly and are rewritten as Markdown on the next real edit —
  no migration, and opening a card does not by itself rewrite it (autosave fires on the editor's
  `update` event, not on a content diff).
- Pasted Markdown becomes rich text; copied rich text comes out as Markdown.
- GitHub issue bodies, task files and AI prompts now carry real Markdown instead of tag soup.

**Known issues / notes**
- `tiptap-markdown` upstream is in maintenance mode (its README points at Tiptap's paid
  Conversion extension). MIT, small, pinned, and the three defects above are patched in our own
  config rather than upstream — but a Tiptap v4 upgrade will need a plan.
- A mixed bullet/checkbox list is stored as two adjacent lists, since the editor cannot represent
  one list holding both. Round-trip stable.
- `linkify` is deliberately off: auto-linking bare URLs on parse would make load→serialise
  non-idempotent and trip the autosave timers.

## Log

- Read all content producers/consumers; confirmed `todos.content` is already a mixed
  HTML/Markdown column because of GitHub issue import.
- Installed `tiptap-markdown@0.9.0`; read its source to confirm `setContent`/`insertContentAt`
  patching, `html: true` passthrough, and built-in TaskList/TaskItem Markdown specs.
- Wrote the round-trip suite first; it immediately caught the loose-checklist and phantom-checkbox
  bugs, and the insert-path suite caught the stray space. All three fixed in `extensions.ts`.
- Measured `npm run check` and the bundle against a stashed baseline so the numbers are deltas,
  not absolutes.
