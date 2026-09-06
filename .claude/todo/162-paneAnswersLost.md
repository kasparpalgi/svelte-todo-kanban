> Run with: Opus 5 / high

# Answers typed into the herdr pane are lost when the run ends

## Original Requirement

[NEVER REMOVE]

Observed 2026-09-06 while diagnosing why tasks 159 and 160 both ended unfinished. Both
transcripts end the same way — the agent stopped, and a line sat **unsent** in the pane's
input box:

```
159:  ✻ Cooked for 5m 51s · done 12:34 PM
      ❯ commit this

160:  ✻ Brewed for 17s · done 12:24 PM
      ❯ the drag handle sticks when dragging cards between lists
```

In both cases the typed text was exactly what the run needed, and in both cases the run
had already been declared over: the runner closes the tab in its `finally` block as soon
as `agent prompt --wait` returns.

## The gap

`runInHerdr` only waits for a human while the agent is **blocked** — a permission prompt.
It does not wait when the agent goes **idle with a question**, which is what both of these
were: 160 asked for a description it did not have, 159 finished the work and stopped
before committing. An idle agent looks identical to a finished one, so the runner reads
the pane, writes the log, closes the tab, and anything typed a moment later goes nowhere.

That is also why the answer never reached it: by the time a notification reaches the phone
and a human types, the pane is gone.

## The task

Decide and implement how an idle-but-unfinished agent is handled. Sketch, to be argued
with rather than followed:

1. **Detect it.** After `--wait` returns, the runner already checks completion (the
   `-DONE` rename plus a clean tree, added 2026-09-06). When that check fails, the agent
   is idle but not finished — today that only produces a `⚠ did not finish` push.
2. **Give it one nudge before giving up.** Send a second prompt into the same pane —
   "finish steps 6-8: rename the task file, commit, push" — and wait again. Most
   non-completions are this exact shape and need no human at all.
3. **Then, if it is still unfinished, hold the pane open** for `blockedMinutes` the way a
   blocked agent is held, with the `⏸ needs you` push carrying the pane text, so an
   answer typed on the phone actually lands. Close only on timeout.
4. Make sure a held-open pane cannot leak: the existing `reap()` covers a crash, but check
   the timeout path closes the tab and leaves the task file as `-TODO`.

Consider whether step 2 should be capped (one nudge, not a conversation) so a confused
agent cannot spend the whole `taskMinutes` budget talking to itself.

## Note on execution

No `-TODO` suffix on this filename, deliberately — the same guard task 027 used. Its files
live in `klarity-claude-kit`, not in this repo, and it rewrites the very runner that would
be executing it. `findPending()` ignores a file without the suffix, so run it by hand with
`/todo 162` from a checkout of `klarity-claude-kit`.

## Files

`klarity-claude-kit/plugins/dev-kit/runner/src/herdr.js` — the wait/close lifecycle
`klarity-claude-kit/plugins/dev-kit/runner/src/run.js` — the completion check that would
trigger the nudge

## Verification

- [ ] Stub agent that does the work but never commits → nudged once, then completes
- [ ] Stub agent that asks a question and idles → pane held open, `⏸` push carries the
      question, an answer typed into the pane is picked up and the run continues
- [ ] Nobody answers within `blockedMinutes` → tab closed, file left `-TODO`, no leaked
      `task-*` agent
- [ ] A genuinely finished run is unaffected and still closes immediately
