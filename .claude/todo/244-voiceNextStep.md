> Run with: Opus 5.5 / high

# Voice: "Hopsti, let's work on X — what next?"

## Original Requirement

[NEVER REMOVE]

Follow-up from #237 (Speaking). Original request:
"Opening app starts listening immediatelly. Start speaking to me with "Hopsti" (changeable).
Want to know what I can all do? See (on all projects) what's most urgent/quick-win today.
Clean up not needed things. Let's start working on project/task, what shall I or agent do
here next? (think the same way on all project and speak yourself more to improve)"

## This slice

Add `open` and `next` intents to the #237 assistant:

- "Hopsti, open <board|card>" — fuzzy-match the name against the user's boards / cards and
  navigate (`goto`). Reuse the BoardSwitcher's matching if it fits (`filterBoards.ts`).
- "Hopsti, what next?" on a board or card — ask the AI (server route next to
  `src/routes/api/ai/plan/+server.ts`, same `resolveOpenAiKey`) for the single next step and
  whether a **person** or the **agent** should do it. Speak it.
- If the agent should: offer "send it to the agent?" — a spoken yes moves the card to the
  board's agent list (the Kanban runner picks it up). Same confirm step as #243; build it
  once and share it.
- Open question for Kaspar: should "next" also look at the board's GitHub repo / runner
  state (open PRs, blocked tasks), or cards only?

_GitHub issue #244 — end the commit subject with `(#244)`._
