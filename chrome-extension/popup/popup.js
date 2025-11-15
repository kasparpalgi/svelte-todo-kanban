/** @file chrome-extension/popup/popup.js */

/**
 * Popup logic for ToDzz Chrome Extension
 * Handles UI interactions, board selection, and note creation
 */

// Global state
let pageData = null;
let boards = [];
let selectedBoardId = null;
let selectedImageUrl = null;
let availableImages = [];
let aiSummary = null;
let aiProcessing = false;

// DOM elements
const authRequired = document.getElementById('auth-required');
const mainContent = document.getElementById('main-content');
const loadingState = document.getElementById('loading');
const signInBtn = document.getElementById('sign-in-btn');
const boardSelect = document.getElementById('board-select');
const titleInput = document.getElementById('title-input');
const descriptionInput = document.getElementById('description-input');
const commentInput = document.getElementById('comment-input');
const aiSummarizeCheckbox = document.getElementById('ai-summarize');
const aiModelGroup = document.getElementById('ai-model-group');
const aiModelSelect = document.getElementById('ai-model-select');
const aiSummaryGroup = document.getElementById('ai-summary-group');
const aiSummaryInput = document.getElementById('ai-summary-input');
const generateAiBtn = document.getElementById('generate-ai-btn');
const generateAiText = document.getElementById('generate-ai-text');
const generateAiLoading = document.getElementById('generate-ai-loading');
const imagePickerGroup = document.getElementById('image-picker-group');
const imagePicker = document.getElementById('image-picker');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtnText = document.getElementById('save-btn-text');
const saveBtnLoading = document.getElementById('save-btn-loading');
const statusMessage = document.getElementById('status-message');
const pageUrlLink = document.getElementById('page-url-link');

/**
 * Initialize the popup
 */
async function init() {
  try {
    // Show loading state
    showLoading();

    // Check authentication
    let isAuth = await isAuthenticated();

    if (!isAuth) {
      showAuthRequired();
      return;
    }

    // Load boards first (critical)
    boards = await loadBoards();

    // Try to load page data (optional - may fail on some pages)
    try {
      pageData = await loadPageData();
      displayPageData();
    } catch (error) {
      console.warn('Could not load page data:', error.message);
      // Set default page data (await the async operation)
      await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            pageData = {
              title: tabs[0].title || 'Untitled Page',
              url: tabs[0].url || '',
              description: '',
              image: null,
              images: [],
              content: ''
            };
            displayPageData();
          }
          resolve();
        });
      });
    }

    // Populate board selector
    populateBoardSelector();

    // Load last selected board
    await loadLastBoard();

    // Load user preferences
    await loadPreferences();

    // Show main content
    showMainContent();
  } catch (error) {
    console.error('Init error:', error);
    showError('Failed to initialize: ' + error.message);
  }
}

/**
 * Load page data from content script
 */
async function loadPageData() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        reject(new Error('No active tab found'));
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: 'EXTRACT_PAGE_DATA' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!response) {
            reject(new Error('No response from content script'));
            return;
          }

          resolve(response);
        }
      );
    });
  });
}

/**
 * Load user's boards
 */
async function loadBoards() {
  try {
    const boardsList = await getBoards();
    return boardsList;
  } catch (error) {
    console.error('Load boards error:', error);
    throw new Error('Failed to load boards');
  }
}

/**
 * Display page data in the UI
 */
function displayPageData() {
  if (!pageData) return;

  // Set page URL link
  pageUrlLink.href = pageData.url;
  pageUrlLink.textContent = pageData.url;

  // Set editable title
  titleInput.value = pageData.title || 'Untitled Page';

  // Set editable description
  descriptionInput.value = pageData.description || '';

  // Set up image picker if images are available
  availableImages = pageData.images || [];
  selectedImageUrl = pageData.image || null;

  if (availableImages.length > 0 || selectedImageUrl) {
    displayImagePicker();
  }
}

/**
 * Display image picker with thumbnails
 */
function displayImagePicker() {
  // Show image picker group
  imagePickerGroup.classList.remove('hidden');

  // Clear existing images
  imagePicker.innerHTML = '';

  // Combine OG image with extracted images
  const allImages = [];
  if (selectedImageUrl && !availableImages.includes(selectedImageUrl)) {
    allImages.push(selectedImageUrl);
  }
  allImages.push(...availableImages);

  // Remove duplicates
  const uniqueImages = [...new Set(allImages)];

  // Limit to 6 images (including "No image" option)
  const imagesToShow = uniqueImages.slice(0, 5);

  // Add "No image" option
  const noneOption = document.createElement('div');
  noneOption.className = 'image-option' + (!selectedImageUrl ? ' selected' : '');
  noneOption.onclick = () => selectImage(null);
  const noneInner = document.createElement('div');
  noneInner.className = 'image-option-inner image-option-none';
  noneInner.textContent = 'No Image';
  noneOption.appendChild(noneInner);
  imagePicker.appendChild(noneOption);

  // Add image options
  imagesToShow.forEach((imageUrl, index) => {
    const option = document.createElement('div');
    option.className = 'image-option' + (imageUrl === selectedImageUrl ? ' selected' : '');
    option.onclick = () => selectImage(imageUrl);

    const inner = document.createElement('div');
    inner.className = 'image-option-inner';
    inner.style.backgroundImage = `url('${imageUrl}')`;

    option.appendChild(inner);
    imagePicker.appendChild(option);
  });
}

