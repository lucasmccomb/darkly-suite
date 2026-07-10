import { type Env, isValidProduct, type ProductId } from '../_shared/types.ts'
import { getProductStripeId } from '../_shared/products.ts'
import { requireAdmin } from './_shared/auth.ts'
import {
  listPromotionCodes,
  createStripeCoupon,
  createStripePromotionCode,
  updateStripePromotionCode,
  type StripePromotionCodeFull,
} from '../_shared/stripe.ts'

type CFContext = EventContext<Env, string, unknown>

// -- Helpers ----------------------------------------------------------------

function promoToCode(p: StripePromotionCodeFull) {
  const coupon = typeof p.promotion.coupon === 'object' ? p.promotion.coupon : null
  return {
    id: p.id,
    code: p.code,
    active: p.active,
    discount_type: coupon?.percent_off != null ? 'percent' : 'fixed',
    discount_value: coupon?.percent_off ?? (coupon?.amount_off != null ? coupon.amount_off / 100 : 0),
    product: p.metadata.product ?? null,
    max_redemptions: p.max_redemptions,
    times_redeemed: p.times_redeemed,
    expires_at: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null,
    created_at: new Date(p.created * 1000).toISOString(),
  }
}

function errorResponse(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

// -- GET: List all promotion codes from Stripe ------------------------------

/**
 * GET /api/admin/discount-codes?search=&status=&product=&page=&limit=
 * Fetches all promotion codes from Stripe, applies filters, returns paginated.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const url = new URL(context.request.url)
  const search = url.searchParams.get('search')?.trim().toLowerCase() ?? ''
  const status = url.searchParams.get('status') ?? ''
  const product = url.searchParams.get('product') ?? ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '25', 10)))

  try {
    const allPromos = await listPromotionCodes(context.env.STRIPE_SECRET_KEY)
    let codes = allPromos.map(promoToCode)

    // Sort newest first
    codes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply filters
    if (search) {
      codes = codes.filter(
        (c) => c.code.toLowerCase().includes(search),
      )
    }

    if (product) {
      codes = codes.filter((c) => c.product === product || c.product === null)
    }

    if (status) {
      codes = codes.filter((c) => getCodeStatus(c) === status)
    }

    const total = codes.length
    const offset = (page - 1) * limit
    const paged = codes.slice(offset, offset + limit)

    return new Response(JSON.stringify({ codes: paged, total, page, limit }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`List discount codes error: ${message}`)
    return errorResponse(500, message)
  }
}

function getCodeStatus(c: ReturnType<typeof promoToCode>): string {
  if (!c.active) return 'inactive'
  if (c.max_redemptions != null && c.times_redeemed >= c.max_redemptions) return 'exhausted'
  if (c.expires_at && new Date(c.expires_at) < new Date()) return 'expired'
  if (c.times_redeemed > 0 && c.max_redemptions == null) return 'used'
  if (c.times_redeemed > 0) return 'used'
  return 'available'
}

// -- POST: Create a coupon + promotion code in Stripe -----------------------

interface CreateCodeBody {
  code?: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  product?: string
  expires_at?: string
  max_uses?: number
  count?: number
}

/**
 * POST /api/admin/discount-codes
 * Creates a Stripe Coupon + one or more Promotion Codes.
 * Product scope is stored in Stripe promotion code metadata.
 */
export const onRequestPost: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  let body: CreateCodeBody
  try {
    body = (await context.request.json()) as CreateCodeBody
  } catch {
    return errorResponse(400, 'Request body must be valid JSON')
  }

  if (!body.discount_type || !['percent', 'fixed'].includes(body.discount_type)) {
    return errorResponse(400, 'discount_type must be "percent" or "fixed"')
  }

  if (!body.discount_value || body.discount_value <= 0) {
    return errorResponse(400, 'discount_value must be a positive number')
  }

  if (body.discount_type === 'percent' && body.discount_value > 100) {
    return errorResponse(400, 'Percent discount cannot exceed 100')
  }

  const count = Math.min(100, Math.max(1, body.count ?? 1))
  if (count > 1 && body.code) {
    return errorResponse(400, 'Cannot specify a custom code when creating in bulk')
  }

  if (body.product && !isValidProduct(body.product)) {
    return errorResponse(400, 'Invalid product scope')
  }

  if (body.code && !/^[a-zA-Z0-9-]+$/.test(body.code.trim())) {
    return errorResponse(400, 'Code can only contain letters, numbers, and dashes')
  }

  if (body.expires_at != null) {
    if (typeof body.expires_at !== 'string' || Number.isNaN(Date.parse(body.expires_at))) {
      return errorResponse(400, 'expires_at must be a valid ISO 8601 date string')
    }
  }

  if (body.max_uses != null) {
    if (typeof body.max_uses !== 'number' || !Number.isInteger(body.max_uses) || body.max_uses <= 0) {
      return errorResponse(400, 'max_uses must be a positive integer')
    }
  }

  try {
    let appliesTo: string[] | undefined
    if (body.product) {
      appliesTo = [getProductStripeId(context.env, body.product as ProductId)]
    }

    const productLabel = body.product ? ` (${body.product})` : ''
    const coupon = await createStripeCoupon(context.env.STRIPE_SECRET_KEY, {
      discountType: body.discount_type,
      discountValue: body.discount_value,
      name: `Darkly${productLabel} ${body.discount_value}${body.discount_type === 'percent' ? '%' : '$'} off`,
      appliesTo,
    })

    const created: Array<{ id: string; code: string }> = []

    for (let i = 0; i < count; i++) {
      const code = count === 1 && body.code ? body.code.trim().toUpperCase() : generateCode()

      const promoCode = await createStripePromotionCode(context.env.STRIPE_SECRET_KEY, {
        couponId: coupon.id,
        code,
        expiresAt: body.expires_at,
        maxRedemptions: body.max_uses,
        metadata: body.product ? { product: body.product } : undefined,
      })

      created.push({ id: promoCode.id, code })
    }

    return new Response(
      JSON.stringify(count === 1 ? created[0] : { codes: created, count: created.length }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Create discount code error: ${message}`)
    return errorResponse(500, message)
  }
}

// -- PATCH: Toggle active state on Stripe -----------------------------------

/**
 * PATCH /api/admin/discount-codes?id=promo_xxx
 * Updates a promotion code in Stripe. Supports: active toggle only.
 * Product scope cannot be changed — it's enforced by the coupon's applies_to,
 * which is immutable after creation.
 */
export const onRequestPatch: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const url = new URL(context.request.url)
  const promoId = url.searchParams.get('id')
  if (!promoId) return errorResponse(400, 'Missing ?id= parameter')

  const body = (await context.request.json()) as { active?: boolean }

  if (body.active === undefined) {
    return errorResponse(400, 'No fields to update')
  }

  try {
    await updateStripePromotionCode(context.env.STRIPE_SECRET_KEY, promoId, {
      active: body.active,
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return errorResponse(500, message)
  }
}

/**
 * DELETE /api/admin/discount-codes?id=promo_xxx
 * Deactivates a promotion code in Stripe (promo codes can't be deleted).
 */
export const onRequestDelete: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const url = new URL(context.request.url)
  const promoId = url.searchParams.get('id')
  if (!promoId) return errorResponse(400, 'Missing ?id= parameter')

  try {
    await updateStripePromotionCode(context.env.STRIPE_SECRET_KEY, promoId, { active: false })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return errorResponse(500, message)
  }
}
