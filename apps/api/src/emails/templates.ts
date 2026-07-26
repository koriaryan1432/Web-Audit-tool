// Shared email HTML builder — all styles inline for email client compatibility
// Copied from apps/worker/src/emails/templates.ts to avoid cross-app imports

const BRAND = {
  primary: '#6366F1',
  bg: '#0F172A',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
};

export function emailWrapper(content: string, previewText = ''): string {
  const appUrl = process.env.APP_URL ?? 'https://sitegade.app';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>` : ''}<title>SiteGrade</title></head><body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;"><tr><td style="background-color:${BRAND.bg};border-radius:12px 12px 0 0;padding:24px 32px;"><span style="color:white;font-size:20px;font-weight:800;">SiteGrade</span></td></tr><tr><td style="background-color:${BRAND.white};padding:32px;">${content}</td></tr><tr><td style="background-color:#F8FAFC;border-top:1px solid ${BRAND.border};border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;"><p style="margin:0;font-size:12px;color:${BRAND.textLight};">© ${new Date().getFullYear()} SiteGrade. <a href="${appUrl}/unsubscribe" style="color:${BRAND.textLight};">Unsubscribe</a></p></td></tr></table></td></tr></table></body></html>`;
}

export function ctaButton(text: string, url: string, color = BRAND.primary): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="background-color:${color};border-radius:8px;text-align:center;"><a href="${url}" style="display:inline-block;padding:14px 32px;color:white;font-size:15px;font-weight:700;text-decoration:none;">${text}</a></td></tr></table>`;
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;">`;
}

export function heading(text: string, level: 1 | 2 | 3 = 1): string {
  const sizes = { 1: '24px', 2: '18px', 3: '15px' };
  return `<h${level} style="margin:0 0 12px;font-size:${sizes[level]};font-weight:700;color:${BRAND.text};">${text}</h${level}>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">${text}</p>`;
}

export function scoreBlock(label: string, score: number | null): string {
  const value = score ?? 0;
  let bg = '#FEE2E2'; let color = BRAND.error; let emoji = '🔴';
  if (score === null) { bg = '#F1F5F9'; color = BRAND.textLight; emoji = '⚪'; }
  else if (value >= 90) { bg = '#D1FAE5'; color = BRAND.success; emoji = '🟢'; }
  else if (value >= 50) { bg = '#FEF3C7'; color = BRAND.warning; emoji = '🟡'; }
  return `<td style="text-align:center;padding:8px;"><div style="background:${bg};border-radius:8px;padding:12px 16px;"><div style="font-size:24px;font-weight:800;color:${color};">${score ?? 'N/A'}</div><div style="font-size:11px;color:${BRAND.textLight};">${emoji} ${label}</div></div></td>`;
}
