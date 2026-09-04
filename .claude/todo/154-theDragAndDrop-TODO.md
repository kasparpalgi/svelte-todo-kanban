> Run with: Sonnet 5 / medium

# The drag and drop is terrible on mobile

## Original Requirement

[NEVER REMOVE]

Fable 5. High.
I made it work brilliantly just with HTML5 I think in another project at ../../CodeNew/timetrack - plan and implement it well working and nice looking like in Trello here, too. The whole visual drag'n'drop is pretty terrible and ugly compared to that timetrack project so I would fully refactor I think.

_From Kanban card `4698ab60-e5db-4fb4-a017-be7b0a85bfe5`, moved to the agent list._

## Investigation

- Reference project at `/Users/klarity/Documents/CodeNew/timetrack` (`KanbanCard.svelte`/`KanbanView.svelte`) uses **plain native HTML5 `draggable` attribute** — desktop/Tauri only, no touch support at all. So "brilliant" there mostly means clean desktop visuals + no scroll interference, not a mobile touch solution to copy directly.
- Current board drag-and-drop (`TodoKanban.svelte`, `KanbanColumn.svelte`, `TodoItem.svelte`) already has a custom unified mouse+touch drop-target computation system (global `mousemove`/`touchmove` on `svelte:window`, `elementsFromPoint`, auto horizontal scroll). That part is solid and reusable.
- Root cause of "terrible on mobile": card dragging is wired through `@neodrag/svelte`'s `use:draggable` applied to the **entire card wrapper**. Neodrag's core (`node_modules/@neodrag/svelte/dist/index.js` line ~117) unconditionally sets `touch-action: none` on the node it's bound to, the moment the action mounts — regardless of `threshold`/`handle` options. That means **every touch anywhere on a card permanently blocks native touch scrolling** through that card. Users can't scroll the page past/through cards without accidentally starting a drag. This is the actual mobile bug, not a visual styling issue.

## Plan

1. Remove `@neodrag/svelte` usage from `TodoItem.svelte` (kanban card only — leave other usages in `CardImageManager.svelte`/`NoteItem.svelte`/`NoteImageManager.svelte` untouched, unrelated feature).
2. Add a dedicated small drag-handle (GripVertical icon, ~32px touch target) to each card. Only the handle gets `touch-action: none`; the rest of the card remains natively scrollable on touch.
3. Implement manual pointer-event-based dragging on the handle (pointerdown + setPointerCapture + pointermove/up/cancel), driving the same `onDragStart`/`onDragEnd` contract `TodoKanban.svelte` already expects — no prop/type changes needed.
4. Keep mouse dragging ergonomic: on desktop, mouse users can still grab from the handle (or optionally anywhere via mouse since there's no scroll conflict for mouse input) — decide during implementation, defaulting to handle-only for consistency and simplicity.
5. Unify `TodoKanban.svelte`'s global `mousemove`/`touchmove`/`touchend`/`touchcancel` listeners into `pointermove`/`pointerup`/`pointercancel` to match.
6. Visual polish pass to match Trello/timetrack feel: lifted card (scale + shadow) while dragging, smoother drop-indicator transition.
7. `npm run check` must pass. Manual verification: can't fully drive real touch input non-interactively, so verify logic carefully and note in final summary that live mobile testing by the user is recommended.

## Log

- Starting implementation.
- `TodoItem.svelte`: removed `@neodrag/svelte` entirely. Added a dedicated `GripVertical` drag handle (own flex slot next to the completion checkbox, ~24x32px touch target) with manual pointer-event dragging (`pointerdown` + `setPointerCapture` + `pointermove`/`pointerup`/`pointercancel`). Only the handle gets `touch-action: none`, so the rest of the card (and the page behind it) scrolls normally on touch — this was the actual root cause of "terrible on mobile" (neodrag set `touch-action: none` on the whole card unconditionally). Card now lifts (`scale-[1.03] rotate-1 shadow-2xl`) while dragging for Trello-like visual feedback; drop-indicator line kept as-is.
- `TodoKanban.svelte`: unified the global `mousemove`/`touchmove`/`touchend`/`touchcancel` listeners into `pointermove`/`pointerup`/`pointercancel` (pointer events cover mouse+touch+pen in one path, and still bubble to `window` even though the handle captures the pointer). Drop-target/auto-scroll computation logic (`elementsFromPoint`, `data-todo-id`/`data-list-id`) untouched.
- `TodoList.svelte` (the alternate flat list view, also built on `TodoItem`): previously had **zero** touch support at all (`mousemove` only). Switched its global listener to `pointermove` too, so dragging to reorder now works on touch there as well.
- No prop/type changes needed — `onDragStart`/`onDragEnd` contract in `TodoItemProps`/`KanbanColumnProps` unchanged.
- `npm run check`: same pre-existing 19 errors/4 warnings as on `main` (unrelated missing deps: `ffmpeg-static`, `d3-shape`, `d3-scale`, `layercake`, `marked`, plus one unrelated `Buffer` type issue) — nothing new introduced, no errors in touched files.
- `npm test`: server/unit vitest project passes (140/140). The `client` vitest project and Playwright e2e can't run in this environment — Playwright's Chromium binary isn't installed here (pre-existing, unrelated to this change). Recommend the user do a real device/browser touch test before merging, since true touch input can't be exercised non-interactively here.
- Left `@neodrag/svelte` dependency and its other usages (`CardImageManager.svelte`, `NoteItem.svelte`, `NoteImageManager.svelte`) untouched — unrelated features, out of scope.

## Status: implementation complete, awaiting manual mobile verification by user.
