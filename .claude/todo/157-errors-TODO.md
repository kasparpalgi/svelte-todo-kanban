> Run with: Sonnet 4.6 / low

# Errors

## Original Requirement

[NEVER REMOVE]

Sonnet 4.6 / Low
FIX: npm run check in svelte-todo-kanban reports 19 pre-existing errors (missing marked, d3-scale and similar deps) in files

## Log

- Ran `npm run check`: 19 errors in 13 files, all "Cannot find module" for marked, d3-scale, d3-shape, layercake, ffmpeg-static (plus 3 Buffer/type errors in og-image/+server.ts likely stemming from pdf-parse types).
- Confirmed all these packages ARE listed in package.json dependencies, but `node_modules/` is missing them entirely (`npm ls` showed empty tree) — dependencies were declared but never installed.
- Fix: run `npm install` to sync node_modules with package.json, then re-run `npm run check`.
- Ran `npm install` — added 33 packages (marked, d3-scale, d3-shape, layercake, ffmpeg-static, pdf-parse were declared in package.json but absent from node_modules).
- Re-ran `npm run check`: all "Cannot find module" errors gone. Error count went 19 → 9.
- The remaining 9 errors are unrelated pre-existing type issues (Buffer/BodyInit mismatches in og-image server routes, TodoFieldsFragment mismatches in two test files) — not caused by missing deps, out of scope for this task.
- Only `package-lock.json` changed (dependency tree resync); no source files touched.
- Status: DONE — the reported dependency-related errors are fixed.
