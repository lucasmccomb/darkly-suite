/**
 * Admin session validation.
 * Returns null if authorized, or an error Response if not.
 */

export async function requireAdmin(
  request: Request,
  db: D1Database,
): Promise<Response | null> {
  const cookie = parseCookie(request.headers.get('Cookie'), 'darkly_admin_session')
  if (!cookie) {
    return unauthorized()
  }

  const session = await db
    .prepare(
      `SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > datetime('now') LIMIT 1`,
    )
    .bind(cookie)
    .first()

  if (!session) {
    return unauthorized()
  }

  return null // authorized
}

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? match[1] : null
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Generate a cryptographically random session token.
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
