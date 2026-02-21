import type { ProductConfig } from '../config';
import { createPaymentClient } from '../payment/client';
import { createCheckoutPoller } from '../payment/checkout-poller';
import { createPreferencesManager } from '../storage/preferences';
import { getSunTimes } from '../geo/sun-times';
import { shouldBeDark as isInScheduleRange } from '../theme/scheduler';
import type { BaseUserPreferences } from '../storage/types';
import type { SunTimes } from '../geo/sun-times';

function isDarkBySunTimes(sunrise: Date, sunset: Date): boolean {
  const now = new Date();
  return now < sunrise || now >= sunset;
}

/**
 * Handlers exposed by a site worker. Used by the bundle to build a single
 * unified message listener instead of registering N separate listeners.
 */
export interface SiteWorkerHandlers {
  readonly config: ProductConfig;
  getScheduleStatus(): Promise<{ shouldBeDark: boolean }>;
  getSunTimes(lat: number, lng: number): Promise<SunTimes | null>;
  getProStatus(): Promise<{ paid: boolean }>;
  getLocation(): Promise<{ lat: number; lng: number } | { error: string }>;
  handleAlarm(): Promise<void>;
  setupAlarm(): Promise<void>;
}

/**
 * Derive a per-site sun times cache key from the storage key.
 * Standalone: gd_preferences → gd_sun_times_cache
 * Bundle:     ds_gmail_preferences → ds_gmail_sun_times_cache
 */
function sunCacheKeyFrom(storageKey: string): string {
  return storageKey.replace(/_preferences$/, '_sun_times_cache');
}

/**
 * Creates a site worker that exposes handler functions without registering
 * any Chrome event listeners. Sets up payment init and prefs.onChange
 * (both correctly scoped by their respective storage keys).
 *
 * Used by the bundle's background.ts to avoid duplicate listeners.
 * Standalone extensions should use createBackgroundWorker() instead.
 */
