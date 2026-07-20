import { sendEmail } from '../lib/resend';
import { emailWrapper, ctaButton, heading, paragraph, divider } from '../../worker/src/emails/templates';

/**
 * Send welcome email to a new SiteGrade user.
 * Fire-and-forget — never throws.
 */
export async function sendWelcomeEmail(userId: string, email: string, name?: string | null): Promise<void> {
  try {
    const appUrl = process.env.APP_URL ?? 'https://sitegade.app';
    const firstName = name?.split(' ')[0] ?? 'there';
    const newAuditUrl = `${appUrl}/dashboard/audits/new`;

    const content = `
      ${heading(`Welcome to SiteGrade, ${firstName}! 🚀`)}
      ${paragraph("You've just joined the fastest way to audit, analyze, and improve your website's performance and accessibility.")}

      ${divider()}

      ${heading('What SiteGrade does for you', 2)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          <td style="padding:12px;background:#F8FAFC;border-radius:8px;border-left:3px solid #6366F1;margin-bottom:12px;">
            <strong style="color:#1E293B;">⚡ Performance Audits</strong>
            <p style="margin:4px 0 0;font-size:13px;color:#64748B;">Lighthouse-powered scores for performance, accessibility, SEO, and best practices.</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:12px;background:#F8FAFC;border-radius:8px;border-left:3px solid #10B981;">
            <strong style="color:#1E293B;">♿ Accessibility Scanning</strong>
            <p style="margin:4px 0 0;font-size:13px;color:#64748B;">axe-core powered WCAG compliance checks with actionable fixes.</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:12px;background:#F8FAFC;border-radius:8px;border-left:3px solid #F59E0B;">
            <strong style="color:#1E293B;">🤖 AI Recommendations</strong>
            <p style="margin:4px 0 0;font-size:13px;color:#64748B;">GPT-4o-mini analyzes your issues and gives you prioritized, actionable fixes.</p>
          </td>
        </tr>
      </table>

      ${divider()}

      ${heading('Run your first audit in 30 seconds', 2)}
      ${paragraph('Just paste your URL and hit "Run Audit". We\'ll handle the rest — Lighthouse, axe-core, and AI recommendations all in one go.')}

      ${ctaButton('Run Your First Audit →', newAuditUrl)}

      ${divider()}

      <p style="margin:0;font-size:13px;color:#64748B;text-align:center;">
        Questions? Reply to this email — we read every one.
        <br>
        <a href="${appUrl}/unsubscribe?token=${userId}" style="color:#64748B;">Unsubscribe</a>
      </p>
    `;

    await sendEmail({
      to: email,
      subject: 'Welcome to SiteGrade — run your first audit in 30 seconds',
      html: emailWrapper(content, 'Audit your website for performance, accessibility, and SEO in seconds.'),
    });

    console.log(`[Email] Welcome email sent to ${email}`);
  } catch (err) {
    console.error(`[Email] Failed to send welcome email to ${email}:`, err);
  }
}
