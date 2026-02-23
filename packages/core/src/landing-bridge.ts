/**
 * Landing bridge content script — runs on landing page domains to enable
 * bidirectional communication between the web page and the extension's
 * background worker. Works for both published and unpacked extensions
 * since it uses chrome.runtime.sendMessage (no extension ID needed).
 *
 * Communication flow:
 *   Token handoff:
 *     content script → background: chrome.runtime.sendMessage({ type: 'getToken' })
 *     content script → page: window.dispatchEvent('darkly-extension-token')
 *     page → content script: window.dispatchEvent('darkly-token-request')
 *
 *   Checkout complete:
 *     page → content script: window.dispatchEvent('darkly-checkout-complete')
 *     content script → background: chrome.runtime.sendMessage({ type: 'checkoutComplete' })
 */

interface TokenResponse {
  token: string;
  productId: string;
}

// Request the extension's token from the background worker and broadcast
// it to the page. The page's useExtensionToken hook listens for this event.
chrome.runtime.sendMessage({ type: 'getToken' }, (response: TokenResponse) => {
  if (chrome.runtime.lastError || !response?.token) return;

  const detail = { token: response.token, productId: response.productId };

  // Dispatch immediately for any listeners already waiting
  window.dispatchEvent(new CustomEvent('darkly-extension-token', { detail }));

  // Also listen for future requests (page loaded after content script)
  window.addEventListener('darkly-token-request', () => {
    window.dispatchEvent(new CustomEvent('darkly-extension-token', { detail }));
  });
});

// Listen for checkout completion events from the page (success page)
// and forward to the background worker to start the checkout poller.
window.addEventListener('darkly-checkout-complete', () => {
  chrome.runtime.sendMessage({ type: 'checkoutComplete' });
});
