import type { Env, ProductId, Plan } from './types.ts';

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
  };

  const key = `${product}:${plan}`;
  const priceId = priceMap[key];

  if (!priceId) {
    throw new Error(`No Stripe price configured for ${key}`);
  }

  return priceId;
}
