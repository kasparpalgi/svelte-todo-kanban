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

- [x] Card with Model=Haiku, Effort=low → file's first line is `> Run with: Haiku 4.5 / low`
      and the runner's log says `(Haiku 4.5 / low)` — covered by `taskfile.test.ts` (the
      runner-log half can't be checked from this repo; classify.js already prints the
      resolved label, unchanged by this task).
- [x] Card left on *auto* → no `Run with:` line, classifier decides
- [x] Existing cards with a hand-typed line are unaffected
- [x] `npm run check` clean on touched files; migration applied to the hosted Hasura

## Note

`npm test` cannot run in the runner's environment — Playwright's Chromium binary is not
installed (`npx playwright install` fixes it). Worth sorting out separately; it is why
recent task logs say "could not run tests".

---

## Work log — 2026-09-06

**Schema.** Pulled live metadata (`hasura metadata export`, clean diff) before touching
anything, per repo rules. Added migration
`hasura/migrations/default/1788688460533_add_agent_model_effort_to_todos`: two nullable
`text` columns on `public.todos` — `agent_model` (check: fable/opus/sonnet/haiku) and
`agent_effort` (check: low/medium/high). Applied with `hasura migrate apply` against the
hosted instance (`todzz.admin.servicehost.io`), then added both columns to the `user` role's
insert/select/update permission column lists in
`metadata/databases/default/tables/public_todos.yaml` and ran `hasura metadata apply` —
confirmed consistent afterward.

**GraphQL.** Added `agent_model` / `agent_effort` to `TodoFields` in `documents.ts`, ran
`npm run generate`. Reused the existing generic `UPDATE_TODOS` mutation rather than adding a
new one — it already accepts an arbitrary `_set`.

**UI.** `CardDetailView.svelte`: two new `<select>`s next to the existing Priority dropdown,
`Model` (auto/Fable/Opus/Sonnet/Haiku) and `Effort` (auto/low/medium/high), both defaulting
to `null` (auto). Wired into the same `editData` / `fieldSnapshot` / auto-save path task 159
built, and into the explicit `saveTodo()` mutation call. Added the four option labels to
`todoEditSchema` in `cardHelpers.ts` (zod strips unknown keys by default, so the fields would
otherwise vanish before the save request). New i18n keys (`card.agent_model_*`,
`card.agent_effort_*`) added to `en`, `et`, and `cs` locales — matched the existing tone of
each file's priority labels rather than machine-translating.

**Server.** `taskfile.ts`: kept `runWithLabel()` (and its test contract — defaults to Sonnet
on no match) as the low-level prose scanner, but added `detectRunWith()`, the same regex
logic returning `null` instead of defaulting, and a new `resolveRunWith(card, body)` used by
both `buildDraftFile` and `buildTaskFile`: card fields win when `agent_model` is set (effort
defaults to `medium` if unset), else it falls back to `detectRunWith` on the card's own text
(the pre-existing hand-typed-line behavior), else `null`. Both builders now splice the
`> Run with:` line in only when non-null, so an all-auto card gets no line at all — the
runner's classifier decides, as it did before any tier was ever named. `TaskCard` gained the
two optional fields.

**Tests.** Updated `taskfile.test.ts`: the two existing "defaults to Sonnet" assertions on
`buildDraftFile`/`buildTaskFile` no longer hold (that was the exact prose-guessing behavior
this task replaces), so I changed them to assert the line is *absent* for a plain card, and
added cases for auto, hand-typed back-compat, field-priority-over-prose, and effort
defaulting to medium. `runWithLabel`'s own tests are untouched — it still defaults to Sonnet,
since it's kept only as the pre-existing public helper.

**Verification.** `npx vitest run src/lib/server/__tests__/taskfile.test.ts` — 23/23 pass.
`npm run test:unit:server -- --run` — 150/150 pass (this is the non-Playwright half of the
suite; the `client` project still can't run here for the pre-existing reason noted below).
`npm run check` — 19 errors/4 warnings, identical count and files to a `git stash` baseline
run before any of these changes (all pre-existing, unrelated missing-module issues in
`transcribe-podcast`, `charts/Line.svelte`, `penon`, `podcasts` — nothing in a file this task
touched).

Not done from this repo: the runner-log assertion in the first verification item, and
confirming task-014's *other* repo half (`klarity-claude-kit`) reads these same card fields
when it writes the file — task-014 already lives in *this* repo as `taskfile.ts`/
`write-task-file`, so that half is done; only the runner's own log-line format
(`classify.js`, in `klarity-claude-kit`) is untouched, since it's unaffected by this task —
it just prints whatever label preceded it.

## Follow-up — 2026-09-06

Re-opened via `/todo 161`. Found the implementation already committed (`e03678a`) and the
working tree clean — all schema/GraphQL/UI/server/test work described above was already done
in a prior session, just left with the `-TODO` suffix. Verified `agent_model`/`agent_effort`
are present in `taskfile.ts` and the migration exists on disk; re-ran
`taskfile.test.ts` (23/23 pass). Renamed the file to `-DONE` to match this repo's convention
(no further code changes needed).
