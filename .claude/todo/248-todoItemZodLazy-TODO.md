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
