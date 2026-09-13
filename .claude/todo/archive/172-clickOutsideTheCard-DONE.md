# Click outside the card shall close it

## Original Requirement

[NEVER REMOVE]

168 was meant to do: When card open, clicking outside doesn't close it

_From Kanban card `028c4102-425b-4a54-9de9-090cb5987cc2`._

_GitHub issue #172 — end the commit subject with `(#172)`._

---

## Analysis

- `src/routes/[lang]/[username]/[board]/CardModal.svelte` renders 3 nested divs:
  1. outer backdrop (`fixed inset-0`, has `onclick={handleBackdropClick}`)
  2. middle wrapper (`fixed inset-4 ... overflow-auto`, **no click handler, no stopPropagation**)
  3. inner card content (`mx-auto max-w-4xl`, `onclick={(e) => e.stopPropagation()}`)
- Bug: `handleBackdropClick` checked `event.target === event.currentTarget`. Clicking in the
  padded area of the middle wrapper (visually looks like backdrop, but is inside `inset-4`)
  bubbles up to the outer handler with `event.target` = the middle wrapper div, not the outer
  div — so the equality check fails and the modal doesn't close. Only clicks landing directly
  on the outermost div (outside `inset-4`) worked.

## Fix

- Changed `handleBackdropClick` to use `!target.closest('[data-card-modal]')` instead of the
  strict target/currentTarget equality check. Any click that isn't inside the actual
  `[data-card-modal]` card element now closes the modal, regardless of which wrapper div it
  landed on.

## Result

- `npm run check`: no errors related to `CardModal.svelte` (10 pre-existing errors/warnings in
  unrelated files: `og-image/+server.ts`, `Line.svelte`, `TodoFiltersSidebar.svelte`).
- Verified manually with Playwright: signed in as `test@e-stonia.co.uk`, created a temporary
  list + card, opened the card modal, clicked in the gap area outside the card but inside the
  modal's padded wrapper — modal now closes correctly. Removed the temporary list/card afterward.
- Committed to `main` per project convention.
