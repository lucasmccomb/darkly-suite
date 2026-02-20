// @darkly/site-sheets — SitePlugin implementation for Google Sheets
// Custom DOM injection for toolbar, sidebar, and grid observation.

import React from 'react';
import type {
  SitePlugin,
  ToolbarButtonOpts,
  SidebarIconOpts,
  KeyboardShortcutHandlers,
  ThemeEngine,
  ProductConfig,
  PageContext,
} from '@darkly/core';
import { injectToolbarButton } from './inject/toolbar';
import { injectSidebarIcon } from './inject/sidebar-icon';
import { startGridObserver } from './inject/grid-observer';
import { registerKeyboardShortcuts } from './inject/keyboard-shortcuts';
import { SheetsSettingsSection } from './ui/SheetsSettingsSection';

let _prefix = 'sd';

export const sheetsPlugin: SitePlugin = {
  siteId: 'sheets',
  tabUrlPattern: 'https://docs.google.com/spreadsheets/*',
  contentScriptMatches: ['https://docs.google.com/spreadsheets/*'],

  getPageContext(): PageContext {
    // Editor pages have a doc ID: /spreadsheets/d/{id}/...
    if (/\/spreadsheets\/d\/[^/]+/.test(window.location.pathname)) return 'editor';
    return 'dashboard';
  },

  // Sheets override CSS is loaded via the manifest css array.
  overrideStyles: 'sheets-overrides.css',

  async init(_engine: ThemeEngine, config: ProductConfig): Promise<void> {
    _prefix = config.prefix;

    // Apply saved per-site preferences (e.g., preserve grid attribute) on load
    const siteKey = `${_prefix}_site_sheets`;
    const result = await chrome.storage.sync.get(siteKey);
    const stored = result[siteKey];
    if (stored?.preserveGridColors) {
      document.documentElement.setAttribute(`data-${_prefix}-grid`, 'preserve');
    }
  },

  async injectToolbarButton(opts: ToolbarButtonOpts): Promise<HTMLElement | null> {
    return injectToolbarButton(
      { onClick: opts.onAllSettings },
      _prefix,
    );
  },

  async injectSidebarIcon(opts: SidebarIconOpts): Promise<HTMLElement | null> {
    return injectSidebarIcon(
      { onClick: opts.onClick },
      _prefix,
    );
  },

  startDomObserver(onReinject: () => Promise<void>): void {
    startGridObserver(() => {
      onReinject();
    });
  },

  registerKeyboardShortcuts(handlers: KeyboardShortcutHandlers): () => void {
    return registerKeyboardShortcuts(handlers);
  },

  renderProductSection(): React.ReactNode {
    return React.createElement(SheetsSettingsSection);
  },
};
