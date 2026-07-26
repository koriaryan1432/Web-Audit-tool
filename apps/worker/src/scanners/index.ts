import { runLighthouse } from '../lighthouse/runner.js';
import { runAxeScan } from './axe-scanner.js';
import type { LighthouseResult } from '../lighthouse/types.js';
import type { AxeResult } from '../../../packages/shared/src/types/axe.js';
import type { AuditOptions } from '../queue/types.js';

export interface CombinedScanResult {
  lighthouse: LighthouseResult;
  axe: AxeResult;
  combinedScore: number;
}

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
  const accessibilityScore = Math.min(lighthouse.scores.accessibility, axe.score);
  const combinedScore = Math.round(
    lighthouse.scores.performance * 0.3 +
    accessibilityScore * 0.3 +
    lighthouse.scores.seo * 0.2 +
    lighthouse.scores['best-practices'] * 0.2
  );
  return { lighthouse, axe, combinedScore };
}

export { runLighthouse, runAxeScan };
