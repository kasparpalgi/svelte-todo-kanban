> Run with: Opus 5.5 / high
> Machine: mac

# todzz move

## Original Requirement

[NEVER REMOVE]

see if everything todzz related can be finally deleted from hetzner and if not then make move that, too

_From Kanban card `477a6b4b-baf5-4b6f-81ad-172d0c7661b9`, moved to the agent list._

_GitHub issue #253 — end the commit subject with `(#253)`._

## Results

**Summary** — **No, todzz can't be deleted from Hetzner yet.** Production still runs on it. I
did the next piece of the move instead: slice **241**, which puts lists, labels, members and
invitations on D1.

What todzz still has on the Hetzner box (`servicehost`, 65.109.175.163, CapRover), checked 2026-11-15:

| CapRover app / item | What it is | Can it go? |
| --- | --- | --- |
| `srv-captain--todzz` | Hasura v2.48.5, at `api.todzz.eu` and `todzz.admin.servicehost.io` | **No.** It served 1,377 production requests in about 4.5 hours (from Vercel, via `api.todzz.eu`), plus the runner from your own network |
| `srv-captain--todzz-db` | Postgres 15, volume `captain--todzz-db-data` (169 MB) | **No.** It is the live database. Only `srv-captain--todzz` connects to it |
| nginx sites `api.todzz.eu`, `todzz.admin.servicehost.io` | CapRover's domains for that app | They go when the app is deleted |
| `iot.todzz.eu` on the `iot` app (mosquitto) | Your MQTT broker on a todzz.eu name, not part of the Todzz app | Not part of this task, left alone. Keep its DNS record when todzz.eu moves |

There are no todzz cron jobs or backup scripts on the box. Nothing else there reads the todzz database.

**Why it can't be deleted yet** (unchanged since #234/#235): www.todzz.eu is still Vercel
(`x-vercel-id`), and Vercel can't use D1. Most ops and server routes, plus Auth.js, still read Hasura.
The runner and the extension also still call Hasura directly.

**What got built this run: slice 241** (see `241-d1OpsBoardsRest-DONE.md`). The 16 list,
label, member and invitation ops now have D1 versions, and the contract runs against
production show the same output on both sides for every user and every board, writes
included. With the boards, logs and poll ops already done, 24 of the 81 ops now run on D1.
Also deployed to `todzz-staging`.

**Steps left before Hetzner can be emptied, in order:**
1. **You:** finish #218: copy the production secrets to the `todzz` Worker, then attach
   `todzz.eu` / `www.todzz.eu` as its custom domains.
2. **You:** #231 / #246: `RUNNER_API_TOKEN` in production, extension 1.3.0 submitted, and
   merge `runner-api-246` in klarity-claude-kit once each runner's `config.json` has the token.
3. **Queue from the Backlog** (code work a runner can do, one session each): 242 cards,
   243 users and the rest, 244 server routes, 245 Auth.js on D1 plus the staging e2e proof.
4. **You pick the moment, then queue 234:** the cut-over, with a few minutes of read-only.
5. **7 days later, queue 235:** final `pg_dump` to R2, remove the Hasura code, and the line
   "You can now delete the todzz Hasura and Postgres apps from CapRover on Hetzner".
   Then delete `todzz` and `todzz-db` in CapRover. Leave the box's other apps alone.

**Files changed** — the 241 slice (listed in its file), `package.json` 0.40.0 → 0.41.0, this
file and `241-d1OpsBoardsRest.md` → `-DONE.md`.

**Verification** — `npm run check` 0 errors / 0 warnings. `npm test`: 63 files, 640 passed,
12 skipped. D1 unit tests 22/22. Contract tests (reads and `CONTRACT_WRITES`) all equal.
`npm run build` (adapter-cloudflare) passes, and `todzz-staging` is deployed (`d4027d9b`).
Hetzner was inspected read-only over SSH: nothing was stopped or deleted.

**Deviations** — The request was to delete or move. Deleting would break production, so I
did one slice of the move (241). The rest needs steps 1–2 from you and then four more
sessions. No new follow-up files: each remaining step already has one (218, 231, 234, 235,
242–246). Renamed `-BLOCKED.md` because steps 1, 2 and 4 are yours.
