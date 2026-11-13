> Run with: Sonnet 5.5 / medium

# A card clicked right after quick-add doesn't open

## Original Requirement

[NEVER REMOVE]

Found in #232's live check. The `card-detail` e2e spec ("opens from the board without a full
loading state") fails on both www.todzz.eu (Vercel) and the Worker, every run when it runs alone.
It passes when the suite runs in parallel, which is slower.

Cause, reproduced on the Worker: right after quick-add the card's `data-todo-id` is still
`temp-<uuid>` (the optimistic row). Clicking the card then sets `?card=<alias>`, but no dialog
opens. Once `createTodo` returns (well under 3 s), the same click opens the dialog.

1. Decide what a click on a card that is still saving should do: open the dialog as soon as the
   real id arrives (preferred, it is what the user asked for), or ignore the click visibly.
2. Fix it in the app, not by adding a wait to the spec.
3. Keep the spec as the regression test.

**Done when (deploy + live check):** `E2E_BASE_URL=https://todzz.svelte-todo-kanban.workers.dev
npx playwright test e2e/card-detail.spec.ts` passes 3 runs in a row, and so does the same command
against https://www.todzz.eu after the Vercel deploy.

_GitHub issue #240 — end the commit subject with `(#240)`._
