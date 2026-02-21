import type { Env } from './types.ts';

/**
 * Send a plain-text email to the admin via Resend.
 * Fire-and-forget — failures are logged but never propagate.
 */
export async function sendAdminEmail(
  env: Env,
  subject: string,
  body: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) return;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Darkly Suite <notifications@darklysuite.com>',
        to: env.ADMIN_EMAIL,
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`sendAdminEmail failed (${res.status}): ${text}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`sendAdminEmail error: ${message}`);
  }
}
