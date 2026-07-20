export type AuditDevice = 'mobile' | 'desktop';
export type AuditThrottling = 'simulated' | 'devtools' | 'none';
export type AuditCategory =
  | 'performance'
  | 'accessibility'
  | 'best-practices'
  | 'seo';

export interface AuditOptions {
  categories: AuditCategory[];
  device: AuditDevice;
  throttling: AuditThrottling;
}

export interface AuditJobData {
  auditId: string;
  url: string;
  userId: string;
  orgId?: string;
  options: AuditOptions;
}

export interface AuditJobResult {
  auditId: string;
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  issueCount: number;
  completedAt: string;
}

export const DEFAULT_AUDIT_OPTIONS: AuditOptions = {
  categories: ['performance', 'accessibility', 'best-practices', 'seo'],
  device: 'mobile',
  throttling: 'simulated',
};
