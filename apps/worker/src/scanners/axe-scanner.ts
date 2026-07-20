import puppeteer from 'puppeteer';
import type { AxeResult, AxeViolation, AxeImpact } from '../../../packages/shared/src/types/axe.js';

const AXE_TIMEOUT_MS = 30_000;

// Deduction per violation by impact level
const IMPACT_DEDUCTIONS: Record<AxeImpact, number> = {
  critical: 10,
  serious: 5,
  moderate: 2,
  minor: 0.5,
};

/**
 * Run axe-core accessibility scan via Puppeteer + headless Chrome.
 *
 * Handles:
 * - CSP-blocked pages (injects axe via CDP)
 * - JS-disabled pages (graceful fallback)
 * - 30s hard timeout
 *
 * Score: starts at 100, deducts per violation, floor 0.
 */
export async function runAxeScan(url: string): Promise<AxeResult> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });

  const page = await browser.newPage();

  try {
    await page.setDefaultNavigationTimeout(AXE_TIMEOUT_MS);
    await page.setUserAgent(
      'Mozilla/5.0 (compatible; SiteGrade/1.0; +https://sitegarde.com/bot)'
    );

    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: AXE_TIMEOUT_MS });

    // Inject axe-core via CDP to bypass CSP restrictions
    const axeSource = await import('axe-core').then((m) => m.source);
    await page.evaluate(axeSource);

    // Run axe analysis
    const axeResults = await page.evaluate(async () => {
      return new Promise<{
        violations: unknown[];
        passes: unknown[];
        incomplete: unknown[];
        url: string;
        timestamp: string;
      }>((resolve, reject) => {
        // @ts-ignore — axe is injected globally
        window.axe.run(
          document,
          {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
            },
          },
          (err: Error | null, results: unknown) => {
            if (err) reject(err);
            else resolve(results as ReturnType<typeof resolve> extends Promise<infer T> ? T : never);
          }
        );
      });
    });

    const violations = axeResults.violations as AxeViolation[];
    const passes = axeResults.passes as AxeResult['passes'];
    const incomplete = axeResults.incomplete as AxeResult['incomplete'];

    // Count violations by impact
    const violationCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      total: violations.length,
    };

    let score = 100;
    for (const v of violations) {
      const impact = v.impact ?? 'minor';
      violationCounts[impact] = (violationCounts[impact] ?? 0) + 1;
      score -= IMPACT_DEDUCTIONS[impact] ?? 0;
    }
    score = Math.max(0, Math.round(score));

    return {
      url,
      timestamp: new Date().toISOString(),
      violations,
      passes,
      incomplete,
      score,
      violationCounts,
    };
  } catch (err) {
    // Return a degraded result rather than crashing the whole audit
    console.error(`[axe-scanner] Scan failed for ${url}:`, err);
    return {
      url,
      timestamp: new Date().toISOString(),
      violations: [],
      passes: [],
      incomplete: [],
      score: 0,
      violationCounts: { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 },
    };
  } finally {
    await browser.close();
  }
}
