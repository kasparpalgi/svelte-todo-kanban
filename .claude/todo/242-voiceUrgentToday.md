> Run with: Sonnet 5.5 / medium

# Voice: "Hopsti, what's urgent today?"

## Original Requirement

[NEVER REMOVE]

Follow-up from #237 (Speaking). Original request:
"Opening app starts listening immediatelly. Start speaking to me with "Hopsti" (changeable).
Want to know what I can all do? See (on all projects) what's most urgent/quick-win today.
Clean up not needed things. Let's start working on project/task, what shall I or agent do
here next? (think the same way on all project and speak yourself more to improve)"

## This slice

#237 shipped the always-on listener: `src/lib/stores/voiceAssistant.svelte.ts` (wake word,
speech reply + toast) and intents in `src/lib/utils/voiceCommands.ts` (`wake`, `help`,
`unknown`). Add an `urgent` intent:

- Phrases (en / et / cs): "what's urgent", "what's today", "quick wins", "mis on täna",
  "mis on kiire", "co je dnes".
- Across **all** the user's boards: overdue + due today first, then high priority, then
  quick wins (small `min_hours`/`max_hours`, or no estimate and a short body). Top 3 only —
  it is spoken, so keep it short: "3 things: … on board X, …".
- Read the data through the data API (`src/lib/api/call.ts`), not Hasura directly — the
  D1 cut-over (#234) is under way. Prefer one server op that returns the ranked list over
  loading every board in the browser.
- Ranking is a pure function with unit tests. Update `voice_assistant.reply_help` to
  mention the new command.
