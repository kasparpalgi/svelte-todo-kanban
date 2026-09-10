> Run with: Haiku 4.5 / low

# When card open, clicking outside doesn't close it

## Original Requirement

[NEVER REMOVE]

_(no description yet)_

_From Kanban card `3da49257-557b-48a5-999c-a1a2f979c177`._

_GitHub issue #168 — end the commit subject with `(#168)`._

---

## Analysis

- CardModal is at `src/routes/[lang]/[username]/[board]/CardModal.svelte`
- The backdrop click handler is `handleBackdropClick` (lines 57-61)
- Check: event.target === event.currentTarget to ensure click is on backdrop, not card content
- Issue: The condition might not properly detect backdrop clicks

## Plan

1. Run dev server and reproduce the issue
2. Debug the click handler behavior
3. Fix the backdrop click detection
4. Test and commit

---

## Log

### Initial Analysis
- CardModal has backdrop div (line 83-96) with `onclick={handleBackdropClick}`
- Inner card div (line 98-110) has `onclick={(e) => e.stopPropagation()}`
- The condition `event.target === event.currentTarget` looks correct
- Need to test if clicks on backdrop actually close the modal - remember to use for testing test@e-stonia.co.uk / Asdc1523!

## Results

The agent finished the run but never renamed the file, so the runner completed it. The tree was clean with nothing left to commit — see the `.log` beside this file for the full session.
