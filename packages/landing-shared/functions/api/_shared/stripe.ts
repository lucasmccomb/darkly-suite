/**
 * Stripe API helper -- raw fetch, no SDK.
 * Keeps the Workers bundle small and avoids Node.js dependencies.
 */

const STRIPE_API = 'https://api.stripe.com/v1';

function authHeaders(secretKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

function encodeParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// -- Checkout Sessions ---------------------------------------------------

export interface CreateCheckoutParams {
  priceId: string;
  mode: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  customerEmail?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  metadata: Record<string, string>;
  customer: string | null;
  subscription: string | null;
  customer_details?: { email: string | null };
}

export async function createCheckoutSession(
  secretKey: string,
  params: CreateCheckoutParams,
): Promise<CheckoutSession> {
  const body: Record<string, string> = {
    'line_items[0][price]': params.priceId,
    'line_items[0][quantity]': '1',
    mode: params.mode,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: 'true',
  };

  for (const [key, value] of Object.entries(params.metadata)) {
    body[`metadata[${key}]`] = value;
  }

  if (params.customerEmail) {
    body['customer_email'] = params.customerEmail;
  }

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: authHeaders(secretKey),
    body: encodeParams(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe createCheckoutSession failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<CheckoutSession>;
}

// -- Checkout Session Retrieval ------------------------------------------

export async function retrieveCheckoutSession(
  secretKey: string,
  sessionId: string,
): Promise<CheckoutSession> {
  const res = await fetch(`${STRIPE_API}/checkout/sessions/${sessionId}`, {
    method: 'GET',
    headers: authHeaders(secretKey),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe retrieveCheckoutSession failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<CheckoutSession>;
}

// -- Price Retrieval ------------------------------------------------------

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
}

export async function retrievePrice(
  secretKey: string,
  priceId: string,
): Promise<StripePrice> {
  const res = await fetch(`${STRIPE_API}/prices/${priceId}`, {
    method: 'GET',
    headers: authHeaders(secretKey),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe retrievePrice failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<StripePrice>;
}

// -- Billing Portal ------------------------------------------------------

export interface PortalSession {
  id: string;
  url: string;
}

export async function createPortalSession(
  secretKey: string,
  customerId: string,
  returnUrl: string,
): Promise<PortalSession> {
  const body = encodeParams({
    customer: customerId,
    return_url: returnUrl,
  });

  const res = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
    method: 'POST',
    headers: authHeaders(secretKey),
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe createPortalSession failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<PortalSession>;
}

// -- Coupons & Promotion Codes -------------------------------------------

interface StripeCoupon {
  id: string
  object: 'coupon'
}

export async function createStripeCoupon(
  secretKey: string,
  params: { discountType: 'percent' | 'fixed'; discountValue: number; name: string },
): Promise<StripeCoupon> {
  const isFree = params.discountType === 'percent' && params.discountValue === 100
  const body: Record<string, string> = {
    name: params.name,
    duration: isFree ? 'forever' : 'once',
  }

  if (params.discountType === 'percent') {
    body['percent_off'] = params.discountValue.toString()
  } else {
    body['amount_off'] = (params.discountValue * 100).toString()
    body['currency'] = 'usd'
  }

  const res = await fetch(`${STRIPE_API}/coupons`, {
    method: 'POST',
    headers: authHeaders(secretKey),
    body: encodeParams(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Stripe createCoupon failed (${res.status}): ${err}`)
  }

  return res.json() as Promise<StripeCoupon>
}

interface StripePromotionCode {
  id: string
  code: string
  object: 'promotion_code'
}

export async function createStripePromotionCode(
  secretKey: string,
  params: { couponId: string; code: string; expiresAt?: string; maxRedemptions?: number },
): Promise<StripePromotionCode> {
  const body: Record<string, string> = {
    'promotion[type]': 'coupon',
    'promotion[coupon]': params.couponId,
    code: params.code,
  }

  if (params.expiresAt) {
    body['expires_at'] = Math.floor(new Date(params.expiresAt).getTime() / 1000).toString()
  }

  if (params.maxRedemptions) {
    body['max_redemptions'] = params.maxRedemptions.toString()
  }

  const res = await fetch(`${STRIPE_API}/promotion_codes`, {
    method: 'POST',
    headers: authHeaders(secretKey),
    body: encodeParams(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Stripe createPromotionCode failed (${res.status}): ${err}`)
  }

  return res.json() as Promise<StripePromotionCode>
}

export async function updateStripePromotionCode(
  secretKey: string,
  promoCodeId: string,
  params: { active: boolean },
): Promise<{ id: string; active: boolean }> {
  const body: Record<string, string> = {
    active: params.active.toString(),
  }

  const res = await fetch(`${STRIPE_API}/promotion_codes/${promoCodeId}`, {
    method: 'POST',
    headers: authHeaders(secretKey),
    body: encodeParams(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Stripe updatePromotionCode failed (${res.status}): ${err}`)
  }

  return res.json() as Promise<{ id: string; active: boolean }>
}

// -- Webhook Signature Verification --------------------------------------

export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  const elements = signatureHeader.split(',');
  const timestamp = elements.find((e) => e.startsWith('t='))?.slice(2);
  const signatures = elements
    .filter((e) => e.startsWith('v1='))
    .map((e) => e.slice(3));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatures.some((sig) => timingSafeEqual(sig, expectedSignature));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
