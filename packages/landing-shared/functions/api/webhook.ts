import type { Env } from './_shared/types.ts';
import { verifyWebhookSignature, retrieveCheckoutSession } from './_shared/stripe.ts';

type CFContext = EventContext<Env, string, unknown>;

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export const onRequestPost: PagesFunction<Env> = async (context: CFContext) => {
  const signatureHeader = context.request.headers.get('stripe-signature');
  if (!signatureHeader) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await context.request.text();

  const valid = await verifyWebhookSignature(
    rawBody,
    signatureHeader,
    context.env.STRIPE_WEBHOOK_SECRET,
  );

  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const event: StripeEvent = JSON.parse(rawBody);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(context.env, event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(context.env, event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(context.env, event);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(context.env, event);
        break;

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook handler error for ${event.type}: ${message}`);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// -- Event Handlers -------------------------------------------------------

async function handleCheckoutCompleted(env: Env, event: StripeEvent): Promise<void> {
  const session = event.data.object as Record<string, unknown>;
  const sessionId = session.id as string;

  const fullSession = await retrieveCheckoutSession(env.STRIPE_SECRET_KEY, sessionId);

  const token = fullSession.metadata?.token;
  const plan = fullSession.metadata?.plan;
  const product = fullSession.metadata?.product ?? 'gmail';

  if (!token || !plan) {
    console.error('checkout.session.completed missing token or plan in metadata');
    return;
  }

  const email = fullSession.customer_details?.email ?? null;
  const customerId = fullSession.customer ?? null;
  const subscriptionId = fullSession.subscription ?? null;
  const expiresAt = plan === 'lifetime' ? '2099-12-31T23:59:59Z' : null;

  await env.DB.prepare(
    `INSERT INTO licenses (token, product, email, plan, status, stripe_customer_id, stripe_subscription_id, expires_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
     ON CONFLICT(token, product) DO UPDATE SET
       email = excluded.email,
       plan = excluded.plan,
       status = 'active',
       stripe_customer_id = excluded.stripe_customer_id,
       stripe_subscription_id = excluded.stripe_subscription_id,
       expires_at = excluded.expires_at`,
  )
    .bind(token, product, email, plan, customerId, subscriptionId, expiresAt)
    .run();

  await trackDiscountUsage(env, sessionId, email, token, product);
}

async function trackDiscountUsage(
  env: Env,
  sessionId: string,
  _email: string | null,
  _token: string,
  _product: string,
): Promise<void> {
  // Stripe tracks promotion code usage natively (times_redeemed).
  // We just log when a discount was used for observability.
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=total_details.breakdown`,
      {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      },
    );

    if (!res.ok) return;

    const session = (await res.json()) as Record<string, unknown>;
    const totalDetails = session.total_details as Record<string, unknown> | undefined;
    const breakdown = totalDetails?.breakdown as Record<string, unknown> | undefined;
    const discounts = breakdown?.discounts as Array<Record<string, unknown>> | undefined;

    if (!discounts || discounts.length === 0) return;

    const discount = discounts[0];
    const promoCodeId =
      typeof discount.discount === 'object' && discount.discount
        ? (discount.discount as Record<string, unknown>).promotion_code
        : null;

    if (promoCodeId) {
      console.log(`Checkout ${sessionId} used promotion code ${promoCodeId}`);
    }
  } catch {
    console.error('Failed to track discount code usage');
  }
}

async function handleSubscriptionUpdated(env: Env, event: StripeEvent): Promise<void> {
  const subscription = event.data.object as Record<string, unknown>;
  const subscriptionId = subscription.id as string;
  const status = subscription.status as string;

  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'expired',
    trialing: 'active',
    paused: 'cancelled',
  };

  const licenseStatus = statusMap[status] ?? 'active';

  await env.DB.prepare(
    `UPDATE licenses SET status = ? WHERE stripe_subscription_id = ?`,
  )
    .bind(licenseStatus, subscriptionId)
    .run();
}

async function handleSubscriptionDeleted(env: Env, event: StripeEvent): Promise<void> {
  const subscription = event.data.object as Record<string, unknown>;
  const subscriptionId = subscription.id as string;

  await env.DB.prepare(
    `UPDATE licenses SET status = 'cancelled' WHERE stripe_subscription_id = ?`,
  )
    .bind(subscriptionId)
    .run();
}

async function handlePaymentFailed(env: Env, event: StripeEvent): Promise<void> {
  const invoice = event.data.object as Record<string, unknown>;
  const subscriptionId = invoice.subscription as string | null;

  if (!subscriptionId) return;

  await env.DB.prepare(
    `UPDATE licenses SET status = 'past_due' WHERE stripe_subscription_id = ?`,
  )
    .bind(subscriptionId)
    .run();
}
