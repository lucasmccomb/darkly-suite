import type { Env } from '../_shared/types.ts'
import { requireAdmin } from './_shared/auth.ts'
import {
  createStripeCoupon,
  createStripePromotionCode,
  updateStripePromotionCode,
} from '../_shared/stripe.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/admin/discount-codes?search=&status=&product=&page=&limit=
 * Paginated list with filters.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const url = new URL(context.request.url)
  const search = url.searchParams.get('search')?.trim() ?? ''
  const status = url.searchParams.get('status') ?? ''
  const product = url.searchParams.get('product') ?? ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '25', 10)))
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (search) {
    conditions.push(`(code LIKE ? OR used_by_email LIKE ?)`)
    bindings.push(`%${search}%`, `%${search}%`)
  }

  if (product) {
    conditions.push(`(product = ? OR product LIKE ? OR product IS NULL)`)
    bindings.push(product, `%"${product}"%`)
  }

  if (status) {
    const now = "datetime('now')"
    switch (status) {
      case 'inactive':
        conditions.push(`active = 0`)
        break
      case 'exhausted':
        conditions.push(`active = 1 AND max_uses IS NOT NULL AND use_count >= max_uses`)
        break
      case 'used':
        conditions.push(`active = 1 AND max_uses IS NULL AND used_at IS NOT NULL`)
        break
      case 'expired':
        conditions.push(`active = 1 AND expires_at IS NOT NULL AND expires_at < ${now}`)
        break
      case 'available':
        conditions.push(
          `active = 1 AND (expires_at IS NULL OR expires_at >= ${now})` +
          ` AND (max_uses IS NULL AND used_at IS NULL OR max_uses IS NOT NULL AND use_count < max_uses)`,
        )
        break
    }
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await context.env.DB.prepare(
    `SELECT COUNT(*) as total FROM discount_codes${where}`,
  )
    .bind(...bindings)
    .first<{ total: number }>()

  const total = countResult?.total ?? 0

  const rows = await context.env.DB.prepare(
    `SELECT id, code, discount_type, discount_value, product, active, max_uses, use_count,
            used_by_email, used_at, expires_at, created_at, stripe_promo_code_id
     FROM discount_codes${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...bindings, limit, offset)
    .all()

  return new Response(JSON.stringify({ codes: rows.results, total, page, limit }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface CreateCodeBody {
  code?: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  product?: string | string[]
  expires_at?: string
  max_uses?: number
  count?: number
}

/**
 * POST /api/admin/discount-codes
 * Creates one or more discount codes with Stripe Coupon + Promotion Code.
 * Supports multi-product (string[]) and bulk creation (count param).
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

  const count = Math.min(100, Math.max(1, body.count ?? 1))
  if (count > 1 && body.code) {
    return errorResponse(400, 'Cannot specify a custom code when creating in bulk')
  }

  // Normalize product to JSON string or null
  const productScope = normalizeProduct(body.product)

  try {
    const productLabel = productScope ? ` (${productScope})` : ''
    const coupon = await createStripeCoupon(context.env.STRIPE_SECRET_KEY, {
      discountType: body.discount_type,
      discountValue: body.discount_value,
      name: `Darkly${productLabel} ${body.discount_value}${body.discount_type === 'percent' ? '%' : '$'} off`,
    })

    const created: Array<Record<string, unknown>> = []

    for (let i = 0; i < count; i++) {
      const code = count === 1 && body.code ? body.code.trim().toUpperCase() : generateCode()

      const promoCode = await createStripePromotionCode(context.env.STRIPE_SECRET_KEY, {
        couponId: coupon.id,
        code,
        expiresAt: body.expires_at,
        maxRedemptions: body.max_uses,
      })

      const result = await context.env.DB.prepare(
        `INSERT INTO discount_codes (code, discount_type, discount_value, product, active, max_uses, stripe_coupon_id, stripe_promo_code_id, expires_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      )
        .bind(
          code,
          body.discount_type,
          body.discount_value,
          productScope,
          body.max_uses ?? null,
          coupon.id,
          promoCode.id,
          body.expires_at ?? null,
        )
        .run()

      created.push({
        id: result.meta.last_row_id,
        code,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        product: productScope,
        max_uses: body.max_uses ?? null,
        stripe_coupon_id: coupon.id,
        stripe_promo_code_id: promoCode.id,
      })
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

interface PatchCodeBody {
  active?: boolean
  expires_at?: string | null
  product?: string | string[]
  max_uses?: number | null
}

/**
 * PATCH /api/admin/discount-codes?id=N
 * Edit an existing discount code.
 */
export const onRequestPatch: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  if (!id) return errorResponse(400, 'Missing ?id= parameter')

  const body = (await context.request.json()) as PatchCodeBody

  const existing = await context.env.DB.prepare(
    `SELECT id, stripe_promo_code_id FROM discount_codes WHERE id = ?`,
  )
    .bind(id)
    .first<{ id: number; stripe_promo_code_id: string | null }>()

  if (!existing) return errorResponse(404, 'Discount code not found')

  const sets: string[] = []
  const bindings: (string | number | null)[] = []

  if (body.active !== undefined) {
    sets.push('active = ?')
    bindings.push(body.active ? 1 : 0)

    // Sync active state with Stripe
    if (existing.stripe_promo_code_id) {
      await updateStripePromotionCode(context.env.STRIPE_SECRET_KEY, existing.stripe_promo_code_id, {
        active: body.active,
      })
    }
  }

  if (body.expires_at !== undefined) {
    sets.push('expires_at = ?')
    bindings.push(body.expires_at ?? null)
  }

  if (body.product !== undefined) {
    sets.push('product = ?')
    bindings.push(normalizeProduct(body.product))
  }

  if (body.max_uses !== undefined) {
    sets.push('max_uses = ?')
    bindings.push(body.max_uses ?? null)
  }

  if (sets.length === 0) return errorResponse(400, 'No fields to update')

  bindings.push(id)
  await context.env.DB.prepare(
    `UPDATE discount_codes SET ${sets.join(', ')} WHERE id = ?`,
  )
    .bind(...bindings)
    .run()

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * DELETE /api/admin/discount-codes?id=N
 * Deactivates the Stripe promo code and deletes from D1.
 */
export const onRequestDelete: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  if (!id) return errorResponse(400, 'Missing ?id= parameter')

  const existing = await context.env.DB.prepare(
    `SELECT id, stripe_promo_code_id FROM discount_codes WHERE id = ?`,
  )
    .bind(id)
    .first<{ id: number; stripe_promo_code_id: string | null }>()

  if (!existing) return errorResponse(404, 'Discount code not found')

  // Deactivate on Stripe first (promo codes can't be deleted, only deactivated)
  if (existing.stripe_promo_code_id) {
    try {
      await updateStripePromotionCode(context.env.STRIPE_SECRET_KEY, existing.stripe_promo_code_id, {
        active: false,
      })
    } catch {
      console.error(`Failed to deactivate Stripe promo ${existing.stripe_promo_code_id}`)
    }
  }

  // Delete usages, then the code
  await context.env.DB.prepare(
    `DELETE FROM discount_code_usages WHERE discount_code_id = ?`,
  )
    .bind(id)
    .run()

  await context.env.DB.prepare(
    `DELETE FROM discount_codes WHERE id = ?`,
  )
    .bind(id)
    .run()

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// -- Helpers ----------------------------------------------------------------

function normalizeProduct(product: string | string[] | undefined): string | null {
  if (!product) return null
  if (Array.isArray(product)) {
    return product.length === 0 ? null : product.length === 1 ? product[0] : JSON.stringify(product)
  }
  return product
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
