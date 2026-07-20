import { getSupabaseClient } from './supabase.js';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type AuditStatus = 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export type AuditSummary = {
  id: string; url: string; status: AuditStatus;
  createdAt: string; completedAt: string | null;
  auditResult: { performanceScore: number | null; accessibilityScore: number | null; seoScore: number | null; bestPracticesScore: number | null; } | null;
};

export type AuditIssue = {
  id: string; title: string; description: string;
  score: number | null; weight: number; category: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
};

export type AIRecommendation = {
  id: string; category: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string; description: string; fixSuggestion: string;
};

export type ReportSummary = {
  id: string; shareToken: string; isPublic: boolean; expiresAt: string | null; createdAt: string;
};

export type AuditDetail = AuditSummary & {
  auditResult: {
    id: string; performanceScore: number | null; accessibilityScore: number | null;
    seoScore: number | null; bestPracticesScore: number | null;
    issues: AuditIssue[]; aiRecommendations: AIRecommendation[];
  } | null;
  reports: ReportSummary[];
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; };
};

export type CreateAuditOptions = {
  categories?: string[]; runAxe?: boolean;
  generateAiRecommendations?: boolean; device?: 'mobile' | 'desktop';
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    let errorBody: { error?: string; detail?: string } = {};
    try { errorBody = await response.json(); } catch {}
    throw new ApiError(response.status, errorBody.error ?? `HTTP ${response.status}`, errorBody.detail);
  }

  return response.json() as Promise<T>;
}

export const auditsApi = {
  create: (url: string, options?: CreateAuditOptions) =>
    apiFetch<{ auditId: string; status: AuditStatus; url: string; createdAt: string }>('/api/v1/audits', { method: 'POST', body: JSON.stringify({ url, options }) }),
  list: (page = 1, limit = 20) =>
    apiFetch<PaginatedResponse<AuditSummary>>(`/api/v1/audits?page=${page}&limit=${limit}`),
  get: (id: string) =>
    apiFetch<{ data: AuditDetail }>(`/api/v1/audits/${id}`),
  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/v1/audits/${id}`, { method: 'DELETE' }),
  generateReport: (id: string) =>
    apiFetch<{ reportId: string; shareToken: string; shareUrl: string; expiresAt: string }>(`/api/v1/audits/${id}/report`, { method: 'POST' }),
};

export const reportsApi = {
  getPublic: (shareToken: string) => apiFetch<{ data: unknown }>(`/api/v1/reports/${shareToken}`),
};
