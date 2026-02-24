// @darkly/site-gmail — InboxSDK sidebar panel
// Mounts the full SettingsPanel React component inside Gmail's sidebar.

import React from 'react';
import { createRoot } from 'react-dom/client';
import type { InboxSDK } from '@inboxsdk/core';
import type { ProductConfig } from '@darkly/core';
import { DarklyProvider } from '@darkly/core';

// V20 squircle logo — dark bg with brand mark.
function sidebarIcon(variant: 'golden' | 'blue'): string {
  const bg = variant === 'golden' ? '#0a0a1a' : '#1a2d6b';
  const colors = variant === 'golden'
    ? { start: '#f5c842', end: '#d4941c', border: '#d4941c' }
    : { start: '#ffffff', end: '#e0e0e0', border: 'none' };

  return (
    'data:image/svg+xml;base64,' +
    btoa(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
        '<defs>' +
        '<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
        `<stop offset="0%" stop-color="${colors.start}"/>` +
        `<stop offset="100%" stop-color="${colors.end}"/>` +
        '</linearGradient>' +
        '<clipPath id="c"><rect x="1" y="1" width="30" height="30" rx="7"/></clipPath>' +
        '<mask id="m">' +
        '<rect x="-6" y="-3" width="40" height="38" fill="white"/>' +
        '<circle cx="12" cy="20" r="5" fill="black"/>' +
        '<circle cx="14.5" cy="19" r="4.5" fill="white"/>' +
        '<path d="M15.5,16.0L15.9,18.6L18.5,19.0L15.9,19.4L15.5,22.0L15.1,19.4L12.5,19.0L15.1,18.6Z" fill="black"/>' +
        '</mask>' +
        '</defs>' +
        `<rect x="1" y="1" width="30" height="30" rx="7" fill="${bg}"/>` +
        '<g clip-path="url(#c)">' +
        '<svg viewBox="-5.25 -3 38 38" x="1" y="1" width="30" height="30">' +
        '<path d="M5.0,5.5L5.9,9.1L9.5,10.0L5.9,10.9L5.0,14.5L4.1,10.9L0.5,10.0L4.1,9.1Z" fill="url(#g)"/>' +
        '<rect x="19" y="4" width="3.8" height="24" rx="1.9" fill="url(#g)"/>' +
        '<circle cx="13.5" cy="20" r="8" fill="url(#g)" mask="url(#m)"/>' +
        '</svg>' +
        '</g>' +
        `<rect x="1.5" y="1.5" width="29" height="29" rx="6.5" fill="none" stroke="${colors.border}" stroke-width="1.2"/>` +
        '</svg>',
    )
  );
}

const SIDEBAR_ICON_GOLDEN = sidebarIcon('golden');
const SIDEBAR_ICON_BLUE = sidebarIcon('blue');

function currentSidebarIcon(prefix: string): string {
  const isDark = document.documentElement.getAttribute(`data-${prefix}-theme`) === 'dark';
  return isDark ? SIDEBAR_ICON_GOLDEN : SIDEBAR_ICON_BLUE;
}

function swapSidebarIcon(prefix: string): void {
  const target = currentSidebarIcon(prefix);
  document.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    if (img.src === SIDEBAR_ICON_GOLDEN || img.src === SIDEBAR_ICON_BLUE) {
      if (img.src !== target) img.src = target;
    }
  });
}

interface SidebarPanelOptions {
  isPro?: boolean;
  plan?: string;
  subscriptionStatus?: string;
  prices?: import('@darkly/core').PriceInfo;
  onUpgrade?: (plan?: 'monthly' | 'yearly' | 'lifetime') => void;
  onRestorePurchase?: () => void;
  onManageSubscription?: () => void;
}

/**
 * Mount the Darkly settings panel in Gmail's sidebar using InboxSDK.
 *
 * `config` provides the product configuration for DarklyProvider
 * context and CSS class name generation via `config.prefix`.
 * `SettingsPanel` is the React component to render inside the panel.
 *
 * @returns A function to open the panel, or null if mounting failed.
 */
export async function mountSettingsPanel(
  sdk: InboxSDK,
  options: SidebarPanelOptions,
  config: ProductConfig,
  SettingsPanel: React.FC<{
    isPro?: boolean;
    plan?: string;
    subscriptionStatus?: string;
    prices?: import('@darkly/core').PriceInfo;
    onUpgrade?: (plan?: 'monthly' | 'yearly' | 'lifetime') => void;
    onRestorePurchase?: () => void;
    onManageSubscription?: () => void;
    onClose: () => void;
  }>,
): Promise<(() => void) | null> {
  const prefix = config.prefix;
  const container = document.createElement('div');
  container.className = `${prefix}-settings-container ${prefix}-sidebar`;

  const isDark = document.documentElement.getAttribute(`data-${prefix}-theme`) === 'dark';

  const panelView = await sdk.Global.addSidebarContentPanel({
    title: 'Darkly',
    el: container,
    iconUrl: currentSidebarIcon(prefix),
    primaryColor: isDark ? '#d4941c' : '#1a73e8',
  });

  if (!panelView) return null;

  const root = createRoot(container);
  root.render(
    <DarklyProvider config={config}>
      <SettingsPanel
        isPro={options.isPro}
        plan={options.plan}
        subscriptionStatus={options.subscriptionStatus}
        prices={options.prices}
        onUpgrade={options.onUpgrade}
        onRestorePurchase={options.onRestorePurchase}
        onManageSubscription={options.onManageSubscription}
        onClose={() => panelView.close()}
      />
    </DarklyProvider>,
  );

  // Fix golden border corner gaps
  requestAnimationFrame(() => {
    let current = container.parentElement;
    let radius = '';
    for (let i = 0; i < 5 && current; i++) {
      const r = getComputedStyle(current).borderRadius;
      if (r && r !== '0px') radius = r;
      current.style.background = 'transparent';
      current = current.parentElement;
    }
    if (radius) {
      container.style.borderRadius = radius;
      container.style.overflow = 'clip';
    }
  });

  // Swap sidebar icon when theme changes
  const themeObserver = new MutationObserver(() => swapSidebarIcon(prefix));
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [`data-${prefix}-theme`],
  });

  panelView.on('deactivate', () => {
    panelView.close();
  });

  // Close Gmail's Quick Settings panel when Darkly panel opens
  panelView.on('activate', () => {
    const quickSettings = document.querySelector<HTMLElement>('.IU');
    if (quickSettings) {
      const closeBtn = quickSettings.querySelector<HTMLElement>('[aria-label="Close"]');
      closeBtn?.click();
    }
  });

  // Auto-close when Gmail's native Quick Settings panel opens
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node instanceof HTMLElement &&
          (node.classList.contains('IU') || node.querySelector('.IU'))
        ) {
          panelView.close();
          return;
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  return () => panelView.open();
}
