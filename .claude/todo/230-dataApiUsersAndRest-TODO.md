> Run with: Opus 5.5 / medium
> Machine: mac

# Data API: users and settings, notes, money, extras; then remove the browser GraphQL client

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high

# Data API: users and settings, notes, money, extras; then remove the browser GraphQL client

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`, sections 1, 5, 6 and 8. Needs `dataApiCards`first.

1. **Users:** GetUsers, UpdateUser, SearchUsers and GetUserByGithubUsername as ops. Other users get only `id, name, username, image`. **Then tighten Hasura's** `users` **select to** `id = X-Hasura-User-Id`: today any signed-in user can read every user's email and `settings` (226, Security). Move the encrypted tokens (`settings.tokens.github`, Google calendar) out of `settings` into a server-only `user_secrets` table, so a client settings save can never drop them (#193).
2. Notes (GetNotes, CreateNote, UpdateNote(s), DeleteNote, note uploads), money (clients, invoice companies, invoices, expenses), url shortcuts, push subscriptions, Claude usage, podcasts, tracker stats, news. Follow the owner's answer in 226, Decisions 3, for the dead features; archive their tables with `pg_dump` to R2 before dropping anything.
3. When nothing in `src/` imports `$lib/graphql/client`'s `request`, delete it along with `/api/auth/token`, the JWT minting and `ensureTokenForUser`. That also closes #224.

**Done when (deploy + live check):** check and tests pass. Deployed to Vercel and the Worker. Live as the test user: settings save (dark mode, locale); GitHub still connected after a settings save; notes CRUD; a short link redirects; the invoices and expenses pages load. A GraphQL query as the test user for another user's `email` returns nothing. The browser makes no request to `todzz.admin.servicehost.io` on any page.

*GitHub issue #230 — end the commit subject with* `(#230)`*.*

_From Kanban card `1c8f4a71-0e5b-40ce-86b8-3b9117b19d00`, moved to the agent list._

_GitHub issue #230 — end the commit subject with `(#230)`._
