import type { Env } from './_shared/types.ts';
import { isValidPlan, isValidToken, isValidProduct } from './_shared/types.ts';
import { corsHeaders, handleOptions, parseExtensionIds } from './_shared/cors.ts';
import { checkRateLimit, getClientIp } from './_shared/rate-limit.ts';
import { createCheckoutSession } from './_shared/stripe.ts';
import { getPriceId } from './_shared/products.ts';
import { parseCookie } from './admin/_shared/auth.ts';

/**
 * Read the checkout prefill email from the short-lived HttpOnly cookie set by
 * /api/auth/callback. Email is deliberately NOT accepted via the query string:
 * PII in URLs lands in browser history, Referer headers, and access logs (#670).
 */
function readCheckoutEmail(request: Request): string | null {
  const raw = parseCookie(request.headers.get('Cookie'), 'darkly_checkout_email');
  if (!raw) return null;

  try {
    const email = decodeURIComponent(raw);
    // Light sanity check — the cookie is only ever written by our own OAuth
    // callback; anything that does not look like an email is ignored rather
    // than forwarded to Stripe.
    return email.includes('@') && !/[\s;,]/.test(email) ? email : null;
  } catch {
    return null;
  }
}

type CFContext = EventContext<Env, string, unknown>;

export const onRequestOptions: PagesFunction<Env> = async (context: CFContext) => {
  return handleOptions(
    context.request,
    context.env.SITE_URL,
    parseExtensionIds(context.env.ALLOWED_EXTENSION_IDS),
    context.env.ENVIRONMENT,
  );
};

async function handleCheckout(context: CFContext): Promise<Response> {
  const origin = context.request.headers.get('Origin') ?? undefined;
  const extIds = parseExtensionIds(context.env.ALLOWED_EXTENSION_IDS);
  const headers = corsHeaders(origin, context.env.SITE_URL, extIds, context.env.ENVIRONMENT);

  // Rate limiting — 10 requests per 60-second window per IP.
  // Stricter than /api/status because checkout sessions hit the Stripe API.
  const ip = getClientIp(context.request);
  const rateLimit = await checkRateLimit(context.env.DB, ip, '/api/checkout', {
    windowSeconds: 60,
    maxRequests: 10,
  });

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter),
        },
      },
    );
  }

  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');
  const plan = url.searchParams.get('plan');
  const product = url.searchParams.get('product') ?? 'gmail';
  const email = readCheckoutEmail(context.request);

  if (!token || !isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing token (must be a valid UUID v4)' }),
      { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }

  if (!plan || !isValidPlan(plan)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing plan (must be monthly, yearly, or lifetime)' }),
      { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }

  if (!isValidProduct(product)) {
    return new Response(
      JSON.stringify({ error: 'Invalid product (must be gmail, sheets, docs, suite, or browse)' }),
      { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }

  const priceId = getPriceId(context.env, product, plan);
  const mode = plan === 'lifetime' ? 'payment' : 'subscription';

  // Use product-specific site URL for success redirect if available.
  // e.g. Gmail purchases redirect to gmaildarkly.com instead of darklysuite.com.
  const productSiteUrls: Partial<Record<string, string>> = {
    gmail: context.env.SITE_URL_GMAIL,
    sheets: context.env.SITE_URL_SHEETS,
    docs: context.env.SITE_URL_DOCS,
    browse: context.env.SITE_URL_BROWSE,
  };
  const siteUrl = productSiteUrls[product] ?? context.env.SITE_URL;

  try {
    const session = await createCheckoutSession(context.env.STRIPE_SECRET_KEY, {
      priceId,
      mode,
      successUrl: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}&product=${product}`,
      cancelUrl: siteUrl !== context.env.SITE_URL
        ? `${siteUrl}/#pricing`
        : `${siteUrl}/${product === 'suite' ? '' : product}#pricing`,
      metadata: { token, plan, product },
      customerEmail: email ?? undefined,
    });

    const responseHeaders = new Headers(headers);
    responseHeaders.set('Location', session.url);
    // The prefill email cookie is one-time use — clear it on the redirect
    // to Stripe so it cannot linger in the browser.
    responseHeaders.append(
      'Set-Cookie',
      'darkly_checkout_email=; HttpOnly; Secure; SameSite=Lax; Path=/api/checkout; Max-Age=0',
    );

    return new Response(null, {
      status: 303,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[checkout] Failed to create checkout session:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }
}

export const onRequestGet: PagesFunction<Env> = async (context: CFContext) => {
  return handleCheckout(context);
};

export const onRequestPost: PagesFunction<Env> = async (context: CFContext) => {
  return handleCheckout(context);
};
