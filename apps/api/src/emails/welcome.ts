import { sendEmail } from '../lib/resend.js';
import { emailWrapper, ctaButton, heading, paragraph, divider } from './templates.js';

export async function sendWelcomeEmail(userId: string, email: string, name?: string | null): Promise<void> {
  try {
    const appUrl = process.env.APP_URL ?? 'https://sitegade.app';
    const firstName = name?.split(' ')[0] ?? 'there';
    const newAuditUrl = `${appUrl}/dashboard/audits/new`;
    const content = `${heading(`Welcome to SiteGrade, ${firstName}! 🚀`)}${paragraph("You've just joined the fastest way to audit, analyze, and improve your website's performance and accessibility.")}${divider()}${heading('What SiteGrade does for you', 2)}<p style="font-size:14px;color:#1E293B;">⚡ <strong>Performance Audits</strong> — Lighthouse-powered scores for performance, accessibility, SEO, and best practices.</p><p style="font-size:14px;color:#1E293B;">♿ <strong>Accessibility Scanning</strong> — axe-core powered WCAG compliance checks with actionable fixes.</p><p style="font-size:14px;color:#1E293B;">🤖 <strong>AI Recommendations</strong> — GPT-4o-mini analyzes your issues and gives you prioritized, actionable fixes.</p>${divider()}${ctaButton('Run Your First Audit →', newAuditUrl)}${divider()}<p style="margin:0;font-size:13px;color:#64748B;text-align:center;">Questions? Reply to this email — we read every one.<br><a href="${appUrl}/unsubscribe?token=${userId}" style="color:#64748B;">Unsubscribe</a></p>`;
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
