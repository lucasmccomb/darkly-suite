// Foundational types for the Darkly Suite monorepo.
// Every module is parameterized by ProductConfig — this is the key to code sharing.

import type React from 'react';

export type SiteId = 'gmail' | 'sheets' | 'docs' | 'drive';
export type ProductId = 'gmail' | 'sheets' | 'docs' | 'suite' | 'browse';
export type Plan = 'monthly' | 'yearly' | 'lifetime';
export type PageContext = 'editor' | 'dashboard';

export interface ProductConfig {
  productId: ProductId;
  productName: string;
  prefix: string;
  storageKey: string;
  tokenKey: string;
  proCacheKey: string;
  apiBase: string;
  siteBase: string;
  alarmName: string;
  tabUrlPattern: string;
  sites?: SiteId[];
  /** When true, force `color-scheme: light` regardless of theme.
   * Required for Docs to prevent Google's native dark mode from activating. */
  forceColorSchemeLight?: boolean;
}

export interface ToolbarButtonOpts {
  isPro: boolean;
  plan?: string;
  subscriptionStatus?: string;
  cancelAt?: string;
  prices?: import('./payment/client').PriceInfo;
  onAllSettings: () => void;
  onUpgrade: (plan?: 'monthly' | 'yearly' | 'lifetime') => void;
  onRestorePurchase?: () => void;
  onManageSubscription?: () => void;
}

export interface SidebarIconOpts {
  isPro: boolean;
  onClick: () => void;
}

export interface KeyboardShortcutHandlers {
  toggleDarkMode: () => void;
  openSettings: () => void;
}

export interface SitePlugin {
  siteId: SiteId;
  tabUrlPattern: string;
  contentScriptMatches: string[];
  injectToolbarButton(opts: ToolbarButtonOpts): Promise<HTMLElement | null>;
  injectSidebarIcon?(opts: SidebarIconOpts): Promise<HTMLElement | null>;
  startDomObserver(onReinject: () => Promise<void>): void;
  registerKeyboardShortcuts?(handlers: KeyboardShortcutHandlers): (() => void) | void;
  renderProductSection?(
    prefs: unknown,
    update: (p: unknown) => void
  ): React.ReactNode;
  getDefaultPreferences?(): Record<string, unknown>;
  overrideStyles: string;
  init?(engine: ThemeEngine, config: ProductConfig): Promise<void>;
  getPageContext?(): PageContext;
}

// Forward reference for ThemeEngine (avoids circular import)
export type ThemeEngine = import('./theme/engine').ThemeEngine;
