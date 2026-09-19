# When I create new lists then they disappear after some time

## Original Requirement

[NEVER REMOVE]

I think not saving to DB

_From Kanban card `65351e55-cdfd-4eb8-9464-7147ef5a9f4e`._

_GitHub issue #199 — end the commit subject with `(#199)`._


## Plan & Log

- Root cause: `listsStore.loadLists` used `GET_LISTS` default `limit: 100` ordered by `sort_order`, so once >100 lists are visible, newly created lists (highest sort_order) are dropped on reload. Create itself does persist (`CREATE_LIST` -> `insert_lists`).
- Fix: `loadLists` passes `limit: 10000`; `createList` computes `sort_order` from lists of the target board only.
- Not verified live in browser (no repro data checked); verified via `npm run check` / tests below.
