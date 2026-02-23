/**
 * Extension bridge — detects installed Darkly extensions via
 * chrome.runtime.sendMessage (externally_connectable).
 *
 * The extension's background worker responds with { token, productId }
 * so the landing page can use the real extension token for checkout
 * instead of generating a throwaway UUID.
 */

// Minimal Chrome runtime types for externally_connectable messaging.
// Web pages listed in an extension's externally_connectable.matches can call
// chrome.runtime.sendMessage(extensionId, ...) — this covers only that API.
declare global {
  namespace chrome {
    namespace runtime {
      const lastError: { message?: string } | undefined
      function sendMessage(
        extensionId: string,
        message: unknown,
        callback: (response: unknown) => void,
      ): void
    }
  }
}

/** Chrome Web Store extension IDs. Fill in as extensions are published. */
const EXTENSION_IDS: Record<string, string> = {
  gmail: 'PLACEHOLDER_GMAIL_ID',
  sheets: 'PLACEHOLDER_SHEETS_ID',
  docs: 'PLACEHOLDER_DOCS_ID',
  suite: 'PLACEHOLDER_SUITE_ID',
}

interface TokenResponse {
  token: string | null
  productId: string
}

/**
 * Try to get the extension's token for a given product via
 * externally_connectable messaging. Returns null if no extension
 * is installed or the message fails.
 */
export async function getExtensionToken(product: string): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    return null
  }

  // Try the product-specific extension first, then the suite extension
  const idsToTry = [
    EXTENSION_IDS[product],
    ...(product !== 'suite' ? [EXTENSION_IDS.suite] : []),
  ].filter(Boolean)

  for (const id of idsToTry) {
    try {
      const response = await new Promise<TokenResponse>((resolve, reject) => {
        chrome.runtime.sendMessage(id, { type: 'getToken' }, (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(resp as TokenResponse)
          }
        })
      })
      if (response?.token) return response.token
    } catch {
      // Extension not installed or not responding — try next
      continue
    }
  }

  return null
}
