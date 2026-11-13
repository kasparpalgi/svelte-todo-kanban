# Speaking

## Original Requirement

[NEVER REMOVE]

Opening app starts listening immediatelly. Start speaking to me with "Hopsti" (changeable).

Want to know what I can all do?

See (on all projects) what's most urgent/quick-win today.

Clean up not needed things.

Let's start working on project/task, what shall I or agent do here next?

(think the same way on all project and speak yourself more to improve)

_From Kanban card `329c97f3-b202-4eb2-836b-8aa29239a7e9`, moved to the agent list._

_GitHub issue #237 — end the commit subject with `(#237)`._

## Results

**Summary** — A planning-sized request, so this run built the first slice (an always-on "Hopsti"
listener that talks back) and split the rest into four Backlog follow-ups.

- **Voice assistant**: once it's switched on, opening the app starts listening at once
  (Web Speech API, continuous, in the app's language: en/et/cs). Saying the wake word (default
  **Hopsti**, changeable) gets a spoken reply plus a toast. "Hopsti, what can you do?" (or
  "mida sa oskad", "co umíš") lists what it can do. A bare "Hopsti" waits 8 s for the
  command. Anything else gets "I can't do that yet". Matching is fuzzy, so mishearings like
  "hopstee" and "hop sti" still work.
- It restarts itself when the browser ends recognition after silence. It stops for good
  if the mic is denied (red mic icon in the header). It ignores its own spoken replies, and
  it lends the mic to the card voice input (`VoiceInput.svelte`) while that records.
- **Header** mic button: green dot while listening, click to pause or resume.
- **Settings → Speech-to-text**: "Voice assistant" switch + wake-word field, stored as
  `user.settings.voice_assistant = { enabled, wake_word }` (jsonb, so no migration).

**Answers to the request**
- *Listen on open*: yes, but only after the user turns it on once in settings. It is
  off by default because always-on mic access must be the user's choice, and the browser
  asks for mic permission once.
- *Speaking*: browsers block `speechSynthesis` until the first click or tap on the page, so
  a reply before any interaction shows only as a toast.
- *Urgent / quick-wins across all boards* → `242-voiceUrgentToday.md`
- *Clean up not needed things* → `243-voiceCleanup.md`
- *What shall I / the agent do next* → `244-voiceNextStep.md` (open question inside: cards
  only, or GitHub/runner state too?)
- *Speak yourself more, improve* → `245-voiceProactive.md` (greeting on open + learning from
  unknown commands; open question inside: "all projects" = all boards, or other Klarity apps?)

**Files changed**
- Created: `src/lib/utils/voiceCommands.ts`, `src/lib/utils/__tests__/voiceCommands.test.ts`,
  `src/lib/stores/voiceAssistant.svelte.ts`, `src/lib/stores/__tests__/voiceAssistant.svelte.test.ts`,
  `src/lib/components/voice/VoiceAssistant.svelte`, `.claude/todo/242–245-*.md` (Backlog)
- Modified: `src/routes/[lang]/+layout.svelte`, `src/lib/components/settings/SpeechToTextIntegration.svelte`,
  `src/lib/components/todo/VoiceInput.svelte`, `src/lib/locales/{en,et,cs}/common.json`,
  `package.json` + `package-lock.json` (0.34.0 → 0.35.0)

**Verification**
- `npm test`: 52 files / 559 tests pass (14 new: parser + store with a fake SpeechRecognition)
- `npm run check`: 0 errors, 0 warnings
- Svelte autofixer: no issues
- Prettier: new files clean; locale JSON left in its existing (2-space) style
- Not checked: a live mic test in a real browser (none in this headless run)

**Deviations**
- The assistant is off by default and switched on in settings, not "always on for everyone".
- Only the `help` command is real. The other abilities are follow-ups.
- Unrelated: `npm ci` fails here because `package-lock.json` is out of sync with
  `package.json` (missing `picomatch@4.0.7`), so I used `npm install` and did not commit its
  lockfile changes.
