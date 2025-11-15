# Extension Icons Needed

The Chrome extension requires three icon files in PNG format:

## Required Icons

1. **icon16.png** - 16x16 pixels
   - Used in: Browser toolbar, extension menu

2. **icon48.png** - 48x48 pixels
   - Used in: Extension management page

3. **icon128.png** - 128x128 pixels
   - Used in: Chrome Web Store, installation prompts

## Design Guidelines

- **Format**: PNG with transparency
- **Content**: ToDzz logo or "T" letter
- **Colors**: Use brand colors (blue/primary color)
- **Style**: Simple, recognizable at small sizes
- **Background**: Transparent or solid color

## How to Create Icons

### Option 1: Use Existing Logo
If you have a ToDzz logo:
1. Resize to 128x128, 48x48, and 16x16
2. Ensure good visibility at small sizes
3. Save as PNG files with the exact names above

### Option 2: Create Simple Icon
1. Create a 128x128 canvas
2. Add a colored circle or rounded square background
3. Add "T" or "ToDzz" text in white
4. Export as PNG
5. Resize for smaller versions

### Option 3: Use Online Icon Generator
1. Visit a site like https://favicon.io/ or https://realfavicongenerator.net/
2. Upload your logo or create text-based icon
3. Generate and download icons
4. Rename to match required names

### Option 4: Use Placeholder (Development Only)
For development, you can use simple colored squares:

Create a simple HTML file and open in browser, then screenshot:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .icon {
      width: 128px;
      height: 128px;
      background: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 64px;
      font-weight: bold;
      font-family: Arial;
      border-radius: 20px;
    }
  </style>
</head>
<body>
  <div class="icon">T</div>
</body>
</html>
```

Then resize the screenshot to create all three sizes.

## Current Status

⚠️ **Icons are currently missing**

The extension will not load in Chrome until these icon files are added to this directory.

## Next Steps

1. Create or obtain the three PNG icon files
2. Place them in this directory (`chrome-extension/icons/`)
3. Ensure filenames match exactly: `icon16.png`, `icon48.png`, `icon128.png`
4. Load or reload the extension in Chrome
