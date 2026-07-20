/**
 * Lighthouse Runner
 * Runs Lighthouse audits in headless Chromium.
 * Architecture: runs in apps/worker (Railway), NOT apps/api (Vercel).
 * Lighthouse requires a real Chrome process — serverless can't run it.
 */

import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import type { LighthouseOptions, LighthouseResult, LHR, AuditErrorCode } from "./types";
import { extractIssues } from "./extractor";
import type { AuditScores } from "@sitegarde/types";

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_CATEGORIES: LighthouseOptions["categories"] = ["performance", "accessibility", "best-practices", "seo"];

export class LighthouseError extends Error {
  constructor(message: string, public readonly code: AuditErrorCode, public readonly originalError?: unknown) {
    super(message);
    this.name = "LighthouseError";
  }
}

/**
 * Runs a full Lighthouse audit against the given URL.
 * @param url - Validated, sanitized public URL
 * @param options - Lighthouse configuration
 * @returns LighthouseResult with scores, issues, and raw LHR
 * @throws LighthouseError with classified error code
 */
export async function runLighthouse(url: string, options: LighthouseOptions = {}): Promise<LighthouseResult> {
  const {
    mobile = true,
    throttle = true,
    categories = DEFAULT_CATEGORIES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    chromeFlags = [],
  } = options;

  const startTime = Date.now();
  let chrome: chromeLauncher.LaunchedChrome | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new LighthouseError(`Lighthouse audit timed out after ${timeoutMs / 1000}s`, "TIMEOUT")), timeoutMs);
  });

  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        "--headless=new", "--no-sandbox", "--disable-gpu",
        "--disable-dev-shm-usage", "--disable-extensions",
        "--disable-background-networking", "--disable-default-apps",
        "--disable-sync", "--no-first-run",
        ...chromeFlags,
      ],
    });

    const runResult = await Promise.race([
      lighthouse(url, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: categories,
        formFactor: mobile ? "mobile" : "desktop",
        screenEmulation: mobile
          ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false }
          : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: throttle ? "simulate" : "provided",
        throttling: throttle ? {
          rttMs: 150, throughputKbps: 1638.4,
          cpuSlowdownMultiplier: mobile ? 4 : 1,
          requestLatencyMs: 562.5,
          downloadThroughputKbps: 1474.56,
          uploadThroughputKbps: 675,
        } : undefined,
      }),
      timeoutPromise,
    ]);

    if (!runResult?.lhr) throw new LighthouseError("Lighthouse returned no result", "UNKNOWN");

    const lhr = runResult.lhr as unknown as LHR;
    const scores = extractScores(lhr);
    const issues = extractIssues(lhr);

    return { scores, issues, lhr, durationMs: Date.now() - startTime, finalUrl: lhr.finalUrl };
  } catch (err) {
    if (err instanceof LighthouseError) throw err;
    throw new LighthouseError(
      `Lighthouse audit failed: ${err instanceof Error ? err.message : String(err)}`,
      classifyError(err), err
    );
  } finally {
    if (chrome) {
      try { await chrome.kill(); } catch { /* Chrome may already be dead */ }
    }
  }
}

function extractScores(lhr: LHR): AuditScores {
  const raw = lhr.categories;
  const performance = toScore(raw.performance?.score);
  const accessibility = toScore(raw.accessibility?.score);
  const seo = toScore(raw.seo?.score);
  const bestPractices = toScore(raw["best-practices"]?.score);
  const overall = Math.round(performance * 0.3 + accessibility * 0.2 + seo * 0.2 + bestPractices * 0.15);
  return { performance, accessibility, seo, bestPractices, overall };
}

function toScore(score: number | null | undefined): number {
  if (score === null || score === undefined) return 0;
  return Math.round(score * 100);
}

function classifyError(err: unknown): AuditErrorCode {
  if (!(err instanceof Error)) return "UNKNOWN";
  const msg = err.message.toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return "TIMEOUT";
  if (msg.includes("net::err") || msg.includes("econnrefused") || msg.includes("enotfound")) return "NETWORK_ERROR";
  if (msg.includes("invalid url") || msg.includes("protocol")) return "INVALID_URL";
  if (msg.includes("chrome") || msg.includes("browser")) return "CHROME_CRASH";
  return "UNKNOWN";
}
