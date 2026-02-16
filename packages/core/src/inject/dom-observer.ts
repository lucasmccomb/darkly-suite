import type { ProductConfig } from '../config';

/**
 * Watches for SPA navigation changes in the host page.
 * When significant DOM mutations occur (e.g., Gmail re-rendering
 * the main view on navigation), the onReinject callback fires
 * so the extension can re-inject its UI elements.
 */
export function createDomObserver(
  config: ProductConfig,
  onReinject: () => Promise<void>,
): { start: () => void; stop: () => void } {
  let observer: MutationObserver | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function start(): void {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      // Only react to significant structural changes (childList),
      // not minor attribute or text updates.
      const hasStructuralChange = mutations.some(
        (m) => m.type === 'childList' && m.addedNodes.length > 0,
      );

      if (!hasStructuralChange) return;

      // Debounce to avoid rapid-fire re-injections during
      // bulk DOM updates (e.g., inbox rendering).
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onReinject().catch((err) => {
          console.warn(`[${config.productName}] DOM observer reinject error:`, err);
        });
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stop(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  return { start, stop };
}
