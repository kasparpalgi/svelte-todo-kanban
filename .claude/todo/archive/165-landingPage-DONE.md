# Landing page

## Original Requirement

[NEVER REMOVE]

> At src/routes main page there's landing page of telling what this does.
>
> Create a subpage about the cool agentic development flow we just created and shorlt mention
> it on the main page then lin there, too.
>
> Also, see if voice input and browser extension to save stuff from web here and the notes
> taking is mentioned. MAke the website up to date. It might be multi-todo session task so
> then create followup todo files.

Also covers issue #158 — "Agentic coding section -> how it works with screenshots".

---

## Results

**Summary** — New `/workflow` subpage on todzz.eu describing the agentic development loop,
plus a "Capture It Anywhere" section on the landing page that links to it.

**Answering the question in the prompt** — of the three things asked about, only one was on
the site at all, and only as a buried checklist item:

| Feature | Before | Now |
| --- | --- | --- |
| Voice input | "Voice + AI note taking" — one of 18 items in the All Features checklist | Feature card on the landing page + opening section of `/workflow` |
| Browser extension | Not mentioned anywhere | Feature card, checklist item, and a section on `/workflow` |
| AI note taking | Same buried checklist item | Feature card + `/workflow` section |
| Agentic dev flow | Not mentioned anywhere | Its own page, linked from the landing page |

**`/workflow`** tells the loop end to end, using only what has actually been built:
card → `doc/todo/NNN-slug.md` + synced GitHub issue → `/plan` pass → move to TODO renames to
`-TODO.md` and the local runner starts Claude Code on it → push notification / ping when it
asks something → agent writes results, pushes, card moves itself to Review or Blocked with
the outcome as a comment. Ends with an honest "What you need" list (GitHub-connected board,
Claude Code + dev-kit plugin, the runner daemon) and a note that the agent runs on the user's
own machine with their own key.

**Files changed**
- Created: `src/routes/workflow/+page.svelte` (215 lines)
- Modified: `src/routes/+page.svelte` — "Capture It Anywhere" cards, the agentic-flow callout
  linking to `/workflow`, and two new All Features entries
- Modified: `package.json` — 0.13.1 → 0.14.0

**Verification**
- `npm run check` — 9 errors / 4 warnings in 7 files, all pre-existing and none in the two
  files touched here (baseline unchanged)
- `npm run test:unit:server` — 180/180 pass
- `npx prettier --check` on both files — clean, and `git diff --stat` confirms no whole-file
  rewrite
- Browser at 1280px — both pages render in dark mode, no console errors, the landing-page
  button reaches `/workflow`

**Deviations**
- Icons use `lucide-svelte`, not `@lucide/svelte`. First draft used the latter; the repo uses
  `lucide-svelte` in 66 files against 2, and mixing both on one page broke hydration in dev.
- **No screenshots yet.** Issue #158 asks for them and the repo only has `docs/screenshot.png`
  (the board). Shots of the runner in tmux, the phone push and a card moving to Review need a
  human with the daemon running — filed as `166-workflowScreenshots.md`.
- Built as one page rather than split across sessions, so no other follow-up files.
