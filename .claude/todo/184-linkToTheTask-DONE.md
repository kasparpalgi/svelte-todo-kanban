> Run with: Sonnet 4.6 / medium
> Machine: karel

# Link to the task file

## Original Requirement

[NEVER REMOVE]

At the top of the card we have: [.claude/todo/183-getVercelCliWorking-DONE.mdcard.task_file_notice](https://github.com/{\"owner\":\"kasparpalgi\",\"repo\":\"svelte-todo-kanban\",\"full_name\":\"kasparpalgi/svelte-todo-kanban\"}/blob/main/.claude/todo/183-getVercelCliWorking-DONE.md)

What that `card.task_file_notice`text means? Remove if nonsense and otherwise make it make a sense.

Also, the file link is way outstanding with its yellow background and way too prominent location at the very top.

_From Kanban card `6f843ce1-2561-413e-b144-061e166ea9ec`._

_GitHub issue #184 — end the commit subject with `(#184)`._

## Done

- `card.task_file_notice` i18n key was missing from all locale files — the i18n library was rendering the raw key string. Added translations: EN "Linked task file", ET "Seotud ülesandefail", CS "Propojený soubor úkolu".
- Replaced the large amber/yellow banner at the top of the card with a small muted text link; label moved to a `title` tooltip to keep the header uncluttered.
- Commit `5553e57` pushed to main.
