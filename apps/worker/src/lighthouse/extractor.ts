/**
 * Lighthouse Issue Extractor
 * Transforms raw LHR into SiteGrade's AuditIssue[] format.
 * Filters to failed/warning audits, maps to impact classification,
 * sorts by impact (critical first) then weight (highest first).
 */

import type { AuditIssue, AuditCategory } from "@sitegarde/types";
import type { LHR, LHRAudit } from "./types";
import { scoreToImpact } from "./types";

const CATEGORY_MAP: Record<string, AuditCategory> = {
  performance: "performance",
  accessibility: "accessibility",
  "best-practices": "best-practices",
  seo: "seo",
};

const SKIP_AUDIT_IDS = new Set([
  "screenshot-thumbnails", "final-screenshot", "full-page-screenshot",
  "network-requests", "network-rtt", "network-server-latency",
  "main-thread-tasks", "diagnostics", "metrics", "resource-summary",
  "third-party-summary", "timing-budget", "performance-budget",
]);

export function extractIssues(lhr: LHR): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const auditCategoryMap = new Map<string, { category: AuditCategory; weight: number }>();

  for (const [categoryId, category] of Object.entries(lhr.categories)) {
    if (!category) continue;
    const mappedCategory = CATEGORY_MAP[categoryId];
    if (!mappedCategory) continue;
    for (const ref of category.auditRefs) {
      auditCategoryMap.set(ref.id, { category: mappedCategory, weight: ref.weight });
    }
  }

  for (const [auditId, audit] of Object.entries(lhr.audits)) {
    if (SKIP_AUDIT_IDS.has(auditId)) continue;
    if (!shouldIncludeAudit(audit)) continue;
    const categoryInfo = auditCategoryMap.get(auditId);
    if (!categoryInfo) continue;

    issues.push({
      id: auditId,
      title: audit.title,
      description: cleanDescription(audit.description),
      score: audit.score,
      weight: categoryInfo.weight,
      category: categoryInfo.category,
      impact: scoreToImpact(audit.score),
      helpUrl: extractHelpUrl(audit.description),
    });
  }

  const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return issues.sort((a, b) => {
    const diff = impactOrder[a.impact] - impactOrder[b.impact];
    return diff !== 0 ? diff : b.weight - a.weight;
  });
}

function shouldIncludeAudit(audit: LHRAudit): boolean {
  if (audit.scoreDisplayMode === "notApplicable" || audit.scoreDisplayMode === "informative" || audit.scoreDisplayMode === "error") return false;
  if (audit.score === null) return true;
  return audit.score < 0.9;
}

function cleanDescription(description: string): string {
  return description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

function extractHelpUrl(description: string): string | undefined {
  const match = /\[(?:[^\]]+)\]\(([^)]+)\)/.exec(description);
  return match?.[1];
}

export interface IssueSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byCategory: Record<AuditCategory, number>;
}

export function summarizeIssues(issues: AuditIssue[]): IssueSummary {
  const summary: IssueSummary = {
    total: issues.length, critical: 0, high: 0, medium: 0, low: 0,
    byCategory: { performance: 0, accessibility: 0, seo: 0, "best-practices": 0, security: 0, ux: 0 },
  };
  for (const issue of issues) {
    summary[issue.impact]++;
    summary.byCategory[issue.category]++;
  }
  return summary;
}
