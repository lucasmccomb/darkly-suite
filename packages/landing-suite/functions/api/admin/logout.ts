import type { Env } from '../_shared/types.ts'
import { parseCookie } from './_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * POST /api/admin/logout
 * Deletes the session from D1 and clears the cookie.
 */
export const onRequestPost: PagesFunction<Env> = async (context: CFContext) => {
  const sessionToken = parseCookie(context.request.headers.get('Cookie'), 'darkly_admin_session')

  if (sessionToken) {
    await context.env.DB.prepare(
      `DELETE FROM admin_sessions WHERE session_token = ?`,
    )
      .bind(sessionToken)
      .run()
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin',
      'Set-Cookie': `darkly_admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
    },
  })
}
