import type { Env } from '../_shared/types.ts'
import { requireAdmin } from './_shared/auth.ts'
import { createStripeCoupon, createStripePromotionCode } from '../_shared/stripe.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/admin/discount-codes?product=
 * Returns all discount codes with usage info, optionally filtered by product.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const url = new URL(context.request.url)
  const product = url.searchParams.get('product') ?? ''

  let query = `SELECT id, code, discount_type, discount_value, product, used_by_email, used_at, expires_at, created_at
     FROM discount_codes`
  const bindings: string[] = []

  if (product) {
    query += ` WHERE product = ? OR product IS NULL`
    bindings.push(product)
  }

  query += ` ORDER BY created_at DESC`

  const result = await context.env.DB.prepare(query)
    .bind(...bindings)
    .all()

  return new Response(JSON.stringify({ codes: result.results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface CreateCodeBody {
  code?: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  product?: string
  expires_at?: string
}

/**
 * POST /api/admin/discount-codes
 * Creates a Stripe Coupon + Promotion Code, then stores in D1.
 */
export const onRequestPost: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const body = (await context.request.json()) as CreateCodeBody

  if (!body.discount_type || !['percent', 'fixed'].includes(body.discount_type)) {
    return errorResponse(400, 'discount_type must be "percent" or "fixed"')
  }

  if (!body.discount_value || body.discount_value <= 0) {
    return errorResponse(400, 'discount_value must be a positive number')
  }

  if (body.discount_type === 'percent' && body.discount_value > 100) {
    return errorResponse(400, 'Percent discount cannot exceed 100')
  }

  const code = body.code || generateCode()
  const productScope = body.product ?? null

  try {
    const productLabel = productScope ? ` (${productScope})` : ''
    const coupon = await createStripeCoupon(context.env.STRIPE_SECRET_KEY, {
      discountType: body.discount_type,
      discountValue: body.discount_value,
      name: `Darkly${productLabel} ${body.discount_value}${body.discount_type === 'percent' ? '%' : '$'} off`,
    })

    const promoCode = await createStripePromotionCode(context.env.STRIPE_SECRET_KEY, {
      couponId: coupon.id,
      code,
      expiresAt: body.expires_at,
    })

    const result = await context.env.DB.prepare(
      `INSERT INTO discount_codes (code, discount_type, discount_value, product, stripe_coupon_id, stripe_promo_code_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(code, body.discount_type, body.discount_value, productScope, coupon.id, promoCode.id, body.expires_at ?? null)
      .run()

    return new Response(
      JSON.stringify({
        id: result.meta.last_row_id,
        code,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        product: productScope,
        stripe_coupon_id: coupon.id,
        stripe_promo_code_id: promoCode.id,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Create discount code error: ${message}`)
    return errorResponse(500, message)
  }
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

function errorResponse(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
