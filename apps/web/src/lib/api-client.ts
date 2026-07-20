import { supabase } from './supabase.js';
import type {
  Audit,
  CreateAuditRequest,
  CreateAuditResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  PaginatedResponse,
  PublicReport,
} from '../../../packages/shared/src/types/api.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      error: { code: 'UNKNOWN', message: res.statusText },
    }));
    throw Object.assign(new Error(error.error?.message ?? 'API error'), {
      code: error.error?.code,
      status: res.status,
    });
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  audits: {
    create: (data: CreateAuditRequest) =>
      apiFetch<CreateAuditResponse>('/api/v1/audits', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      sort?: string;
    }) => {
      const query = new URLSearchParams(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return apiFetch<PaginatedResponse<Audit>>(
        `/api/v1/audits${query ? `?${query}` : ''}`
      );
    },

    get: (id: string) => apiFetch<Audit>(`/api/v1/audits/${id}`),

    delete: (id: string) =>
      apiFetch<{ success: boolean; deletedId: string }>(
        `/api/v1/audits/${id}`,
        { method: 'DELETE' }
      ),

    generateReport: (id: string, data?: GenerateReportRequest) =>
      apiFetch<GenerateReportResponse>(`/api/v1/audits/${id}/report`, {
        method: 'POST',
        body: JSON.stringify(data ?? {}),
      }),
  },

  reports: {
    get: (shareToken: string) =>
      apiFetch<PublicReport>(`/api/v1/reports/${shareToken}`),
  },
};
