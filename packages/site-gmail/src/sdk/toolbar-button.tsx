// @darkly/site-gmail — InboxSDK toolbar dropdown button
// Renders a Darkly brand icon in the Gmail toolbar. Clicking it opens
// a dropdown with the MiniControlPanel React component.

import React from 'react';
import { createRoot } from 'react-dom/client';
import type { InboxSDK } from '@inboxsdk/core';
import type { ToolbarButtonOpts, ProductConfig } from '@darkly/core';
import { DarklyProvider } from '@darkly/core';

// V20 squircle brand mark — golden-on-black for dark, blue-on-white for light
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

/**
 * Register the Darkly toolbar button with InboxSDK.
 *
 * The `config` param provides the product configuration for DarklyProvider
 * context and CSS class name generation via `config.prefix`.
 */
export function registerToolbarButton(
  sdk: InboxSDK,
  options: ToolbarButtonOpts,
  config: ProductConfig,
  MiniControlPanel: React.FC<{
    isPro: boolean;
    onAllSettings: () => void;
    onUpgrade: () => void;
    onClose: () => void;
  }>,
): void {
  const prefix = config.prefix;
  sdk.Toolbars.addToolbarButtonForApp({
    title: 'Darkly',
    titleClass: `${prefix}-toolbar-title-hidden`,
    iconUrl: currentToolbarIcon(prefix),
    onClick: (event) => {
      if (!event.dropdown) return;
      const { dropdown } = event;

      // Center the tooltip under the Darkly button.
      const tooltip = dropdown.el.closest('.inboxsdk__tooltip') as HTMLElement | null;
      const btn = document.querySelector('.inboxsdk__appButton') as HTMLElement | null;
      if (tooltip && btn) {
        requestAnimationFrame(() => {
          const btnRect = btn.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();
          const centered = btnRect.left + btnRect.width / 2 - tooltipRect.width / 2;
          tooltip.style.left = `${Math.max(8, centered)}px`;
        });
      }

      const container = document.createElement('div');
      container.className = `${prefix}-settings-container`;
      dropdown.el.appendChild(container);

      const root = createRoot(container);
      root.render(
        <DarklyProvider config={config}>
          <MiniControlPanel
            isPro={options.isPro}
            onAllSettings={() => {
              dropdown.close();
              options.onAllSettings();
            }}
            onUpgrade={() => {
              dropdown.close();
              options.onUpgrade();
            }}
            onClose={() => dropdown.close()}
          />
        </DarklyProvider>,
      );
    },
  });

  // Wrap the InboxSDK-rendered icon in a 3D coin structure
  // and swap icon variant on theme changes.
  const wrapIconInCoin = () => {
    const img = document.querySelector<HTMLImageElement>('.inboxsdk__appButton img');
    if (!img || img.closest(`.${prefix}-coin-wrapper`)) return;

    img.classList.add(`${prefix}-coin-face`);
    img.style.width = '22px';
    img.style.height = '22px';
    img.style.borderRadius = '4px';

    const wrapper = document.createElement('div');
    wrapper.className = `${prefix}-coin-wrapper`;

    const edge = document.createElement('div');
    edge.className = `${prefix}-coin-edge`;
    Object.assign(edge.style, {
      top: '1px', left: '1px',
      width: '22px', height: '22px',
    });

    img.parentElement!.insertBefore(wrapper, img);
    wrapper.appendChild(edge);
    wrapper.appendChild(img);
  };

  requestAnimationFrame(wrapIconInCoin);

  new MutationObserver(() => {
    wrapIconInCoin();
    const img = document.querySelector<HTMLImageElement>('.inboxsdk__appButton img');
    if (img) {
      const target = currentToolbarIcon(prefix);
      if (img.src !== target) img.src = target;
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: [`data-${prefix}-theme`],
  });
}
