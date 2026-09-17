> Run with: Opus 4.8 / high

# New user onboarding

## Original Requirement

[NEVER REMOVE]

Invited a new user to the board and the email that arrived is terrible looking. Make a nice HTML email. Also, it shall tell in email that you must create account with email address (address where invite was sent). Cick on the link and click "Create account" or even better take straight to account creation page. Then instruct to click on the bell icon to accept invite or even better show that invite asap or accept automatically when certain url after ? mark and take straight to that board.

_From Kanban card `177e4d61-e1df-4609-916c-b03cf6195dfe`._

_GitHub issue #196 — end the commit subject with `(#196)`._

---

## Plan (Opus 4.8 / high)

### Findings from codebase
- Invite email built in `src/routes/api/invitations/send/+server.ts` — plain-ish HTML, generic
  wording, button links to bare `/signin`. No mention of which email to use, no auto-accept.
- Invite URL built in `src/lib/stores/boardMembers.svelte.ts:92` as `${origin}/signin` — carries
  no token, so nothing ties the click back to the invitation.
- `board_invitations` has a unique `token` (VARCHAR) + `board { alias, user { username } }`.
- Accept today is manual: bell dropdown → `InvitationNotifications.svelte` → `invitationsStore.acceptInvitation`
  (ADD_BOARD_MEMBER + UPDATE_BOARD_INVITATION status=accepted).
- Hasura select on `board_invitations` returns rows where `invitee_email = X-Hasura-User-Email`,
  so a logged-in invitee can look up their own invite by token. board_members insert check is `{}`.
- `request(doc, vars, undefined, fetch)` works in +page.server.ts (mints JWT from session cookie).
- Board URL = `/${locale}/${board.user.username}/${board.alias}`. Page params via `$app/state`.
- Auth: signup via `signIn('credentials', { mode:'signup', callbackUrl })`; Google via `signIn('google', {callbackUrl})`.
  callbackUrl controls post-auth landing → use it to route through the accept step.

### Design
1. **Email link** → `${origin}/signin?invite=<token>&email=<encoded invitee email>`.
2. **LoginForm** reads `invite` + `email`: defaults to signup mode, prefills + locks the email
   field (must use the invited address), shows an invitation banner, and sets `callbackUrl` to
   `/invite/<token>` for every provider.
3. **New route `/invite/[token]/+page.server.ts`**: after auth, look up the pending invite by token
   (email-matched by Hasura perms), add the board member, mark accepted, redirect straight to the
   board. Logged-out / no-match falls back to `/signin?invite=<token>` or top board.
4. **Nicer HTML email**: responsive table layout, clear "create your account with THIS email"
   instruction, numbered steps, auto-accept promise. All strings i18n (en/et/cs).

### Steps
- [x] Explore invitation + auth flow
- [x] Add `GET_INVITATION_BY_TOKEN` to `documents.ts`; `npm run generate`
- [x] Update invite URL in `boardMembers.svelte.ts` (token + email params)
- [x] Create `/invite/[token]/+page.server.ts` (auto-accept + redirect)
- [x] Update `LoginForm.svelte` (invite params: signup mode, locked email, banner, callbackUrl)
- [x] Redesign email HTML/text in `invitations/send/+server.ts` (pass inviteeEmail)
- [x] Add i18n keys (email.* + auth.invite_* ) to en/et/cs
- [x] Tests + `npm run check` (my files clean) + server tests (239 pass)
- [ ] Commit `(#196)` to main and push

## Log

**2026-09-17 (Opus 4.8 / high)**

Implemented the full new-user onboarding flow for board invitations:

- **`documents.ts`**: added `GET_INVITATION_BY_TOKEN` (returns board alias + owner username for
  redirect); ran `npm run generate`.
- **`boardMembers.svelte.ts`**: invite email link now carries the token + invitee email
  (`/signin?invite=<token>&email=<addr>`) instead of a bare `/signin`.
- **`routes/invite/[token]/+page.server.ts`** (new): the post-auth landing. Looks up the pending
  invite by token (Hasura only returns it when the signed-in email matches the invitee), adds the
  board member, marks it accepted, and redirects straight to the board. Anonymous → `/signin?invite=…`;
  no match / already accepted → board or top-board fallback. `+page.svelte` shows a "joining…" spinner.
- **`LoginForm.svelte`**: reads `invite`/`email` params → defaults to signup, prefills + locks the
  email input, shows an invitation banner with the required address, and routes every provider
  (Google / credentials / magic link) through `callbackUrl=/invite/<token>` so auth flows back to
  auto-accept.
- **`invitations/send/+server.ts`**: rewrote the email as a table-based, inline-styled responsive
  layout (branded header, board highlight, ⚠️ "use THIS email" box, numbered join steps, CTA,
  plaintext link fallback). Added HTML escaping for interpolated values. Passes `inviteeEmail`.
- **i18n**: added `email.*` (someone, board_label, email_notice_*, steps_title, step_1..3,
  link_fallback, updated invite_text/button_text) and `auth.invite_*` + `members.accepting_invitation`
  to en / et / cs.
- **Tests**: added `routes/invite/[token]/invite.server.test.ts` (5 cases: anon redirect, accept +
  board redirect, no re-accept of accepted, no-match fallback, locale-root fallback). All pass.

**Verification**
- `npm run check`: my touched files are clean; the 10 remaining errors are pre-existing on `main`
  (charts/Line, invoicing, TodoFiltersSidebar, todos, og-image) — none in files I changed.
- Server test project: 239 passed (was 234 + 5 new). Client (browser) project can't run in this
  env — Playwright wants `chromium_headless_shell-1193` (version-pinned infra issue, unrelated).
- Rendered the real email template with English strings in a browser and screenshotted it to
  confirm the new design (sent to user).

## Results

The agent finished the run but never renamed the file, so the runner completed it. The tree was clean and the agent's commits are in — see the `.log` beside this file for the full session.
