> Run with: Opus 4.8 / high

# Chrome web store

## Original Requirement

[NEVER REMOVE]

See #167 task was done and there was left manually to do:

  1\. Create Chrome Web Store Developer account ($5 USD) -- done

  2\. Design promo tile (440×280) and screenshots (1280×800) -- tried but ended up slightly different sizes but almost - is that ok or if not resize the images in /docs folder to correct size (both are screenshots - is that ok?)

3\. Manual test on clean Chrome profile - tested works but when clicked opens slow - probably due to AI summary - can you make it open ASAP and then show loader while it is working?

4\. Package ZIP and submit via dashboard - ZIP it for me

_From Kanban card `5c378638-317a-40b6-b862-058609fb6a78`, moved to the agent list._

---

## Plan (Opus 4.8) — 2026-09-17

Actionable leftovers from the four items (1 = dev account, already done):

- **Item 2 — image sizes.** `docs/chrome-1280x800.png` is 1279×799, `docs/chrome-440x280.png`
  is 417×273. Chrome Web Store requires exact 1280×800 screenshots and 440×280 small promo
  tile. Both being screenshots is fine (the store allows real screenshots as promo tiles as
  long as they aren't misleading). → Resize both to the exact required dimensions with `sips`.
- **Item 3 — popup opens slow.** Not actually the AI summary (that only runs on button
  click). `init()` in `popup/popup.js` shows a full-window spinner and hides the form until
  the network `loadBoards()` GraphQL call finishes. → Restructure `init()` to render the form
  immediately after the (local, fast) auth check, then load boards + page data in the
  background with inline "Loading boards…" placeholders. Form appears instantly; loaders show
  while data streams in.
- **Item 4 — package ZIP.** Zip the `chrome-extension/` folder (excluding docs/dev files) into
  a store-ready upload.

### Progress log

**Done 2026-09-17:**

- **Item 2 (images) — DONE.** Resized in place with `sips`:
  - `docs/chrome-1280x800.png`: 1279×799 → **1280×800**
  - `docs/chrome-440x280.png`: 417×273 → **440×280**
  - Both are real screenshots; that is acceptable for the store (screenshots for the
    screenshot slot; the small screenshot is fine as the 440×280 small promo tile).
    Answer to the "is that ok?" question: yes — resized to exact required sizes.

- **Item 3 (slow open) — DONE.** Root cause was **not** the AI summary (that only runs on
  the "Generate Summary" click). `init()` blocked the whole popup on the network
  `loadBoards()` GraphQL call, showing a full-window spinner until it returned. Refactored
  `popup/popup.js`:
  - After the fast local auth check, `showMainContent()` is called **immediately** so the
    form appears at once.
  - Boards and page data now load concurrently in the background via new `initBoards()` /
    `initPageData()` helpers; the board `<select>` shows its existing "Loading boards…"
    placeholder until data arrives, and page fields fill in when the content script responds.
  - Added a graceful "Failed to load boards" state. `node --check` passes.

- **Item 4 (ZIP) — DONE.** Built `chrome-extension/todzz-extension-v1.2.0.zip` (16 files,
  runtime only — manifest, background.js, content/, icons/, lib/, popup/; docs/dev/.git
  files excluded per the documented recipe). Manifest already ships production-only
  host_permissions (no localhost), so no manifest edit was needed. `*.zip` is gitignored,
  so the archive stays local for you to upload via the dashboard.

**Left for you (manual, cannot be automated):** upload the ZIP + the two resized images to
the Chrome Web Store Developer Dashboard and submit for review.

## Results

The agent finished the run but never renamed the file, so the runner completed it. The tree was clean and the agent's commits are in — see the `.log` beside this file for the full session.
