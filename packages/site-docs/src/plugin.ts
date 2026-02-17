// @darkly/site-docs — SitePlugin implementation for Google Docs
// Custom DOM injection for toolbar, sidebar, and canvas observation.

import React from 'react';
import type {
  SitePlugin,
  ToolbarButtonOpts,
  SidebarIconOpts,
  KeyboardShortcutHandlers,
  ThemeEngine,
  ProductConfig,
} from '@darkly/core';
import { injectToolbarButton } from './inject/toolbar';
import { injectSidebarIcon } from './inject/sidebar-icon';
import { startCanvasObserver } from './inject/canvas-observer';
import { registerKeyboardShortcuts } from './inject/keyboard-shortcuts';
import {
  KIX_APPVIEW_SELECTOR,
  KIX_PAGE_SELECTOR,
  KIX_PAGELESS_CLASS,
} from './inject/dom-selectors';
import { DocsSettingsSection } from './ui/DocsSettingsSection';

let _prefix = 'dd';
let _engine: ThemeEngine | null = null;

function detectPagelessMode(): void {
  const editor = document.querySelector(KIX_APPVIEW_SELECTOR);
  if (editor && _engine) {
    const pageless = editor.classList.contains(KIX_PAGELESS_CLASS) ||
                     !document.querySelector(KIX_PAGE_SELECTOR);
    _engine.setPagelessMode(pageless);
  }
}

export const docsPlugin: SitePlugin = {
  siteId: 'docs',
  tabUrlPattern: 'https://docs.google.com/document/*',
  contentScriptMatches: ['https://docs.google.com/document/*'],

  // Docs override CSS is loaded via the manifest css array.
  overrideStyles: 'docs-overrides.css',

  async init(engine: ThemeEngine, config: ProductConfig): Promise<void> {
    _prefix = config.prefix;
    _engine = engine;

    // Detect pageless mode after engine init
    detectPagelessMode();

    // Apply saved per-site preferences (e.g., preserve page attribute) on load
    const siteKey = `${_prefix}_site_docs`;
    const result = await chrome.storage.sync.get(siteKey);
    const stored = result[siteKey];
    if (stored?.preservePageColors) {
      document.documentElement.setAttribute(`data-${_prefix}-page`, 'preserve');
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
    startCanvasObserver(() => {
      onReinject();
    });
  },

  registerKeyboardShortcuts(handlers: KeyboardShortcutHandlers): () => void {
    return registerKeyboardShortcuts(handlers);
  },

  renderProductSection(): React.ReactNode {
    return React.createElement(DocsSettingsSection);
  },
};
