import React from 'react';
import { createRoot } from 'react-dom/client';
import type { ProductConfig } from '../config';
import { SettingsPanel } from '../ui/SettingsPanel';
import { DarklyProvider } from '../context';

// V20 squircle logo -- dark bg with brand mark.
// Golden variant for dark mode, blue variant for light mode.
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

// Pre-compute both icon variants for theme swapping
const SIDEBAR_ICON_GOLDEN = sidebarIcon('golden');
const SIDEBAR_ICON_BLUE = sidebarIcon('blue');

function currentSidebarIcon(prefix: string): string {
  const isDark = document.documentElement.getAttribute(`data-${prefix}-theme`) === 'dark';
  return isDark ? SIDEBAR_ICON_GOLDEN : SIDEBAR_ICON_BLUE;
}

/**
 * Returns icon URLs for use in sidebar panel registration.
 */
export function getSidebarIcons(config: ProductConfig): {
  current: () => string;
  golden: string;
  blue: string;
  primaryColor: () => string;
} {
  return {
    current: () => currentSidebarIcon(config.prefix),
    golden: SIDEBAR_ICON_GOLDEN,
    blue: SIDEBAR_ICON_BLUE,
    primaryColor: () => {
      const isDark = document.documentElement.getAttribute(`data-${config.prefix}-theme`) === 'dark';
      return isDark ? '#d4941c' : '#1a73e8';
    },
  };
}

/** Find sidebar icon <img> elements and swap src for theme changes */
function swapSidebarIcon(): void {
  const target = document.documentElement.getAttribute('data-gd-theme') === 'dark'
    ? SIDEBAR_ICON_GOLDEN : SIDEBAR_ICON_BLUE;
  document.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    if (img.src === SIDEBAR_ICON_GOLDEN || img.src === SIDEBAR_ICON_BLUE) {
      if (img.src !== target) img.src = target;
    }
  });
}

export interface SidebarPanelOptions {
  isPro?: boolean;
  onUpgrade?: () => void;
  onClose?: () => void;
  renderProductSection?: React.ReactNode;
}

/**
 * Renders the full settings panel into a container element.
 * Returns a cleanup function to unmount the React tree.
 *
 * Site plugins call this to render the shared SettingsPanel inside
 * their platform-specific sidebar integration.
 */
export function createSidebarPanel(
  config: ProductConfig,
  container: HTMLElement,
  options: SidebarPanelOptions = {},
): () => void {
  container.className = `${config.prefix}-settings-container ${config.prefix}-sidebar`;

  const root = createRoot(container);
  root.render(
    <DarklyProvider config={config}>
      <SettingsPanel
        isPro={options.isPro}
        onUpgrade={options.onUpgrade}
        onClose={options.onClose}
        renderProductSection={options.renderProductSection}
      />
    </DarklyProvider>,
  );

  // Fix golden border corner gaps: ancestor wrappers may have border-radius
  // with opaque backgrounds that peek through at rounded corners.
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

  return () => root.unmount();
}

/**
 * Observes theme attribute changes and swaps sidebar icon src.
 * Returns a cleanup function.
 */
export function observeSidebarIcon(config: ProductConfig): () => void {
  const observer = new MutationObserver(() => swapSidebarIcon());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [`data-${config.prefix}-theme`],
  });
  return () => observer.disconnect();
}
