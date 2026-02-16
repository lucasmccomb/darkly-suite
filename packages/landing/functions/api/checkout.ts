import type { Env } from './_shared/types.ts';
import { isValidPlan, isValidToken, isValidProduct } from './_shared/types.ts';
import { corsHeaders, handleOptions } from './_shared/cors.ts';
import { createCheckoutSession } from './_shared/stripe.ts';
import { getPriceId } from './_shared/products.ts';

type CFContext = EventContext<Env, string, unknown>;

export const onRequestOptions: PagesFunction<Env> = async (context: CFContext) => {
  return handleOptions(context.request);
};

async function handleCheckout(context: CFContext): Promise<Response> {
  const origin = context.request.headers.get('Origin') ?? undefined;
  const headers = corsHeaders(origin);

  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');
  const plan = url.searchParams.get('plan');
  const product = url.searchParams.get('product') ?? 'gmail';

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
      JSON.stringify({ error: 'Invalid product (must be gmail, sheets, docs, or suite)' }),
      { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }

  const priceId = getPriceId(context.env, product, plan);
  const mode = plan === 'lifetime' ? 'payment' : 'subscription';

  try {
    const session = await createCheckoutSession(context.env.STRIPE_SECRET_KEY, {
      priceId,
      mode,
      successUrl: 'https://darklysuite.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: `https://darklysuite.com/${product === 'suite' ? '' : product}#pricing`,
      metadata: { token, plan, product },
    });

    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: session.url },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session', detail: message }),
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
