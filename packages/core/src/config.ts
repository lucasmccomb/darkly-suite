// Foundational types for the Darkly Suite monorepo.
// Every module is parameterized by ProductConfig — this is the key to code sharing.

import type React from 'react';

export type SiteId = 'gmail' | 'sheets' | 'docs';
export type ProductId = 'gmail' | 'sheets' | 'docs' | 'suite';
export type Plan = 'monthly' | 'yearly' | 'lifetime';

export interface ProductConfig {
  productId: ProductId;
  productName: string;
  prefix: string;
  storageKey: string;
  tokenKey: string;
  proCacheKey: string;
  apiBase: string;
  alarmName: string;
  tabUrlPattern: string;
  sites?: SiteId[];
}

export interface ToolbarButtonOpts {
  isPro: boolean;
  onAllSettings: () => void;
  onUpgrade: () => void;
}

export interface SidebarIconOpts {
  isPro: boolean;
}

export interface SitePlugin {
  siteId: SiteId;
  tabUrlPattern: string;
  contentScriptMatches: string[];
  injectToolbarButton(opts: ToolbarButtonOpts): Promise<HTMLElement | null>;
  injectSidebarIcon?(opts: SidebarIconOpts): void;
  startDomObserver(onReinject: () => Promise<void>): void;
  renderProductSection?(
    prefs: unknown,
    update: (p: unknown) => void
  ): React.ReactNode;
  getDefaultPreferences?(): Record<string, unknown>;
  overrideStyles: string;
  init?(engine: ThemeEngine, config: ProductConfig): Promise<void>;
}

// Forward reference for ThemeEngine (avoids circular import)
export type ThemeEngine = import('./theme/engine').ThemeEngine;
