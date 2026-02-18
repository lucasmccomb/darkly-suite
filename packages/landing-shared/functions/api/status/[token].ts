import type { Env, License } from '../_shared/types.ts';
import { isValidToken, isValidProduct } from '../_shared/types.ts';
import { corsHeaders, handleOptions, parseExtensionIds } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp } from '../_shared/rate-limit.ts';

type CFContext = EventContext<Env, string, unknown>;

export const onRequestOptions: PagesFunction<Env> = async (context: CFContext) => {
  return handleOptions(context.request, context.env.SITE_URL, parseExtensionIds(context.env.ALLOWED_EXTENSION_IDS));
};

export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  const origin = context.request.headers.get('Origin') ?? undefined;
  const extIds = parseExtensionIds(context.env.ALLOWED_EXTENSION_IDS);
  const headers: HeadersInit = { ...corsHeaders(origin, context.env.SITE_URL, extIds), 'Content-Type': 'application/json' };

  // Rate limiting — 10 requests per 60-second window per IP
  const ip = getClientIp(context.request);
  const rateLimit = await checkRateLimit(context.env.DB, ip, '/api/status', {
    windowSeconds: 60,
    maxRequests: 10,
  });

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { ...headers, 'Retry-After': String(rateLimit.retryAfter) } },
    );
  }

  const token = context.params.token as string;
  const url = new URL(context.request.url);
  const product = url.searchParams.get('product') ?? 'gmail';

  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: 'Invalid token format' }),
      { status: 400, headers },
    );
  }

  if (!isValidProduct(product)) {
    return new Response(
      JSON.stringify({ error: 'Invalid product' }),
      { status: 400, headers },
    );
  }

  try {
    // Check for both the specific product license AND a suite license
    const result = await context.env.DB.prepare(
      `SELECT * FROM licenses
       WHERE token = ? AND product IN (?, 'suite') AND status = 'active'
       ORDER BY CASE WHEN product = ? THEN 0 ELSE 1 END
       LIMIT 1`,
    )
      .bind(token, product, product)
      .first<License>();

    if (!result) {
      return new Response(
        JSON.stringify({ paid: false, plan: null, product: null, expiresAt: null }),
        { status: 200, headers },
      );
    }

    return new Response(
      JSON.stringify({
        paid: true,
        plan: result.plan,
        product: result.product,
        expiresAt: result.expires_at,
      }),
      { status: 200, headers },
    );
  } catch (err) {
    console.error('[status] Database query failed:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers },
    );
  }
};
