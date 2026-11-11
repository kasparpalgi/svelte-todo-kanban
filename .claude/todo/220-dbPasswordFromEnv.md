> Run with: Sonnet 5.5 / low

# Take the Postgres password out of Hasura metadata in git

## Original Requirement

[NEVER REMOVE]

Follow-up from #215 (move Todzz to Cloudflare, fit the free plan). Original request:
"Think how to move to Cloudfare and fir there on the free plan. Or Supabase free plan? …
Is Hasura really needed?"

`hasura/metadata/databases/databases.yaml` holds the production Postgres connection, password
included, in plain text, and it is committed to git. The host (`srv-captain--todzz-db`) is
internal to CapRover, so it is not directly reachable from outside. It is still a leaked secret.

**Needs a human** (on the CapRover box): rotate the `postgres` password, then set
`HASURA_GRAPHQL_DATABASE_URL` on the Hasura app to the new URL.

1. Change `databases.yaml` to `database_url: { from_env: HASURA_GRAPHQL_DATABASE_URL }`. Run
   `hasura metadata apply` only **after** the env var is set on the server, or Hasura loses its
   database.
2. Make sure `hasura/docker-compose.yml` sets the same variable for local dev (it already does).

_GitHub issue #220 — end the commit subject with `(#220)`._
