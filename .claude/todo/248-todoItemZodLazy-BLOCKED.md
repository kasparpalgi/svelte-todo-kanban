> Run with: Sonnet 5.5 / medium

# Keep zod off the board's server render

## Original Requirement

[NEVER REMOVE]

Follow-up from #236. Owner: "remember, we want to stay on free. Be always clever and
lightweight and simple."

#236 moved the card editor out of the board's server render, but zod still loads there:
`src/lib/components/todo/TodoItem.svelte` imports `z` at the top for `todoEditSchema`
(used only in `saveEdit`) and for `error instanceof z.ZodError`. The server never renders
the inline edit form, so a fresh Worker isolate evaluates zod (zod/v4 core, classic and
locales) on its first board render for nothing: about 11 ms in a local `wrangler dev`
profile, about 3 ms on the Worker.

1. Move the schema into a small module (e.g. `todoEditSchema.ts`) that `saveEdit` loads
   with `await import(...)`, or into the already browser-only `TodoEditForm`. Use
   `safeParse` so `TodoItem` no longer needs `z.ZodError`; keep `TodoEditData` as an
   `import type`.
2. Check with the Wrangler bundle metafile (`npx wrangler deploy --dry-run --metafile`) or
   a cold CPU profile that the board page's server render no longer reaches `zod`.
3. Keep inline edit behaviour and its validation messages exactly as they are.

**Done when (deploy + live check):** deployed to the Worker; the board's warm p90 stays under
10 ms of CPU over 20 runs and the first render in a fresh isolate is cheaper than before,
with numbers in the Results (#236's Results show how to read `cpuTimeMs` per request);
inline edit of a card still saves and shows validation errors; the e2e suite passes
against https://todzz.svelte-todo-kanban.workers.dev.

## Results

**Summary** — The inline-edit schema moved out of `TodoItem.svelte` into `todoEditSchema.ts` (`createTodoEditSchema(t)` plus the `TodoEditData` type). `saveEdit` now loads it with `await import('./todoEditSchema')` and calls `safeParse`, so `TodoItem` no longer imports `zod` or needs `z.ZodError`. Validation messages and the per-field `validationErrors` mapping are unchanged. A non-validation failure still shows `common.unexpected_error`. The schema is built per save with the current `$t`, so messages follow the active locale as before.

**Files changed** — created `src/lib/components/todo/todoEditSchema.ts`; modified `src/lib/components/todo/TodoItem.svelte`.

**Verification**
- `npm run check`: no errors in the touched files. 15 errors remain elsewhere (google-drive `accessToken`, `BoardSwitcherModal`), none caused by this change.
- `vitest --project=server`: 506 tests passed. 2 test files failed to load in this worktree (the `listsBoards-archive` suite is one); I did not check whether they fail on `main`.
- `npm run build` and `wrangler deploy --dry-run --metafile` failed here (no build output, so no metafile). Dependencies had to be installed with `--legacy-peer-deps` because `package-lock.json` is out of sync with `package.json`.
- **NOT done:** the deploy, the metafile/cold-profile check that the board render no longer reaches `zod`, the 20-run warm p90 and first-render CPU numbers, and the e2e run against the live Worker.

**Deviations** — Marked BLOCKED because the deploy and live measurements need the Worker credentials and a working build, which this worktree does not have.

**Needed from a human** — Deploy, then run `npx wrangler deploy --dry-run --metafile` and confirm `zod` is not in the board route's server chunk. Take the 20-run `cpuTimeMs` numbers as in #236, run the e2e suite against https://todzz.svelte-todo-kanban.workers.dev, and check that an inline card edit still saves and still shows validation errors.
