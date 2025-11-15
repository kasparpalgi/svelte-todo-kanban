# Development Guide - ToDzz Chrome Extension

## Testing the Extension Locally

### Initial Setup

1. **Open Chrome Extensions Page**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right corner)

2. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - Extension should appear in your list

3. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Find "ToDzz - Save to Notes"
   - Click the pin icon

### IMPORTANT: After Making Code Changes

**You MUST follow these steps for changes to take effect:**

1. **Reload the Extension**:
   - Go to `chrome://extensions/`
   - Find "ToDzz - Save to Notes"
   - Click the reload icon (circular arrow) 🔄

2. **Refresh Any Open Pages**:
   - Go to any tab where you want to test the extension
   - Press `Ctrl+R` (or `Cmd+R` on Mac) to refresh the page
   - This ensures the content script is re-injected

3. **Test the Extension**:
   - Click the extension icon
   - The popup should now use your updated code

### Why This is Necessary

- **Extension Code**: Cached by Chrome until you reload
- **Content Scripts**: Injected when page loads, so page must be refreshed
- **Service Worker**: Restarted when extension reloads

### Testing on Different Pages

#### ✅ Pages Where Content Script Works

The content script can extract full page data (title, description, content, images) from:
- Regular websites (http://, https://)
- Most public web pages
- Blog posts, articles, documentation

**On these pages you'll get**:
- Page title and meta description
- Extracted content for AI summarization
- Multiple images to choose from
- Full functionality

#### ❌ Pages Where Content Script CANNOT Run

Chrome restricts content scripts on these pages for security:
- `chrome://` pages (e.g., `chrome://extensions`)
- `chrome-extension://` pages
- Chrome Web Store (`chrome.google.com/webstore`)
- New Tab page
- `about:` pages
- Browser internal pages

**On these pages you'll get**:
- Basic tab title and URL only
- "Could not load page data" warning (expected)
- No description, no content, no images
- Limited functionality (but save still works)

This is **normal behavior** - just test on regular web pages!

### Debugging

#### Check Console Logs

1. **Popup Console**:
   - Right-click the extension icon → "Inspect popup"
   - Console shows popup.js logs

2. **Content Script Console**:
   - Open DevTools on the page (F12)
   - Console shows content.js logs

3. **Background Script Console**:
   - Go to `chrome://extensions/`
   - Click "service worker" under the extension
   - Console shows background.js logs

#### Common Issues

**"Could not load page data" Error**:
- ✅ **Normal**: If testing on chrome://, about:, or other restricted pages
- ❌ **Problem**: If happens on regular websites
- **Fix**: Reload extension + refresh page

**AI Summary Not Working**:
- Check if page has content (content script must work)
- Check console for errors
- Verify AI API is accessible

**Images Not Showing**:
- Content script must work (see restricted pages above)
- Page must have images ≥200x200 pixels
- Check console for errors

**Changes Not Appearing**:
- Did you reload the extension? (`chrome://extensions/`)
- Did you refresh the page?
- Try closing and reopening the popup

### Development Workflow

```bash
# 1. Make code changes
vim popup/popup.js

# 2. Go to chrome://extensions/
# 3. Click reload icon for extension
# 4. Refresh the page you're testing on
# 5. Click extension icon to test

# Repeat!
```

### Development Mode

To use with local dev server:

1. Open popup console (right-click icon → Inspect popup)
2. Run:
   ```javascript
   chrome.storage.local.set({ devMode: true });
   ```
3. Extension will now use `http://localhost:5173`

To disable:
```javascript
chrome.storage.local.set({ devMode: false });
```

### File Watching (Optional)

For faster development, you can use a file watcher to auto-reload:

```bash
# Install extension-reloader (one-time)
npm install -g extension-reloader

# Watch for changes (in chrome-extension folder)
extension-reloader --watch popup,content,lib,*.js,*.html,*.css
```

### Best Practices

1. **Always test on real websites**, not chrome:// pages
2. **Reload extension after every change**
3. **Refresh pages** to re-inject content scripts
4. **Check all 3 consoles** when debugging
5. **Test on multiple websites** (with/without images, different layouts)
6. **Test with AI enabled/disabled**
7. **Test error cases** (no internet, API down, etc.)

### Recommended Test Sites

Good sites for testing the extension:
- https://www.wikipedia.org (lots of content, images)
- https://developer.mozilla.org (good meta tags, code examples)
- https://github.com (structured content, avatars)
- https://medium.com (articles with images)
- https://stackoverflow.com (Q&A format, code blocks)

---

## Quick Troubleshooting Checklist

- [ ] Extension reloaded in `chrome://extensions/`?
- [ ] Page refreshed after reloading extension?
- [ ] Testing on a regular website (not chrome://, about:, etc.)?
- [ ] Checked popup console for errors?
- [ ] Checked page console for content script errors?
- [ ] Extension icon appears in toolbar?
- [ ] Signed in to ToDzz account?
- [ ] Have at least one board created?

---

**Last Updated**: 2025-11-15
