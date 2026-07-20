export type AISeverity = 'critical' | 'high' | 'medium' | 'low';
export type AIEffort = 'low' | 'medium' | 'high';

export interface AITopIssue {
  title: string;
  severity: AISeverity;
  impact: string;
  fix: string;
  effort: AIEffort;
  category?: string;
}

export interface AIQuickWin {
  title: string;
  description: string;
  estimatedImpact: string;
}

export interface AIRecommendations {
  summary: string;
  topIssues: AITopIssue[];
  quickWins: AIQuickWin[];
  estimatedImpact: string;
  generatedAt: string;
  fromCache: boolean;
  cacheKey?: string;
}

export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  score: number;
  weight: number;
  category: 'performance' | 'accessibility' | 'seo' | 'best-practices';
  impact: 'critical' | 'high' | 'medium' | 'low';
}
