import type { Env } from '../_shared/types.ts'
import { exchangeCodeForTokens, decodeIdToken } from '../_shared/google-oauth.ts'
import { generateSessionToken, parseCookie } from '../admin/_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/auth/callback
 * Google redirects here after user authenticates.
 * Exchanges auth code for tokens, verifies email, creates session.
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

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAIL, DB } = context.env
  const redirectUri = `${url.origin}/api/auth/callback`

  try {
    const tokens = await exchangeCodeForTokens(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, code, redirectUri)
    const claims = decodeIdToken(tokens.id_token, GOOGLE_CLIENT_ID)

    if (claims.email !== ADMIN_EMAIL) {
      return redirectWithError(url.origin, 'Unauthorized: this account is not allowed')
    }

    await DB.prepare(`DELETE FROM admin_sessions WHERE expires_at <= datetime('now')`).run()

    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await DB.prepare(
      `INSERT INTO admin_sessions (session_token, email, expires_at) VALUES (?, ?, ?)`,
    )
      .bind(sessionToken, claims.email, expiresAt)
      .run()

    const responseHeaders = new Headers()
    responseHeaders.set('Location', `${url.origin}/admin/licenses`)
    responseHeaders.set(
      'Set-Cookie',
      `darkly_admin_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`,
    )
    responseHeaders.append(
      'Set-Cookie',
      `darkly_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
    )

    return new Response(null, { status: 302, headers: responseHeaders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`OAuth callback error: ${message}`)
    return redirectWithError(url.origin, 'Authentication failed')
  }
}

function redirectWithError(origin: string, error: string): Response {
  const url = new URL('/admin', origin)
  url.searchParams.set('error', error)
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() },
  })
}
