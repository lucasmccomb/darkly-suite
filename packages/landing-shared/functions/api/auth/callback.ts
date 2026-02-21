import type { Env } from '../_shared/types.ts'
import { exchangeCodeForTokens, decodeIdToken } from '../_shared/google-oauth.ts'
import { generateSessionToken, parseCookie } from '../admin/_shared/auth.ts'
import { sendAdminEmail } from '../_shared/email.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/auth/callback
 * Google redirects here after user authenticates.
 * Parses the state prefix to determine admin vs user flow:
 *   - admin:{hex} → existing admin session flow (ADMIN_EMAIL check)
 *   - user:{hex}  → account portal session flow (any Google account)
 *   - {hex}       → legacy admin flow (backward compat)
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

    if (flowType === 'user') {
      return handleUserFlow(context.env, url.origin, DB, claims.email)
    }

    return handleAdminFlow(context.env, url.origin, DB, claims.email, ADMIN_EMAIL)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`OAuth callback error: ${message}`)
    const errorRedirect = flowType === 'user' ? '/account' : '/admin'
    return redirectWithError(url.origin, 'Authentication failed', errorRedirect)
  }
}

function parseFlowType(state: string): 'admin' | 'user' {
  if (state.startsWith('user:')) return 'user'
  return 'admin' // 'admin:' prefix or legacy unprefixed state
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
  responseHeaders.set('Location', `${origin}/admin/licenses`)
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