export function createSiteWorker(config: ProductConfig): SiteWorkerHandlers {
  const payment = createPaymentClient(config);
  const prefs = createPreferencesManager(config);
  const sunCacheKey = sunCacheKeyFrom(config.storageKey);

  payment.initPayment();

  async function getScheduleStatus(): Promise<{ shouldBeDark: boolean }> {
    const current = await prefs.load();

    switch (current.mode) {
      case 'dark':
        return { shouldBeDark: true };
      case 'light':
        return { shouldBeDark: false };
      case 'schedule':
        return { shouldBeDark: isInScheduleRange(current.schedule.startHour, current.schedule.endHour) };
      case 'sunrise-sunset': {
        const { sunriseSunset } = current;
        if (sunriseSunset.lat != null && sunriseSunset.lng != null) {
          const times = await getSunTimes(sunriseSunset.lat, sunriseSunset.lng, sunCacheKey);
          if (times) {
            return { shouldBeDark: isDarkBySunTimes(times.sunrise, times.sunset) };
          }
        }
        return { shouldBeDark: isInScheduleRange(current.schedule.startHour, current.schedule.endHour) };
      }
      case 'system':
      default:
        return { shouldBeDark: false };
    }
  }

  // Offscreen document management
  let creatingOffscreen: Promise<void> | null = null;

  async function ensureOffscreenDocument(): Promise<void> {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    });

    if (existingContexts.length > 0) return;

    if (creatingOffscreen) {
      await creatingOffscreen;
      return;
    }

    const readyPromise = new Promise<void>((resolve) => {
      const onReady = (message: { type: string }) => {
        if (message.type === 'offscreen-ready') {
          chrome.runtime.onMessage.removeListener(onReady);
          resolve();
        }
      };
      chrome.runtime.onMessage.addListener(onReady);
    });

    creatingOffscreen = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.GEOLOCATION],
      justification: 'Geolocation access for sunrise/sunset scheduling',
    });

    await creatingOffscreen;
    creatingOffscreen = null;
    await readyPromise;
  }

  async function getLocation(): Promise<{ lat: number; lng: number } | { error: string }> {
    try {
      await ensureOffscreenDocument();
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create offscreen document' };
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'get-geolocation' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message ?? 'Unknown error' });
          return;
        }
        if (!response) {
          resolve({ error: 'No response from offscreen document' });
          return;
        }
        resolve(response);
      });
    });
  }

  async function setupAlarm(): Promise<void> {
    const current = await prefs.load();
    if (current.mode === 'schedule' || current.mode === 'sunrise-sunset') {
      await chrome.alarms.create(config.alarmName, { periodInMinutes: 1 });
    } else {
      await chrome.alarms.clear(config.alarmName);
    }
  }

  async function notifyContentScripts(dark: boolean): Promise<void> {
    const tabs = await chrome.tabs.query({ url: config.tabUrlPattern });
    for (const tab of tabs) {
      if (tab.id != null) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'schedule-update',
          shouldBeDark: dark,
        }).catch(() => {
          // Tab may not have content script loaded yet
        });
      }
    }
  }

  async function handleAlarm(): Promise<void> {
    const status = await getScheduleStatus();
    await notifyContentScripts(status.shouldBeDark);
  }

  async function getProStatus(): Promise<{ paid: boolean }> {
    try {
      const paid = await payment.isPro();
      return { paid };
    } catch {
      return { paid: false };
    }
  }

  async function getSunTimesHandler(lat: number, lng: number): Promise<SunTimes | null> {
    return getSunTimes(lat, lng, sunCacheKey);
  }

  // Prefs.onChange is correctly scoped by storageKey — safe to register per-site
  prefs.onChange(async (newPrefs: BaseUserPreferences) => {
    if (newPrefs.mode === 'schedule' || newPrefs.mode === 'sunrise-sunset') {
      await chrome.alarms.create(config.alarmName, { periodInMinutes: 1 });
      const status = await getScheduleStatus();
      await notifyContentScripts(status.shouldBeDark);
    } else {
      await chrome.alarms.clear(config.alarmName);
    }
  });

  return {
    config,
    getScheduleStatus,
    getSunTimes: getSunTimesHandler,
    getProStatus,
    getLocation,
    handleAlarm,
    setupAlarm,
  };
}

/**
 * Creates and starts a background service worker for the given product.
 * Registers Chrome event listeners for messages, alarms, and install events.
 *
 * Use this for standalone extensions (one call = one listener set).
 * For the bundle, use createSiteWorker() and register a unified listener.
 */
export function createBackgroundWorker(config: ProductConfig): void {
  const worker = createSiteWorker(config);
  const checkoutPoller = createCheckoutPoller(config);

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === config.alarmName) {
      await worker.handleAlarm();
    }
    if (alarm.name === checkoutPoller.alarmName) {
      await checkoutPoller.handleAlarm();
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'getScheduleStatus') {
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
      worker.getSunTimes(lat, lng).then((times) => {
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

    if (message.type === 'getProStatus') {
      worker.getProStatus().then(sendResponse);
      return true;
    }

    if (message.type === 'getLocation') {
      worker.getLocation().then(sendResponse);
      return true;
    }

    if (message.type === 'getEmail') {
      chrome.identity.getProfileUserInfo({ accountStatus: chrome.identity.AccountStatus.ANY })
        .then(info => sendResponse(info.email || null))
        .catch(() => sendResponse(null));
      return true;
    }

    if (message.type === 'openTab') {
      chrome.tabs.create({ url: message.url });
      return false;
    }

    if (message.type === 'checkoutStarted') {
      checkoutPoller.start();
      return false;
    }

    return false;
  });

  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log(`[${config.productName}] Extension installed:`, details.reason);
    if (details.reason === 'install') {
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
        const qs = params.toString();
        const subscribeUrl = `${config.siteBase}/subscribe${qs ? `?${qs}` : ''}`;
        chrome.tabs.create({ url: subscribeUrl });
      }
      await worker.setupAlarm();
    }
  });
}
