export type AxeImpact = 'critical' | 'serious' | 'moderate' | 'minor';

export type AxeNodeResult = {
  html: string;
  target: string[];
  failureSummary?: string;
  impact?: AxeImpact;
};

export type AxeViolation = {
  id: string;
  impact: AxeImpact | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNodeResult[];
};

export type AxeIncomplete = {
  id: string;
  impact: AxeImpact | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNodeResult[];
};

export type AxeResult = {
  url: string;
  timestamp: string;
  violations: AxeViolation[];
  incomplete: AxeIncomplete[];
  passes: number;
  inapplicable: number;
  violationCount: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  durationMs: number;
};

export const WCAG_LEVEL_TAGS = {
  wcag2a: 'WCAG 2.0 Level A',
  wcag2aa: 'WCAG 2.0 Level AA',
  wcag21a: 'WCAG 2.1 Level A',
  wcag21aa: 'WCAG 2.1 Level AA',
  wcag22aa: 'WCAG 2.2 Level AA',
  'best-practice': 'Best Practice',
  experimental: 'Experimental',
} as const;

export type WcagTag = keyof typeof WCAG_LEVEL_TAGS;
