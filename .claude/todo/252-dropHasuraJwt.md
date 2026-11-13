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
