import type { Env } from '../_shared/types.ts'
import { requireAdmin } from './_shared/auth.ts'

type CFContext = EventContext<Env, string, unknown>

interface ProductStats {
  product: string
  total: number
  active: number
  cancelled: number
  expired: number
  past_due: number
  monthly: number
  yearly: number
  lifetime: number
}

/**
 * GET /api/admin/stats
 * Returns per-product license statistics.
 */
export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const unauthorized = await requireAdmin(context.request, context.env.DB)
  if (unauthorized) return unauthorized

  const result = await context.env.DB.prepare(
    `SELECT
       product,
       COUNT(*) as total,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
       SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END) as past_due,
       SUM(CASE WHEN plan = 'monthly' THEN 1 ELSE 0 END) as monthly,
       SUM(CASE WHEN plan = 'yearly' THEN 1 ELSE 0 END) as yearly,
       SUM(CASE WHEN plan = 'lifetime' THEN 1 ELSE 0 END) as lifetime
     FROM licenses
     GROUP BY product
     ORDER BY product`,
  ).all<ProductStats>()

  // Also get overall totals
  const totals = await context.env.DB.prepare(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
       SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END) as past_due,
       SUM(CASE WHEN plan = 'monthly' THEN 1 ELSE 0 END) as monthly,
       SUM(CASE WHEN plan = 'yearly' THEN 1 ELSE 0 END) as yearly,
       SUM(CASE WHEN plan = 'lifetime' THEN 1 ELSE 0 END) as lifetime
     FROM licenses`,
  ).first<Omit<ProductStats, 'product'>>()

  // Recent signups (last 30 days)
  const recentResult = await context.env.DB.prepare(
    `SELECT product, COUNT(*) as count
     FROM licenses
     WHERE created_at >= datetime('now', '-30 days')
     GROUP BY product`,
  ).all<{ product: string; count: number }>()

  return new Response(
    JSON.stringify({
      byProduct: result.results,
      totals: totals ?? { total: 0, active: 0, cancelled: 0, expired: 0, past_due: 0, monthly: 0, yearly: 0, lifetime: 0 },
      recentSignups: recentResult.results,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
