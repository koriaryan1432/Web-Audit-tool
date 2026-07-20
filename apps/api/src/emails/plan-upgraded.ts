import { sendEmail } from '../lib/resend';
import { prisma } from '../lib/prisma';
import { emailWrapper, ctaButton, heading, paragraph, divider } from '../../worker/src/emails/templates';

type Plan = 'FREE' | 'PRO' | 'AGENCY';

const PLAN_FEATURES: Record<Plan, string[]> = {
  FREE: [],
  PRO: [
    '✅ 100 audits per day (up from 10)',
    '✅ PDF report generation & download',
    '✅ AI-powered recommendations (GPT-4o-mini)',
    '✅ Shareable public report links (30-day expiry)',
    '✅ Priority email support',
  ],
  AGENCY: [
    '✅ Unlimited audits',
    '✅ Team management & org workspaces',
    '✅ White-label PDF reports',
    '✅ API key access for programmatic audits',
    '✅ Dedicated support channel',
    '✅ All Pro features included',
  ],
};

const PLAN_PRICES: Record<Plan, string> = {
  FREE: '$0/mo',
  PRO: '$29/mo',
  AGENCY: '$99/mo',
};

/**
 * Send plan upgrade confirmation email.
 * Fire-and-forget — never throws.
 */
export async function sendPlanUpgradedEmail(userId: string, newPlan: Plan): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      console.warn(`[Email] User ${userId} not found — skipping plan upgrade email`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'https://sitegade.app';
    const dashboardUrl = `${appUrl}/dashboard`;
    const firstName = user.name?.split(' ')[0] ?? 'there';
    const features = PLAN_FEATURES[newPlan];
    const price = PLAN_PRICES[newPlan];

    const featuresList = features.length > 0
      ? `<ul style="margin:0 0 16px;padding-left:0;list-style:none;">
          ${features.map((f) => `<li style="font-size:14px;color:#1E293B;margin-bottom:8px;padding:8px 12px;background:#F0FDF4;border-radius:6px;">${f}</li>`).join('')}
        </ul>`
      : '';

    const content = `
      ${heading(`You're now on ${newPlan}! 🎉`)}
      ${paragraph(`Thanks ${firstName}! Your SiteGrade account has been upgraded to the <strong>${newPlan} plan</strong> (${price}). Your new features are active immediately.`)}

      ${divider()}

      ${heading(`What's unlocked on ${newPlan}`, 2)}
      ${featuresList}

      ${divider()}

      ${paragraph("Head to your dashboard to start using your new features. If you have any questions about your plan, just reply to this email.")}

      ${ctaButton('Go to Dashboard →', dashboardUrl)}

      ${divider()}

      <p style="margin:0;font-size:13px;color:#64748B;text-align:center;">
        Manage your subscription anytime from
        <a href="${appUrl}/dashboard/settings/billing" style="color:#6366F1;">Billing Settings</a>.
        <br>
        <a href="${appUrl}/unsubscribe?token=${userId}" style="color:#64748B;">Unsubscribe from billing emails</a>
      </p>
    `;

    await sendEmail({
      to: user.email,
      subject: `You're now on SiteGrade ${newPlan} — here's what's unlocked`,
      html: emailWrapper(content, `Your ${newPlan} plan is now active. ${features[0] ?? ''}`),
    });

    console.log(`[Email] Plan upgrade email sent to ${user.email} (${newPlan})`);
  } catch (err) {
    console.error(`[Email] Failed to send plan upgrade email for user ${userId}:`, err);
  }
}
