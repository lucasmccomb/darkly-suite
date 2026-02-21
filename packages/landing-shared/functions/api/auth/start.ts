import type { Env } from '../_shared/types.ts'
import { isValidToken, isValidPlan, isValidProduct } from '../_shared/types.ts'
import { buildAuthorizationUrl } from '../_shared/google-oauth.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/auth/start
 * Redirects to Google OAuth consent screen.
 *
 * Flow types (via ?type= query param):
 *   - admin    (default) — admin panel login
 *   - user     — account portal login
 *   - checkout — pre-checkout email capture, requires token/plan/product params
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const { GOOGLE_CLIENT_ID } = context.env
  const url = new URL(context.request.url)
  const redirectUri = `${url.origin}/api/auth/callback`
  const type = url.searchParams.get('type')

  const stateBytes = new Uint8Array(16)
  crypto.getRandomValues(stateBytes)
  const randomHex = Array.from(stateBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  let state: string

  if (type === 'checkout') {
    const token = url.searchParams.get('token')
    const plan = url.searchParams.get('plan')
    const product = url.searchParams.get('product') ?? 'gmail'

    if (!token || !isValidToken(token)) {
      return new Response('Missing or invalid token', { status: 400 })
    }
    if (!plan || !isValidPlan(plan)) {
      return new Response('Missing or invalid plan', { status: 400 })
    }
    if (!isValidProduct(product)) {
      return new Response('Invalid product', { status: 400 })
    }

    state = `checkout:${token}:${plan}:${product}:${randomHex}`
  } else {
    const flowType = type === 'user' ? 'user' : 'admin'
    state = `${flowType}:${randomHex}`
  }

  const authUrl = buildAuthorizationUrl(GOOGLE_CLIENT_ID, redirectUri, state)

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      'Set-Cookie': `darkly_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  })
}
