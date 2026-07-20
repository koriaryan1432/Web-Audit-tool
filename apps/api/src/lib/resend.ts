import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('[Resend] RESEND_API_KEY not set — email sending will be disabled');
}

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@sitegade.app';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email via Resend.
 * Never throws — logs error and returns false on failure.
 * Email is non-critical: callers should fire-and-forget.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!resendClient) {
    console.warn('[Resend] Email not sent — RESEND_API_KEY not configured');
    return false;
  }

  try {
    const { error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
    });

    if (error) {
      console.error('[Resend] Send error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Resend] Unexpected error:', err);
    return false;
  }
}

export { FROM_EMAIL };
