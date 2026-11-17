> Run with: Opus 5.5 / high
> Machine: dell

# D1: user, settings, notes, money and extras

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high

# D1: user, settings, notes, money and extras

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #233 (plan: `.claude/todo/226-backend-DONE.md`). Original request (#226): "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

1. D1 versions of `getMe`, `updateMe`, `disconnectIntegration`, `getBoardPeople`(tokens live in `user_secrets(user_id, name, value)`, one row per name — see #230's handover in `232-d1SchemaAndCopy-DONE.md`), the notes ops, `clients`, `invoice_companies`, invoices, expenses, url shortcuts, push subscriptions and `getClaudeUsageCost`.
2. Contract cases for each, for every user that has rows.

**How (set up in #233):** write `src/lib/server/ops/d1/<file>.ts` with `D1Run<'<op>'>` (same input, and `tsc` enforces the Hasura return type), register it in `ops/d1/index.ts`, add relations in `src/lib/server/db/relations.ts`, unit-test on `migratedSqlite()` + `sqliteD1()` (`ops/d1/__tests__`), then add cases to `ops/d1/__contract__/contract.test.ts` and run it against a fresh local copy (`node scripts/d1/copy-from-postgres.mjs`, then `CONTRACT=1 npx vitest --run --project=server src/lib/server/ops/d1/__contract__`). Gotchas: D1 allows 100 bound parameters per statement (`inChunks`), LIKE patterns of at most 50 bytes (`contains` uses `instr`), never `await` a Drizzle builder you mean to use as a sub-select (it runs it), and never select one column twice in a `d1.batch()` (rows are mapped by name).

**Done when:** every contract case is equal, and the staging Worker answers these ops from D1. Production is deployed and still on Hasura.

*GitHub issue #257 — end the commit subject with* `(#257)`*.*

_From Kanban card `2345a92a-ab22-4f9e-855b-35aeb80c6eca`, moved to the agent list._

_GitHub issue #257 — end the commit subject with `(#257)`._

## Results

**Summary** — The last 37 ops have a D1 version, so **every op in `ops/index.ts` now runs on
D1**. The access rules are the same as the Hasura ops:
- Users (`ops/d1/users.ts`): `getMe`, `updateMe`, `disconnectIntegration`, `getBoardPeople`.
  `getMe` reads the user row and its `user_secrets` in one `d1.batch()`, then folds the
  secrets back into `settings.tokens`, redacted (`encrypted: true`). `updateMe` stores only
  the browser's own tokens (`groq`), so a settings save can never reach a server token (#193).
  `disconnectIntegration` deletes the `user_secrets` row.
- Notes (`ops/d1/notes.ts`): all 7 ops, with the NoteFields shape (author, board, images,
  subnotes). `reorderNotes` is one batch.
- Money (`ops/d1/money.ts`, `invoices.ts`): clients, invoice companies and invoices.
  `createInvoice` gets its totals from the cards' hours, and writes the invoice and its
  items (`inChunks`) in one batch. Every statement is scoped by `user_id`.
- Expenses (`ops/d1/expenses.ts`): board members only. The payer soft-deletes.
- Owned rows (`ops/d1/owned.ts`): URL shortcuts (a taken alias answers 400 on D1 too),
  push subscriptions (an upsert on `endpoint`) and `getClaudeUsageCost`
  (`round(sum, 10)`, as #256 did for cards).
- Relations for notes, invoices and expenses: `src/lib/server/db/ownedRelations.ts`.

**Files changed**
- Created: `src/lib/server/db/ownedRelations.ts`;
  `src/lib/server/ops/d1/{users,notes,money,invoices,expenses,owned}.ts`;
  `ops/d1/__tests__/rest.test.ts`; `ops/d1/__contract__/rest.test.ts`
- Modified: `db/index.ts` (registers the relations); `ops/d1/index.ts` (37 loaders);
  `ops/d1/__contract__/compare.ts` (`note_uploads`, `items` and `expense_splits` are
  compared as sets); `ops/d1/__tests__/boards.test.ts` (the 501 test now checks that every
  op has a D1 version); `ops/owned.ts` (`uniqueAlias` is exported and also reads the Drizzle
  error's `cause`); `ops/money.ts` (`vat_rate` is no longer nullable); `ops/notes.ts` and
  `graphql/documents.ts` + `generated/` (`id` tiebreaks, see Deviations);
  `scripts/d1/copy-from-postgres.mjs` (keeps an empty `settings.tokens`); `CLAUDE.md` (the
  `wrangler versions upload` probe line); `package.json` 0.45.0.

**Verification**
- `npm run check`: 0 errors. `npm run test:unit:all`: 671 passed, 21 skipped (the
  contract tests). The 10 new D1 unit tests run on migrated SQLite.
- Contract against production Hasura, on a fresh local copy (all 31 tables match). Every
  case is equal:
  - For every user (57): `getMe`, `getBoardPeople`, `getClients`, `getInvoiceCompanies`,
    `getInvoices`, `countInvoicesIssued`, `getExpenses`, `getUrlShortcuts`, and
    `getClaudeUsageCost` for 3 periods (plus a call for another user, which answers null).
  - For every board, as its owner and as the test user: `getNotes`, `getExpenses`,
    `getInvoices`, and `getTodosForInvoicing` with all the board's lists.
  - The older contracts (boards, sharing, runner, cards) still pass: 16 cases in total.
- `CONTRACT_WRITES=1`: every write op ran on both backends as the test user on tests-board,
  with a temporary list and card for the invoice. All equal. Each created row is undone in a
  `finally`. Production was checked afterwards and had no leftovers. The 2 soft-deleted
  test expenses were hard-deleted, and one client and one company left by an early failed
  run were deleted.
- Staging: other runs (#258, #259) were deploying `todzz-staging` at the same time. Their
  deploys replaced mine within seconds, twice. So I probed my build through a version
  preview, which doesn't change the live staging deployment: `wrangler versions upload
  --env staging` gave `b6257b2b`, served at
  `https://b6257b2b-todzz-staging.svelte-todo-kanban.workers.dev`. A signed-in probe as the
  test user (a session JWT signed with `AUTH_SECRET`) got 200 from D1 for all 37 ops,
  including a full write cycle with a billed invoice of 2 h × 30 = 60. It cleaned up after
  itself. The live staging Worker gets these ops with the next staging deploy from `main`.
- Production: still on Hasura. The push deploys it through CI.

**Deviations**
- On D1, `updated_at` changes on every update of users, clients, invoice companies,
  invoices and shortcuts (the schema's `$onUpdateFn`). Postgres has no trigger for those
  tables, so Hasura leaves it as it was. The write contract ignores `updated_at`.
- Both backends now break order ties by `id`: subnotes, the notes list, billable cards,
  clients, companies, shortcuts, invoices and expenses. Postgres had returned cards and
  subnotes with equal `sort_order` in any order.
- The copy now keeps a `settings.tokens` key, even when empty. Three users have
  `tokens: {}`, and without the key `getMe` would differ. The staging D1 data was not
  re-copied for this: it only affects those three users' `settings`.
- `vat_rate: null` now answers 400 instead of a database error (500). The column is NOT
  NULL on both backends, and the client never sends null.
