// @darkly/site-docs — Kix canvas mutation observer
// MutationObserver that watches for toolbar rebuilds (happens on view switch,
// resize, SPA navigation). Debounces callbacks to avoid thrashing.

import { TOOLBAR_SELECTOR, BUTTON_ID } from './dom-selectors';

const DEBOUNCE_MS = 500;

/**
 * Start observing the DOM for toolbar removal/rebuild events.
 * When the toolbar is rebuilt (and our button is no longer present),
 * the `onToolbarRemoved` callback fires so the caller can re-inject.
 *
 * @returns A cleanup function to stop observing.
 */
export function startCanvasObserver(onToolbarRemoved: () => void): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    const button = document.getElementById(BUTTON_ID);
    const toolbar = document.querySelector(TOOLBAR_SELECTOR);

    // If the toolbar exists but our button is gone, it was rebuilt
    if (toolbar && !button) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        onToolbarRemoved();
      }, DEBOUNCE_MS);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };
}
