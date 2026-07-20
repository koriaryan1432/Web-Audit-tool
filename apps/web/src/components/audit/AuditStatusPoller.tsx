'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { Audit } from '../../../../packages/shared/src/types/api';

interface AuditStatusPollerProps {
  auditId: string;
  initialStatus: Audit['status'];
  initialProgress?: number;
}

const POLL_INTERVAL_MS = 3000;

const STATUS_LABELS: Record<string, string> = {
  QUEUED: 'Waiting in queue...',
  RUNNING: 'Running audit...',
  COMPLETE: 'Audit complete!',
  FAILED: 'Audit failed',
};

/**
 * Client component that polls audit status every 3s while QUEUED or RUNNING.
 * Shows a progress bar and stops polling on COMPLETE or FAILED.
 * Refreshes the page on completion to show results.
 */
export function AuditStatusPoller({
  auditId,
  initialStatus,
  initialProgress = 0,
}: AuditStatusPollerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);

  const poll = useCallback(async () => {
    try {
      const audit = await apiClient.audits.get(auditId);
      setStatus(audit.status);
      setProgress(audit.progress?.progress ?? (audit.status === 'COMPLETE' ? 100 : progress));

      if (audit.status === 'COMPLETE') {
        router.refresh();
      }
    } catch {
      // Fail silently — keep polling
    }
  }, [auditId, router, progress]);

  useEffect(() => {
    if (status === 'COMPLETE' || status === 'FAILED') return;

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, poll]);

  if (status === 'COMPLETE') return null;

  const isError = status === 'FAILED';

  return (
    <div className={`rounded-xl p-4 border ${isError ? 'bg-red-900/20 border-red-800' : 'bg-blue-900/20 border-blue-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium ${isError ? 'text-red-300' : 'text-blue-300'}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
        {!isError && (
          <span className="text-sm text-gray-400">{progress}%</span>
        )}
      </div>

      {!isError && (
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {isError && (
        <p className="text-red-400 text-sm mt-1">
          The audit failed. Please try again.
        </p>
      )}
    </div>
  );
}