/**
 * Select an image from the picker
 */
function selectImage(imageUrl) {
  selectedImageUrl = imageUrl;

  // Update UI
  const options = imagePicker.querySelectorAll('.image-option');
  options.forEach((option, index) => {
    if (index === 0 && imageUrl === null) {
      // "No image" option selected
      option.classList.add('selected');
    } else if (index > 0 && option.querySelector('.image-option-inner').style.backgroundImage.includes(imageUrl)) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
}

/**
 * Populate board selector dropdown
 */
function populateBoardSelector() {
  // Clear existing options
  boardSelect.innerHTML = '';

  if (boards.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No boards found';
    boardSelect.appendChild(option);
    return;
  }

  // Add boards as options
  boards.forEach((board) => {
    const option = document.createElement('option');
    option.value = board.id;
    option.textContent = board.name;
    boardSelect.appendChild(option);
  });
}

/**
 * Load last selected board
 */
async function loadLastBoard() {
  const lastBoardId = await getLastBoard();

  if (lastBoardId && boards.some(b => b.id === lastBoardId)) {
    boardSelect.value = lastBoardId;
    selectedBoardId = lastBoardId;
  } else if (boards.length > 0) {
    // Default to first board
    boardSelect.value = boards[0].id;
    selectedBoardId = boards[0].id;
  }
}

/**
 * Load user preferences
 */
async function loadPreferences() {
  const prefs = await getPreferences();

  // Set AI model
  if (prefs.aiModel) {
    aiModelSelect.value = prefs.aiModel;
  }

  // Set auto AI correct (not used in extension, but load for consistency)
  if (prefs.autoAiCorrect) {
    aiSummarizeCheckbox.checked = true;
    aiModelGroup.classList.remove('hidden');
  }
}

/**
 * Handle board selection change
 */
function handleBoardChange() {
  selectedBoardId = boardSelect.value;

  // Save to storage
  if (selectedBoardId) {
    setLastBoard(selectedBoardId);
  }
}

/**
 * Handle AI summarize checkbox change
 */
function handleAiSummarizeChange() {
  if (aiSummarizeCheckbox.checked) {
    // Show AI sections
    aiModelGroup.classList.remove('hidden');
    aiSummaryGroup.classList.remove('hidden');
    generateAiBtn.classList.remove('hidden');

    // If we already have a summary, show it
    if (aiSummary) {
      aiSummaryInput.value = aiSummary;
      aiSummaryInput.disabled = false;
    } else {
      aiSummaryInput.value = '';
      aiSummaryInput.placeholder = 'Click \'Generate Summary\' to create AI summary...';
      aiSummaryInput.disabled = false;
    }
  } else {
    // Hide AI sections
    aiModelGroup.classList.add('hidden');
    aiSummaryGroup.classList.add('hidden');
    generateAiBtn.classList.add('hidden');
  }
}

/**
 * Handle Generate AI Summary button click
 */
async function handleGenerateAi() {
  // Check if we have page content for AI processing
  if (!pageData || !pageData.content || pageData.content.trim().length === 0) {
    aiSummaryInput.value = 'No page content available for AI summary.';
    showError('No page content available for AI summary');
    return;
  }

  if (aiProcessing) {
    return; // Already generating
  }

  try {
    // Show loading state
    aiProcessing = true;
    generateAiText.classList.add('hidden');
    generateAiLoading.classList.remove('hidden');
    generateAiBtn.disabled = true;
    aiSummaryInput.value = 'Generating AI summary...';
    aiSummaryInput.disabled = true;

    // Generate summary
    const summary = await getAiSummary(pageData.content);

    // Update UI with summary
    aiSummary = summary;
    aiSummaryInput.value = summary;
    aiSummaryInput.disabled = false;

    showSuccess('AI summary generated successfully!');
  } catch (error) {
    console.error('AI summary error:', error);
    aiSummaryInput.value = '';
    aiSummaryInput.placeholder = 'Failed to generate summary. Try again.';
    aiSummary = null;
    aiSummaryInput.disabled = false;
    showError('Failed to generate AI summary: ' + error.message);
  } finally {
    aiProcessing = false;
    generateAiText.classList.remove('hidden');
    generateAiLoading.classList.add('hidden');
    generateAiBtn.disabled = false;
  }
}

/**
 * Handle save button click
 * Implements optimistic save - creates note immediately, AI processing happens in background
 */
async function handleSave() {
  try {
    // Validate
    if (!selectedBoardId) {
      showError('Please select a board');
      return;
    }

    if (!pageData) {
      showError('No page data available');
      return;
    }

    // Show loading
    setLoading(true);
    hideStatusMessage();

    // Get user-edited values
    const noteTitle = titleInput.value.trim() || 'Untitled Page';
    const noteDescription = descriptionInput.value.trim();
    const userComment = commentInput.value.trim();

    // Build content
    let content = '';

    // 1. URL at the very top (as requested)
    content += `<p><a href="${pageData.url}" target="_blank">${pageData.url}</a></p>\n\n`;

    // 2. AI Summary or Description (without "AI Summary" title as requested)
    if (aiSummarizeCheckbox.checked && aiSummary) {
      // Use the AI summary from the editable textarea (user may have edited it)
      const editedSummary = aiSummaryInput.value.trim();
      if (editedSummary &&
          editedSummary !== 'Generating AI summary...' &&
          editedSummary !== 'Failed to generate summary. Description will be used instead.' &&
          editedSummary !== 'No page content available for AI summary. Description will be used instead.') {
        content += `<p>${editedSummary}</p>\n\n`;
      } else if (noteDescription) {
        content += `<p>${noteDescription}</p>\n\n`;
      }
    } else if (noteDescription) {
      content += `<p>${noteDescription}</p>\n\n`;
    }

    // 3. User notes/comment (if provided)
    if (userComment) {
      content += `<p><strong>Notes:</strong></p>\n<p>${userComment}</p>\n\n`;
    }

    // Create note data
    const noteData = {
      board_id: selectedBoardId,
      title: noteTitle,
      content: content,
      cover_image_url: selectedImageUrl || null
    };

    // OPTIMISTIC SAVE: Create note immediately
    const createdNote = await createNote(noteData);

    // Success!
    showSuccess('Note saved successfully!');

    // If AI summarize is checked but AI is still processing, continue in background
    if (aiSummarizeCheckbox.checked && aiProcessing) {
      console.log('AI summary still processing in background');
      // Note: We could update the note later when AI finishes, but for now
      // we just save what we have. The user can see the AI summary in the textarea
      // and edit the note later if needed.
    }

    // Close popup after 1.5 seconds
    setTimeout(() => {
      window.close();
    }, 1500);
  } catch (error) {
    console.error('Save error:', error);
    showError('Failed to save note: ' + error.message);
  } finally {
    setLoading(false);
  }
}

/**
 * Get AI summary of content
 */
async function getAiSummary(content) {
  const apiUrl = await getApiUrl();
  const model = aiModelSelect.value || 'gpt-5-mini';

  const response = await fetch(`${apiUrl}/api/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: content,
      type: 'correct',
      model: model,
      context: 'Summarize this web page content in 2-3 sentences'
    })
  });

  if (!response.ok) {
    throw new Error('AI summarization failed');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'AI summarization failed');
  }

  return data.corrected || content;
}

/**
 * Helper function to get API URL
 */
async function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['devMode'], (result) => {
      resolve(result.devMode ? 'http://localhost:5173' : 'https://www.todzz.eu');
    });
  });
}

/**
 * Handle cancel button click
 */
function handleCancel() {
  window.close();
}

/**
 * Handle sign in button click
 */
async function handleSignIn() {
  await openAuthFlow();
  showInfo('Authentication page opened. After signing in, this popup will automatically update.');
}

/**
 * Set loading state
 */
function setLoading(loading) {
  saveBtn.disabled = loading;

  if (loading) {
    saveBtnText.classList.add('hidden');
    saveBtnLoading.classList.remove('hidden');
  } else {
    saveBtnText.classList.remove('hidden');
    saveBtnLoading.classList.add('hidden');
  }
}

/**
 * Show/hide UI states
 */
function showLoading() {
  loadingState.classList.remove('hidden');
  authRequired.classList.add('hidden');
  mainContent.classList.add('hidden');
}

function showAuthRequired() {
  loadingState.classList.add('hidden');
  authRequired.classList.remove('hidden');
  mainContent.classList.add('hidden');
}

function showMainContent() {
  loadingState.classList.add('hidden');
  authRequired.classList.add('hidden');
  mainContent.classList.remove('hidden');
}

/**
 * Show status messages
 */
function showSuccess(message) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message success';
  statusMessage.classList.remove('hidden');
}

function showError(message) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message error';
  statusMessage.classList.remove('hidden');
}

function showInfo(message) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message info';
  statusMessage.classList.remove('hidden');
}

function hideStatusMessage() {
  statusMessage.classList.add('hidden');
}

/**
 * Event listeners
 */
boardSelect.addEventListener('change', handleBoardChange);
aiSummarizeCheckbox.addEventListener('change', handleAiSummarizeChange);
generateAiBtn.addEventListener('click', handleGenerateAi);
saveBtn.addEventListener('click', handleSave);
cancelBtn.addEventListener('click', handleCancel);
signInBtn.addEventListener('click', handleSignIn);

// Listen for auth complete message from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'AUTH_COMPLETE') {
    console.log('Auth complete, reinitializing popup');
    // Reinitialize the popup now that we have auth
    init();
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
