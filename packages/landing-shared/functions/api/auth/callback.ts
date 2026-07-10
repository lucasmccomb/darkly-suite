import type { Env } from '../_shared/types.ts'
import { exchangeCodeForTokens, decodeIdToken } from '../_shared/google-oauth.ts'
import { generateSessionToken, parseCookie } from '../admin/_shared/auth.ts'
import { sendAdminEmail } from '../_shared/email.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/auth/callback
 * Google redirects here after user authenticates.
 * Parses the state prefix to determine flow type:
 *   - admin:{hex}   → existing admin session flow (ADMIN_EMAIL check)
 *   - user:{hex}    → account portal session flow (any Google account)
 *   - checkout:...  → pre-checkout email capture
 *   - restore:...   → restore purchase after extension reinstall
 *   - {hex}         → legacy admin flow (backward compat)
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const url = new URL(context.request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return redirectWithError(url.origin, `OAuth error: ${error}`)
  }

  if (!code || !state) {
    return redirectWithError(url.origin, 'Missing code or state parameter')
  }

  const savedState = parseCookie(context.request.headers.get('Cookie'), 'darkly_oauth_state')
  if (!savedState || savedState !== state) {
    return redirectWithError(url.origin, 'Invalid OAuth state -- possible CSRF attack')
  }

  // Parse flow type from state prefix
  const flowType = parseFlowType(state)

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAIL, DB } = context.env
  const redirectUri = `${url.origin}/api/auth/callback`

  try {
    const tokens = await exchangeCodeForTokens(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, code, redirectUri)
    const claims = decodeIdToken(tokens.id_token, GOOGLE_CLIENT_ID)

    if (flowType === 'checkout') {
      return handleCheckoutFlow(url.origin, state, claims.email)
    }

    if (flowType === 'restore') {
      return handleRestoreFlow(context.env, url.origin, DB, state, claims.email)
    }

    if (flowType === 'user') {
      return handleUserFlow(context.env, url.origin, DB, claims.email)
    }

    return handleAdminFlow(context.env, url.origin, DB, claims.email, ADMIN_EMAIL)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`OAuth callback error: ${message}`)
    const errorRedirect = flowType === 'checkout' || flowType === 'restore' ? '/' : flowType === 'user' ? '/account' : '/admin'
    return redirectWithError(url.origin, 'Authentication failed', errorRedirect)
  }
}

function parseFlowType(state: string): 'admin' | 'user' | 'checkout' | 'restore' {
  if (state.startsWith('checkout:')) return 'checkout'
  if (state.startsWith('restore:')) return 'restore'
  if (state.startsWith('user:')) return 'user'
  return 'admin' // 'admin:' prefix or legacy unprefixed state
}

