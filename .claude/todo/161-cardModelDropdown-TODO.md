> Run with: Sonnet 5 / medium

# Pick the agent's model on the card, not in the card text

## Original Requirement

[NEVER REMOVE]

From Kaspar, 2026-09-06, after task 159 ran with the wrong model:

> "I created in TODO list card with content that had the top line: Sonnet 4.6 / medium
> but it started with Sonnet 5 medium. Where I can define models in what config file and
> how it's meant to be set the model currently? Shall be maybe in todo kanban board
> dropdown?"

---

## How it works today

The runner reads the task file's first line — `> Run with: Opus 5 / high` — and maps the
**family name only** (`fable` | `opus` | `sonnet` | `haiku`) to a `--model` flag. Version
numbers are ignored on purpose: `--model sonnet` always resolves to the current Sonnet, so
`Sonnet 4.6` and `Sonnet 5` are the same request. The tiers live in
`klarity-claude-kit/plugins/dev-kit/runner/src/classify.js`.

Task-014 writes that line into the file when a card enters the agent list, so the model is
chosen by typing prose into the card body. That is why 159 "ignored" its model: nothing was
wrong except that a version number can never do anything, and the effort suffix was being
dropped (fixed 2026-09-06 — `/ low` is now honoured).

## The task

Make the model a **field on the card**, not a line of prose.

1. **Schema.** Add `agent_model` and `agent_effort` to the todos table (nullable text,
   with a check constraint or an enum). Migration + metadata, applied through the Hasura
   CLI — pull the live metadata first, per this repo's rules.
2. **UI.** A small dropdown in `CardDetailView.svelte`: Model (Fable / Opus / Sonnet /
   Haiku / *auto*) and Effort (low / medium / high), defaulting to *auto*. No version
   numbers in the options — they are meaningless to the runner and only mislead.
3. **Server.** The task-014 writer emits `> Run with: <Model> / <effort>` from those
   columns when they are set, and omits the line entirely when the card says *auto*, so
   the runner's haiku classifier picks the tier as it does now.
4. **Back-compat.** A hand-typed `Run with:` line in the card body must keep working —
   the file is still the contract the runner reads.

## Verification

- [ ] Card with Model=Haiku, Effort=low → file's first line is `> Run with: Haiku 4.5 / low`
      and the runner's log says `(Haiku 4.5 / low)`
- [ ] Card left on *auto* → no `Run with:` line, classifier decides
- [ ] Existing cards with a hand-typed line are unaffected
- [ ] `npm run check` clean on touched files; migration applied to the hosted Hasura

## Note

`npm test` cannot run in the runner's environment — Playwright's Chromium binary is not
installed (`npx playwright install` fixes it). Worth sorting out separately; it is why
recent task logs say "could not run tests".
