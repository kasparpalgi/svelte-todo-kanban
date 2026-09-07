> Run with: Sonnet 5 / medium

# Screenshots for the /workflow page

## Original Requirement

[NEVER REMOVE]

From issue #158 — "Agentinc coding section -> how it works with screenshots" — and split out
of `165`, which built the page but shipped it without images.

The page at `src/routes/workflow/+page.svelte` explains the loop in words only. Issue #158
asks for screenshots. The repo has just `docs/screenshot.png` (a board view).

## What is needed

Four shots, in the order the page tells the story:

1. Dictating a card on a phone (voice input in the mobile browser)
2. The Chrome extension popup saving a page as a note
3. The runner working — `tmux attach -t kanban-runner`, Claude Code mid-task
4. The card sitting in Review with the agent's results as a comment

Then add them to the matching sections, `static/` + `<img>` with width/height set so the
page does not shift as they load, and alt text that describes what is happening.

## Needs a human

Shots 1, 3 and 4 need the runner daemon actually running against a real board, and shot 1
needs a phone. An agent cannot produce these on its own — capture them, drop them in
`static/`, then this task is mechanical.
