import type { Env, License } from './_shared/types.ts';
import { isValidToken, isValidProduct } from './_shared/types.ts';
import { corsHeaders, handleOptions, parseExtensionIds } from './_shared/cors.ts';
import { checkRateLimit, getClientIp } from './_shared/rate-limit.ts';
import { createPortalSession } from './_shared/stripe.ts';

type CFContext = EventContext<Env, string, unknown>;

export const onRequestOptions: PagesFunction<Env> = async (context: CFContext) => {
  return handleOptions(
    context.request,
    context.env.SITE_URL,
    parseExtensionIds(context.env.ALLOWED_EXTENSION_IDS),
    context.env.ENVIRONMENT,
  );
};

async function handlePortal(context: CFContext): Promise<Response> {
  const origin = context.request.headers.get('Origin') ?? undefined;
  const extIds = parseExtensionIds(context.env.ALLOWED_EXTENSION_IDS);
  const env = context.env.ENVIRONMENT;
  const headers: HeadersInit = { ...corsHeaders(origin, context.env.SITE_URL, extIds, env), 'Content-Type': 'application/json' };

  // Rate limiting — 10 requests per 60-second window per IP.
  // Stricter than /api/status because portal sessions hit the Stripe API.
  const ip = getClientIp(context.request);
  const rateLimit = await checkRateLimit(context.env.DB, ip, '/api/portal', {
    windowSeconds: 60,
    maxRequests: 10,
  });

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { ...headers, 'Retry-After': String(rateLimit.retryAfter) } },
    );
  }

  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');
  const product = url.searchParams.get('product') ?? 'gmail';

  if (!token || !isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing token' }),
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
    // Check for license on the specific product OR suite
    const license = await context.env.DB.prepare(
      `SELECT * FROM licenses
       WHERE token = ? AND product IN (?, 'suite') AND status = 'active'
       ORDER BY CASE WHEN product = ? THEN 0 ELSE 1 END
       LIMIT 1`,
    )
      .bind(token, product, product)
      .first<License>();

    if (!license || !license.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No active license found for this token' }),
        { status: 404, headers },
      );
    }

    const portalSession = await createPortalSession(
      context.env.STRIPE_SECRET_KEY,
      license.stripe_customer_id,
      `${context.env.SITE_URL}/`,
    );

    return new Response(null, {
      status: 303,
      headers: { ...corsHeaders(origin, context.env.SITE_URL, extIds, env), Location: portalSession.url },
    });
  } catch (err) {
    console.error('[portal] Failed to create portal session:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create portal session' }),
      { status: 500, headers },
    );
  }
}

export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  return handlePortal(context);
};

export const onRequestPost: PagesFunction<Env> = async (context: CFContext) => {
  return handlePortal(context);
};
