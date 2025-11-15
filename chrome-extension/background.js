/** @file chrome-extension/background.js */

/**
 * Background service worker for ToDzz Chrome Extension
 * Handles extension lifecycle events and message passing
 */

// Extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ToDzz extension installed');
    // Open welcome page or sign-in on first install
    chrome.tabs.create({
      url: 'https://todzz.eu/signin'
    });
  } else if (details.reason === 'update') {
    console.log('ToDzz extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_DATA') {
    // Request page data from content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_PAGE_DATA' }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true; // Async response
  }

  if (request.type === 'OPEN_AUTH') {
    // Open authentication page
    chrome.tabs.create({
      url: request.url || 'https://todzz.eu/en/signin'
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'SAVE_TOKEN') {
    // Save JWT token to storage
    chrome.storage.local.set({
      jwtToken: request.token,
      tokenExpiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Check token expiry periodically
chrome.alarms.create('checkToken', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkToken') {
    chrome.storage.local.get(['tokenExpiry'], (result) => {
      if (result.tokenExpiry && Date.now() > result.tokenExpiry) {
        // Token expired, clear it
        chrome.storage.local.remove(['jwtToken', 'tokenExpiry']);
        console.log('JWT token expired and cleared');
      }
    });
  }
});
