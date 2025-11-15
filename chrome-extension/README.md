# ToDzz Chrome Extension

Save web pages to your ToDzz boards as notes with AI summarization.

> **For Developers**: See [DEVELOPMENT.md](DEVELOPMENT.md) for testing instructions and troubleshooting.

## Features

### Core Features
- **One-Click Save**: Save web pages to your ToDzz boards as notes
- **Optimistic Save**: Instant save without waiting for AI processing
- **AI Summarization**: Generate intelligent summaries using GPT-5 models (Nano, Mini, Full)
- **Board Selection**: Choose which board to save to, with last selection remembered
- **Source Links**: URL displayed prominently at top of note content

### v1.1.0 New Features
- **Editable Title & Description**: Customize page title and description before saving
- **AI Summary Preview**: Edit AI-generated summary in real-time before saving
- **Image Picker**: Choose from up to 5 page images or select "No Image"
- **Background AI Processing**: AI summary generates in background, doesn't block save
- **Enhanced Content Structure**: URL → Description → Notes (clean, organized format)

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
2. **Click the extension icon** - page data loads instantly
3. **Review and edit** (all optional):
   - **Title**: Edit the auto-populated page title
   - **Description**: Edit the auto-populated page description
   - **Cover Image**: Choose from 1-5 extracted images or select "No Image"
   - **Board**: Select destination board (last selected is pre-selected)
   - **Your Notes**: Add personal comments or thoughts
4. **(Optional) Enable "AI Summarize"**:
   - AI summary generates in background
   - Edit the summary in the textarea when it appears
   - Choose AI model: Nano (fastest/cheapest), Mini (balanced), or Full (most capable)
5. **Click "Save to Notes"** - saves instantly!
6. The note appears in your selected board immediately

### What Gets Saved

The note content is structured as:
1. **URL** - Clickable link at the very top
2. **Description/Summary** - AI summary (if enabled) OR edited description
3. **Your Notes** - Personal comments (if added)

Plus:
- **Title**: Your edited title (or original page title)
- **Cover Image**: Your selected image (or none)

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

**Version**: 1.2.0
**Last Updated**: 2025-11-15

## What's New in v1.2.0

- Fixed critical content script connection issues
- Modernized UI with gradient design and improved spacing
- Added actual logo icon instead of emoji
- Improved error handling for pages without content scripts
- Better height (no scrolling needed)
- Enhanced visual design throughout

## What's New in v1.1.0

See [IMPROVEMENTS.md](IMPROVEMENTS.md) for detailed changelog.

Key improvements:
- Editable title and description fields
- AI summary preview with editing capability
- Image picker with 1-5 thumbnail options
- Optimistic save (no more waiting for AI)
- URL now at top of note content
- Cleaner content structure without "AI Summary" heading

For Chrome Web Store submission instructions, see [CHROME_WEB_STORE_SUBMISSION.md](CHROME_WEB_STORE_SUBMISSION.md).
