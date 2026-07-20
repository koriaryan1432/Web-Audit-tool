export type AxeImpact = 'critical' | 'serious' | 'moderate' | 'minor';

export interface AxeNodeResult {
  html: string;
  target: string[];
  failureSummary?: string;
  impact?: AxeImpact;
}

export interface AxeViolation {
  id: string;
  impact: AxeImpact | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNodeResult[];
}

export interface AxePass {
  id: string;
  description: string;
  help: string;
  nodes: AxeNodeResult[];
}

export interface AxeIncomplete {
  id: string;
  impact: AxeImpact | null;
  description: string;
  help: string;
  nodes: AxeNodeResult[];
}

export interface AxeResult {
  url: string;
  timestamp: string;
  violations: AxeViolation[];
  passes: AxePass[];
  incomplete: AxeIncomplete[];
  score: number; // 0-100, computed from violations
  violationCounts: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
}
