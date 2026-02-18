import type { Env } from '../_shared/types.ts'
import { requireAdmin } from './_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

/**
 * GET /api/admin/licenses?search=&status=&plan=&product=&page=1&limit=50
 * Returns paginated licenses for the admin dashboard.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const url = new URL(context.request.url)
  const search = url.searchParams.get('search') ?? ''
  const status = url.searchParams.get('status') ?? ''
  const plan = url.searchParams.get('plan') ?? ''
  const product = url.searchParams.get('product') ?? ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10)))
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const bindings: string[] = []

  if (search) {
    conditions.push('l.email LIKE ?')
    bindings.push(`%${search}%`)
  }

  if (status) {
    conditions.push('l.status = ?')
    bindings.push(status)
  }

  if (plan) {
    conditions.push('l.plan = ?')
    bindings.push(plan)
  }

  if (product) {
    conditions.push('l.product = ?')
    bindings.push(product)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await context.env.DB.prepare(
    `SELECT COUNT(*) as total FROM licenses l ${where}`,
  )
    .bind(...bindings)
    .first<{ total: number }>()

  const total = countResult?.total ?? 0

  const licenses = await context.env.DB.prepare(
    `SELECT l.id, l.email, l.product, l.plan, l.status, l.created_at, l.expires_at,
            d.code as discount_code
     FROM licenses l
     LEFT JOIN discount_codes d ON l.discount_code_id = d.id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...bindings, limit, offset)
    .all()

  return new Response(
    JSON.stringify({
      licenses: licenses.results,
      total,
      page,
      limit,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
