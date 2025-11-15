/** @file chrome-extension/lib/auth.js */

/**
 * Authentication helpers for ToDzz Chrome Extension
 * Handles JWT token management and authentication flow
 */

const API_URL = 'https://www.todzz.eu';
const API_URL_DEV = 'http://localhost:5173';

/**
 * Get the API URL based on environment
 * @returns {string} API URL
 */
function getApiUrl() {
  // Check if dev mode is enabled in storage
  return new Promise((resolve) => {
    chrome.storage.local.get(['devMode'], (result) => {
      resolve(result.devMode ? API_URL_DEV : API_URL);
    });
  });
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
async function isAuthenticated() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['jwtToken', 'tokenExpiry'], (result) => {
      if (!result.jwtToken || !result.tokenExpiry) {
        resolve(false);
        return;
      }

      // Check if token is expired
      if (Date.now() > result.tokenExpiry) {
        // Clear expired token
        chrome.storage.local.remove(['jwtToken', 'tokenExpiry']);
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

/**
 * Get JWT token from storage
 * @returns {Promise<string|null>} JWT token or null
 */
async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['jwtToken', 'tokenExpiry'], (result) => {
      if (!result.jwtToken || !result.tokenExpiry) {
        resolve(null);
        return;
      }

      // Check if token is expired
      if (Date.now() > result.tokenExpiry) {
        chrome.storage.local.remove(['jwtToken', 'tokenExpiry']);
        resolve(null);
        return;
      }

      resolve(result.jwtToken);
    });
  });
}

/**
 * Save JWT token to storage
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
async function saveToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      jwtToken: token,
      tokenExpiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }, resolve);
  });
}

/**
 * Clear authentication data
 * @returns {Promise<void>}
 */
async function logout() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['jwtToken', 'tokenExpiry', 'userData'], resolve);
  });
}

/**
 * Open authentication flow
 * Opens the app's extension auth page in a new tab
 * After user signs in, the page will automatically provide the JWT token
 * @returns {Promise<void>}
 */
async function openAuthFlow() {
  const apiUrl = await getApiUrl();
  const authUrl = `${apiUrl}/extension-auth`;

  return new Promise((resolve) => {
    chrome.tabs.create({ url: authUrl }, () => {
      resolve();
    });
  });
}

/**
 * Fetch JWT token from the app
 * This requires the user to be signed in to the web app
 * @returns {Promise<string|null>} JWT token or null
 */
async function fetchJwtToken() {
  const apiUrl = await getApiUrl();
  const tokenUrl = `${apiUrl}/api/auth/token`;

  try {
    const response = await fetch(tokenUrl, {
      credentials: 'include' // Include cookies
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }

    const data = await response.json();

    if (data.token) {
      await saveToken(data.token);
      return data.token;
    }

    return null;
  } catch (error) {
    console.error('Error fetching JWT token:', error);
    return null;
  }
}

/**
 * Get user data from JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} User data or null
 */
function decodeToken(token) {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64 payload
    const payload = JSON.parse(atob(parts[1]));

    // Extract Hasura claims
    const claims = payload['https://hasura.io/jwt/claims'];
    if (!claims) {
      return null;
    }

    return {
      userId: claims['x-hasura-user-id'],
      email: claims['x-hasura-user-email'],
      username: claims['x-hasura-user-username'],
      role: claims['x-hasura-default-role']
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get current user data
 * @returns {Promise<Object|null>} User data or null
 */
async function getCurrentUser() {
  const token = await getToken();
  if (!token) {
    return null;
  }

  return decodeToken(token);
}
