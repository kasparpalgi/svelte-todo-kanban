# Fix stale Playwright e2e specs

## Original Requirement

[NEVER REMOVE]

Follow-up from #209: `npm test` can't pass — Playwright fails 33 of 52 specs on unmodified main (34 in one run). From that run:

- `error-boundary.spec.ts` and others use `storageState: 'e2e/.auth/user.json'`, which doesn't exist (the setup project writes `playwright/.auth/user.json`).
- /signin now has email + password: strict-mode violations on `getByRole('textbox')` and `h1`, and 14 sign-in `locator.fill` timeouts.
- `todo-drag-reorder.spec.ts › reorders a card to the top with a mouse drag` is flaky (failed on main, passed on the #209 branch).

Fix the specs so the suite is green. Note: e2e runs against production Hasura with the test user.

_From Kanban card `829212ed-0cde-4275-9290-6a64f69ac7e1`._

_GitHub issue #212 — end the commit subject with `(#212)`._
