import type { AuditStatus } from '@prisma/client';

export type AuditJobData = {
  auditId: string;
  url: string;
  userId: string;
  orgId?: string;
  options: AuditOptions;
};

export type AuditOptions = {
  categories?: LighthouseCategory[];
  runAxe?: boolean;
  generateAiRecommendations?: boolean;
  device?: 'mobile' | 'desktop';
  throttling?: 'simulated' | 'devtools' | 'none';
};

export type LighthouseCategory = 'performance' | 'accessibility' | 'best-practices' | 'seo';

export type AuditJobResult = {
  auditId: string;
  status: AuditStatus;
  auditResultId: string;
  scores: { performance: number | null; accessibility: number | null; seo: number | null; bestPractices: number | null; };
  issueCount: number;
  durationMs: number;
};

export type AuditJobProgress = { stage: AuditStage; message: string; percent: number; };

export type AuditStage = 'validating' | 'launching_browser' | 'running_lighthouse' | 'running_axe' | 'extracting_issues' | 'saving_results' | 'generating_ai_recommendations' | 'complete';
