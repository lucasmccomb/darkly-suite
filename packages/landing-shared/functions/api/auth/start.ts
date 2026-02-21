import type { Env } from '../_shared/types.ts'
import { buildAuthorizationUrl } from '../_shared/google-oauth.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/auth/start
 * Redirects to Google OAuth consent screen.
 * Pass ?type=user for account portal login (default: admin).
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const { GOOGLE_CLIENT_ID } = context.env
  const url = new URL(context.request.url)
  const redirectUri = `${url.origin}/api/auth/callback`

  const flowType = url.searchParams.get('type') === 'user' ? 'user' : 'admin'

  const stateBytes = new Uint8Array(16)
  crypto.getRandomValues(stateBytes)
  const randomHex = Array.from(stateBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const state = `${flowType}:${randomHex}`

  const authUrl = buildAuthorizationUrl(GOOGLE_CLIENT_ID, redirectUri, state)

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      'Set-Cookie': `darkly_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  })
}
