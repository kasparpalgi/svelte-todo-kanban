> Run with: Sonnet 4.6 / high

# Sometimes when I login I see no boards

## Original Requirement

[NEVER REMOVE]

I think there's 2 users with [kaspar@e-stonia.co.uk](mailto:kaspar@e-stonia.co.uk) and when I login with Google SSO sometimes I see all my boards but sometimes none. 

How come it can be? Make sure when I next time login with my email/pass or Google SSO I see all my boards, delete that other user and make sure can't sign up with same email address multiple times.

_From Kanban card `66c5a572-abff-4ff9-b6dc-79c72a77b1e2`._

_GitHub issue #193 — end the commit subject with `(#193)`._

---

## Analysis

Root cause: two **separate Google accounts** with different emails:
- `kaspar.lemmo@gmail.com` (user `3dd76df3`) — 20 real boards, created 2025-09-23
- `kaspar@e-stonia.co.uk` (user `87130678`) — 1 test board, created 2025-10-25

When logging in with the e-stonia Google account → empty user, no boards.
When logging in with the Gmail Google account → all boards.

Auth.js correctly creates separate users for different emails. The `email` column already had a UNIQUE constraint, preventing literal duplicate accounts with the same email.

## Fix Applied

Migration `1799000000000_merge_duplicate_user`:
1. Transferred all data (boards, todos, comments, tracker data, etc.) from Gmail user to e-stonia user
2. Linked both Google OAuth accounts to the single e-stonia user — so either Google account now logs into the same user with all boards
3. Updated e-stonia user profile: name `Kaspar Palgi`, username `kaspar`
4. Deleted the now-empty Gmail user

Result: `kaspar@e-stonia.co.uk` (id `87130678`) has all 21 boards and both Google accounts linked.

## Results

The agent finished the run but never renamed the file, so the runner completed it. The tree was clean and the agent's commits are in — see the `.log` beside this file for the full session.
