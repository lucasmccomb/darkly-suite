import type { Env, ProductId, Plan } from './types.ts';
import { retrievePrice } from './stripe.ts';

/**
 * Product ID registry.
 * Maps a product to its Stripe product ID (used for coupon applies_to).
 */
export function getProductStripeId(env: Env, product: ProductId): string {
  const productMap: Record<ProductId, string> = {
    gmail: env.STRIPE_PRODUCT_GMAIL,
    sheets: env.STRIPE_PRODUCT_SHEETS,
    docs: env.STRIPE_PRODUCT_DOCS,
    suite: env.STRIPE_PRODUCT_SUITE,
    browse: env.STRIPE_PRODUCT_BROWSE,
  };

  const id = productMap[product];
  if (!id) {
    throw new Error(`No Stripe product configured for ${product}`);
  }

  return id;
}

/**
 * Product price registry.
 * Maps (product, plan) to the correct Stripe price env var.
 */
export function getPriceId(env: Env, product: ProductId, plan: Plan): string {
  const priceMap: Record<string, string> = {
    'gmail:monthly': env.STRIPE_PRICE_GMAIL_MONTHLY,
    'gmail:yearly': env.STRIPE_PRICE_GMAIL_YEARLY,
    'gmail:lifetime': env.STRIPE_PRICE_GMAIL_LIFETIME,
    'sheets:monthly': env.STRIPE_PRICE_SHEETS_MONTHLY,
    'sheets:yearly': env.STRIPE_PRICE_SHEETS_YEARLY,
    'sheets:lifetime': env.STRIPE_PRICE_SHEETS_LIFETIME,
    'docs:monthly': env.STRIPE_PRICE_DOCS_MONTHLY,
    'docs:yearly': env.STRIPE_PRICE_DOCS_YEARLY,
    'docs:lifetime': env.STRIPE_PRICE_DOCS_LIFETIME,
    'suite:monthly': env.STRIPE_PRICE_SUITE_MONTHLY,
    'suite:yearly': env.STRIPE_PRICE_SUITE_YEARLY,
    'suite:lifetime': env.STRIPE_PRICE_SUITE_LIFETIME,
    'browse:monthly': env.STRIPE_PRICE_BROWSE_MONTHLY,
    'browse:yearly': env.STRIPE_PRICE_BROWSE_YEARLY,
    'browse:lifetime': env.STRIPE_PRICE_BROWSE_LIFETIME,
  };

  const key = `${product}:${plan}`;
  const priceId = priceMap[key];

  if (!priceId) {
    throw new Error(`No Stripe price configured for ${key}`);
  }

  return priceId;
}

/**
 * Reverse lookup: given a Stripe price ID, return the product and plan.
 * Used when D1 data is unavailable (e.g. license already deleted).
 */
export function getProductPlanFromPriceId(env: Env, priceId: string): { product: string; plan: string } | null {
  const entries: [string, string, string][] = [
    [env.STRIPE_PRICE_GMAIL_MONTHLY, 'gmail', 'monthly'],
    [env.STRIPE_PRICE_GMAIL_YEARLY, 'gmail', 'yearly'],
    [env.STRIPE_PRICE_GMAIL_LIFETIME, 'gmail', 'lifetime'],
    [env.STRIPE_PRICE_SHEETS_MONTHLY, 'sheets', 'monthly'],
    [env.STRIPE_PRICE_SHEETS_YEARLY, 'sheets', 'yearly'],
    [env.STRIPE_PRICE_SHEETS_LIFETIME, 'sheets', 'lifetime'],
    [env.STRIPE_PRICE_DOCS_MONTHLY, 'docs', 'monthly'],
    [env.STRIPE_PRICE_DOCS_YEARLY, 'docs', 'yearly'],
    [env.STRIPE_PRICE_DOCS_LIFETIME, 'docs', 'lifetime'],
    [env.STRIPE_PRICE_SUITE_MONTHLY, 'suite', 'monthly'],
    [env.STRIPE_PRICE_SUITE_YEARLY, 'suite', 'yearly'],
    [env.STRIPE_PRICE_SUITE_LIFETIME, 'suite', 'lifetime'],
    [env.STRIPE_PRICE_BROWSE_MONTHLY, 'browse', 'monthly'],
    [env.STRIPE_PRICE_BROWSE_YEARLY, 'browse', 'yearly'],
    [env.STRIPE_PRICE_BROWSE_LIFETIME, 'browse', 'lifetime'],
  ];

  for (const [id, product, plan] of entries) {
    if (id === priceId) return { product, plan };
  }
  return null;
}

export interface ProductPrices {
  monthly: string;
  yearly: string;
  lifetime: string;
}

function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars}`
    : `$${dollars.toFixed(2)}`;
}

/**
 * Fetches all 3 plan prices for a product from Stripe and returns
 * formatted display strings (e.g. "$0.99", "$5.99", "$9.99").
 */
export async function getProductPrices(
  env: Env,
  product: ProductId,
): Promise<ProductPrices> {
  const plans: Plan[] = ['monthly', 'yearly', 'lifetime'];
  const results = await Promise.all(
    plans.map((plan) => {
      const priceId = getPriceId(env, product, plan);
      return retrievePrice(env.STRIPE_SECRET_KEY, priceId);
    }),
  );

  return {
    monthly: formatCents(results[0].unit_amount),
    yearly: formatCents(results[1].unit_amount),
    lifetime: formatCents(results[2].unit_amount),
  };
}
