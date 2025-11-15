/** @file chrome-extension/popup/popup.js */

/**
 * Popup logic for ToDzz Chrome Extension
 * Handles UI interactions, board selection, and note creation
 */

// Global state
let pageData = null;
let boards = [];
let selectedBoardId = null;

// DOM elements
const authRequired = document.getElementById('auth-required');
const mainContent = document.getElementById('main-content');
const loadingState = document.getElementById('loading');
const signInBtn = document.getElementById('sign-in-btn');
const boardSelect = document.getElementById('board-select');
const commentInput = document.getElementById('comment-input');
const aiSummarizeCheckbox = document.getElementById('ai-summarize');
const aiModelGroup = document.getElementById('ai-model-group');
const aiModelSelect = document.getElementById('ai-model-select');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtnText = document.getElementById('save-btn-text');
const saveBtnLoading = document.getElementById('save-btn-loading');
const statusMessage = document.getElementById('status-message');
const pageTitle = document.getElementById('page-title');
const pageUrl = document.getElementById('page-url');
const pageImage = document.getElementById('page-image');

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

    // Load page data and boards in parallel
    const [pageDataResult, boardsResult] = await Promise.all([
      loadPageData(),
      loadBoards()
    ]);

    pageData = pageDataResult;
    boards = boardsResult;

    // Display page preview
    displayPagePreview();

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
 * Display page preview
 */
function displayPagePreview() {
  if (!pageData) return;

  // Set page title
  pageTitle.textContent = pageData.title || 'Untitled Page';

  // Set page URL
  const urlObj = new URL(pageData.url);
  pageUrl.textContent = urlObj.hostname;
  pageUrl.title = pageData.url;

  // Set page image
  if (pageData.image) {
    pageImage.style.backgroundImage = `url('${pageData.image}')`;
    pageImage.classList.remove('hidden');
  } else {
    pageImage.classList.add('hidden');
  }
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
    aiModelGroup.classList.remove('hidden');
  } else {
    aiModelGroup.classList.add('hidden');
  }
}

/**
 * Handle save button click
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

    // Prepare content
    let content = '';

    // If AI summarize is checked, get summary
    if (aiSummarizeCheckbox.checked && pageData.content) {
      const summary = await getAiSummary(pageData.content);
      content += `<h3>AI Summary</h3>\n<p>${summary}</p>\n\n`;
    } else if (pageData.description) {
      content += `<p>${pageData.description}</p>\n\n`;
    }

    // Add user comment if provided
    const userComment = commentInput.value.trim();
    if (userComment) {
      content += `<p><strong>Notes:</strong></p>\n<p>${userComment}</p>\n\n`;
    }

    // Add source link
    content += `<p><a href="${pageData.url}" target="_blank">${pageData.title}</a></p>`;

    // Create note
    const noteData = {
      board_id: selectedBoardId,
      title: pageData.title || 'Untitled Page',
      content: content,
      cover_image_url: pageData.image || null
    };

    const createdNote = await createNote(noteData);

    // Success!
    showSuccess('Note saved successfully!');

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
      resolve(result.devMode ? 'http://localhost:5173' : 'https://todzz.eu');
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
