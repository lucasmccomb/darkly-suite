/**
 * Darkly Suite — Unified background service worker
 *
 * Creates a site worker for each site (gmail, sheets, docs, drive) and routes all
 * Chrome events through a single set of listeners. This avoids the N-listener
 * duplication that would occur if createBackgroundWorker() were called per-site.
 *
 * Per-site storage keys:
 *   - ds_gmail_preferences
 *   - ds_sheets_preferences
 *   - ds_docs_preferences
 *   - ds_drive_preferences
 */

// InboxSDK requires its background handler for pageWorld.js injection via
// chrome.scripting.registerContentScripts. Without this import, Gmail's
// InboxSDK integration silently fails with "Couldn't inject pageWorld.js".
import '@inboxsdk/core/background.js';

import { createSiteWorker, createCheckoutPoller } from '@darkly/core';
import type { SiteWorkerHandlers } from '@darkly/core';
import type { SiteId } from '@darkly/core';
import { config, getSiteConfig, siteConfigs } from './darkly.config';

// Initialize a site worker for each site (no Chrome listeners registered).
const sites = Object.keys(siteConfigs) as SiteId[];
const workers = new Map<SiteId, SiteWorkerHandlers>();
for (const siteId of sites) {
  workers.set(siteId, createSiteWorker(getSiteConfig(siteId)));
}

// Use the first worker for shared operations (payment, geolocation) since
// all site workers share the same token, API base, and offscreen document.
const sharedWorker = workers.get('gmail')!;

// Checkout poller uses suite-level config (all sites share one payment token)
const checkoutPoller = createCheckoutPoller(config);

/**
 * Determine which site a message came from by examining the sender's tab URL.
 * Returns null for messages without a tab (e.g., from offscreen documents).
 */
function getSiteIdFromSender(sender: chrome.runtime.MessageSender): SiteId | null {
  const url = sender.tab?.url ?? sender.url;
  if (!url) return null;
  if (url.startsWith('https://mail.google.com')) return 'gmail';
  if (url.includes('docs.google.com/spreadsheets')) return 'sheets';
  if (url.includes('docs.google.com/document')) return 'docs';
  if (url.startsWith('https://drive.google.com')) return 'drive';
  return null;
}

// --- Single unified message listener ---
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; [key: string]: unknown },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    // Site-specific messages — route to the correct site worker
    if (message.type === 'getScheduleStatus') {
      const siteId = getSiteIdFromSender(sender);
      const worker = siteId ? workers.get(siteId) : null;
      if (!worker) {
        sendResponse({ shouldBeDark: false });
        return true;
      }
      worker.getScheduleStatus().then(sendResponse);
      return true;
    }

    if (message.type === 'getSunTimes') {
      const { lat, lng } = message;
      if (typeof lat !== 'number' || typeof lng !== 'number' ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        sendResponse(null);
        return true;
      }
      const siteId = getSiteIdFromSender(sender);
      const worker = (siteId && workers.get(siteId)) ?? sharedWorker;
      worker.getSunTimes(lat as number, lng as number).then((times) => {
        if (times) {
          sendResponse({
            sunrise: times.sunrise.toISOString(),
            sunset: times.sunset.toISOString(),
          });
        } else {
          sendResponse(null);
        }
      });
      return true;
    }

    // Shared messages — use any worker (they all share the same payment/token)
    if (message.type === 'getProStatus') {
      sharedWorker.getProStatus().then(sendResponse);
      return true;
    }

    if (message.type === 'getLocation') {
      sharedWorker.getLocation().then(sendResponse);
      return true;
    }

    if (message.type === 'openTab') {
      if (message.url) {
        chrome.tabs.create({ url: message.url as string });
      }
      return false;
    }

    if (message.type === 'checkoutStarted') {
      checkoutPoller.start();
      return false;
    }

    if (message.type === 'getProductConfig') {
      sendResponse(config);
      return true;
    }

    return false;
  },
);

// --- Single alarm listener ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === checkoutPoller.alarmName) {
    await checkoutPoller.handleAlarm();
    return;
  }
  for (const worker of workers.values()) {
    if (alarm.name === worker.config.alarmName) {
      await worker.handleAlarm();
      return;
    }
  }
});

// --- Single install/update handler ---
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[Darkly Suite] Extension installed');
    if (typeof __DEV_MODE__ === 'undefined' || !__DEV_MODE__) {
      // Get token (already initialized by createSiteWorker → initPayment)
      const result = await chrome.storage.sync.get(config.tokenKey);
      const token = result[config.tokenKey] ?? '';

      // Get Chrome Identity email (may be empty if user isn't signed into Chrome)
      let email = '';
      try {
        const info = await chrome.identity.getProfileUserInfo({
          accountStatus: chrome.identity.AccountStatus.ANY,
        });
        email = info.email || '';
      } catch {
        // identity.email permission missing or API unavailable — proceed without email
      }

      const params = new URLSearchParams();
      if (token) params.set('token', token);
      if (email) params.set('email', email);
      params.set('product', 'suite');
      const qs = params.toString();
      chrome.tabs.create({ url: `${config.siteBase}/subscribe?${qs}` });
    }
    for (const worker of workers.values()) {
      await worker.setupAlarm();
    }
  } else if (details.reason === 'update') {
    console.log(
      `[Darkly Suite] Extension updated to ${chrome.runtime.getManifest().version}`,
    );
  }
});

console.log(`[Darkly Suite] Background service worker initialized (${sites.length} sites)`);
