/**
 * Tests for _shared/products.ts — Price ID mapping.
 *
 * Maps (product, plan) to Stripe price IDs. A wrong mapping charges the
 * wrong amount; a missing mapping prevents checkout entirely.
 */

import { createMockEnv } from './test-helpers';
import { getPriceId, getProductStripeId } from '../api/_shared/products';
import type { ProductId, Plan } from '../api/_shared/types';

describe('getPriceId', () => {
  const env = createMockEnv();

  it.each([
    ['gmail', 'monthly', 'price_gmail_monthly'],
    ['gmail', 'yearly', 'price_gmail_yearly'],
    ['gmail', 'lifetime', 'price_gmail_lifetime'],
    ['sheets', 'monthly', 'price_sheets_monthly'],
    ['sheets', 'yearly', 'price_sheets_yearly'],
    ['sheets', 'lifetime', 'price_sheets_lifetime'],
    ['docs', 'monthly', 'price_docs_monthly'],
    ['docs', 'yearly', 'price_docs_yearly'],
    ['docs', 'lifetime', 'price_docs_lifetime'],
    ['suite', 'monthly', 'price_suite_monthly'],
    ['suite', 'yearly', 'price_suite_yearly'],
    ['suite', 'lifetime', 'price_suite_lifetime'],
  ] as const)('returns correct price for %s/%s', (product, plan, expected) => {
    expect(getPriceId(env, product, plan)).toBe(expected);
  });

  it('throws for a product+plan with no env var configured', () => {
    // Force an unknown combo through type casting to hit the throw path
    expect(() => {
      getPriceId(env, 'gmail' as ProductId, 'weekly' as Plan);
    }).toThrow('No Stripe price configured for gmail:weekly');
  });
});

describe('getProductStripeId', () => {
  const env = createMockEnv();

  it.each([
    ['gmail', 'prod_test_gmail'],
    ['sheets', 'prod_test_sheets'],
    ['docs', 'prod_test_docs'],
    ['suite', 'prod_test_suite'],
  ] as const)('returns correct product ID for %s', (product, expected) => {
    expect(getProductStripeId(env, product)).toBe(expected);
  });

  it('throws for an invalid product', () => {
    expect(() => {
      getProductStripeId(env, 'invalid' as ProductId);
    }).toThrow('No Stripe product configured for invalid');
  });
});
