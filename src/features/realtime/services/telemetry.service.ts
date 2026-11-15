import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export interface LiveTelemetryCounts {
  pendingApprovals: number;
  pendingDrafts: number;
  activeRuns: number;
}

/**
 * Lightweight head-only count query for navigation badges & realtime initialization.
 */
export const getLiveTelemetryCounts = cache(async (): Promise<LiveTelemetryCounts> => {
  const supabase = createAdminClient();

  const [approvalsRes, draftsRes, runsRes] = await Promise.all([
    supabase
      .from('action_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('message_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase
      .from('agent_runs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['queued', 'running', 'waiting_approval']),
  ]);

  return {
    pendingApprovals: approvalsRes.count ?? 0,
    pendingDrafts: draftsRes.count ?? 0,
    activeRuns: runsRes.count ?? 0,
  };
});
