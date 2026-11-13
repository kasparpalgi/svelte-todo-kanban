> Run with: Sonnet 5.5 / medium

# Voice: "Hopsti, clean up"

## Original Requirement

[NEVER REMOVE]

Follow-up from #237 (Speaking). Original request:
"Opening app starts listening immediatelly. Start speaking to me with "Hopsti" (changeable).
Want to know what I can all do? See (on all projects) what's most urgent/quick-win today.
Clean up not needed things. Let's start working on project/task, what shall I or agent do
here next? (think the same way on all project and speak yourself more to improve)"

## This slice

Add a `cleanup` intent to the #237 assistant (`voiceCommands.ts` + `voiceAssistant.svelte.ts`):

- Find candidates across all boards: cards untouched for 60+ days, cards completed long ago
  still on the board, empty lists, duplicate titles.
- Speak a count and the first few ("5 cards untouched since spring, first: …"), then ask
  "archive them?". Only a spoken **yes** (or a click on the toast) archives — never delete,
  always archive, and offer "undo".
- Needs a confirm step in the assistant: a pending action that the next utterance
  ("yes"/"jah"/"ano" vs "no") resolves within the existing 8 s follow-up window.

_GitHub issue #243 — end the commit subject with `(#243)`._
