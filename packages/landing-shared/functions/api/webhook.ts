import type { Env } from './_shared/types.ts';
import { isValidProduct } from './_shared/types.ts';
import { verifyWebhookSignature, retrieveCheckoutSession, retrieveCustomer } from './_shared/stripe.ts';
import { getProductPlanFromPriceId } from './_shared/products.ts';
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

const FEEDBACK_LABELS: Record<string, string> = {
  customer_service: 'Customer service',
  low_quality: 'Low quality',
  missing_features: 'Missing features',
  other: 'Other',
  switched_service: 'Found an alternative',
  too_complex: 'Too complex',
  too_expensive: 'Too expensive',
  unused: 'No longer needed',
};

function formatCancellationDetails(subscription: Record<string, unknown>): string {
  const details = subscription.cancellation_details as
    | { feedback?: string | null; comment?: string | null; reason?: string | null }
    | undefined;

  if (!details) return '';

  const parts: string[] = [];
  if (details.feedback) {
    parts.push(`Reason: ${FEEDBACK_LABELS[details.feedback] ?? details.feedback}`);
  }
  if (details.comment) {
    parts.push(`Comment: ${details.comment}`);
  }

  return parts.length > 0 ? '\n' + parts.join('\n') : '';
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

  // Ownership guard: skip checkout sessions that don't belong to Darkly Suite.
  // The extension sets `product` in session metadata to a valid Darkly product ID.
  // A foreign checkout (evoglyph, etc.) will have no metadata or a non-Darkly product.
  if (!isValidProduct(product)) {
    console.log(`Webhook: ignoring checkout session ${sessionId} — product '${product}' is not a Darkly product`);
    return;
  }

  const email = fullSession.customer_details?.email ?? null;
  const customerId = fullSession.customer ?? null;
  const subscriptionId = fullSession.subscription ?? null;
  const expiresAt = plan === 'lifetime' ? '2099-12-31T23:59:59Z' : null;

  await env.DB.prepare(
    `INSERT INTO licenses (token, product, email, plan, status, stripe_customer_id, stripe_subscription_id, stripe_status, expires_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, 'active', ?)
     ON CONFLICT(token, product) DO UPDATE SET
       email = excluded.email,
       plan = excluded.plan,
       status = 'active',
       stripe_customer_id = excluded.stripe_customer_id,
       stripe_subscription_id = excluded.stripe_subscription_id,
       stripe_status = 'active',
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
  const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean | undefined;
  const currentPeriodEnd = subscription.current_period_end as number | undefined;
  const previousAttributes = (event.data as Record<string, unknown>).previous_attributes as
    | Record<string, unknown>
    | undefined;
  const previousStatus = previousAttributes?.status as string | undefined;

  // Access gate: active, trialing, and past_due all keep access (grace period).
  // past_due means Stripe is retrying payment — user keeps access but sees a warning.
  const activeStatuses = new Set(['active', 'trialing', 'past_due']);
  const licenseStatus = activeStatuses.has(status) ? 'active' : 'inactive';

  // Determine stripe_status for UI warnings:
  // - cancel_at_period_end → user canceled, subscription ending at period end
  // - past_due → payment failed, Stripe is retrying
  // - active (default) → subscription healthy
  let stripeStatus = 'active';
  if (cancelAtPeriodEnd && status === 'active') {
    stripeStatus = 'cancel_at_period_end';
  } else if (status === 'past_due') {
    stripeStatus = 'past_due';
  }

  // Store the subscription end date when canceling, clear it when renewed
  const cancelAt = cancelAtPeriodEnd && currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : null;

  await env.DB.prepare(
    `UPDATE licenses SET status = ?, stripe_status = ?, cancel_at = ? WHERE stripe_subscription_id = ?`,
  )
    .bind(licenseStatus, stripeStatus, cancelAt, subscriptionId)
    .run();

  // Notify admin on status changes to non-active states
  if (previousStatus && previousStatus !== status && status !== 'active') {
    const license = await env.DB.prepare(
      `SELECT email, product, plan FROM licenses WHERE stripe_subscription_id = ? LIMIT 1`,
    )
      .bind(subscriptionId)
      .first<{ email: string | null; product: string; plan: string }>();

    // Ownership guard: skip notification for foreign subscriptions.
    // Shape-robust price extraction: 2026-01-28.clover uses item.pricing.price_details.price;
    // legacy shape uses item.price.id.
    if (!license) {
      const updItems = subscription.items as {
        data?: Array<{
          pricing?: { price_details?: { price?: string } };
          price?: { id?: string };
        }>;
      } | undefined;
      const updFirstItem = updItems?.data?.[0];
      const updPriceId = updFirstItem?.pricing?.price_details?.price ?? updFirstItem?.price?.id;
      const priceMatchesDarkly = updPriceId ? getProductPlanFromPriceId(env, updPriceId) !== null : false;

      if (!priceMatchesDarkly) {
        console.log(`Webhook: ignoring ${subscriptionId} — not a Darkly product`);
        return;
      }
    }

    const email = license?.email ?? 'unknown';
    const product = license?.product ?? 'unknown';
    const plan = license?.plan ?? 'unknown';

    const cancellationInfo = formatCancellationDetails(subscription);

    await sendAdminEmail(
      env,
      `Subscription ${status}: ${capitalize(product)} ${capitalize(plan)} — ${email}`,
      `Product: ${capitalize(product)}\nPlan: ${capitalize(plan)}\nEmail: ${email}\nStripe status: ${previousStatus} → ${status}\nSubscription: ${subscriptionId}${cancellationInfo}`,
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

  // Ownership guard: ignore events for subscriptions that don't belong to Darkly Suite.
  // An event is ours iff EITHER a license row exists (common case) OR the price maps to
  // a Darkly product (covers the admin-deleted-from-D1 fallback path).
  // Shape-robust price extraction: API version 2026-01-28.clover moved price to
  // item.pricing.price_details.price; legacy shape has item.price.id.
  const items = subscription.items as {
    data?: Array<{
      pricing?: { price_details?: { price?: string } };
      price?: { id?: string };
    }>;
  } | undefined;
  const firstItem = items?.data?.[0];
  const priceId = firstItem?.pricing?.price_details?.price ?? firstItem?.price?.id;
  const priceMatchesDarkly = priceId ? getProductPlanFromPriceId(env, priceId) !== null : false;

  if (!license && !priceMatchesDarkly) {
    console.log(`Webhook: ignoring ${subscriptionId} — not a Darkly product`);
    return;
  }

  await env.DB.prepare(
    `UPDATE licenses SET status = 'inactive', stripe_status = 'active' WHERE stripe_subscription_id = ?`,
  )
    .bind(subscriptionId)
    .run();

  // If license was already deleted from D1 (e.g. admin "Delete Membership"),
  // fall back to extracting info from the Stripe event data
  let email = license?.email ?? null;
  let product = license?.product ?? null;
  let plan = license?.plan ?? null;

  if (!license) {
    // Get customer email from Stripe
    const customerId = subscription.customer as string | null;
    if (customerId) {
      try {
        const customer = await retrieveCustomer(env.STRIPE_SECRET_KEY, customerId);
        email = customer.email;
      } catch {
        // Stripe lookup failed — continue with null
      }
    }

    // Get product/plan by reverse-mapping the subscription's price ID
    if (priceId) {
      const match = getProductPlanFromPriceId(env, priceId);
      if (match) {
        product = match.product;
        plan = match.plan;
      }
    }
  }

  // Tier 1: Subscription cancelled notification
  const displayEmail = email ?? 'unknown';
  const displayProduct = product ?? 'unknown';
  const displayPlan = plan ?? 'unknown';

  const cancellationInfo = formatCancellationDetails(subscription);

  await sendAdminEmail(
    env,
    `Subscription cancelled: ${capitalize(displayProduct)} ${capitalize(displayPlan)} — ${displayEmail}`,
    `Product: ${capitalize(displayProduct)}\nPlan: ${capitalize(displayPlan)}\nEmail: ${displayEmail}\nSubscription: ${subscriptionId}${cancellationInfo}`,
  );
}

async function handlePaymentFailed(env: Env, event: StripeEvent): Promise<void> {
  const invoice = event.data.object as Record<string, unknown>;
  const subscriptionId = invoice.subscription as string | null;

  if (!subscriptionId) return;

  // Keep license active during Stripe's payment retry window — user sees a
  // warning banner instead of losing access immediately. Final revocation
  // happens via customer.subscription.deleted when all retries are exhausted.
  await env.DB.prepare(
    `UPDATE licenses SET stripe_status = 'past_due' WHERE stripe_subscription_id = ?`,
  )
    .bind(subscriptionId)
    .run();

  const license = await env.DB.prepare(
    `SELECT email, product, plan FROM licenses WHERE stripe_subscription_id = ? LIMIT 1`,
  )
    .bind(subscriptionId)
    .first<{ email: string | null; product: string; plan: string }>();

  // Ownership guard: skip notification if this subscription is not ours.
  // invoice.payment_failed doesn't carry line-item price data in the same way,
  // so we rely solely on the D1 license row for ownership. A foreign sub will
  // have no row → no email, no user notification.
  if (!license) {
    console.log(`Webhook: ignoring payment_failed for ${subscriptionId} — not a Darkly product`);
    return;
  }

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
