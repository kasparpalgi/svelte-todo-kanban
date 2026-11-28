> Run with: Opus 5.5 / high
> Machine: mac (D1 credentials in .env; the live migration is run from here)

# Tservo in the agent machine dropdown; Tambet pinned to it

## Original Requirement

[NEVER REMOVE]

From kasparpalgi/server todo 059 (2026-11-28):

> …when new card is created then can pick from machines dropdown also "Tservo".
> User tkrinal@gmail.com shall have in dropdown only that machine and Karel shall still have like now access only
> to Windows machine to run claude code and Kaspar all machines.

tservo (Tambet's PC, Omarchy) already runs a runner with `"machine": ["tservo", "tambet"]` and `"auto": false`
(klarity-claude-kit 0.40.0): it takes only `> Machine: tservo` tasks, never an Auto card.

_GitHub issue #268 — end the commit subject with `(#268)`._

## Plan

### 1. Code

- `src/lib/utils/agentMachine.ts`: `AGENT_MACHINES` gets `'tservo'` (before `'cloud'`). `PINNED` gets
  `'tkrinal@gmail.com': 'tservo'`. Karel stays `'windows'`. Everyone else (Kaspar) sees all machines.
- Locales `en`/`et`/`cs`: `card.agent_machine_tservo` = `Tambet Omarchy` (et: `Tambet Omarchy`, cs: `Tambet Omarchy`).
- `src/lib/server/db/schema/cards.ts`: the CHECK lists `'tservo'`.
- Hasura migration `hasura/migrations/default/<next>_add_tservo_to_agent_machine/{up,down}.sql`, same shape as
  `1809000000000_add_cloud_to_agent_machine`, for the frozen Postgres (#235). Applying it there is optional.
- Tests: `src/lib/utils/__tests__/agentMachine.test.ts` (the list, Tambet pinned, Karel still windows,
  `todoEditSchema` takes `tservo`, `buildTaskFile` writes `> Machine: tservo`), plus the schema test.

### 2. The D1 migration: DANGER

Production runs on D1 (`DATA_BACKEND=d1`, since #234). SQLite cannot change a CHECK constraint in place, so the
table has to be rebuilt. **9 tables reference `todos` with `ON DELETE CASCADE`**: `comments todo_assignees
todo_labels todo_subscribers uploads activity_logs notifications invoice_items claude_usage`. D1 cannot turn
foreign keys off, and `PRAGMA defer_foreign_keys = on` **does not stop cascades**
(https://developers.cloudflare.com/d1/sql-api/foreign-keys/). drizzle-kit's generated rebuild
(`CREATE __new_todos … DROP TABLE todos …`) would delete every child row. **Do not apply the generated SQL as it is.**

Suggested approach, to be proven on a copy first: with `PRAGMA legacy_alter_table = ON`, `ALTER TABLE … RENAME`
does not rewrite foreign keys in other tables. Then:

```sql
PRAGMA defer_foreign_keys = on;
PRAGMA legacy_alter_table = ON;
ALTER TABLE `todos` RENAME TO `todos_old`;   -- children still say REFERENCES `todos`
CREATE TABLE `todos` ( … same columns, new CHECK with 'tservo' … );
INSERT INTO `todos` SELECT * FROM `todos_old`;  -- name the columns explicitly
DROP TABLE `todos_old`;                       -- nothing references todos_old, so nothing cascades
-- recreate every index on todos (todos_user_id_alias_key, todos_list_id_idx, todos_github_issue_id_idx,
-- todos_github_issue_number_idx, todos_task_file_path_idx) and any trigger; check sqlite_master first
PRAGMA legacy_alter_table = OFF;
```

Check D1 accepts `legacy_alter_table` (its PRAGMA list). If it does not, find another way that provably keeps the
children. Never run a rebuild that depends on luck.

Steps:

1. `npx drizzle-kit generate --name todos_agent_machine_tservo` for the snapshot and journal, then hand-edit the
   SQL as above (as `0002_user_secrets_per_name.sql` was hand-edited).
2. **Local proof:** a local D1 with a copy of prod (`wrangler d1 export todzz --remote` → `--local` import, or
   `scripts/d1/copy-from-postgres.mjs`). Count rows in `todos` and all 9 children, apply, count again: every
   count must match. `PRAGMA foreign_key_check` must be empty. Insert `agent_machine='tservo'` (ok) and `'pi'`
   (refused).
3. **Staging:** the same on `todzz-staging` (`--env staging`), counts before and after.
4. **Production:** note the D1 Time Travel bookmark first (`npx wrangler d1 time-travel info todzz`) and write it
   into this file. Then `npx wrangler d1 migrations apply todzz --remote`, then the counts again. If any count
   drops, restore at once with `wrangler d1 time-travel restore todzz --bookmark <it>`.
5. Push (deploys the Worker). Live check: Kaspar's card dropdown lists Tservo; a card saved with it writes
   `> Machine: tservo`.

## Verification

- [ ] unit tests + `npm run check` green
- [ ] local copy: child row counts equal before/after, `foreign_key_check` empty
- [ ] staging: same
- [ ] production: Time Travel bookmark recorded, counts equal, `tservo` saves, `pi` refused
- [ ] Tambet's (`tkrinal@gmail.com`) dropdown shows only Tservo; Karel's only Karel Windows; Kaspar's all

## Results

**Summary** — `tservo` (shown as "Tambet Omarchy") is now in the agent machine dropdown, before Cloud.
`tkrinal@gmail.com` is pinned to it (dropdown shows only Tservo, and every card Tambet publishes is
written with `> Machine: tservo`). Karel is still pinned to Windows; everyone else (Kaspar) sees all
machines. The D1 `todos.agent_machine` CHECK takes `tservo`, migrated on local copy → staging → production
with no child row lost.

The planned `legacy_alter_table` route **does not work**: drizzle qualifies the CHECKs (`"todos"."priority"`),
and a legacy RENAME leaves them pointing at a table that no longer exists (`error in table todos_old after
rename: no such column: todos.priority`). Migration `0004` instead moves the old ids out of the way first:
the rows are copied to `todos_rows`, then `UPDATE todos SET id = '~' || id`. All 9 child FKs are
`ON UPDATE no action`, so nothing cascades. `DROP TABLE todos` then deletes rows no child points at, and the
rows go back under their real ids into the new `todos`, which reconnects the children (the deferred FK
count is back to 0 before commit). Run outside a transaction, the UPDATE fails the FK check and nothing
changes, so it fails safe.

**Production D1 Time Travel bookmark (taken before the migration):**
`000002c6-000000dd-00005131-97ef2eb0bcb17958f6a71b375965149e`
(restore: `npx wrangler d1 time-travel restore todzz --bookmark=000002c6-000000dd-00005131-97ef2eb0bcb17958f6a71b375965149e`).
Staging bookmark before: `00000021-00000006-00005131-8faf83ed9a6d2fb66baeccde20dcf19d`.

**Files changed**
- created `drizzle/0004_todos_agent_machine_tservo.sql` (hand-edited) + `drizzle/meta/0004_snapshot.json`,
  `hasura/migrations/default/1815000000000_add_tservo_to_agent_machine/{up,down}.sql` (not applied to the
  frozen Postgres)
- modified `src/lib/utils/agentMachine.ts`, `src/lib/server/db/schema/cards.ts`, `drizzle/meta/_journal.json`,
  locales `en`/`et`/`cs` `common.json`, `src/lib/utils/__tests__/agentMachine.test.ts`,
  `src/lib/server/db/__tests__/schema.test.ts` (migrations now run one transaction each, as on D1; new test:
  the 0004 rebuild keeps a comment, `foreign_key_check` stays empty, and deleting the card still cascades),
  `package.json` 0.49.1 → 0.50.0

**Verification**
- [x] unit tests + `npm run check`: 709 passed / 21 skipped, 0 type errors
- [x] local copy of prod (export loaded into a local D1 file, migration applied by wrangler/workerd): todos
  1948, comments 2253, assignees 1051, labels 37, uploads 17, activity_logs 12198, notifications 61,
  claude_usage 1177 (740 with a todo): same before and after. `todos` rows byte-identical (sha of every
  `quote()`d column), `foreign_key_check` empty, all 5 indexes back, `tservo` saves, `pi` refused
- [x] staging (`todzz-staging`): todos 1829, comments 2008, … all counts equal, `foreign_key_check` empty
- [x] production: bookmark recorded above, all 13 counts equal (todos 1948, comments 2253, …),
  `foreign_key_check` empty, 5 indexes + 9 child FKs intact, live CHECK contains `'tservo'`
- [x] live, after the deploy (`Deploy to Cloudflare` run 46159262722 green): as the test user (not pinned,
  like Kaspar) on https://www.todzz.eu the card dropdown lists Auto, Kaspar Mac, Karel Ubuntu, Dell Ubuntu,
  Karel Windows, **Tambet Omarchy**, Cloud; a card saved with it reloads as `tservo` (temp list deleted
  afterwards). Tambet's and Karel's pinned dropdowns are covered by unit tests (`pinnedMachine`, `withPin`
  → `> Machine: tservo` / `windows`); I can't sign in as them.

**Deviations** — the D1 migration uses the move-the-ids rebuild above, not `legacy_alter_table` (proven to
fail). `pi`-refused / `tservo`-saves were checked on the local copy (wrangler/workerd), not by writing to a
production card.
