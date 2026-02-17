// @darkly/site-sheets — Sheets toolbar button injector
// Custom DOM injection for Google Sheets toolbar.
// Waits for the toolbar to appear, then injects a Darkly brand icon
// styled to match Sheets' native toolbar buttons.

import {
  TOOLBAR_SELECTOR,
  BUTTON_ID,
  TITLEBAR_BUTTONS_SELECTOR,
  REVISIONS_BUTTON_SELECTOR,
  REVISIONS_BUTTON_FALLBACK,
} from './dom-selectors';

/**
 * Wait for a DOM element matching `selector` to appear.
 * Uses MutationObserver + initial check for reliability.
 */
export function waitForElement(
  selector: string,
  timeout = 15000,
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLElement>(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`[Sheets Darkly] Timed out waiting for ${selector}`));
    }, timeout);

    const observer = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector);
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

// V20 squircle brand mark — golden-on-black for dark, white-on-blue for light
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
 * Create the toolbar button element styled to blend with Sheets' toolbar.
 */
function createToolbarButton(onClick: () => void, prefix: string): HTMLElement {
  const button = document.createElement('div');
  button.id = BUTTON_ID;
  button.setAttribute('role', 'button');
  button.setAttribute('aria-label', 'Sheets Darkly settings');
  button.setAttribute('data-tooltip', 'Sheets Darkly');
  button.setAttribute('tabindex', '0');

  Object.assign(button.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    verticalAlign: 'middle',
    width: '30px',
    height: '30px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '4px',
    marginRight: '12px',
    transition: 'background-color 150ms ease',
    flexShrink: '0',
  });

  // 3D coin effect
  const wrapper = document.createElement('div');
  wrapper.className = `${prefix}-coin-wrapper`;

  const edge = document.createElement('div');
  edge.className = `${prefix}-coin-edge`;
  Object.assign(edge.style, { top: '1px', left: '1px', width: '22px', height: '22px' });

  const img = document.createElement('img');
  img.className = `${prefix}-coin-face`;
  img.src = currentToolbarIcon(prefix);
  img.width = 22;
  img.height = 22;
  img.style.borderRadius = '4px';

  wrapper.appendChild(edge);
  wrapper.appendChild(img);
  button.appendChild(wrapper);

  button.addEventListener('click', onClick);
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });

  // Watch for theme changes to swap between golden/blue icon
  new MutationObserver(() => {
    const target = currentToolbarIcon(prefix);
    if (img.src !== target) img.src = target;
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: [`data-${prefix}-theme`],
  });

  return button;
}

/**
 * Inject the Sheets Darkly toolbar button into the Google Sheets header.
 * Returns the button element, or null if injection failed.
 */
export async function injectToolbarButton(
  options: { onClick: () => void },
  prefix: string,
): Promise<HTMLElement | null> {
  try {
    const toolbar = await waitForElement(TOOLBAR_SELECTOR);

    // Remove existing button if present (re-injection case)
    const existing = document.getElementById(BUTTON_ID);
    if (existing) {
      existing.remove();
    }

    const button = createToolbarButton(options.onClick, prefix);

    // Inject before the "last edited" clock button
    const titlebarButtons = toolbar.querySelector(TITLEBAR_BUTTONS_SELECTOR);
    const lastEditBtn = toolbar.querySelector(REVISIONS_BUTTON_SELECTOR) ??
      toolbar.querySelector(REVISIONS_BUTTON_FALLBACK)?.closest('.goog-inline-block');

    if (lastEditBtn?.parentElement) {
      lastEditBtn.parentElement.insertBefore(button, lastEditBtn);
    } else if (titlebarButtons) {
      titlebarButtons.prepend(button);
    } else {
      toolbar.appendChild(button);
    }

    return button;
  } catch (err) {
    console.warn('[Sheets Darkly] Could not inject toolbar button:', err);
    return null;
  }
}

/**
 * Remove the toolbar button from the DOM.
 */
export function removeToolbarButton(): void {
  const button = document.getElementById(BUTTON_ID);
  if (button) {
    button.remove();
  }
}
