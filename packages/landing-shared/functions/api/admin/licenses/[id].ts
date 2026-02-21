import type { Env, License } from '../../_shared/types.ts'
import { retrieveSubscription, retrieveCustomer } from '../../_shared/stripe.ts'
import type { StripeSubscription, StripeCustomer } from '../../_shared/stripe.ts'
import { requireAdmin } from '../_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

interface LicenseDetailResponse {
  license: License & { discount_code: string | null }
  stripe: {
    subscription: StripeSubscription | null
    customer: StripeCustomer | null
  } | null
  stripe_error: string | null
}

/**
 * GET /api/admin/licenses/:id
 * Returns a single license enriched with live Stripe subscription/customer data.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const id = context.params.id as string

  const license = await context.env.DB.prepare(
    `SELECT l.*, dc.code AS discount_code
     FROM licenses l
     LEFT JOIN discount_codes dc ON l.discount_code_id = dc.id
     WHERE l.id = ?`,
  )
    .bind(id)
    .first<License & { discount_code: string | null }>()

  if (!license) {
    return new Response(JSON.stringify({ error: 'License not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const response: LicenseDetailResponse = {
    license,
    stripe: null,
    stripe_error: null,
  }

  // Fetch live Stripe data (best-effort)
  try {
    let subscription: StripeSubscription | null = null
    let customer: StripeCustomer | null = null

    if (license.stripe_subscription_id) {
      subscription = await retrieveSubscription(
        context.env.STRIPE_SECRET_KEY,
        license.stripe_subscription_id,
      )
    }

    if (license.stripe_customer_id) {
      customer = await retrieveCustomer(
        context.env.STRIPE_SECRET_KEY,
        license.stripe_customer_id,
      )
    }

    response.stripe = { subscription, customer }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Failed to fetch Stripe data for license ${id}:`, message)
    response.stripe_error = message
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
