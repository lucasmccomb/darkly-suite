// @darkly/site-gmail — SitePlugin implementation for Gmail
// Integrates InboxSDK for toolbar, sidebar, and keyboard shortcuts.

import type {
  SitePlugin,
  ToolbarButtonOpts,
  SidebarIconOpts,
  KeyboardShortcutHandlers,
  ThemeEngine,
  ProductConfig,
} from '@darkly/core';
import { MiniControlPanel, SettingsPanel } from '@darkly/core';
import { getSDK } from './sdk/init';
import { registerToolbarButton } from './sdk/toolbar-button';
import { registerKeyboardShortcut } from './sdk/keyboard-shortcut';
import { mountSettingsPanel } from './sdk/sidebar-panel';

let _config: ProductConfig | null = null;
let _engine: ThemeEngine | null = null;
let _openSettings: (() => void) | null = null;

export const gmailPlugin: SitePlugin = {
  siteId: 'gmail',
  tabUrlPattern: 'https://mail.google.com/*',
  contentScriptMatches: ['https://mail.google.com/*'],

  // Gmail override CSS is loaded via the manifest css array, not injected at runtime.
  // This string is available for programmatic reference if needed.
  overrideStyles: 'gmail-overrides.css',

  async init(engine: ThemeEngine, config: ProductConfig): Promise<void> {
    _config = config;
    _engine = engine;
  },

  async injectToolbarButton(opts: ToolbarButtonOpts): Promise<HTMLElement | null> {
    if (!_config) throw new Error('[Darkly/Gmail] Plugin not initialized — call init() first');

    try {
      const sdk = await getSDK();

      // Mount sidebar settings panel
      _openSettings = await mountSettingsPanel(
        sdk,
        { isPro: opts.isPro, onUpgrade: opts.onUpgrade },
        _config,
        SettingsPanel,
      );

      // Register toolbar dropdown button
      registerToolbarButton(
        sdk,
        {
          isPro: opts.isPro,
          onAllSettings: () => _openSettings?.(),
          onUpgrade: opts.onUpgrade,
        },
        _config,
        MiniControlPanel,
      );

      // Register keyboard shortcut
      if (_engine) {
        registerKeyboardShortcut(sdk, () => _engine!.toggle());
      }

      // InboxSDK manages its own DOM — return null (no explicit element)
      return null;
    } catch (err) {
      console.warn('[Darkly/Gmail] InboxSDK initialization failed:', err);
      return null;
    }
  },

  async injectSidebarIcon(_opts: SidebarIconOpts): Promise<HTMLElement | null> {
    // Sidebar panel is mounted in injectToolbarButton via InboxSDK.
    // Gmail uses InboxSDK sidebar, not custom DOM injection.
    return null;
  },

  startDomObserver(_onReinject: () => Promise<void>): void {
    // InboxSDK handles DOM observation internally for Gmail.
    // No custom MutationObserver needed.
  },

  registerKeyboardShortcuts(_handlers: KeyboardShortcutHandlers): void {
    // Gmail keyboard shortcuts are registered inside injectToolbarButton
    // via InboxSDK's Keyboard API.
  },
};

