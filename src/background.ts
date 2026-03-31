/**
 * Background Service Worker for SpeedVideo Chrome Extension.
 * Handles tab-level state persistence.
 */

// Install event – set default values
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    speed: 1.5,
    isEnabled: true,
  });
});
