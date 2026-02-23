/**
 * Extension bridge — detects installed Darkly extensions via a content
 * script bridge (landing-bridge.ts) that runs on landing page domains.
 *
 * The content script requests the token from the extension's background
 * worker and dispatches it to the page via a CustomEvent. This approach
 * works for both published (CWS) and unpacked extensions, unlike
 * externally_connectable which requires knowing the extension ID.
 *
 * Communication:
 *   Token:    content script → page via 'darkly-extension-token' event
 *   Request:  page → content script via 'darkly-token-request' event
 *   Checkout: page → content script via 'darkly-checkout-complete' event
 */

interface TokenDetail {
  token: string
  productId: string
}

/**
 * Try to get the extension's token via the content script bridge.
 * Returns null if no extension is installed or doesn't respond within 2s.
 *
 * Handles both timing scenarios:
 * - Content script loaded first: responds to our 'darkly-token-request'
 * - Page loaded first: catches the content script's initial dispatch
 */
export function getExtensionToken(_product: string): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('darkly-extension-token', handler)
      resolve(null)
    }, 2000)

    function handler(event: Event) {
      const detail = (event as CustomEvent<TokenDetail>).detail
      if (detail?.token) {
        clearTimeout(timeout)
        window.removeEventListener('darkly-extension-token', handler)
        resolve(detail.token)
      }
    }

    window.addEventListener('darkly-extension-token', handler)

    // Ask the content script to re-send its token (handles case where
    // content script dispatched before our listener was ready)
    window.dispatchEvent(new CustomEvent('darkly-token-request'))
  })
}

/**
 * Notify the extension that checkout completed, triggering the checkout
 * poller to detect the new license. The content script bridge forwards
 * this to the background worker via chrome.runtime.sendMessage.
 */
export function notifyCheckoutComplete(_product: string): void {
  window.dispatchEvent(new CustomEvent('darkly-checkout-complete'))
}
