/**
 * Domain Proxy Worker — Migration Period
 *
 * Proxies API requests from old per-product domains to the unified
 * darklysuite.com backend, injecting the correct product parameter.
 *
 * Routes:
 *   gmaildarkly.com/api/* → darklysuite.com/api/* (product=gmail)
 *   sheetsdarkly.com/api/* → darklysuite.com/api/* (product=sheets)
 *   docsdarkly.com/api/*  → darklysuite.com/api/* (product=docs)
 *
 * Deploy one instance per old domain using the per-domain wrangler configs.
 */

// Product is injected at deploy time via the PRODUCT env var in each wrangler.toml
const TARGET_HOST = 'darklysuite.com';

/**
 * Add CORS headers to a response
 */
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Handle preflight OPTIONS requests
 */
function handleOptions(request) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const product = env.PRODUCT; // 'gmail', 'sheets', or 'docs'
    if (!product) {
      return new Response(
        JSON.stringify({ error: 'PRODUCT env var not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const incomingUrl = new URL(request.url);

    // Only proxy /api/* paths
    if (!incomingUrl.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Only /api/* paths are proxied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build the target URL
    const targetUrl = new URL(incomingUrl.pathname, `https://${TARGET_HOST}`);

    // Copy existing query parameters
    for (const [key, value] of incomingUrl.searchParams) {
      targetUrl.searchParams.set(key, value);
    }

    // Inject the product parameter (don't override if already set)
    if (!targetUrl.searchParams.has('product')) {
      targetUrl.searchParams.set('product', product);
    }

    // Forward the request with original method, headers, and body
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set('Host', TARGET_HOST);
    // Remove CF-specific headers that shouldn't be forwarded
    proxyHeaders.delete('cf-connecting-ip');
    proxyHeaders.delete('cf-ipcountry');
    proxyHeaders.delete('cf-ray');
    proxyHeaders.delete('cf-visitor');

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: proxyHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    try {
      const response = await fetch(proxyRequest);

      // Clone response and add CORS headers
      const origin = request.headers.get('Origin') || '*';
      const responseHeaders = new Headers(response.headers);
      const cors = corsHeaders(origin);
      for (const [key, value] of Object.entries(cors)) {
        responseHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Proxy request failed', detail: err.message }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(request.headers.get('Origin') || '*'),
          },
        },
      );
    }
  },
};
