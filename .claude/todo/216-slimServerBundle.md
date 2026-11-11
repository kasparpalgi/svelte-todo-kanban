> Run with: Sonnet 5.5 / medium

# Slim the server bundle: drop googleapis and the Playwright routes

## Original Requirement

[NEVER REMOVE]

Follow-up from #215 (move Todzz to Cloudflare, fit the free plan). Original request:
"Think how to move to Cloudfare and fir there on the free plan. Or Supabase free plan? …
Is Hasura really needed?"

A trial Cloudflare build gave a 37.9 MB Worker, 2.17 MB gzipped against the 3 MB Free limit,
and **`googleapis` accounts for 30.1 MB of it**. The bundle does not build at all until
Playwright is stubbed. Both fixes help on Vercel too (smaller bundle, faster cold starts), so
this ships before the move.

1. Replace `googleapis` with plain `fetch` calls to the Google REST APIs in:
   - `src/routes/api/calendar-event/+server.ts` (events insert/patch/delete)
   - `src/routes/api/google-calendar/callback/+server.ts`
   - `src/routes/api/google-drive/list/+server.ts`, `.../download/+server.ts`
   - `src/routes/api/google-sheets/create/+server.ts`

   The OAuth token exchange and refresh already use `fetch` (`oauth2.googleapis.com/token`), so
   only the API calls change: `Authorization: Bearer <token>`. Put one small helper in
   `src/lib/server/google.ts`, then remove `googleapis` from `package.json`.
2. Delete `src/routes/[lang]/[username]/[board]/og-screenshot.png/+server.ts` and
   `src/routes/api/og-image/+server.ts`. They launch Chromium through Playwright, no UI links to
   them (the board page uses the SVG `og-image.png` route), and Vercel has no Chromium either.
3. Check: `npm run check` and the unit tests pass. Calendar sync, the Drive picker and Sheets
   export still work against your Google account (manual test, listed in Results).
