/**
 * Stripe Promotion Code API fixtures — sourced from Stripe API docs, NOT from our code.
 *
 * IMPORTANT: These fixtures define the contract between our code and Stripe.
 * When updating, verify against the official Stripe API documentation:
 *
 * - Object shape:  https://docs.stripe.com/api/promotion_codes/object
 * - Create params: https://docs.stripe.com/api/promotion_codes/create
 * - List params:   https://docs.stripe.com/api/promotion_codes/list
 *
 * DO NOT update these fixtures to match our code. If a test fails because the
 * fixture doesn't match what our code expects, the code is wrong — not the fixture.
 */

// ---------------------------------------------------------------------------
// Response fixtures: what Stripe returns
// ---------------------------------------------------------------------------

/**
 * A single promotion code object as returned by the Stripe API.
 * Shape from: https://docs.stripe.com/api/promotion_codes/object
 *
 * Key structural note: The coupon lives under `promotion.coupon`, NOT at the
 * top level. When `expand[]=data.promotion.coupon` is used on list, the
 * coupon string is replaced with the full coupon object.
 */
export function makeStripePromotionCode(overrides: Record<string, unknown> = {}) {
  return {
    id: 'promo_test1',
    object: 'promotion_code' as const,
    active: true,
    code: 'TESTCODE',
    created: Math.floor(Date.now() / 1000),
    customer: null,
    expires_at: null,
    livemode: false,
    max_redemptions: null,
    metadata: {},
    promotion: {
      type: 'coupon' as const,
      coupon: {
        id: 'coupon_test1',
        object: 'coupon' as const,
        amount_off: null,
        created: Math.floor(Date.now() / 1000),
        currency: null,
        duration: 'once' as const,
        livemode: false,
        name: 'Darkly 50% off',
        percent_off: 50,
        valid: true,
      },
    },
    restrictions: {
      currency_options: null,
      first_time_transaction: false,
      minimum_amount: null,
      minimum_amount_currency: null,
    },
    times_redeemed: 0,
    ...overrides,
  }
}

/**
 * A promotion code with an unexpanded coupon (just the ID string).
 * This is what Stripe returns when you DON'T use expand[].
 */
export function makeStripePromotionCodeUnexpanded(overrides: Record<string, unknown> = {}) {
  return {
    ...makeStripePromotionCode(overrides),
    promotion: {
      type: 'coupon' as const,
      coupon: 'coupon_test1',
    },
    ...overrides,
  }
}

/**
 * Stripe list response wrapper.
 * Shape from: https://docs.stripe.com/api/promotion_codes/list
 */
export function makeStripeListResponse(data: unknown[], hasMore = false) {
  return {
    object: 'list' as const,
    data,
    has_more: hasMore,
    url: '/v1/promotion_codes',
  }
}

// ---------------------------------------------------------------------------
// Request contract: what we MUST send to Stripe
// ---------------------------------------------------------------------------

/**
 * POST /v1/promotion_codes — required parameters
 * From: https://docs.stripe.com/api/promotion_codes/create
 *
 * curl example from docs:
 *   curl https://api.stripe.com/v1/promotion_codes \
 *     -d "promotion[type]"=coupon \
 *     -d "promotion[coupon]"=nVJYDOag
 *
 * The coupon reference MUST be nested under `promotion`:
 *   promotion[type]=coupon
 *   promotion[coupon]=<coupon_id>
 *
 * NOT a flat `coupon=<coupon_id>` parameter (that is rejected as unknown).
 */
export const CREATE_PROMO_PARAMS = {
  /** URL-encoded form of promotion[type]=coupon */
  promotionType: 'promotion%5Btype%5D=coupon',
  /** URL-encoded form of promotion[coupon]=<coupon_id> (prefix, needs ID appended) */
  promotionCouponPrefix: 'promotion%5Bcoupon%5D=',
} as const

/**
 * GET /v1/promotion_codes — expand parameter for coupon details
 * From: https://docs.stripe.com/api/promotion_codes/list
 *
 * To get the full coupon object instead of just the ID string,
 * expand[]=data.promotion.coupon (NOT data.coupon).
 */
export const LIST_PROMO_PARAMS = {
  /** URL-encoded form of expand[]=data.promotion.coupon */
  expandCoupon: 'expand%5B%5D=data.promotion.coupon',
} as const
