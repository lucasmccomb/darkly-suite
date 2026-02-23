/**
 * Checkout URL helpers for landing pages.
 *
 * Generates Stripe checkout URLs and manages throwaway tokens
 * for visitors who don't have the extension installed yet.
 */

const SESSION_TOKEN_KEY = 'darkly_checkout_token'

/**
 * Build a full checkout URL for redirecting the user to Stripe.
 *
 * Used by home page pricing sections where email is not pre-captured.
 */
export function buildCheckoutUrl(
  baseUrl: string,
  product: string,
  plan: string,
  token: string,
): string {
  const params = new URLSearchParams({
    token,
    plan: plan.toLowerCase(),
    product,
  })
  return `${baseUrl}?${params}`
}

/**
 * Build an OAuth checkout URL that routes through Google sign-in
 * before reaching Stripe. This guarantees the correct email is captured.
 *
 * Used by the subscribe page (extension install redirect).
 */
export function buildOAuthCheckoutUrl(
  authBaseUrl: string,
  product: string,
  plan: string,
  token: string,
): string {
  const params = new URLSearchParams({
    type: 'checkout',
    token,
    plan: plan.toLowerCase(),
    product,
  })
  return `${authBaseUrl}?${params}`
}

/**
 * Get a checkout token, preferring:
 * 1. An explicit token (e.g. from URL params, passed by the extension)
 * 2. A token retrieved from an installed extension via externally_connectable
 * 3. A previously generated token stored in sessionStorage
 * 4. A freshly generated UUID
 *
 * sessionStorage ensures the same token is reused within a tab session
 * (e.g. user clicks Monthly → cancels on Stripe → clicks Yearly).
 */
export function getOrCreateToken(
  urlToken?: string | null,
  extensionToken?: string | null,
): string {
  if (urlToken) return urlToken
  if (extensionToken) return extensionToken

  const existing = sessionStorage.getItem(SESSION_TOKEN_KEY)
  if (existing) return existing

  const token = crypto.randomUUID()
  sessionStorage.setItem(SESSION_TOKEN_KEY, token)
  return token
}
