import React from 'react';
import { createRoot } from 'react-dom/client';
import type { ProductConfig, ToolbarButtonOpts } from '../config';
import { MiniControlPanel } from '../ui/MiniControlPanel';
import { DarklyProvider } from '../context';

// V20 squircle brand mark -- golden-on-black for dark, blue-on-white for light
function brandIcon(variant: 'golden' | 'blue'): string {
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

const TOOLBAR_ICON_GOLDEN = brandIcon('golden');
const TOOLBAR_ICON_BLUE = brandIcon('blue');

function currentToolbarIcon(prefix: string): string {
  return document.documentElement.getAttribute(`data-${prefix}-theme`) === 'dark'
    ? TOOLBAR_ICON_GOLDEN : TOOLBAR_ICON_BLUE;
}

export interface ToolbarButtonContext {
  iconUrl: string;
}

/**
 * Creates a toolbar dropdown panel with the MiniControlPanel React component.
 * Returns a DOM element that can be appended to a dropdown container.
 *
 * Site plugins call this to render the shared MiniControlPanel inside
 * their platform-specific toolbar integration (InboxSDK, custom button, etc.)
 */
export function createToolbarDropdown(
  config: ProductConfig,
  container: HTMLElement,
  options: ToolbarButtonOpts & { onClose: () => void },
): () => void {
  const root = createRoot(container);
  root.render(
    <DarklyProvider config={config}>
      <MiniControlPanel
        isPro={options.isPro}
        onAllSettings={() => {
          options.onClose();
          options.onAllSettings();
        }}
        onUpgrade={() => {
          options.onClose();
          options.onUpgrade();
        }}
        onClose={options.onClose}
      />
    </DarklyProvider>,
  );

  return () => root.unmount();
}

/**
 * Returns icon URLs for use in toolbar buttons.
 * Icons swap between golden (dark mode) and blue (light mode) variants.
 */
export function getToolbarIcons(config: ProductConfig): {
  current: () => string;
  golden: string;
  blue: string;
} {
  return {
    current: () => currentToolbarIcon(config.prefix),
    golden: TOOLBAR_ICON_GOLDEN,
    blue: TOOLBAR_ICON_BLUE,
  };
}

/**
 * Wraps an image element inside a 3D coin structure.
 * Call after the toolbar button image is rendered.
 */
export function wrapIconInCoin(config: ProductConfig, img: HTMLImageElement): void {
  const p = config.prefix;
  if (img.closest(`.${p}-coin-wrapper`)) return;

  img.classList.add(`${p}-coin-face`);
  img.style.width = '22px';
  img.style.height = '22px';
  img.style.borderRadius = '4px';

  const wrapper = document.createElement('div');
  wrapper.className = `${p}-coin-wrapper`;

  const edge = document.createElement('div');
  edge.className = `${p}-coin-edge`;
  Object.assign(edge.style, {
    top: '1px', left: '1px',
    width: '22px', height: '22px',
  });

  img.parentElement!.insertBefore(wrapper, img);
  wrapper.appendChild(edge);
  wrapper.appendChild(img);
}

/**
 * Observes theme attribute changes and updates a toolbar icon's src.
 * Returns a cleanup function.
 */
export function observeToolbarIcon(config: ProductConfig, getImg: () => HTMLImageElement | null): () => void {
  const observer = new MutationObserver(() => {
    const img = getImg();
    if (img) {
      const target = currentToolbarIcon(config.prefix);
      if (img.src !== target) img.src = target;
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [`data-${config.prefix}-theme`],
  });

  return () => observer.disconnect();
}
