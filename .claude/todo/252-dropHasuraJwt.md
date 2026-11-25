> Run with: Sonnet 5.5 / medium

# Drop the Hasura JWT once extension 1.3.0 is live

## Original Requirement

[NEVER REMOVE]

Follow-up from #231 (parent #226). Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Only after the Chrome Web Store has published extension **1.3.0** (which calls
`/api/data/*`, #231). Version 1.2.0 still sends the token to Hasura.

- `/api/auth/token` keeps minting the 24 h token the extension uses (verified by
  `src/lib/server/extensionToken.ts`), but drops the `https://hasura.io/jwt/claims` block:
  `sub` is all `/api/data` reads. Rename it to something like `/api/extension/token` only
  if `/extension-auth` and `chrome-extension/lib/auth.js` move with it (a store release).
- Remove the Hasura `user` role's remaining permissions and Hasura's JWT secret config.
- Drop `jsonwebtoken` from `package.json` if anything still lists it.

**Done when:** deployed; the store-installed extension still lists boards and saves a
note; a GraphQL request with a user token to Hasura is refused.

_GitHub issue #248 — end the commit subject with `(#248)`._

## Chain off Hetzner (owner, 2026-11-25)

The owner asked (during #263): "once done make the next TODO task to be picked up by runner and
instruct all the following tasks to do the same so one by one all done until everything away
from Hetzner". So when this task ends, **queue the next one yourself** in the same commit as your
rename, by renaming its file to `-TODO.md` (a suffixless `NNN-slug.md` or a `-BLOCKED.md` alike).
The order:

1. `263-d1GithubWebhook` — the webhook on D1 (done 2026-11-25)
2. `264-d1GithubRoutes` — the other GitHub routes on D1
3. `265-d1BillingKeysCalendar` — Stripe, API keys and Google Calendar on D1 (runs beside 264)
4. `234-d1CutOver` — after **both** 264 and 265 are `-DONE`. The owner's chain request is the
   go-ahead for the cut-over moment that file asks for.
5. `252-dropHasuraJwt` — needs Chrome extension 1.3.0 live in the Web Store
6. `235-hasuraDecommission` — 7 days after the cut-over; the owner deletes the Hetzner apps

Rules:
- Queue the first unfinished task in the list whose prerequisites are all met. 264 and 265
  run side by side: whichever finishes second queues 234. If the other one isn't `-DONE`
  yet, queue nothing.
- If the next step needs something only a person can give (the extension in the Web Store,
  the 7 days after the cut-over), don't queue it. Finish `-BLOCKED.md`, and give the exact
  date or action in the Results.
- Copy this whole section into any follow-up file you split off, so the chain carries on.
