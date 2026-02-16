/**
 * Darkly Suite — Unified background service worker
 *
 * Handles alarms, message passing, and payment routing for all sites.
 * This is the single service_worker entry for the MV3 extension.
 */

import { config } from './darkly.config';

/**
 * Handle messages from content scripts across all sites.
 */
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; url?: string; [key: string]: unknown },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    switch (message.type) {
      case 'openTab':
        if (message.url) {
          chrome.tabs.create({ url: message.url as string });
        }
        break;

      case 'getProductConfig':
        sendResponse(config);
        return true; // keep channel open for async response

      default:
        console.log('[Darkly Suite] Unknown message type:', message.type);
    }

    return false;
  }
);

/**
 * Schedule check alarm — evaluates whether dark mode should be active
 * based on schedule/sunset rules for each site.
 */
chrome.alarms.create(config.alarmName, { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== config.alarmName) return;

  // Placeholder: once @darkly/core's createBackgroundWorker is wired up,
  // this will evaluate schedule rules and push theme updates to each tab.
  console.log('[Darkly Suite] Schedule check alarm fired');
});

/**
 * Extension install/update handler.
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Darkly Suite] Extension installed');
  } else if (details.reason === 'update') {
    console.log(
      `[Darkly Suite] Extension updated to ${chrome.runtime.getManifest().version}`
    );
  }
});

console.log(`[Darkly Suite] Background service worker initialized`);
