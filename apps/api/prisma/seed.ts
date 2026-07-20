/**
 * SiteGrade - Prisma Seed Script
 * Seeds: 1 test user, 1 org, 1 sample audit with results and AI recommendations
 * Run with: pnpm db:seed
 */

import { PrismaClient, Plan, AuditStatus, IssueSeverity } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SiteGrade database...");

  // 1. Test User
  const testUser = await prisma.user.upsert({
    where: { email: "test@sitegarde.com" },
    update: {},
    create: { email: "test@sitegarde.com", name: "Test User", plan: Plan.PRO },
  });
  console.log(`User: ${testUser.email} (${testUser.id})`);

  // 2. Organization
  const org = await prisma.organization.upsert({
    where: { slug: "sitegarde-demo" },
    update: {},
    create: { name: "SiteGrade Demo Agency", slug: "sitegarde-demo", ownerId: testUser.id, plan: Plan.AGENCY, seats: 5 },
  });
  console.log(`Org: ${org.name} (${org.id})`);

  await prisma.orgMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: testUser.id } },
    update: {},
    create: { orgId: org.id, userId: testUser.id, role: "OWNER" },
  });

  // 3. Sample Audit
  const audit = await prisma.audit.create({
    data: {
      url: "https://example.com",
      userId: testUser.id,
      orgId: org.id,
      status: AuditStatus.COMPLETE,
      options: { mobile: true, desktop: true, categories: ["performance", "accessibility", "seo", "best-practices"], throttle: true },
      completedAt: new Date(),
    },
  });
  console.log(`Audit: ${audit.url} (${audit.id})`);

  // 4. Audit Result
  const auditResult = await prisma.auditResult.create({
    data: {
      auditId: audit.id,
      performanceScore: 72,
      accessibilityScore: 88,
      seoScore: 91,
      bestPracticesScore: 83,
      rawLighthouse: {
        lighthouseVersion: "12.2.1",
        requestedUrl: "https://example.com",
        finalUrl: "https://example.com/",
        fetchTime: new Date().toISOString(),
        categories: {
          performance: { score: 0.72 },
          accessibility: { score: 0.88 },
          seo: { score: 0.91 },
          "best-practices": { score: 0.83 },
        },
      },
      rawAxe: [],
      issues: [
        { id: "render-blocking-resources", title: "Eliminate render-blocking resources", description: "Resources are blocking the first paint.", score: 0.5, weight: 0.3, category: "performance", impact: "high" },
        { id: "color-contrast", title: "Background and foreground colors do not have sufficient contrast", description: "Low-contrast text is difficult for many users to read.", score: 0, weight: 0.3, category: "accessibility", impact: "critical" },
      ],
    },
  });
  console.log(`AuditResult: P:${auditResult.performanceScore} A:${auditResult.accessibilityScore} S:${auditResult.seoScore}`);

  // 5. AI Recommendations
  await prisma.aiRecommendation.createMany({
    data: [
      {
        auditResultId: auditResult.id,
        category: "performance",
        severity: IssueSeverity.HIGH,
        title: "Eliminate render-blocking resources",
        description: "3 render-blocking scripts delay First Contentful Paint by ~1.2s.",
        fixSuggestion: "Add `defer` or `async` to non-critical scripts. Inline critical CSS.",
        cacheKey: "sha256-render-blocking-example-com-001",
      },
      {
        auditResultId: auditResult.id,
        category: "accessibility",
        severity: IssueSeverity.CRITICAL,
        title: "Fix color contrast on navigation links",
        description: "Nav links have contrast ratio 3.2:1, below WCAG AA minimum of 4.5:1.",
        fixSuggestion: "Change link color to #d1d5db (contrast ratio 7.2:1).",
        cacheKey: "sha256-color-contrast-example-com-001",
      },
    ],
    skipDuplicates: true,
  });

  // 6. Report
  const report = await prisma.report.create({
    data: { auditId: audit.id, userId: testUser.id, shareToken: "demo-share-token-example-com-2026", isPublic: true },
  });
  console.log(`Report: /reports/${report.shareToken}`);

  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
