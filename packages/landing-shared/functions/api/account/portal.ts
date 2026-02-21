import type { Env } from '../_shared/types.ts'
import { requireUser } from './_shared/auth.ts'
import { createPortalSession } from '../_shared/stripe.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/account/portal?customer_id=cus_XXXXX
 * Creates a Stripe Billing Portal session and redirects the user.
 * Validates that the customer_id belongs to a license owned by the authenticated user.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const result = await requireUser(context.request, context.env.DB)
  if (result instanceof Response) return result

  const url = new URL(context.request.url)
  const customerId = url.searchParams.get('customer_id')

  if (!customerId) {
    return new Response(JSON.stringify({ error: 'Missing customer_id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify the customer_id belongs to this user's email
  const { DB, STRIPE_SECRET_KEY } = context.env

  const license = await DB.prepare(
    `SELECT id FROM licenses WHERE stripe_customer_id = ? AND email = ? LIMIT 1`,
  )
    .bind(customerId, result.email)
    .first()

  if (!license) {
    return new Response(JSON.stringify({ error: 'Customer not found for this account' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const returnUrl = `${url.origin}/account/subscriptions`
  const portal = await createPortalSession(STRIPE_SECRET_KEY, customerId, returnUrl)

  return new Response(null, {
    status: 303,
    headers: { Location: portal.url },
  })
}
