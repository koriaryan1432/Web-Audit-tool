import { chromium } from 'playwright';
import type { AxeResult, AxeViolation, AxeImpact } from './types.js';

const AXE_TIMEOUT_MS = 45_000;

/**
 * Run axe-core accessibility audit on a URL using Playwright + headless Chromium.
 *
 * Strategy:
 *   1. Launch headless Chromium via Playwright
 *   2. Navigate to the URL and wait for network idle
 *   3. Inject axe-core via CDN
 *   4. Run axe.run() in page context
 *   5. Extract and normalize violations
 *
 * @param url - Pre-validated URL (SSRF check already done by caller)
 */
export async function runAxe(url: string): Promise<AxeResult> {
  const startTime = Date.now();
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; SiteGrade/1.0; +https://sitegra.de/bot)',
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: false,
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: AXE_TIMEOUT_MS });

    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js',
    });

    const axeRawResult = await page.evaluate(async () => {
      // @ts-ignore
      const results = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
        resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'],
      });
      return {
        violations: results.violations,
        incomplete: results.incomplete,
        passesCount: results.passes.length,
        inapplicableCount: results.inapplicable.length,
        url: results.url,
        timestamp: results.timestamp,
      };
    });

    const violations: AxeViolation[] = axeRawResult.violations.map((v: any) => ({
      id: v.id,
      impact: (v.impact as AxeImpact) ?? null,
      tags: v.tags ?? [],
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: (v.nodes ?? []).slice(0, 10).map((n: any) => ({
        html: n.html?.slice(0, 500) ?? '',
        target: n.target ?? [],
        failureSummary: n.failureSummary,
        impact: n.impact as AxeImpact | undefined,
      })),
    }));

    const incomplete = axeRawResult.incomplete.map((i: any) => ({
      id: i.id, impact: (i.impact as AxeImpact) ?? null,
      description: i.description, help: i.help, helpUrl: i.helpUrl,
      nodes: (i.nodes ?? []).slice(0, 5).map((n: any) => ({
        html: n.html?.slice(0, 300) ?? '', target: n.target ?? [],
        failureSummary: n.failureSummary, impact: n.impact as AxeImpact | undefined,
      })),
    }));

    const impactCounts = violations.reduce((acc, v) => {
      if (v.impact) acc[v.impact] = (acc[v.impact] ?? 0) + 1;
      return acc;
    }, {} as Record<AxeImpact, number>);

    return {
      url: axeRawResult.url,
      timestamp: axeRawResult.timestamp,
      violations, incomplete,
      passes: axeRawResult.passesCount,
      inapplicable: axeRawResult.inapplicableCount,
      violationCount: violations.length,
      criticalCount: impactCounts.critical ?? 0,
      seriousCount: impactCounts.serious ?? 0,
      moderateCount: impactCounts.moderate ?? 0,
      minorCount: impactCounts.minor ?? 0,
      durationMs: Date.now() - startTime,
    };
  } finally {
    if (browser) await browser.close().catch((err) => console.error('[axe] Failed to close browser:', err));
  }
}
