import type { Env } from './_shared/types.ts';
import { verifyWebhookSignature, retrieveCheckoutSession } from './_shared/stripe.ts';
import { sendAdminEmail, sendUserEmail } from './_shared/email.ts';

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

// -- Helpers ----------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatAmount(cents: unknown): string {
  if (typeof cents !== 'number') return 'N/A';
  return `$${(cents / 100).toFixed(2)}`;
}

// -- Event Handlers ---------------------------------------------------------

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

  const promoInfo = await trackDiscountUsage(env, sessionId, email, token, product);

  // Tier 1: New purchase notification
  const amount = fullSession.amount_total;
  let body = `Product: ${capitalize(product)}\nPlan: ${capitalize(plan)}\nEmail: ${email ?? 'unknown'}\nAmount: ${formatAmount(amount)}`;
  if (promoInfo) {
    body += `\nPromo code: ${promoInfo}`;
  }

  await sendAdminEmail(
    env,
    `New purchase: ${capitalize(product)} ${capitalize(plan)} — ${email ?? 'unknown'}`,
    body,
  );
}

async function trackDiscountUsage(
  env: Env,
  sessionId: string,
  _email: string | null,
  _token: string,
  _product: string,
): Promise<string | null> {
  // Stripe tracks promotion code usage natively (times_redeemed).
  // We just log when a discount was used for observability.
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=total_details.breakdown`,
      {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      },
    );

    if (!res.ok) return null;

    const session = (await res.json()) as Record<string, unknown>;
    const totalDetails = session.total_details as Record<string, unknown> | undefined;
    const breakdown = totalDetails?.breakdown as Record<string, unknown> | undefined;
    const discounts = breakdown?.discounts as Array<Record<string, unknown>> | undefined;

    if (!discounts || discounts.length === 0) return null;

    const discount = discounts[0];
    const discountObj =
      typeof discount.discount === 'object' && discount.discount
        ? (discount.discount as Record<string, unknown>)
        : null;
    const promoCodeId = discountObj?.promotion_code as string | null;
    const couponName = (discountObj?.coupon as Record<string, unknown> | undefined)?.name as string | undefined;

    if (promoCodeId) {
      console.log(`Checkout ${sessionId} used promotion code ${promoCodeId}`);
    }

    return couponName ?? promoCodeId ?? null;
  } catch {
    console.error('Failed to track discount code usage');
    return null;
  }
}

async function handleSubscriptionUpdated(env: Env, event: StripeEvent): Promise<void> {
  const subscription = event.data.object as Record<string, unknown>;
  const subscriptionId = subscription.id as string;
  const status = subscription.status as string;
  const previousAttributes = (event.data as Record<string, unknown>).previous_attributes as
    | Record<string, unknown>
    | undefined;
  const previousStatus = previousAttributes?.status as string | undefined;

  // Binary access gate: only 'active' and 'trialing' grant access
  const activeStatuses = new Set(['active', 'trialing']);
  const licenseStatus = activeStatuses.has(status) ? 'active' : 'inactive';

  await env.DB.prepare(
    `UPDATE licenses SET status = ? WHERE stripe_subscription_id = ?`,
  )
    .bind(licenseStatus, subscriptionId)
    .run();

  // Notify admin on status changes to non-active states
  if (previousStatus && previousStatus !== status && status !== 'active') {
    const license = await env.DB.prepare(
      `SELECT email, product, plan FROM licenses WHERE stripe_subscription_id = ? LIMIT 1`,
    )
      .bind(subscriptionId)
      .first<{ email: string | null; product: string; plan: string }>();

    const email = license?.email ?? 'unknown';
    const product = license?.product ?? 'unknown';
    const plan = license?.plan ?? 'unknown';

    await sendAdminEmail(
      env,
      `Subscription ${status}: ${capitalize(product)} ${capitalize(plan)} — ${email}`,
      `Product: ${capitalize(product)}\nPlan: ${capitalize(plan)}\nEmail: ${email}\nStripe status: ${previousStatus} → ${status}\nSubscription: ${subscriptionId}`,
    );
  }
}

async function handleSubscriptionDeleted(env: Env, event: StripeEvent): Promise<void> {
  const subscription = event.data.object as Record<string, unknown>;
  const subscriptionId = subscription.id as string;

  // Look up license before updating so we have context for the notification
  const license = await env.DB.prepare(
    `SELECT email, product, plan FROM licenses WHERE stripe_subscription_id = ? LIMIT 1`,
  )
    .bind(subscriptionId)
    .first<{ email: string | null; product: string; plan: string }>();

  await env.DB.prepare(
    `UPDATE licenses SET status = 'inactive' WHERE stripe_subscription_id = ?`,
  )
    .bind(subscriptionId)
    .run();

  // Tier 1: Subscription cancelled notification
  const email = license?.email ?? 'unknown';
  const product = license?.product ?? 'unknown';
  const plan = license?.plan ?? 'unknown';

  await sendAdminEmail(
    env,
    `Subscription cancelled: ${capitalize(product)} ${capitalize(plan)} — ${email}`,
    `Product: ${capitalize(product)}\nPlan: ${capitalize(plan)}\nEmail: ${email}\nSubscription: ${subscriptionId}`,
  );
}

async function handlePaymentFailed(env: Env, event: StripeEvent): Promise<void> {
  const invoice = event.data.object as Record<string, unknown>;
  const subscriptionId = invoice.subscription as string | null;

  if (!subscriptionId) return;

  await env.DB.prepare(
    `UPDATE licenses SET status = 'inactive' WHERE stripe_subscription_id = ?`,
  )
    .bind(subscriptionId)
    .run();

  const license = await env.DB.prepare(
    `SELECT email, product, plan FROM licenses WHERE stripe_subscription_id = ? LIMIT 1`,
  )
    .bind(subscriptionId)
    .first<{ email: string | null; product: string; plan: string }>();

  const email = license?.email ?? 'unknown';
  const product = license?.product ?? 'unknown';
  const plan = license?.plan ?? 'unknown';

  // Notify admin
  await sendAdminEmail(
    env,
    `Payment failed: ${capitalize(product)} ${capitalize(plan)} — ${email}`,
    `Product: ${capitalize(product)}\nPlan: ${capitalize(plan)}\nEmail: ${email}\nSubscription: ${subscriptionId}`,
  );

  // Notify user to update payment info
  if (license?.email) {
    await sendUserEmail(
      env,
      license.email,
      `Action required: Update your payment method for Darkly`,
      `Hi,\n\nYour recent payment for Darkly for ${capitalize(product)} (${capitalize(plan)} plan) was unsuccessful.\n\nPlease update your payment information to restore access:\nhttps://darklysuite.com/account/subscriptions\n\nIf you believe this is an error, please contact us at admin@darklysuite.com.\n\nThanks,\nDarkly Suite`,
    );
  }
}
