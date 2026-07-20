/**
 * TypeScript types for Lighthouse integration
 */

import type { AuditIssue, AuditScores, AuditCategory } from "@sitegarde/types";

export interface LighthouseOptions {
  mobile?: boolean;
  throttle?: boolean;
  categories?: LighthouseCategory[];
  timeoutMs?: number;
  chromeFlags?: string[];
}

export type LighthouseCategory = "performance" | "accessibility" | "best-practices" | "seo";

export interface LighthouseResult {
  scores: AuditScores;
  issues: AuditIssue[];
  lhr: LHR;
  durationMs: number;
  finalUrl: string;
}

export interface LHR {
  lighthouseVersion: string;
  requestedUrl: string;
  finalUrl: string;
  fetchTime: string;
  runWarnings: string[];
  categories: {
    performance?: LHRCategory;
    accessibility?: LHRCategory;
    "best-practices"?: LHRCategory;
    seo?: LHRCategory;
  };
  audits: Record<string, LHRAudit>;
  configSettings: {
    formFactor: "mobile" | "desktop";
    throttlingMethod: string;
  };
}

export interface LHRCategory {
  id: string;
  title: string;
  score: number | null;
  auditRefs: Array<{ id: string; weight: number; group?: string }>;
}

export interface LHRAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: "binary" | "numeric" | "informative" | "notApplicable" | "error";
  displayValue?: string;
  details?: { type: string; items?: unknown[]; overallSavingsMs?: number };
  warnings?: string[];
}

export const LH_CATEGORY_MAP: Record<LighthouseCategory, AuditCategory> = {
  performance: "performance",
  accessibility: "accessibility",
  "best-practices": "best-practices",
  seo: "seo",
};

export function scoreToImpact(score: number | null): AuditIssue["impact"] {
  if (score === null || score === 0) return "critical";
  if (score < 0.5) return "high";
  if (score < 0.75) return "medium";
  return "low";
}

export interface AuditWorkerJob {
  auditId: string;
  url: string;
  userId: string;
  options: LighthouseOptions;
}

export type AuditWorkerResult =
  | { success: true; result: LighthouseResult }
  | { success: false; error: string; errorCode: AuditErrorCode };

export type AuditErrorCode = "TIMEOUT" | "NETWORK_ERROR" | "INVALID_URL" | "CHROME_CRASH" | "UNKNOWN";
