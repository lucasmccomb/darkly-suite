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
} from '@darkly/core';
import { createToolbarDropdown } from '@darkly/core';
import { injectToolbarButton } from './inject/toolbar';
import { injectSidebarIcon } from './inject/sidebar-icon';
import { startGridObserver } from './inject/grid-observer';
import { registerKeyboardShortcuts } from './inject/keyboard-shortcuts';
import { SheetsSettingsSection } from './ui/SheetsSettingsSection';

let _prefix = 'sd';
let _config: ProductConfig | null = null;

// Toolbar dropdown state
let _dropdownContainer: HTMLElement | null = null;
let _dropdownCleanup: (() => void) | null = null;
let _dropdownOpen = false;
let _outsideClickHandler: ((e: MouseEvent) => void) | null = null;

function closeDropdown(): void {
  if (_dropdownContainer) _dropdownContainer.style.display = 'none';
  _dropdownOpen = false;
  if (_outsideClickHandler) {
    document.removeEventListener('click', _outsideClickHandler);
    _outsideClickHandler = null;
  }
}

function toggleDropdown(anchor: HTMLElement, opts: ToolbarButtonOpts): void {
  if (_dropdownOpen) {
    closeDropdown();
    return;
  }

  if (!_config) return;

  if (!_dropdownContainer) {
    _dropdownContainer = document.createElement('div');
    _dropdownContainer.className = `${_prefix}-toolbar-dropdown-wrap`;
    document.body.appendChild(_dropdownContainer);
  }

  // Position below the toolbar button
  const rect = anchor.getBoundingClientRect();
  Object.assign(_dropdownContainer.style, {
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`,
    display: '',
  });

  // Clean up previous render
  if (_dropdownCleanup) _dropdownCleanup();

  _dropdownCleanup = createToolbarDropdown(_config, _dropdownContainer, {
    isPro: opts.isPro,
    onAllSettings: opts.onAllSettings,
    onUpgrade: opts.onUpgrade,
    onClose: closeDropdown,
  });

  _dropdownOpen = true;

  // Close on outside click (deferred to avoid catching the opening click)
  _outsideClickHandler = (e: MouseEvent) => {
    if (
      _dropdownContainer && !_dropdownContainer.contains(e.target as Node) &&
      !anchor.contains(e.target as Node)
    ) {
      closeDropdown();
    }
  };
  setTimeout(() => {
    if (_outsideClickHandler) document.addEventListener('click', _outsideClickHandler);
  }, 0);
}

export const sheetsPlugin: SitePlugin = {
  siteId: 'sheets',
  tabUrlPattern: 'https://docs.google.com/spreadsheets/*',
  contentScriptMatches: ['https://docs.google.com/spreadsheets/*'],

  // Sheets override CSS is loaded via the manifest css array.
  overrideStyles: 'sheets-overrides.css',

  async init(_engine: ThemeEngine, config: ProductConfig): Promise<void> {
    _prefix = config.prefix;
    _config = config;

    // Apply saved per-site preferences (e.g., preserve grid attribute) on load
    const siteKey = `${_prefix}_site_sheets`;
    const result = await chrome.storage.sync.get(siteKey);
    const stored = result[siteKey];
    if (stored?.preserveGridColors) {
      document.documentElement.setAttribute(`data-${_prefix}-grid`, 'preserve');
    }
  },

  async injectToolbarButton(opts: ToolbarButtonOpts): Promise<HTMLElement | null> {
    let toolbarBtn: HTMLElement | null = null;
    toolbarBtn = await injectToolbarButton(
      { onClick: () => { if (toolbarBtn) toggleDropdown(toolbarBtn, opts); } },
      _prefix,
    );
    return toolbarBtn;
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
