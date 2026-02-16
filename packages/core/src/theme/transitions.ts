const FADE_MS = 200;
const SETTLE_MS = 150;

let initialized = false;
let overlayEl: HTMLDivElement | null = null;

function getOverlay(): HTMLDivElement {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 2147483647',
    'background: #000',
    'opacity: 0',
    `transition: opacity ${FADE_MS}ms ease`,
    'pointer-events: none',
  ].join(';');
  return overlayEl;
}

/**
 * Call once after initial page load to enable transitions on subsequent
 * theme changes. Skipped on first load to avoid FOUC.
 */
export function initTransitions(): void {
  initialized = true;
}

/**
 * Wraps a theme-change callback with a fade-to-black overlay.
 * No-ops before initTransitions() is called.
 */
export function withTransition(changeFn: () => void): void {
  if (!initialized) {
    changeFn();
    return;
  }

  const overlay = getOverlay();

  if (!overlay.parentNode) {
    document.documentElement.appendChild(overlay);
  }
  overlay.style.opacity = '0';

  // Force layout flush
  overlay.offsetHeight; // eslint-disable-line @typescript-eslint/no-unused-expressions

  overlay.style.opacity = '1';

  setTimeout(() => {
    changeFn();
    setTimeout(() => {
      overlay.style.opacity = '0';
    }, SETTLE_MS);
  }, FADE_MS);
}
