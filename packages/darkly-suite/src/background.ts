/**
 * Darkly Suite — Unified background service worker
 *
 * Creates a background worker for each site (gmail, sheets, docs) so that
 * each one manages its own per-site preferences, schedule alarms, and
 * tab notifications. Payment and token are shared at the suite level.
 *
 * Per-site storage keys:
 *   - ds_gmail_preferences
 *   - ds_sheets_preferences
 *   - ds_docs_preferences
 */

import { createBackgroundWorker } from '@darkly/core';
import type { SiteId } from '@darkly/core';
import { config, getSiteConfig, siteConfigs } from './darkly.config';

// Initialize a background worker for each site.
// Each worker watches its own per-site preferences key and manages
// its own schedule alarm and tab notifications.
const sites = Object.keys(siteConfigs) as SiteId[];
for (const siteId of sites) {
  const siteConfig = getSiteConfig(siteId);
  createBackgroundWorker(siteConfig);
}

// Suite-level message handling (not site-specific)
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
        // Let per-site workers handle other message types
        break;
    }

    return false;
  }
);

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

console.log(`[Darkly Suite] Background service worker initialized (${sites.length} sites)`);
