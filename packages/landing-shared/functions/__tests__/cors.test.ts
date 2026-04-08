/**
 * Tests for _shared/cors.ts — CORS header generation.
 *
 * Controls which origins can call the payment API. A misconfiguration
 * either blocks paying customers or opens the API to unauthorized origins.
 */

import { corsHeaders, parseExtensionIds, handleOptions } from '../api/_shared/cors';

// corsHeaders returns HeadersInit (a union type in Workers). Cast to Record for indexing.
type Headers = Record<string, string>;

// ---------------------------------------------------------------------------
// corsHeaders
// ---------------------------------------------------------------------------

describe('corsHeaders', () => {
  const siteUrl = 'https://darklysuite.com';

  it('allows the bare site origin', () => {
    const headers = corsHeaders('https://darklysuite.com', siteUrl) as Headers;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://darklysuite.com');
  });

  it('allows the www site origin', () => {
    const headers = corsHeaders('https://www.darklysuite.com', siteUrl) as Headers;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://www.darklysuite.com');
  });

  it('allows Google app origins', () => {
    const origins = ['https://mail.google.com', 'https://docs.google.com', 'https://sheets.google.com'];
    for (const origin of origins) {
      const headers = corsHeaders(origin, siteUrl) as Headers;
      expect(headers['Access-Control-Allow-Origin']).toBe(origin);
    }
  });

  it('allows a chrome extension with valid 32-char ID when environment is development', () => {
    const origin = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const headers = corsHeaders(origin, siteUrl, undefined, 'development') as Headers;
    expect(headers['Access-Control-Allow-Origin']).toBe(origin);
  });

  it('rejects any chrome extension by default in production (no allowlist set)', () => {
    const origin = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const headers = corsHeaders(origin, siteUrl) as Headers;
    expect(headers['Access-Control-Allow-Origin']).not.toBe(origin);
    expect(headers['Access-Control-Allow-Origin']).toBe('https://darklysuite.com');
  });

  it('rejects any chrome extension in production with explicit production env', () => {
    const origin = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const headers = corsHeaders(origin, siteUrl, undefined, 'production') as Headers;
    expect(headers['Access-Control-Allow-Origin']).not.toBe(origin);
  });

  it('allows a chrome extension when its ID is in the allowlist', () => {
    const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
    const origin = `chrome-extension://${extensionId}`;
    const headers = corsHeaders(origin, siteUrl, [extensionId]) as Headers;
    expect(headers['Access-Control-Allow-Origin']).toBe(origin);
  });

  it('allows allowlisted extension regardless of environment', () => {
    const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
    const origin = `chrome-extension://${extensionId}`;
    const headers = corsHeaders(origin, siteUrl, [extensionId], 'production') as Headers;
    expect(headers['Access-Control-Allow-Origin']).toBe(origin);
  });

  it('rejects a chrome extension when its ID is NOT in the allowlist', () => {
    const origin = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const headers = corsHeaders(origin, siteUrl, ['differentextensionidhereplease']) as Headers;
    expect(headers['Access-Control-Allow-Origin']).not.toBe(origin);
  });

  it('rejects a chrome extension not in allowlist even in development', () => {
    const origin = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const headers = corsHeaders(
      origin,
      siteUrl,
      ['differentextensionidhereplease'],
      'development',
    ) as Headers;
    expect(headers['Access-Control-Allow-Origin']).not.toBe(origin);
  });

  it('rejects an extension origin with invalid characters (not a-p)', () => {
    const origin = 'chrome-extension://zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
    const headers = corsHeaders(origin, siteUrl, undefined, 'development') as Headers;
    expect(headers['Access-Control-Allow-Origin']).not.toBe(origin);
  });

  it('rejects an extension origin with wrong length', () => {
    const origin = 'chrome-extension://abcdefg';
    const headers = corsHeaders(origin, siteUrl, undefined, 'development') as Headers;
    expect(headers['Access-Control-Allow-Origin']).not.toBe(origin);
  });

  it('rejects unknown origins', () => {
    const headers = corsHeaders('https://evil.com', siteUrl) as Headers;
    expect(headers['Access-Control-Allow-Origin']).not.toBe('https://evil.com');
    // Falls back to the default (bare site origin)
    expect(headers['Access-Control-Allow-Origin']).toBe('https://darklysuite.com');
  });

  it('uses default origin when origin is undefined', () => {
    const headers = corsHeaders(undefined, siteUrl) as Headers;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://darklysuite.com');
  });

  it('falls back to Google app origin when no siteUrl provided', () => {
    const headers = corsHeaders(undefined, undefined) as Headers;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://mail.google.com');
  });

  it('includes standard CORS methods and headers', () => {
    const headers = corsHeaders('https://darklysuite.com', siteUrl) as Headers;
    expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type');
  });
});

// ---------------------------------------------------------------------------
// parseExtensionIds
// ---------------------------------------------------------------------------

describe('parseExtensionIds', () => {
  it('returns undefined for undefined input', () => {
    expect(parseExtensionIds(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(parseExtensionIds('')).toBeUndefined();
  });

  it('parses a single ID', () => {
    expect(parseExtensionIds('abcdefghijklmnopabcdefghijklmnop')).toEqual([
      'abcdefghijklmnopabcdefghijklmnop',
    ]);
  });

  it('parses comma-separated IDs', () => {
    const result = parseExtensionIds('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(result).toHaveLength(2);
  });

  it('trims whitespace around IDs', () => {
    const result = parseExtensionIds(' abc , def ');
    expect(result).toEqual(['abc', 'def']);
  });

  it('filters out empty entries from trailing commas', () => {
    const result = parseExtensionIds('abc,,def,');
    expect(result).toEqual(['abc', 'def']);
  });
});

// ---------------------------------------------------------------------------
// handleOptions
// ---------------------------------------------------------------------------

describe('handleOptions', () => {
  it('returns 204 with CORS headers', () => {
    const request = new Request('https://darklysuite.com/api/status/tok', {
      headers: { Origin: 'https://mail.google.com' },
    });

    const response = handleOptions(request, 'https://darklysuite.com');

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://mail.google.com');
  });

  it('uses default origin when request has no Origin header', () => {
    const request = new Request('https://darklysuite.com/api/status/tok');

    const response = handleOptions(request, 'https://darklysuite.com');

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://darklysuite.com');
  });
});
