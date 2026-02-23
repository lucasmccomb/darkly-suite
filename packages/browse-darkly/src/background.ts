// Browse Darkly — Background Service Worker
// Handles extension lifecycle, side panel setup, and message routing.

import { config } from './darkly.config';

// Open side panel when toolbar icon is clicked (if user prefers side panel)
// Default: popup opens. Side panel opened via "Open Settings" button in popup.
chrome.sidePanel?.setOptions({
  enabled: true,
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'bd:openSidePanel') {
    if (sender.tab?.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
    }
    sendResponse({ ok: true });
  }

  if (msg.type === 'bd:openTab') {
    chrome.tabs.create({ url: msg.url });
    sendResponse({ ok: true });
  }

  return true;
});

// Set up alarm for schedule checking (sunrise/sunset, time-based)
chrome.alarms.create(config.alarmName, { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === config.alarmName) {
    // TODO: Implement schedule checking
  }
});

console.log(`[${config.productName}] Background service worker initialized`);
