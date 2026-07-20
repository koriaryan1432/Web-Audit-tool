import { sendEmail } from '../../api/src/lib/resend';
import { prisma } from '../lib/db';
import {
  emailWrapper,
  scoreBlock,
  ctaButton,
  heading,
  paragraph,
  divider,
} from './templates';

interface AuditResults {
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  bestPracticesScore: number | null;
  issues: Array<{ title: string; impact: string; category: string }>;
}

/**
 * Send audit completion email to the user.
 * Fire-and-forget — never throws.
 */
export async function sendAuditCompleteEmail(
  userId: string,
  auditId: string,
  results: AuditResults
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      console.warn(`[Email] User ${userId} not found — skipping audit complete email`);
      return;
    }

    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: { url: true },
    });

    if (!audit) return;

    const appUrl = process.env.APP_URL ?? 'https://sitegade.app';
    const auditUrl = `${appUrl}/dashboard/audits/${auditId}`;
    const firstName = user.name?.split(' ')[0] ?? 'there';

    // Top 3 issues preview
    const topIssues = results.issues.slice(0, 3);
    const issuesList = topIssues.length > 0
      ? `<ul style="margin:0 0 16px;padding-left:20px;">
          ${topIssues.map((issue) =>
            `<li style="font-size:14px;color:#1E293B;margin-bottom:6px;">
              <strong>${issue.title}</strong>
              <span style="color:#64748B;font-size:12px;"> — ${issue.category}</span>
            </li>`
          ).join('')}
        </ul>`
      : `<p style="color:#64748B;font-size:14px;">No critical issues found — great job!</p>`;

    const content = `
      ${heading(`Hey ${firstName}, your audit is ready! 🎉`)}
      ${paragraph(`We've finished auditing <strong>${audit.url}</strong>. Here's a quick summary of your scores:`)}

      <!-- Score Grid -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          ${scoreBlock('Performance', results.performanceScore)}
          ${scoreBlock('Accessibility', results.accessibilityScore)}
          ${scoreBlock('SEO', results.seoScore)}
          ${scoreBlock('Best Practices', results.bestPracticesScore)}
        </tr>
      </table>

      ${divider()}

      ${heading('Top Issues Found', 2)}
      ${issuesList}

      ${paragraph('View the full report for detailed AI-powered recommendations and step-by-step fixes.')}

      ${ctaButton('View Full Report →', auditUrl)}

      ${divider()}

      <p style="margin:0;font-size:13px;color:#64748B;text-align:center;">
        This audit was run on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
        <br>
        <a href="${appUrl}/unsubscribe?token=${userId}" style="color:#64748B;">Unsubscribe from audit notifications</a>
      </p>
    `;

    await sendEmail({
      to: user.email,
      subject: `Your SiteGrade audit is ready — ${audit.url}`,
      html: emailWrapper(content, `Your audit scores are in! Performance: ${results.performanceScore ?? 'N/A'}, Accessibility: ${results.accessibilityScore ?? 'N/A'}`),
    });

    console.log(`[Email] Audit complete email sent to ${user.email} for audit ${auditId}`);
  } catch (err) {
    // Email is non-critical — log and continue
    console.error(`[Email] Failed to send audit complete email for ${auditId}:`, err);
  }
}
