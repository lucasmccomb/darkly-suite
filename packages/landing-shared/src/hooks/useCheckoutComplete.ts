import { useEffect } from 'react'
import { notifyCheckoutComplete } from '../utils/extension-bridge.ts'

/**
 * On mount, dispatches a CustomEvent that the extension's landing-bridge
 * content script picks up and forwards to the background worker. This
 * starts the checkout poller so the extension auto-detects the new license.
 */
export function useCheckoutComplete(product: string | null): void {
  useEffect(() => {
    if (!product) return
    notifyCheckoutComplete(product)
  }, [product])
}
