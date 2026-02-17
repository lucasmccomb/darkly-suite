// @darkly/site-docs — Sidebar Icon Injector
// Injects a Darkly brand icon into Google Docs' companion app-switcher strip.

import { waitForElement } from './toolbar';
import { SIDEBAR_STRIP_SELECTOR, SIDEBAR_ICON_ID } from './dom-selectors';

// V20 squircle brand mark — golden-on-black for dark, white-on-blue for light
function brandIcon(variant: 'golden' | 'blue'): string {
  const bg = variant === 'golden' ? '#0a0a1a' : '#1a2d6b';
  const colors =
    variant === 'golden'
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

const ICON_GOLDEN = brandIcon('golden');
const ICON_BLUE = brandIcon('blue');

function currentIcon(prefix: string): string {
  return document.documentElement.getAttribute(`data-${prefix}-theme`) === 'dark'
    ? ICON_GOLDEN
    : ICON_BLUE;
}

function createSidebarButton(onClick: () => void, prefix: string): HTMLElement {
  const button = document.createElement('div');
  button.id = SIDEBAR_ICON_ID;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-label', 'Docs Darkly settings');
  button.setAttribute('data-tooltip', 'Docs Darkly');
  button.setAttribute('tabindex', '0');

  Object.assign(button.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '44px',
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
  });

  const wrapper = document.createElement('div');
  wrapper.className = `${prefix}-coin-wrapper`;

  const edge = document.createElement('div');
  edge.className = `${prefix}-coin-edge`;
  Object.assign(edge.style, { top: '1px', left: '1px', width: '24px', height: '24px' });

  const img = document.createElement('img');
  img.className = `${prefix}-coin-face`;
  img.src = currentIcon(prefix);
  img.width = 24;
  img.height = 24;
  img.style.borderRadius = '5px';

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

  new MutationObserver(() => {
    const target = currentIcon(prefix);
    if (img.src !== target) img.src = target;
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: [`data-${prefix}-theme`],
  });

  return button;
}

export async function injectSidebarIcon(
  options: { onClick: () => void },
  prefix: string,
): Promise<HTMLElement | null> {
  try {
    const strip = await waitForElement(SIDEBAR_STRIP_SELECTOR);

    const existing = document.getElementById(SIDEBAR_ICON_ID);
    if (existing) existing.remove();

    const button = createSidebarButton(options.onClick, prefix);
    strip.appendChild(button);
    return button;
  } catch {
    console.warn('[Docs Darkly] Companion strip not found — sidebar icon skipped');
    return null;
  }
}
