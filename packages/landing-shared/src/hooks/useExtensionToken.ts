import { useState, useEffect } from 'react'
import { getExtensionToken } from '../utils/extension-bridge.ts'

/**
 * Detect an installed Darkly extension and retrieve its token.
 * Runs once on mount; returns null until detection completes or
 * if no extension is found.
 */
export function useExtensionToken(product: string): string | null {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    getExtensionToken(product).then((t) => {
      if (t) setToken(t)
    })
  }, [product])

  return token
}
