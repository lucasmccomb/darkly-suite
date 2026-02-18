import type { ProductConfig } from '../config';
import { createPaymentClient } from '../payment/client';
import { createPreferencesManager } from '../storage/preferences';
import { getSunTimes } from '../geo/sun-times';
import { shouldBeDark as isInScheduleRange } from '../theme/scheduler';
import type { BaseUserPreferences } from '../storage/types';

function isDarkBySunTimes(sunrise: Date, sunset: Date): boolean {
  const now = new Date();
  return now < sunrise || now >= sunset;
}

/**
 * Creates and starts a background service worker for the given product.
 * Handles: alarms, schedule checking, message passing, payment init, geolocation.
 */
export function createBackgroundWorker(config: ProductConfig): void {
  const payment = createPaymentClient(config);
  const prefs = createPreferencesManager(config);
  const sunCacheKey = `${config.prefix}_sun_times_cache`;

  // Initialize payment token
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

  async function getGeolocation(): Promise<{ lat: number; lng: number } | { error: string }> {
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

  // Alarm management
  async function setupAlarm(): Promise<void> {
    const current = await prefs.load();
    if (current.mode === 'schedule' || current.mode === 'sunrise-sunset') {
      await chrome.alarms.create(config.alarmName, { periodInMinutes: 1 });
    } else {
      await chrome.alarms.clear(config.alarmName);
    }
  }

  // Notify content scripts
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

  // Event listeners
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === config.alarmName) {
      const status = await getScheduleStatus();
      await notifyContentScripts(status.shouldBeDark);
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'getScheduleStatus') {
      getScheduleStatus().then(sendResponse);
      return true;
    }

    if (message.type === 'getSunTimes') {
      const { lat, lng } = message;
      if (typeof lat !== 'number' || typeof lng !== 'number' ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        sendResponse(null);
        return true;
      }
      getSunTimes(lat, lng, sunCacheKey).then((times) => {
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
      payment.isPro()
        .then((paid) => sendResponse({ paid }))
        .catch(() => sendResponse({ paid: false }));
      return true;
    }

    if (message.type === 'getLocation') {
      getGeolocation().then(sendResponse);
      return true;
    }

    if (message.type === 'openTab') {
      chrome.tabs.create({ url: message.url });
      return false;
    }

    return false;
  });

  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log(`[${config.productName}] Extension installed:`, details.reason);
    if (details.reason === 'install') {
      const siteBase = config.apiBase.replace(/\/api$/, '');
      chrome.tabs.create({ url: `${siteBase}/setup?product=${config.productId}` });
      await setupAlarm();
    }
  });

  prefs.onChange(async (newPrefs: BaseUserPreferences) => {
    if (newPrefs.mode === 'schedule' || newPrefs.mode === 'sunrise-sunset') {
      await chrome.alarms.create(config.alarmName, { periodInMinutes: 1 });
      const status = await getScheduleStatus();
      await notifyContentScripts(status.shouldBeDark);
    } else {
      await chrome.alarms.clear(config.alarmName);
    }
  });
}
