'use client';

import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { Audit, PaginatedResponse } from '../../../packages/shared/src/types/api';

interface UseAuditsOptions {
  page?: number;
  limit?: number;
  status?: string;
}

/**
 * SWR hook for paginated audits list.
 * Revalidates every 30s.
 */
export function useAudits(options: UseAuditsOptions = {}) {
  const key = ['audits', options.page, options.limit, options.status];

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Audit>>(
    key,
    () => apiClient.audits.list(options),
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    }
  );

  return {
    audits: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}

/**
 * SWR hook for a single audit.
 * Polls every 3s while QUEUED or RUNNING, stops on COMPLETE/FAILED.
 */
export function useAudit(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Audit>(
    id ? ['audit', id] : null,
    () => apiClient.audits.get(id),
    {
      refreshInterval: (data) => {
        if (!data) return 3000;
        return data.status === 'QUEUED' || data.status === 'RUNNING' ? 3000 : 0;
      },
      revalidateOnFocus: false,
    }
  );

  return {
    audit: data,
    isLoading,
    error,
    mutate,
    isRunning: data?.status === 'RUNNING' || data?.status === 'QUEUED',
  };
}
