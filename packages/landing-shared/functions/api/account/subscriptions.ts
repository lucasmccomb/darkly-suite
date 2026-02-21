import type { Env, License } from '../_shared/types.ts'
import { requireUser } from './_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

interface SubscriptionResponse {
  id: number
  product: string
  plan: string
  status: string
  created_at: string
  expires_at: string | null
  discount_code: string | null
  stripe_customer_id: string | null
}

/**
 * GET /api/account/subscriptions
 * Returns all licenses associated with the authenticated user's email.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const result = await requireUser(context.request, context.env.DB)
  if (result instanceof Response) return result

  const { DB } = context.env

  const licenses = await DB.prepare(
    `SELECT l.id, l.product, l.plan, l.status, l.created_at, l.expires_at,
            l.stripe_customer_id, dc.code AS discount_code
     FROM licenses l
     LEFT JOIN discount_codes dc ON l.discount_code_id = dc.id
     WHERE l.email = ?
     ORDER BY l.created_at DESC`,
  )
    .bind(result.email)
    .all<License & { discount_code: string | null }>()

  const subscriptions: SubscriptionResponse[] = (licenses.results ?? []).map((lic) => ({
    id: lic.id,
    product: lic.product,
    plan: lic.plan,
    status: lic.status,
    created_at: lic.created_at,
    expires_at: lic.expires_at,
    discount_code: lic.discount_code ?? null,
    stripe_customer_id: lic.stripe_customer_id,
  }))

  return new Response(JSON.stringify({ subscriptions }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
