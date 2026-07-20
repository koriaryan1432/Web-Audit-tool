/**
 * @sitegarde/types - Shared TypeScript types and interfaces
 * Used across apps/web, apps/api, and apps/worker
 */

export type Plan = "FREE" | "PRO" | "AGENCY";
export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";
export type AuditStatus = "QUEUED" | "RUNNING" | "COMPLETE" | "FAILED";
export type IssueSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type AuditCategory = "performance" | "accessibility" | "seo" | "best-practices" | "security" | "ux";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: Plan;
  seats: number;
  createdAt: Date;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  joinedAt: Date;
}

export interface AuditOptions {
  mobile?: boolean;
  desktop?: boolean;
  categories?: AuditCategory[];
  throttle?: boolean;
}

export interface Audit {
  id: string;
  url: string;
  userId: string;
  orgId: string | null;
  status: AuditStatus;
  options: AuditOptions;
  createdAt: Date;
  completedAt: Date | null;
}

export interface AuditScores {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  overall: number;
}

export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  score: number | null;
  weight: number;
  category: AuditCategory;
  impact: "critical" | "high" | "medium" | "low";
  helpUrl?: string;
}

export interface AuditResult {
  id: string;
  auditId: string;
  scores: AuditScores;
  issues: AuditIssue[];
  createdAt: Date;
}

export interface AIRecommendation {
  id: string;
  auditResultId: string;
  category: AuditCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  fixSuggestion: string;
  cacheKey: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  auditId: string;
  userId: string;
  pdfUrl: string | null;
  shareToken: string;
  isPublic: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateAuditRequest {
  url: string;
  options?: AuditOptions;
  orgId?: string;
}

export interface CreateAuditResponse {
  auditId: string;
  status: AuditStatus;
  estimatedDuration: number;
  pollUrl: string;
}

export interface AuditStatusResponse {
  auditId: string;
  status: AuditStatus;
  progress?: number;
  result?: AuditResult;
  error?: string;
}

export interface AuditJobData {
  auditId: string;
  url: string;
  userId: string;
  options: AuditOptions;
}

export interface AuditJobResult {
  auditId: string;
  scores: AuditScores;
  issues: AuditIssue[];
  rawLighthouseJson: string;
  durationMs: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

export type ScoreGrade = "good" | "needs-work" | "poor";

export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 90) return "good";
  if (score >= 50) return "needs-work";
  return "poor";
}

export function computeOverallScore(scores: Omit<AuditScores, "overall">): number {
  return Math.round(
    scores.performance * 0.3 +
    scores.seo * 0.2 +
    scores.accessibility * 0.2 +
    scores.bestPractices * 0.15
  );
}
