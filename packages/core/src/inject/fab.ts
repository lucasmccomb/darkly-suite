// @darkly/core — Dashboard toolbar icon injector
// Injects the Darkly coin icon into Google's global header bar (#gb)
// on dashboard/home pages where the editor toolbar doesn't exist.

import type { ProductConfig } from '../config';
import { getToolbarIcons } from './toolbar-button';

const ICON_ID_SUFFIX = '-dashboard-icon';

// Google's global bar header — stable ID across Sheets/Docs/Drive dashboards.
// [data-ogsr-up] marks the right-side section (apps grid + avatar).
const HEADER_SELECTOR = 'header#gb';
const RIGHT_SECTION_SELECTOR = '[data-ogsr-up]';

export interface FabOptions {
  onClick: () => void;
}

/**
 * Waits for the dashboard header to appear, then returns the right-side
 * container where icons should be injected.
 */
function waitForDashboardHeader(timeout = 10000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const find = (): HTMLElement | null => {
      const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
      if (!header) return null;
      return header.querySelector<HTMLElement>(RIGHT_SECTION_SELECTOR);
    };

    const existing = find();
    if (existing) {
      resolve(existing);
      return;
    }

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error('[Darkly] Timed out waiting for dashboard header'));
    }, timeout);

    const observer = new MutationObserver(() => {
      const el = find();
      if (el) {
        clearTimeout(timer);
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Injects the Darkly icon into the dashboard header toolbar.
 * Positioned before the Google apps grid icon in the right section.
 * Returns the button element, or null if injection failed.
 */
export async function injectFab(config: ProductConfig, options: FabOptions): Promise<HTMLElement | null> {
  const prefix = config.prefix;
  const iconId = `${prefix}${ICON_ID_SUFFIX}`;

  if (document.getElementById(iconId)) return null;

  let rightSection: HTMLElement;
  try {
    rightSection = await waitForDashboardHeader();
  } catch {
    console.warn('[Darkly] Dashboard header not found — icon skipped');
    return null;
  }

  const icons = getToolbarIcons(config);

  const button = document.createElement('div');
  button.id = iconId;
  button.setAttribute('role', 'button');
  button.setAttribute('aria-label', `${config.productName} settings`);
  button.setAttribute('data-tooltip', config.productName);
  button.setAttribute('tabindex', '0');

  // Style to match Google's header icon sizing (48px row height)
  Object.assign(button.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
    flexShrink: '0',
    marginRight: '4px',
  });

  // Hover background (matches Google's icon hover)
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = 'rgba(128, 128, 128, 0.15)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'transparent';
  });

  // 3D coin structure — reuses existing .darkly-coin-* CSS classes
  const wrapper = document.createElement('div');
  wrapper.className = `${prefix}-coin-wrapper`;

  const edge = document.createElement('div');
  edge.className = `${prefix}-coin-edge`;
  Object.assign(edge.style, {
    top: '1px',
    left: '1px',
    width: '24px',
    height: '24px',
    borderRadius: '5px',
  });

  const img = document.createElement('img');
  img.className = `${prefix}-coin-face`;
  img.src = icons.current();
  img.width = 24;
  img.height = 24;
  img.style.borderRadius = '5px';

  wrapper.appendChild(edge);
  wrapper.appendChild(img);
  button.appendChild(wrapper);

  // Click handler
  button.addEventListener('click', options.onClick);
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      options.onClick();
    }
  });

  // Theme-reactive: swap icon variant on theme change
  new MutationObserver(() => {
    const target = icons.current();
    if (img.src !== target) img.src = target;
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: [`data-${prefix}-theme`],
  });

  // Insert before the first child of the right section (before apps grid icon)
  if (rightSection.firstChild) {
    rightSection.insertBefore(button, rightSection.firstChild);
  } else {
    rightSection.appendChild(button);
  }

  return button;
}

/**
 * Removes the dashboard icon from the DOM.
 */
export function removeFab(prefix: string): void {
  const icon = document.getElementById(`${prefix}${ICON_ID_SUFFIX}`);
  if (icon) icon.remove();
}
