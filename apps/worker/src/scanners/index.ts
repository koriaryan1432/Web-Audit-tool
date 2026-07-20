import { runLighthouse } from '../lighthouse/runner.js';
import { runAxeScan } from './axe-scanner.js';
import type { LighthouseResult } from '../lighthouse/types.js';
import type { AxeResult } from '../../../packages/shared/src/types/axe.js';
import type { AuditOptions } from '../../api/src/types/queue.js';

export interface CombinedScanResult {
  lighthouse: LighthouseResult;
  axe: AxeResult;
  combinedScore: number;
}

/**
 * Orchestrator: runs Lighthouse then axe-core sequentially.
 * (Parallel would be faster but two Chromium instances conflict on constrained infra.)
 *
 * Combined score = weighted average:
 *   performance: 30%, accessibility: 30%, seo: 20%, best-practices: 20%
 *   Accessibility score = min(lighthouse_a11y, axe_score) to be conservative.
 */
export async function runFullScan(
  url: string,
  options: AuditOptions
): Promise<CombinedScanResult> {
  const lighthouse = await runLighthouse(url, {
    categories: options.categories,
    device: options.device,
    throttling: options.throttling,
  });

  const axe = await runAxeScan(url);

  const accessibilityScore = Math.min(
    lighthouse.scores.accessibility,
    axe.score
  );

  const combinedScore = Math.round(
    lighthouse.scores.performance * 0.3 +
      accessibilityScore * 0.3 +
      lighthouse.scores.seo * 0.2 +
      lighthouse.scores['best-practices'] * 0.2
  );

  return { lighthouse, axe, combinedScore };
}

export { runLighthouse, runAxeScan };
