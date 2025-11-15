# ToDzz Chrome Extension

Save web pages to your ToDzz boards as notes with AI summarization.

## Features

- **One-Click Save**: Save web pages to your ToDzz boards as notes
- **AI Summarization**: Optionally summarize page content using AI (GPT-5 models)
- **Board Selection**: Choose which board to save to, with last selection remembered
- **Cover Images**: Automatically extracts OG images from pages
- **Personal Notes**: Add your own notes/comments to saved pages
- **Source Links**: Automatically includes clickable link back to source page

## Installation

### For Development

1. **Clone the repository** or navigate to the `chrome-extension` folder

2. **Add extension icons** (required before loading):
   - Place icon files in `chrome-extension/icons/` folder:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)

3. **Load extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension should now appear in your extensions list

4. **Pin the extension** (optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Find "ToDzz - Save to Notes"
   - Click the pin icon to pin it to toolbar

### For Production

1. Package the extension:
   ```bash
   cd chrome-extension
   zip -r todzz-extension.zip . -x "*.git*" -x "*.DS_Store" -x "README.md"
   ```

2. Submit to Chrome Web Store (requires Chrome Web Store developer account)

## Usage

### First Time Setup

1. **Click the extension icon** in your Chrome toolbar
2. **Click "Sign In"** to open ToDzz in a new tab
3. **Sign in** to your ToDzz account
4. **Close and reopen** the extension popup

### Saving a Page

1. **Navigate to any web page** you want to save
2. **Click the extension icon**
3. **Select a board** from the dropdown (last selected board will be pre-selected)
4. **(Optional) Add personal notes** in the text area
5. **(Optional) Enable "AI Summarize"** to get an AI-generated summary
   - Choose AI model: Nano (fastest/cheapest), Mini (balanced), or Full (most capable)
6. **Click "Save to Notes"**
7. The page will be saved as a note in your selected board

### What Gets Saved

- **Title**: Page title (from meta tags or document title)
- **Content**:
  - AI summary (if enabled) OR page meta description
  - Your personal notes (if added)
  - Clickable link back to source page
- **Cover Image**: OG image from page (if available)

## Authentication

The extension uses JWT tokens to authenticate with the ToDzz API:

- Tokens are stored securely in Chrome's local storage
- Tokens expire after 24 hours
- You'll need to re-authenticate if your token expires

## Development Mode

To use the extension with a local development server:

1. Open Chrome DevTools on the extension popup
2. In the console, run:
   ```javascript
   chrome.storage.local.set({ devMode: true });
   ```
3. Reload the extension
4. The extension will now use `http://localhost:5173` instead of `https://todzz.eu`

To disable dev mode:
```javascript
chrome.storage.local.set({ devMode: false });
```

## File Structure

```
chrome-extension/
├── manifest.json           # Extension manifest (Manifest V3)
├── background.js           # Service worker for background tasks
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styles
├── content/
│   └── content.js         # Page metadata extraction
├── lib/
│   ├── graphql.js         # GraphQL client
│   ├── auth.js            # Authentication helpers
│   └── storage.js         # Chrome storage helpers
├── icons/
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── README.md              # This file
```

## API Endpoints Used

- **Authentication**: `GET /api/auth/token`
- **AI Summarization**: `POST /api/ai`
- **GraphQL**: `POST /v1/graphql`
  - `GetBoards` - Fetch user's boards
  - `CreateNote` - Create new note

## Troubleshooting

### "Please sign in" message

- Make sure you're signed in to ToDzz (https://todzz.eu)
- Try clicking "Sign In" and completing the authentication flow
- If still not working, open DevTools and check for errors

### "Failed to load boards"

- Check your internet connection
- Make sure you're authenticated
- Check if you have any boards created in ToDzz
- Open DevTools console for more details

### "Failed to save note"

- Ensure you've selected a board
- Check if you have permission to edit the selected board
- Verify your authentication token hasn't expired
- Check DevTools console for specific error messages

### Extension doesn't appear

- Make sure you've added icon files to the `icons/` folder
- Check `chrome://extensions/` for any errors
- Try reloading the extension
- Check that manifest.json is valid JSON

## Privacy & Permissions

The extension requires the following permissions:

- **activeTab**: To extract metadata from the current page
- **storage**: To store authentication tokens and preferences
- **scripting**: To inject content script for page data extraction
- **host_permissions**: To communicate with ToDzz API

**Data collected**:
- Page title, URL, description, and OG image (only when you click save)
- Your authentication token (stored locally)
- Your selected board and preferences (stored locally)

**Data NOT collected**:
- No tracking or analytics
- No third-party data sharing
- Page content is only sent to AI if you enable summarization

## Support

For issues or questions:
- Report bugs in the main ToDzz repository
- Check the main app documentation at https://todzz.eu

## License

Same as the main ToDzz application.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-15
