# Light board query: load comments on card open

## Original Requirement

[NEVER REMOVE]

Follow-up from #209.

The full board query is still heavy whenever it runs: on `tekdok` (334 active + 187 completed cards) GetTodos returns 2.25 MB + 1.27 MB (~10 s), mostly every card's comments (932 KB) and content (812 KB) from `TodoFields`. Since #209 the 30 s poll only pays this when the board's fingerprint changed (or every 5 min), but the first load and every change still do.

- Load the board with a light card fragment (what the card face shows + comment/upload counts) and fetch comments and full content when a card opens — `loadTodoDetails` exists for that.
- Keep search and filters working (check what they read).
- Add a `set_updated_at` trigger on `comments`: an edited comment doesn't change the board fingerprint today, so others see it only on the 5-min full refresh.

Measure before/after on tekdok.

_From Kanban card `3daf5515-3a52-4d2e-a657-df12a33274b3`._

_GitHub issue #211 — end the commit subject with `(#211)`._
