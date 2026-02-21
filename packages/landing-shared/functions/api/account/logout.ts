import type { Env } from '../_shared/types.ts'
import { parseCookie } from '../admin/_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * POST /api/account/logout
 * Clears the user session cookie and deletes the session from D1.
 * Redirects to /account.
 */
export const onRequestPost: PagesFunction<Env> = async (context: CFContext) => {
  const { DB } = context.env
  const cookie = parseCookie(context.request.headers.get('Cookie'), 'darkly_user_session')

  if (cookie) {
    await DB.prepare(`DELETE FROM user_sessions WHERE session_token = ?`).bind(cookie).run()
  }

  const url = new URL(context.request.url)

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${url.origin}/account`,
      'Set-Cookie': `darkly_user_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
    },
  })
}
