> Run with: Sonnet 5.5 / medium

# Voice: assistant speaks first and learns

## Original Requirement

[NEVER REMOVE]

Follow-up from #237 (Speaking). Original request:
"Opening app starts listening immediatelly. Start speaking to me with "Hopsti" (changeable).
Want to know what I can all do? See (on all projects) what's most urgent/quick-win today.
Clean up not needed things. Let's start working on project/task, what shall I or agent do
here next? (think the same way on all project and speak yourself more to improve)"

## This slice

"Speak yourself more to improve":

- Optional greeting when the app opens: one line from #242's urgent list. Browsers block
  `speechSynthesis.speak()` until the first click/tap on the page, so the greeting shows as a
  toast and is spoken on the first interaction (or wait for the first gesture).
- Log every `unknown` command (`loggingStore.info('VoiceAssistant', 'Unknown command', …)`,
  already half there) and add a small report of the most frequent ones, so the next intents
  are picked from real usage.
- Settings toggle for the greeting, next to the existing assistant switch in
  `SpeechToTextIntegration.svelte`.
- Open question for Kaspar: does "think the same way on all projects" mean all boards in
  ToDzz (assumed), or the same assistant in other Klarity apps too?
