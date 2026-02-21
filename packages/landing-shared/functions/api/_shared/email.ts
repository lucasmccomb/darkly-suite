import type { Env } from './types.ts';

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  body: string;
}

/**
 * Send a plain-text email via Resend.
 * Fire-and-forget — failures are logged but never propagate.
 */
export async function sendEmail(
  env: Env,
  options: EmailOptions,
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
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.body,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`sendEmail failed (${res.status}): ${text}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`sendEmail error: ${message}`);
  }
}

/** Send a notification email to the admin. */
export async function sendAdminEmail(
  env: Env,
  subject: string,
  body: string,
): Promise<void> {
  return sendEmail(env, {
    from: 'Darkly Suite <notifications@darklysuite.com>',
    to: env.ADMIN_EMAIL,
    subject,
    body,
  });
}

/** Send an email to a user (e.g., payment failure notification). */
export async function sendUserEmail(
  env: Env,
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  return sendEmail(env, {
    from: 'Darkly Suite <admin@darklysuite.com>',
    to,
    subject,
    body,
  });
}
