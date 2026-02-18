import type { Env } from '../_shared/types.ts'
import { requireAdmin } from './_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/admin/session
 * Returns 200 with email if session is valid, 401 if not.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  return new Response(JSON.stringify({ authenticated: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
