// Browse Darkly — Background Service Worker
// Handles extension lifecycle, side panel setup, payment integration, and message routing.
// Unlike other Darkly extensions, Browse Darkly uses a custom background worker
// because it has side panel logic that createBackgroundWorker doesn't handle.

import { createPaymentClient, createCheckoutPoller } from '@darkly/core';
import { config } from './darkly.config';

const payment = createPaymentClient(config);
const checkoutPoller = createCheckoutPoller(config);

// Initialize payment token on startup
payment.initPayment();

// Open side panel when toolbar icon is clicked (if user prefers side panel)
// Default: popup opens. Side panel opened via "Open Settings" button in popup.
chrome.sidePanel?.setOptions({ enabled: true });
chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true });

// Handle messages from content scripts, popup, and side panel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'bd:openSidePanel') {
    const windowId = sender.tab?.windowId;
    if (windowId) {
      chrome.sidePanel.open({ windowId });
    } else {
      // Message from popup (not a tab) — get the current window
      chrome.windows.getLastFocused().then((win) => {
        if (win.id) chrome.sidePanel.open({ windowId: win.id });
      });
    }
    sendResponse({ ok: true });
  }

  if (msg.type === 'bd:openTab' || msg.type === 'openTab') {
    chrome.tabs.create({ url: msg.url });
    return false;
  }

  if (msg.type === 'checkoutStarted') {
    checkoutPoller.start();
    return false;
  }

  if (msg.type === 'checkProStatus') {
    payment.refreshProStatus().then((paid) => sendResponse({ paid }));
    return true;
  }

  if (msg.type === 'getProStatus') {
    payment.isPro().then((paid) => sendResponse({ paid }));
    return true;
  }

  return true;
});

// Allow landing pages (listed in externally_connectable) to request the
// extension's token so checkout creates licenses with the correct token.
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message.type === 'getToken') {
    chrome.storage.sync.get(config.tokenKey).then((result) => {
      sendResponse({
        token: result[config.tokenKey] || null,
        productId: config.productId,
      });
    });
    return true;
  }
  return false;
});

// Set up alarm for schedule checking (sunrise/sunset, time-based)
chrome.alarms.create(config.alarmName, { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === config.alarmName) {
    // TODO: Implement schedule checking
  }
  if (alarm.name === checkoutPoller.alarmName) {
    checkoutPoller.handleAlarm();
  }
});

// On fresh install, open the subscribe page (production only)
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`[${config.productName}] Extension installed:`, details.reason);
  if (details.reason === 'install') {
    if (typeof __DEV_MODE__ === 'undefined' || !__DEV_MODE__) {
      const result = await chrome.storage.sync.get(config.tokenKey);
      const token = result[config.tokenKey] ?? '';
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      const qs = params.toString();
      const subscribeUrl = `${config.siteBase}/subscribe${qs ? `?${qs}` : ''}`;
      chrome.tabs.create({ url: subscribeUrl });
    }
  }
});

console.log(`[${config.productName}] Background service worker initialized`);
