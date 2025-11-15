# Chrome Web Store Submission Guide for ToDzz Extension

## Prerequisites

### 1. Developer Account
- Create a Chrome Web Store Developer account at https://chrome.google.com/webstore/devconsole
- One-time registration fee: $5 USD
- Account limit: Maximum 20 extensions per developer account

### 2. Required Assets

#### Extension Icons ✅
Already configured in manifest.json, but need to be created:
- **16x16 pixels** - Favicon for extension pages
- **48x48 pixels** - Extensions management page
- **128x128 pixels** - Installation and Chrome Web Store display
  - Actual icon: 96x96 pixels
  - Transparent padding: 16 pixels on all sides
  - Total size: 128x128 pixels
- **Format**: PNG with transparency
- **Design guidelines**:
  - Work well on both light and dark backgrounds
  - Avoid large drop shadows (UI might add its own)
  - No edge around 128x128 image
  - Consider subtle white outer glow if icon is dark
  - Use front-facing perspective

#### Store Listing Assets (Required)
1. **Small Promotional Tile** (Required)
   - Size: 440x280 pixels
   - Format: PNG or JPG
   - Design: Avoid text, use saturated colors on light gray background
   - Must work when shrunk to half size

2. **Screenshots** (Required: minimum 1, recommended: 5)
   - Preferred size: 1280x800 pixels
   - Minimum size: 640x400 pixels
   - Format: PNG or JPG
   - Design: Full bleed with square corners, no padding
   - Content: Demonstrate actual user experience and core features
   - Localization: Can provide locale-specific versions

3. **Marquee Promotional Tile** (Optional)
   - Size: 1400x560 pixels
   - Format: PNG or JPG
   - Used for featured placements

### 3. Store Listing Information

#### Required Fields
- **Name**: "ToDzz - Save to Notes" (max 45 characters)
- **Summary**: Short description (max 132 characters)
  - Suggested: "Save web pages to your ToDzz boards with AI-powered summaries and image selection"
- **Description**: Detailed description
  - Explain what the extension does
  - List key features
  - Provide usage instructions
  - Max length: Not specified, but be concise
- **Category**: Choose appropriate category (e.g., "Productivity")
- **Language**: Primary language (English)
- **Icon**: 128x128 PNG (upload separate from manifest)

#### Suggested Description
```
Save any web page directly to your ToDzz boards as notes with just one click.

KEY FEATURES:
• Instant Save: Capture web pages to your boards in seconds
• AI Summarization: Get intelligent summaries of page content using GPT-5
• Editable Content: Customize title, description, and AI summary before saving
• Image Selection: Choose from multiple page images or use none
• Board Organization: Save to any of your ToDzz boards
• Rich Formatting: Preserves page metadata and structure

HOW IT WORKS:
1. Click the extension icon while viewing any web page
2. Select which board to save to
3. Optionally enable AI summarization for instant page summaries
4. Edit title, description, or AI summary as needed
5. Choose a cover image from available options
6. Save and access from your ToDzz dashboard

REQUIREMENTS:
• A ToDzz account (create one at www.todzz.eu)
• Active internet connection

PRIVACY:
• Only accesses pages when you click the extension icon
• Communicates only with todzz.eu servers
• No data collection or third-party sharing
• View our privacy policy at www.todzz.eu/privacy

SUPPORT:
For questions or issues, contact support@todzz.eu or visit www.todzz.eu/help
```

### 4. Privacy Information (Required)

#### Single Purpose Declaration
"This extension allows users to save web pages as notes to their ToDzz boards with optional AI summarization."

#### Permission Justifications
- **activeTab**: Required to extract page content when user clicks extension icon
- **storage**: Required to store user authentication token and preferences
- **scripting**: Required to inject content script for page data extraction
- **alarms**: Required for token refresh mechanism
- **host_permissions (todzz.eu)**: Required to communicate with ToDzz GraphQL API and authentication endpoints

#### Data Usage
- **User Authentication**: JWT token stored locally to authenticate with ToDzz API
- **Page Data**: Only extracted when user actively saves a page; sent to AI API only when user enables AI summarization
- **User Preferences**: Last selected board and AI model preference stored locally
- **No Third-Party Data Sharing**: All data sent only to todzz.eu servers