function handleCheckoutFlow(
  origin: string,
  state: string,
  email: string,
): Response {
  // State format: checkout:{token}:{plan}:{product}:{csrf_hex}
  const parts = state.split(':')
  const token = parts[1]
  const plan = parts[2]
  const product = parts[3]

  const checkoutUrl = new URL('/api/checkout', origin)
  checkoutUrl.searchParams.set('token', token)
  checkoutUrl.searchParams.set('plan', plan)
  checkoutUrl.searchParams.set('product', product)

  const responseHeaders = new Headers()
  responseHeaders.set('Location', checkoutUrl.toString())
  // Carry the id_token-verified email to /api/checkout in a short-lived
  // HttpOnly cookie scoped to that endpoint — never as a query parameter,
  // which would land in browser history, Referer headers, and access logs (#670).
  responseHeaders.append(
    'Set-Cookie',
    `darkly_checkout_email=${encodeURIComponent(email)}; HttpOnly; Secure; SameSite=Lax; Path=/api/checkout; Max-Age=300`,
  )
  // Clear the OAuth state cookie
  responseHeaders.append(
    'Set-Cookie',
    `darkly_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
  )

  return new Response(null, { status: 302, headers: responseHeaders })
}

async function handleRestoreFlow(
  env: Env,
  origin: string,
  db: D1Database,
  state: string,
  email: string,
): Promise<Response> {
  // State format: restore:{token}:{product}:{csrf_hex}
  const parts = state.split(':')
  const newToken = parts[1]
  const product = parts[2]

  // Look up active license by email + product (or suite)
  const license = await db
    .prepare(
      `SELECT id, token FROM licenses
       WHERE email = ? AND product IN (?, 'suite') AND status = 'active'
       ORDER BY CASE WHEN product = ? THEN 0 ELSE 1 END
       LIMIT 1`,
    )
    .bind(email, product, product)
    .first<{ id: number; token: string }>()

  if (!license) {
    return redirectWithError(
      origin,
      'No active subscription found for this email. Please sign in with the email you used to purchase.',
      '/',
    )
  }

  // Update the license token to the new extension token
  await db
    .prepare('UPDATE licenses SET token = ? WHERE id = ?')
    .bind(newToken, license.id)
    .run()

  // Redirect to success page — the extension's checkout poller will
  // pick up the license on its next poll of /api/status/:newToken
  const productSiteUrls: Partial<Record<string, string>> = {
    gmail: env.SITE_URL_GMAIL,
    sheets: env.SITE_URL_SHEETS,
    docs: env.SITE_URL_DOCS,
    browse: env.SITE_URL_BROWSE,
  }
  const siteUrl = productSiteUrls[product] ?? env.SITE_URL

  const responseHeaders = new Headers()
  responseHeaders.set('Location', `${siteUrl}/success?restored=true&product=${product}`)
  responseHeaders.append(
    'Set-Cookie',
    `darkly_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
  )

  return new Response(null, { status: 302, headers: responseHeaders })
}

async function handleAdminFlow(
  env: Env,
  origin: string,
  db: D1Database,
  email: string,
  adminEmail: string,
): Promise<Response> {
  if (email !== adminEmail) {
    return redirectWithError(origin, 'Unauthorized: this account is not allowed')
  }

  await db.prepare(`DELETE FROM admin_sessions WHERE expires_at <= datetime('now')`).run()

  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await db
    .prepare(`INSERT INTO admin_sessions (session_token, email, expires_at) VALUES (?, ?, ?)`)
    .bind(sessionToken, email, expiresAt)
    .run()

  // Tier 3: Admin login notification
  await sendAdminEmail(
    env,
    `Admin login: ${email}`,
    `Admin login detected.\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
  )

  const responseHeaders = new Headers()
  responseHeaders.set('Location', `${origin}/admin/memberships`)
  responseHeaders.set(
    'Set-Cookie',
    `darkly_admin_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`,
  )
  responseHeaders.append(
    'Set-Cookie',
    `darkly_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
  )

  return new Response(null, { status: 302, headers: responseHeaders })
}

async function handleUserFlow(
  env: Env,
  origin: string,
  db: D1Database,
  email: string,
): Promise<Response> {
  // Clean up expired user sessions
  await db.prepare(`DELETE FROM user_sessions WHERE expires_at <= datetime('now')`).run()

  // Only allow login if this email has at least one license (any status)
  const license = await db
    .prepare('SELECT id FROM licenses WHERE email = ? LIMIT 1')
    .bind(email)
    .first()

  if (!license) {
    // Tier 3: Failed login attempt (no subscription)
    await sendAdminEmail(
      env,
      `Failed login attempt: ${email}`,
      `A user tried to log in but has no subscriptions.\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    )

    return redirectWithError(
      origin,
      'No subscriptions found for this email. Please sign in with the email you used to purchase your subscription.',
      '/account',
    )
  }

  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  await db
    .prepare(`INSERT INTO user_sessions (session_token, email, expires_at) VALUES (?, ?, ?)`)
    .bind(sessionToken, email, expiresAt)
    .run()

  const responseHeaders = new Headers()
  responseHeaders.set('Location', `${origin}/account/subscriptions`)
  responseHeaders.set(
    'Set-Cookie',
    `darkly_user_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
  )
  responseHeaders.append(
    'Set-Cookie',
    `darkly_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
  )

  return new Response(null, { status: 302, headers: responseHeaders })
}

function redirectWithError(origin: string, error: string, path = '/admin'): Response {
  const url = new URL(path, origin)
  url.searchParams.set('error', error)
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() },
  })
}
