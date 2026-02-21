/**
 * User session validation for the account portal.
 * Returns the user's email if authorized, or an error Response if not.
 */

import { parseCookie } from '../../admin/_shared/auth.ts'

export interface UserSession {
  email: string
}

export async function requireUser(
  request: Request,
  db: D1Database,
): Promise<UserSession | Response> {
  const cookie = parseCookie(request.headers.get('Cookie'), 'darkly_user_session')
  if (!cookie) {
    return unauthorized()
  }

  const session = await db
    .prepare(
      `SELECT email FROM user_sessions WHERE session_token = ? AND expires_at > datetime('now') LIMIT 1`,
    )
    .bind(cookie)
    .first<{ email: string }>()

  if (!session) {
    return unauthorized()
  }

  return { email: session.email }
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
