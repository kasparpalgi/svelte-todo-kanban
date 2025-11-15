/** @file chrome-extension/content/content.js */

/**
 * Content script for extracting page metadata
 * Runs on all pages to extract OG tags, meta data, and page content
 */

/**
 * Extract metadata from the current page
 * @returns {Object} Page metadata including title, description, image, url, and content
 */
function extractPageData() {
  // Helper function to get meta tag content
  const getMeta = (name, property) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag && property) {
      tag = document.querySelector(`meta[property="${property}"]`);
    }
    return tag ? tag.getAttribute('content') : null;
  };

  // Extract OG (Open Graph) data
  const ogTitle = getMeta('og:title', 'og:title');
  const ogDescription = getMeta('og:description', 'og:description');
  const ogImage = getMeta('og:image', 'og:image');
  const ogUrl = getMeta('og:url', 'og:url');

  // Extract standard meta data
  const metaDescription = getMeta('description');
  const metaKeywords = getMeta('keywords');

  // Get page title
  const pageTitle = ogTitle || document.title || 'Untitled Page';

  // Get page URL
  const pageUrl = ogUrl || window.location.href;

  // Get page description
  const pageDescription = ogDescription || metaDescription || '';

  // Get cover image
  const coverImage = ogImage || extractFirstImage();

  // Extract main content (simplified version)
  const mainContent = extractMainContent();

  return {
    title: pageTitle.trim(),
    description: pageDescription.trim(),
    image: coverImage,
    url: pageUrl,
    content: mainContent,
    keywords: metaKeywords || ''
  };
}

/**
 * Extract the first meaningful image from the page
 * @returns {string|null} Image URL or null
 */
function extractFirstImage() {
  // Look for meaningful images (skip icons, logos, etc.)
  const images = document.querySelectorAll('img');
  for (const img of images) {
    const src = img.src;
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    // Skip small images (likely icons or ads)
    if (width >= 200 && height >= 200) {
      return src;
    }
  }

  // Fallback: check for favicon
  const favicon = document.querySelector('link[rel="icon"]') ||
                 document.querySelector('link[rel="shortcut icon"]');
  return favicon ? favicon.href : null;
}

/**
 * Extract main content from the page
 * Uses heuristics to find the main content area
 * @returns {string} Main content text
 */
function extractMainContent() {
  // Try to find main content area
  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.post-content',
    '.entry-content',
    '.article-content'
  ];

  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return extractTextContent(element);
    }
  }

  // Fallback: use body content
  return extractTextContent(document.body);
}

/**
 * Extract clean text content from an element
 * @param {Element} element - DOM element
 * @returns {string} Clean text content
 */
function extractTextContent(element) {
  // Clone to avoid modifying the original
  const clone = element.cloneNode(true);

  // Remove unwanted elements
  const unwantedSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    '.ad',
    '.advertisement',
    '.sidebar',
    '.menu',
    '.navigation'
  ];

  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Get text content
  let text = clone.textContent || '';

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Limit to first 5000 characters for AI processing
  return text.substring(0, 5000);
}

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_PAGE_DATA') {
    const data = extractPageData();
    sendResponse(data);
  }
  return true; // Async response
});

// Also make data available immediately for popup
window.addEventListener('message', (event) => {
  if (event.data.type === 'REQUEST_PAGE_DATA') {
    const data = extractPageData();
    event.source.postMessage({
      type: 'PAGE_DATA_RESPONSE',
      data: data
    }, event.origin);
  }
});
