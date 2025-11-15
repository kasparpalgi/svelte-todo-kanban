/** @file chrome-extension/lib/storage.js */

/**
 * Chrome storage helpers for ToDzz Extension
 * Provides convenient methods for storing and retrieving data
 */

/**
 * Get value from Chrome storage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored value
 */
async function get(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

/**
 * Get multiple values from Chrome storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<Object>} Object with key-value pairs
 */
async function getMultiple(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

/**
 * Set value in Chrome storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
async function set(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Set multiple values in Chrome storage
 * @param {Object} items - Object with key-value pairs
 * @returns {Promise<void>}
 */
async function setMultiple(items) {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, resolve);
  });
}

/**
 * Remove value from Chrome storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
async function remove(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], resolve);
  });
}

/**
 * Remove multiple values from Chrome storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<void>}
 */
async function removeMultiple(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, resolve);
  });
}

/**
 * Clear all data from Chrome storage
 * @returns {Promise<void>}
 */
async function clear() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}

/**
 * Get last selected board ID
 * @returns {Promise<string|null>} Board ID or null
 */
async function getLastBoard() {
  return get('lastBoardId');
}

/**
 * Save last selected board ID
 * @param {string} boardId - Board ID
 * @returns {Promise<void>}
 */
async function setLastBoard(boardId) {
  return set('lastBoardId', boardId);
}

/**
 * Get user preferences
 * @returns {Promise<Object>} User preferences
 */
async function getPreferences() {
  const prefs = await get('preferences');
  return prefs || {
    aiModel: 'gpt-5-mini',
    autoAiCorrect: false,
    devMode: false
  };
}

/**
 * Save user preferences
 * @param {Object} preferences - User preferences
 * @returns {Promise<void>}
 */
async function setPreferences(preferences) {
  return set('preferences', preferences);
}
