// @darkly/site-gmail — SitePlugin implementation for Gmail
// Integrates InboxSDK for toolbar, sidebar, and keyboard shortcuts.

import type {
  SitePlugin,
  ToolbarButtonOpts,
  SidebarIconOpts,
  ThemeEngine,
  ProductConfig,
} from '@darkly/core';
import { getSDK } from './sdk/init';
import { registerToolbarButton } from './sdk/toolbar-button';
import { registerKeyboardShortcut } from './sdk/keyboard-shortcut';
import { mountSettingsPanel } from './sdk/sidebar-panel';

// Minimal fallback components — the extension package provides real ones
// via configureGmailPlugin(). These are used if no configuration is set.
const FallbackMiniPanel: React.FC<{
  isPro: boolean;
  onAllSettings: () => void;
  onUpgrade: () => void;
  onClose: () => void;
}> = () => null;

const FallbackSettingsPanel: React.FC<{
  isPro?: boolean;
  onUpgrade?: () => void;
  onClose: () => void;
}> = () => null;

let _prefix = 'gd';
let _MiniControlPanel: typeof FallbackMiniPanel = FallbackMiniPanel;
let _SettingsPanel: typeof FallbackSettingsPanel = FallbackSettingsPanel;
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
    _prefix = config.prefix;
    _engine = engine;
  },

  async injectToolbarButton(opts: ToolbarButtonOpts): Promise<HTMLElement | null> {
    try {
      const sdk = await getSDK();

      // Mount sidebar settings panel
      _openSettings = await mountSettingsPanel(
        sdk,
        { isPro: opts.isPro, onUpgrade: opts.onUpgrade },
        _prefix,
        _SettingsPanel,
      );

      // Register toolbar dropdown button
      registerToolbarButton(
        sdk,
        {
          isPro: opts.isPro,
          onAllSettings: () => _openSettings?.(),
          onUpgrade: opts.onUpgrade,
        },
        _prefix,
        _MiniControlPanel,
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

  injectSidebarIcon(_opts: SidebarIconOpts): void {
    // Sidebar panel is mounted in injectToolbarButton via InboxSDK.
    // Gmail uses InboxSDK sidebar, not custom DOM injection.
  },

  startDomObserver(_onReinject: () => Promise<void>): void {
    // InboxSDK handles DOM observation internally for Gmail.
    // No custom MutationObserver needed.
  },
};

/**
 * Configure the Gmail plugin with custom React components.
 * Call this before createContentScript() to provide real UI components.
 */
export function configureGmailPlugin(components: {
  MiniControlPanel?: typeof FallbackMiniPanel;
  SettingsPanel?: typeof FallbackSettingsPanel;
}): void {
  if (components.MiniControlPanel) {
    _MiniControlPanel = components.MiniControlPanel;
  }
  if (components.SettingsPanel) {
    _SettingsPanel = components.SettingsPanel;
  }
}
