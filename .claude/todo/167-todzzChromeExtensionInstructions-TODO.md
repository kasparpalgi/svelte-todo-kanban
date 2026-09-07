# Todzz Chrome extension

## Original Requirement

[NEVER REMOVE]

I want to add Chrome extension to the Chrome Web Store. Make sure it is ready to be added and write into this todo file instructions what to do next when you have completed making sure we have all the privacy policy, manifest or whatever needed for that to add it.

## What I found and fixed (2026-09-07)

The extension already existed at `chrome-extension/` with a submission guide
(`chrome-extension/CHROME_WEB_STORE_SUBMISSION.md`). I audited every code-level
requirement and fixed what was actually wrong; everything else needs a human
(design assets, real account, manual test pass).

**Fixed:**
1. **Icons were the wrong pixel size.** `icon16.png`/`icon48.png` were both
   64×64 and `icon128.png` was 192×192 — mismatched with what `manifest.json`
   declares. Regenerated all three at the correct sizes from
   `static/pwa-512x512.png` (the app's existing high-res PWA icon), so they
   now measure exactly 16×16, 48×48, 128×128.
2. **Unused `scripting` permission.** `manifest.json` requested the
   `scripting` permission but nothing in the codebase calls `chrome.scripting`
   — the content script is statically declared via `content_scripts`, not
   injected dynamically. Removed it (unnecessary permissions are a listed
   Chrome Web Store rejection reason). Also documented, in the submission
   guide, why the content script matches `<all_urls>` — it's passive and only
   acts on an explicit message from the popup or a `postMessage` from a
   todzz.eu origin, never automatically.
3. **Broken privacy policy link.** The submission guide and the suggested
   store description both pointed to `www.todzz.eu/privacy`, which doesn't
   exist. The actual route is `/terms` with a query param
   (`src/routes/terms/+page.svelte`), so the real privacy policy URL is
   `https://www.todzz.eu/terms?privacy`. Fixed both references. Also dropped
   a reference to `www.todzz.eu/help`, which isn't a route either.
4. Verified: Manifest V3 ✓, service worker (not background page) ✓, CSP
   restricts `script-src`/`object-src` to `'self'` ✓, no remotely-hosted
   script tags or `eval`/`new Function` anywhere in the extension ✓, no
   `localhost` in the shipped manifest/CSP (dev is a stored toggle, defaults
   off) ✓, `manifest.json` is valid JSON ✓.

Updated the pre-submission checklist in
`chrome-extension/CHROME_WEB_STORE_SUBMISSION.md` to reflect all of the above.

## What's left — genuinely manual, not code

The extension code and its docs are now store-ready. What remains can't be
done from the repo:

1. **Create the Chrome Web Store Developer account** (one-time $5 fee) at
   https://chrome.google.com/webstore/devconsole if not already done.
2. **Design the store listing images** (not code-generatable — needs real
   design work):
   - Small promotional tile, 440×280 PNG/JPG (required)
   - 1–5 screenshots, 1280×800 preferred (required) — capture these from a
     real signed-in session showing the popup saving a page
   - Marquee tile, 1400×560 (optional, for featured placement)
3. **Manual test pass on a clean Chrome profile**: load the unpacked
   `chrome-extension/` folder, sign in, save a page to a board, try the AI
   summarization and image picker, confirm no console errors.
4. **Package and submit**:
   ```bash
   cd chrome-extension
   zip -r todzz-extension.zip . -x "*.git*" -x "*.md" -x ".gitignore"
   ```
   Upload the zip in the dashboard, fill in the listing fields (name,
   summary, description — all drafted in `CHROME_WEB_STORE_SUBMISSION.md`),
   set the privacy policy URL to `https://www.todzz.eu/terms?privacy`, fill
   in the permission justifications (also drafted in that same file), and
   submit for review.

Full field-by-field content (description text, permission justifications,
single-purpose declaration, etc.) is already written out in
`chrome-extension/CHROME_WEB_STORE_SUBMISSION.md` — just copy it into the
dashboard forms.