#### Privacy Policy URL
Provide a link to your privacy policy (e.g., https://www.todzz.eu/privacy)

### 5. Distribution Settings

- **Visibility**: Public or Unlisted
- **Regions**: Select countries where extension will be available
- **Pricing**: Free

---

## Pre-Submission Checklist

### Code Requirements
- [x] Manifest V3 (required since January 2024)
- [x] No remotely hosted code (all logic must be in package)
- [x] Service worker instead of background page
- [x] Content Security Policy compliant
- [ ] Icons created (16x16, 48x48, 128x128)
- [ ] Extension tested in Chrome
- [ ] No console errors or warnings
- [ ] All features working correctly

### Store Assets
- [ ] 128x128 icon created
- [ ] Small promotional tile (440x280) created
- [ ] Screenshots (1-5) created
- [ ] Marquee tile (1400x560) created (optional)

### Documentation
- [ ] Privacy policy published
- [ ] Support email/contact method set up
- [ ] Description written
- [ ] Summary written
- [ ] Single purpose declared
- [ ] Permission justifications documented

### Testing
- [ ] Test on clean Chrome profile
- [ ] Test authentication flow
- [ ] Test all features (save, AI, image picker)
- [ ] Test on various websites
- [ ] Test error handling

---

## Submission Process

### 1. Create Package
```bash
cd chrome-extension
# Remove localhost permission for production
# Update manifest.json to remove localhost from host_permissions
zip -r todzz-extension.zip . -x "*.git*" -x "*.md" -x "ICONS_NEEDED.md" -x ".gitignore"
```

### 2. Upload to Chrome Web Store
1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload `todzz-extension.zip`
4. Fill in all required fields:
   - Store listing info
   - Privacy fields
   - Distribution settings
   - Upload assets (icons, screenshots, promotional images)

### 3. Submit for Review
- Review timeline: Usually within 3 days (varies by extension complexity)
- You'll receive email notification when review is complete
- Deferred publishing option: Can delay publication up to 30 days after approval

### 4. After Approval
- Extension will be published automatically (or manually if deferred publishing enabled)
- Monitor reviews and respond to user feedback
- Submit updates as needed (same process)

---

## Post-Submission

### Monitoring
- Check Chrome Web Store Developer Dashboard regularly
- Respond to user reviews
- Monitor for policy violations

### Updates
- Update version number in manifest.json
- Create new ZIP package
- Upload to Developer Dashboard
- Will undergo review again

### Analytics
- Chrome Web Store provides basic analytics:
  - Installations
  - Uninstalls
  - Active users
  - Reviews and ratings

---

## Common Rejection Reasons

1. **Privacy Policy Issues**
   - Missing privacy policy
   - Privacy policy doesn't match actual permissions/behavior
   - Insufficient permission justifications

2. **Manifest Issues**
   - Still using Manifest V2 (must use V3)
   - Requesting unnecessary permissions
   - Invalid manifest structure

3. **Code Quality**
   - Contains malicious code
   - Contains remotely hosted code
   - Doesn't match stated functionality

4. **Store Listing Issues**
   - Misleading description
   - Poor quality images
   - Trademark violations

5. **Functionality Issues**
   - Extension doesn't work as described
   - Crashes or errors
   - Poor user experience

---

## Useful Links

- Chrome Web Store Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Program Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Publishing Guide: https://developer.chrome.com/docs/webstore/publish
- Image Requirements: https://developer.chrome.com/docs/webstore/images
- Manifest V3 Guide: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3

---

## Support

For issues with Chrome Web Store submission:
- Developer Support: https://support.google.com/chrome_webstore/
- Chrome Extensions Google Group: https://groups.google.com/a/chromium.org/g/chromium-extensions

For issues with ToDzz extension:
- Email: support@todzz.eu
- GitHub: [Repository URL if applicable]

---

## Notes

### Development vs Production
- Remove `http://localhost:5173/*` and `http://localhost:3001` from host_permissions and CSP before submission
- Or use separate manifest.json for development and production

### Version Management
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Document changes in each version
- Update version in manifest.json for each submission

### Beta Testing
- Consider using "Unlisted" visibility for beta testing
- Share link directly with beta testers
- Collect feedback before making public

---

**Last Updated**: 2025-11-15
**Extension Version**: 1.0.0
