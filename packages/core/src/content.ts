import type { ProductConfig, SitePlugin } from './config';
import type React from 'react';
import { ThemeEngine } from './theme/engine';
import { SystemThemeDetector } from './theme/detector';
import * as NightTint from './theme/night-tint';
import { initTransitions } from './theme/transitions';
import { createPreferencesManager } from './storage/preferences';
import { createPaymentClient } from './payment/client';
import { createSidebarPanel } from './inject/sidebar-icon';
import { createSettingsContainer } from './inject/settings-panel';
import type { BaseUserPreferences } from './storage/types';

function isInHourRange(startHour: number, endHour: number): boolean {
  const hour = new Date().getHours();
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}

/**
 * Creates and starts a content script for the given product configuration.
 * Wires together ThemeEngine, preferences, payment, system detection,
 * night tint, schedule handling, and optional site plugin.
 */
export function createContentScript(config: ProductConfig, sitePlugin?: SitePlugin): void {
  const engine = new ThemeEngine(config);
  const prefs = createPreferencesManager(config);
  const payment = createPaymentClient(config);
  let detector: SystemThemeDetector | null = null;
  let detectorUnsub: (() => void) | null = null;

  NightTint.init(config);

  function evaluateNightTint(p: BaseUserPreferences): void {
    if (!p.nightTint.enabled) {
      NightTint.disable();
      return;
    }
    const active = isInHourRange(p.nightTint.startHour, p.nightTint.endHour);
    if (active) {
      NightTint.enable(p.nightTint.intensity);
    } else {
      NightTint.disable();
    }
  }

  async function checkSchedule(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getScheduleStatus' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          resolve(false);
          return;
        }
        resolve(response.shouldBeDark);
      });
    });
  }

  function startSystemDetection(): void {
    stopSystemDetection();
    detector = new SystemThemeDetector();
    const currentTheme = detector.getCurrentTheme();
    engine.apply(currentTheme);

    detectorUnsub = detector.onChange((theme) => {
      engine.apply(theme);
    });
  }

  function stopSystemDetection(): void {
    if (detectorUnsub) {
      detectorUnsub();
      detectorUnsub = null;
    }
    if (detector) {
      detector.destroy();
      detector = null;
    }
  }

  async function applyMode(p: BaseUserPreferences): Promise<void> {
    if (!p.enabled) {
      engine.apply('light');
      NightTint.disable();
      stopSystemDetection();
      return;
    }

    engine.applyPreset(p.preset);

    switch (p.mode) {
      case 'dark':
        stopSystemDetection();
        engine.apply('dark');
        break;

      case 'light':
        stopSystemDetection();
        engine.apply('light');
        break;

      case 'system':
        startSystemDetection();
        break;

      case 'schedule':
      case 'sunrise-sunset': {
        stopSystemDetection();
        const shouldBeDark = await checkSchedule();
        engine.apply(shouldBeDark ? 'dark' : 'light');
        break;
      }
    }

    evaluateNightTint(p);
  }

  async function init(): Promise<void> {
    await engine.init();

    // Let the site plugin do any custom initialization
    if (sitePlugin?.init) {
      await sitePlugin.init(engine, config);
    }

    const proStatus = await payment.isPro();

    if (proStatus) {
      const currentPrefs = await prefs.load();
      await applyMode(currentPrefs);

      initTransitions();

      prefs.onChange(async (newPrefs) => {
        await applyMode(newPrefs);
      });

      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'schedule-update') {
          engine.apply(message.shouldBeDark ? 'dark' : 'light');
        }
      });
    }

    // Build the product-specific settings section from the site plugin
    let productSection: React.ReactNode = undefined;
    if (sitePlugin?.renderProductSection) {
      productSection = sitePlugin.renderProductSection(undefined, () => {});
    }

    // Create a settings sidebar container (lazily appended on first open)
    let sidebarContainer: HTMLElement | null = null;
    let _sidebarCleanup: (() => void) | null = null;
    let sidebarOpen = false;

    function toggleSettingsSidebar(): void {
      if (sidebarOpen && sidebarContainer) {
        sidebarContainer.style.display = 'none';
        sidebarOpen = false;
        return;
      }

      if (!sidebarContainer) {
        sidebarContainer = createSettingsContainer(config, 'sidebar');
        document.body.appendChild(sidebarContainer);
        _sidebarCleanup = createSidebarPanel(config, sidebarContainer, {
          isPro: proStatus,
          onUpgrade: () => payment.openPaymentPage(),
          onClose: () => toggleSettingsSidebar(),
          renderProductSection: productSection,
        });
      }

      sidebarContainer.style.display = '';
      sidebarOpen = true;
    }

    // Site plugin handles its own UI injection (toolbar, sidebar, etc.)
    // The plugin receives proStatus so it can show paywall if needed.
    if (sitePlugin) {
      const toolbarOpts = {
        isPro: proStatus,
        onAllSettings: () => toggleSettingsSidebar(),
        onUpgrade: () => payment.openPaymentPage(),
      };

      await sitePlugin.injectToolbarButton(toolbarOpts);

      // Start DOM observer to re-inject toolbar when the host app rebuilds it
      sitePlugin.startDomObserver(async () => {
        await sitePlugin.injectToolbarButton(toolbarOpts);
      });

      // Inject sidebar icon in companion app-switcher strip (Sheets/Docs)
      if (sitePlugin.injectSidebarIcon) {
        sitePlugin.injectSidebarIcon({
          isPro: proStatus,
          onClick: () => toggleSettingsSidebar(),
        });
      }

      // Register keyboard shortcuts (Alt+Shift+D toggle, Alt+Shift+S settings)
      if (sitePlugin.registerKeyboardShortcuts) {
        sitePlugin.registerKeyboardShortcuts({
          toggleDarkMode: () => engine.toggle(),
          openSettings: () => toggleSettingsSidebar(),
        });
      }
    }

    // Listen for payment status changes
    payment.onPaymentStatusChange(async (paid) => {
      if (paid) {
        const currentPrefs = await prefs.load();
        await applyMode(currentPrefs);
        initTransitions();

        prefs.onChange(async (newPrefs) => {
          await applyMode(newPrefs);
        });
      }
    });

    console.log(`[${config.productName}] Extension loaded`);
  }

  init().catch((err) => {
    console.error(`[${config.productName}] Failed to initialize:`, err);
  });
}
