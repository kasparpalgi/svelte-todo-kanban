> Run with: Sonnet 5.5 / medium

# Drop Vercel after the rollback week

## Original Requirement

[NEVER REMOVE]

Follow-up from #254 (parent #218). Original request (#254): "finish #218: copy the production
secrets to the `todzz` Worker, then attach `todzz.eu` / `www.todzz.eu` as its custom domains."

#254 moved `www.todzz.eu` and `todzz.eu` to the `todzz` Worker on **2026-11-17 09:23 UTC**.
The Vercel project (`crewnewgits-projects/svelte-todo-kanban`) was kept for a week as the
rollback. **Do not start before 2026-11-24.**

1. Check the week went well: Workers → `todzz` → Metrics (no error 1102 / exceeded CPU),
   and the app's `/en/logs` page has no new errors since the move.
2. Remove the `VERCEL` branch in `svelte.config.js` and uninstall `@sveltejs/adapter-auto`.
3. Grep for leftovers (`vercel`, `x-vercel`) and drop them. Update `CLAUDE.md` ("Vercel
   still builds too, but only as the rollback").
4. **Owner:** delete the Vercel project (or `vercel project rm svelte-todo-kanban` from the
   Mac, where the CLI is signed in to that account). Pushes to `main` keep building there
   until then.

**Rollback while Vercel still exists:** Cloudflare → `todzz.eu` → delete the two Worker custom
domains, then re-create `CNAME www → 8ccdd191c1282a57.vercel-dns-017.com` and
`A todzz.eu → 216.198.79.1` (both proxied). The apex → www Redirect Rule can stay.

_GitHub issue #255 — end the commit subject with `(#255)`._
