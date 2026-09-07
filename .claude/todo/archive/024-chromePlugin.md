Break each task into even smaller tasks and first create a plan in this same file. Then take small tasks one by one.

Create Chrome plugin to add content to your board's notes.

1. Connect to your account
2. Click on plugin icon will open small nice looking content to pick the board. Last selected board by default selected.
3. Comment input area that is optional
4. AI summarise checkbox (see how AI is already integrated for voice AI input)
5. When "add button clicked" then:
 - Meta Title -> note title
 - Content - meta content or if AI summarise checked then that
 - Link to the URL clickable below meta content
 - Cover image thumbnail from OG data or if that missing then from where? Let AI pick from code?

---

## Implementation Plan

### Phase 1: Extension Structure & Setup ✅
- [x] Research existing notes and AI implementation
- [x] Create Chrome extension directory structure
- [x] Create manifest.json (Manifest V3)
- [x] Set up background service worker
- [x] Create popup HTML/CSS/JS structure
- [x] Set up content script for page metadata extraction

### Phase 2: Authentication ✅
- [x] Implement OAuth flow (Option A: Open web app sign-in page)
- [x] Store JWT token securely in Chrome storage
- [x] Add token refresh mechanism (24h expiry)
- [x] Authentication helpers implemented

### Phase 3: Popup UI ✅
- [x] Design popup UI (clean, modern design)
- [x] Implement board selector dropdown
  - Fetch user's boards via GraphQL
  - Remember last selected board (chrome.storage.local)
  - Default to last used board
- [x] Add optional comment/notes textarea
- [x] Add AI summarize checkbox
- [x] Add "Save to Notes" button
- [x] Add loading/success/error states

### Phase 4: Content Extraction ✅
- [x] Create content script to extract:
  - Page title (meta title or document.title)
  - OG tags (og:title, og:description, og:image)
  - Meta description
  - Canonical URL
  - Main content (custom extraction logic)
- [x] Send extracted data to popup via messaging
- [x] Handle edge cases (no OG tags, no meta description)

### Phase 5: AI Integration ✅
- [x] Connect to existing /api/ai endpoint
- [x] Implement AI summarization when checkbox enabled
  - Send page content to AI endpoint
  - Use 'gpt-5-mini' model (cost-effective, configurable)
  - Handle context: "Summarize this web page content"
- [x] Show AI processing indicator
- [x] Handle AI errors gracefully
- [x] Support all AI models (gpt-5, gpt-5-mini, gpt-5-nano)

### Phase 6: Note Creation ✅
- [x] Implement GraphQL client in extension
- [x] Create note mutation with:
  - title: extracted page title
  - content: HTML formatted with:
    - Meta description OR AI summary
    - Clickable link to source URL
    - Optional user comment
  - cover_image_url: OG image URL
  - board_id: selected board
- [x] Handle success/error responses
- [x] Show confirmation message

### Phase 7: Testing & Polish ⚠️
- [ ] Test on various websites (with/without OG tags)
- [ ] Test AI summarization
- [ ] Test authentication flow
- [ ] Test board selection and persistence
- [x] Add error handling and user feedback
- [x] Optimize performance
- [ ] Create extension icons (16x16, 48x48, 128x128) - **NEEDED**

### Phase 8: Documentation & Packaging ✅
- [x] Create README for extension
- [x] Add installation instructions
- [ ] Package for Chrome Web Store (pending icons)
- [ ] Test installation from .zip (pending icons)

---

## Technical Architecture

### File Structure
```
chrome-extension/
├── manifest.json           # Extension manifest (V3)
├── background.js           # Service worker
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
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Data Flow
1. User clicks extension icon → popup opens
2. Background script fetches user's boards (via GraphQL)
3. Content script extracts page metadata (OG tags, title, etc.)
4. User selects board, optionally adds comment, checks AI summarize
5. User clicks "Save to Notes"
6. If AI enabled: send content to /api/ai for summarization
7. Create note via GraphQL mutation with formatted content
8. Show success message, close popup

### Authentication Strategy
Use JWT token from existing /api/auth/token endpoint:
1. On first use: open web app sign-in page in new tab
2. After sign-in: capture JWT token via messaging
3. Store token in chrome.storage.local (encrypted)
4. Use token for all GraphQL requests
5. Refresh token before 24h expiry

### Content Format
```html
<h3>AI Summary / Meta Description</h3>
<p>[Summary or meta description]</p>

<p><strong>User Notes:</strong><br>[Optional user comment]</p>

<p><a href="[PAGE_URL]" target="_blank">[PAGE_TITLE]</a></p>
```

### GraphQL Queries Needed
1. **Get Boards**: Fetch user's boards for dropdown
2. **Create Note**: Create new note with content

### API Endpoints Used
1. `GET /api/auth/token` - Get JWT token
2. `POST /api/ai` - AI summarization (optional)
3. `POST /v1/graphql` - Create note via Hasura

---

## Implementation Summary

### Completed (2025-11-15)

The Chrome extension has been successfully implemented with all core functionality:

**Files Created:**
1. `chrome-extension/manifest.json` - Manifest V3 configuration
2. `chrome-extension/background.js` - Service worker for lifecycle management
3. `chrome-extension/content/content.js` - Page metadata extraction
4. `chrome-extension/lib/auth.js` - Authentication helpers
5. `chrome-extension/lib/storage.js` - Chrome storage utilities
6. `chrome-extension/lib/graphql.js` - GraphQL client
7. `chrome-extension/popup/popup.html` - Popup UI structure
8. `chrome-extension/popup/popup.css` - Modern, clean styling
9. `chrome-extension/popup/popup.js` - Complete popup logic
10. `chrome-extension/README.md` - Comprehensive documentation
11. `chrome-extension/.gitignore` - Git ignore rules
12. `chrome-extension/icons/ICONS_NEEDED.md` - Icon requirements

**Features Implemented:**
- ✅ JWT-based authentication with token storage and expiry
- ✅ Board selection with last-used board persistence
- ✅ Page metadata extraction (OG tags, meta data, content)
- ✅ Optional user comments/notes
- ✅ AI summarization with model selection (gpt-5, mini, nano)
- ✅ Cover image extraction from OG tags
- ✅ Note creation via GraphQL mutation
- ✅ Clean, modern UI with loading/success/error states
- ✅ Development mode support for local testing
- ✅ Comprehensive error handling

**Remaining Tasks:**
1. Create extension icons (16x16, 48x48, 128x128 PNG files)
2. Test extension in Chrome with real data
3. Fix any bugs discovered during testing
4. Optional: Package for Chrome Web Store
5. Optional: Add option to select image if multiple images found
6. Optional: Add preview of note content before saving

**Next Steps:**
1. Create or obtain icon files (see `chrome-extension/icons/ICONS_NEEDED.md`)
2. Load extension in Chrome for testing
3. Test all features:
   - Authentication flow
   - Board selection and persistence
   - Page data extraction on various sites
   - AI summarization
   - Note creation
4. Fix any issues found during testing
5. Consider Chrome Web Store submission