import type { ProductConfig, SitePlugin, Plan } from './config';
import type React from 'react';
import { ThemeEngine } from './theme/engine';
import { SystemThemeDetector } from './theme/detector';
import { createTransitionManager } from './theme/transitions';
import { createPreferencesManager } from './storage/preferences';
import { createPaymentClient } from './payment/client';
import { createSettingsModal, createMiniPanel } from './inject/panels';
import type { PanelHandle } from './inject/panels';
import type { BaseUserPreferences } from './storage/types';
import { injectFab } from './inject/fab';

/**
 * Creates and starts a content script for the given product configuration.
 * Wires together ThemeEngine, preferences, payment, system detection,
 * schedule handling, and optional site plugin.
 */
export function createContentScript(config: ProductConfig, sitePlugin?: SitePlugin): void {
  const transitions = createTransitionManager();
  const engine = new ThemeEngine(config, transitions.withTransition);
  const prefs = createPreferencesManager(config);
  const payment = createPaymentClient(config);
  let detector: SystemThemeDetector | null = null;
  let detectorUnsub: (() => void) | null = null;

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
  }

  async function init(): Promise<void> {
    await engine.init();

    // Let the site plugin do any custom initialization
    if (sitePlugin?.init) {
      await sitePlugin.init(engine, config);
    }

    const proStatus = await payment.refreshProStatus();
    const prices = await payment.getPrices();
    const plan = await payment.getPlan();

    if (proStatus) {
      const currentPrefs = await prefs.load();
      await applyMode(currentPrefs);

      transitions.init();

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

    // Create the settings modal (centered overlay with backdrop)
    const isLifetime = plan === 'lifetime';
    const settingsModal = createSettingsModal(config, {
      isPro: proStatus,
      plan: plan ?? undefined,
      prices: prices ?? undefined,
      onUpgrade: (p) => payment.openPaymentPage(p),
      onRestorePurchase: () => payment.openRestorePurchase(),
      onManageSubscription: proStatus && !isLifetime ? () => payment.openManageSubscription() : undefined,
      renderProductSection: productSection,
    });

    const showSettings = () => {
      if (settingsModal.isVisible()) settingsModal.hide();
      else settingsModal.show();
    };

    // For Sheets/Docs: create a mini panel (toolbar dropdown)
    // Gmail uses InboxSDK's own dropdown, so no mini panel needed.
    let miniPanel: PanelHandle | null = null;
    let toolbarButton: HTMLElement | null = null;

    if (sitePlugin?.injectSidebarIcon) {
      miniPanel = createMiniPanel(config, {
        isPro: proStatus,
        prices: prices ?? undefined,
        onAllSettings: () => {
          miniPanel!.hide();
          settingsModal.show();
        },
        onUpgrade: () => payment.openPaymentPage(),
      });
    }

    // Site plugin handles its own UI injection (toolbar, sidebar, etc.)
    if (sitePlugin) {
      const pageContext = sitePlugin.getPageContext?.() ?? 'editor';

      if (pageContext === 'editor') {
        // Editor path: toolbar button, DOM observer, sidebar icon
        const toolbarOpts = {
          isPro: proStatus,
          plan: plan ?? undefined,
          prices: prices ?? undefined,
          onAllSettings: miniPanel
            ? () => {
                // Sheets/Docs: unpaid users see full settings modal (paywall with pricing tiers);
                // paid users get the mini panel with quick controls.
                if (!proStatus) {
                  settingsModal.show();
                } else if (miniPanel!.isVisible()) {
                  miniPanel!.hide();
                } else if (toolbarButton) {
                  miniPanel!.show(toolbarButton);
                }
              }
            : () => settingsModal.show(), // Gmail: "All Settings" opens modal directly
          onUpgrade: (p?: Plan) => payment.openPaymentPage(p),
          onRestorePurchase: () => payment.openRestorePurchase(),
          onManageSubscription: proStatus && !isLifetime ? () => payment.openManageSubscription() : undefined,
        };

        toolbarButton = await sitePlugin.injectToolbarButton(toolbarOpts);

        // Start DOM observer to re-inject toolbar when the host app rebuilds it
        sitePlugin.startDomObserver(async () => {
          toolbarButton = await sitePlugin.injectToolbarButton(toolbarOpts);
        });

        // Inject sidebar icon in companion app-switcher strip (Sheets/Docs)
        if (sitePlugin.injectSidebarIcon) {
          sitePlugin.injectSidebarIcon({
            isPro: proStatus,
            onClick: showSettings,
          });
        }
      } else {
        // Dashboard path: inject icon into Google's header toolbar
        await injectFab(config, { onClick: showSettings });
      }

      // Register keyboard shortcuts on both editor and dashboard pages
      if (sitePlugin.registerKeyboardShortcuts) {
        sitePlugin.registerKeyboardShortcuts({
          toggleDarkMode: () => engine.toggle(),
          openSettings: showSettings,
        });
      }
    }

    // Listen for payment status changes — reload on any transition so all UI
    // panels (settings modal, mini panel, Gmail sidebar) are rebuilt with the
    // correct isPro value. Without this, panels keep stale React props from init.
    payment.onPaymentStatusChange((paid) => {
      if (paid !== proStatus) {
        location.reload();
      }
    });

    // When unpaid, refresh pro status when user returns to tab (e.g. after Stripe checkout)
    if (!proStatus) {
      let lastCheck = 0;
      const handleVisibility = () => {
        if (document.visibilityState !== 'visible') return;
        const now = Date.now();
        if (now - lastCheck < 5_000) return;
        lastCheck = now;
        payment.refreshProStatus();
      };
      document.addEventListener('visibilitychange', handleVisibility);
      payment.onPaymentStatusChange((paid) => {
        if (paid) document.removeEventListener('visibilitychange', handleVisibility);
      });
    }

    // When paid, periodically revalidate on tab focus to catch license revocation.
    // Throttled to 30 min to match the pro cache TTL — at most one API call per
    // 30 min of active tab use. If the API returns unpaid, setCachedProStatus
    // writes to storage which triggers onPaymentStatusChange → reload above.
    if (proStatus) {
      let lastRevalidation = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        const now = Date.now();
        if (now - lastRevalidation < 30 * 60 * 1000) return;
        lastRevalidation = now;
        payment.refreshProStatus();
      });
    }

    console.log(`[${config.productName}] Extension loaded`);
  }

  init().catch((err) => {
    console.error(`[${config.productName}] Failed to initialize:`, err);
  });
}
