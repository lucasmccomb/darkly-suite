/**
 * Access closed shadow roots via chrome.dom.openOrClosedShadowRoot().
 *
 * This API is only available in Chrome extensions (content scripts).
 * It allows us to style closed shadow DOM components that would
 * otherwise be inaccessible.
 */

/** Get a shadow root (open or closed) from an element. */
export function getShadowRoot(element: Element): ShadowRoot | null {
  // Try open shadow root first (standard API)
  if (element.shadowRoot) return element.shadowRoot;

  // Try Chrome extension API for closed shadow roots.
  // The API requires HTMLElement; skip for non-HTML elements (e.g. SVG).
  if (
    typeof chrome !== 'undefined' &&
    chrome.dom?.openOrClosedShadowRoot &&
    element instanceof HTMLElement
  ) {
    return chrome.dom.openOrClosedShadowRoot(element);
  }

  return null;
}

/** Check if the Chrome closed shadow root API is available. */
export function hasClosedShadowRootAccess(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.dom?.openOrClosedShadowRoot;
}
