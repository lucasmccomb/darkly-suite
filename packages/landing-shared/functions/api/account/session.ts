import type { Env } from '../_shared/types.ts'
import { requireUser } from './_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/account/session
 * Returns the authenticated user's email, or 401 if not logged in.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const result = await requireUser(context.request, context.env.DB)
  if (result instanceof Response) return result

  return new Response(JSON.stringify({ authenticated: true, email: result.email }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
