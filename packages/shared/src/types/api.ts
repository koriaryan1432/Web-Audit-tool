import type { AIRecommendations } from './ai.js';

export type AuditStatus = 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED';
export type Plan = 'FREE' | 'PRO' | 'AGENCY';

export interface AuditScores {
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
}

export interface AuditResult extends AuditScores {
  id: string;
  auditId: string;
  issues: unknown[];
  recommendations?: AIRecommendations;
  createdAt: string;
}

export interface Audit {
  id: string;
  url: string;
  status: AuditStatus;
  options: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
  result?: AuditResult;
  progress?: { progress: number; status: string } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAuditRequest {
  url: string;
  options?: {
    categories?: string[];
    device?: 'mobile' | 'desktop';
    throttling?: 'simulated' | 'devtools' | 'none';
  };
}

export interface CreateAuditResponse {
  auditId: string;
  jobId: string;
  status: AuditStatus;
  url: string;
  estimatedTime: number;
  queuePosition: number;
}

export interface GenerateReportRequest {
  expiresInDays?: number;
  isPublic?: boolean;
}

export interface GenerateReportResponse {
  reportId: string;
  shareToken: string;
  shareUrl: string;
  expiresAt: string;
  isPublic: boolean;
}

export interface PublicReport {
  reportId: string;
  shareToken: string;
  createdAt: string;
  expiresAt?: string;
  audit: Audit;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
