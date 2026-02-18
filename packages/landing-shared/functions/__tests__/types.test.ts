/**
 * Tests for _shared/types.ts — Validation functions.
 *
 * These validators gate every API endpoint. A false positive means
 * processing garbage input; a false negative means rejecting paying customers.
 */

import { isValidToken, isValidProduct, isValidPlan } from '../api/_shared/types';

// ---------------------------------------------------------------------------
// isValidToken
// ---------------------------------------------------------------------------

describe('isValidToken', () => {
  it('accepts a valid UUID v4 (lowercase)', () => {
    expect(isValidToken('12345678-1234-4123-8123-123456789abc')).toBe(true);
  });

  it('accepts a valid UUID v4 (uppercase)', () => {
    expect(isValidToken('12345678-1234-4123-8123-123456789ABC')).toBe(true);
  });

  it('accepts a valid UUID v4 (mixed case)', () => {
    expect(isValidToken('a1b2c3d4-e5f6-4a7b-9c8d-0e1f2a3b4c5d')).toBe(true);
  });

  it('rejects a UUID v1 (version digit must be 4)', () => {
    expect(isValidToken('12345678-1234-1123-8123-123456789abc')).toBe(false);
  });

  it('rejects a UUID with invalid variant (must be 8/9/a/b)', () => {
    expect(isValidToken('12345678-1234-4123-0123-123456789abc')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidToken('')).toBe(false);
  });

  it('rejects a random string', () => {
    expect(isValidToken('not-a-uuid-at-all')).toBe(false);
  });

  it('rejects a UUID without dashes', () => {
    expect(isValidToken('123456781234412381231234567890ab')).toBe(false);
  });

  it('rejects a UUID with wrong length', () => {
    expect(isValidToken('12345678-1234-4123-8123-123456789ab')).toBe(false);
  });

  it('rejects null/undefined-like strings', () => {
    expect(isValidToken('null')).toBe(false);
    expect(isValidToken('undefined')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidProduct
// ---------------------------------------------------------------------------

describe('isValidProduct', () => {
  it.each(['gmail', 'sheets', 'docs', 'suite'] as const)('accepts "%s"', (product) => {
    expect(isValidProduct(product)).toBe(true);
  });

  it('rejects unknown product', () => {
    expect(isValidProduct('outlook')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidProduct('')).toBe(false);
  });

  it('rejects case-sensitive variants', () => {
    expect(isValidProduct('Gmail')).toBe(false);
    expect(isValidProduct('SUITE')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidPlan
// ---------------------------------------------------------------------------

describe('isValidPlan', () => {
  it.each(['monthly', 'yearly', 'lifetime'] as const)('accepts "%s"', (plan) => {
    expect(isValidPlan(plan)).toBe(true);
  });

  it('rejects unknown plan', () => {
    expect(isValidPlan('weekly')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidPlan('')).toBe(false);
  });

  it('rejects case-sensitive variants', () => {
    expect(isValidPlan('Monthly')).toBe(false);
    expect(isValidPlan('LIFETIME')).toBe(false);
  });
});
