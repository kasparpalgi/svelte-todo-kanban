> Run with: Sonnet 5.5 / low

# Store the app's own uploads in Cloudflare R2 instead of Backblaze B2

## Original Requirement

[NEVER REMOVE]

Follow-up from #215 (move Todzz to Cloudflare, fit the free plan). Original request:
"Think how to move to Cloudfare and fir there on the free plan. Or Supabase free plan? …
Is Hasura really needed?"

R2 Free gives 10 GB, 1M writes and 10M reads a month, and egress is free. The `.env` already
holds the app's R2 keys (`CLOUDFARE_ACCESS_KEY_ID`, `CLOUDFARE_SECRET_ACCESS_KEY`,
`CLOUDFARE_S3_API_ENDPOINT`). `src/lib/server/r2.ts` already uploads to a user's own R2 (#194).

1. In `src/lib/server/storeFile.ts`, change the fallback when the owner has no R2 of their own
   from `uploadStreamToBackblaze` to `uploadToR2` with the app's credentials. You need a bucket
   name and a public base URL (an `r2.dev` URL or a custom domain). **Ask the owner if neither is
   in `.env`.**
2. Only 19 uploads exist. Leave their B2 URLs as they are, so nothing breaks, and keep
   `upload.ts` until those are copied over or no longer needed.
3. Add the new env names to `.env.example`. Check: unit tests for `storeFile` and one real upload.

_GitHub issue #219 — end the commit subject with `(#219)`._

_From Kanban card `656dcd1a-caa0-4965-999d-58ba4f172722`, moved to the agent list._
