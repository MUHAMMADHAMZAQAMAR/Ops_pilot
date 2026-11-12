import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { ActionApproval, AgentRun, Profile } from '@/types/database';

export interface ActionApprovalWithRelations extends ActionApproval {
  run?: AgentRun | null;
  reviewer?: Profile | null;
  requester?: Profile | null;
}

// React cache() guarantees this query runs at most ONCE per page request
export const getActionApprovals = cache(async (): Promise<ActionApprovalWithRelations[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('action_approvals')
    .select(`
      id,
      run_id,
      action_type,
      payload,
      status,
      requested_by,
      reviewed_by,
      reviewed_at,
      executed_at,
      created_at,
      run:agent_runs(id, task, thread_id, status)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching action approvals:', error.message);
    return [];
  }

  return (data as unknown as ActionApprovalWithRelations[]) || [];
});

// Pure in-memory calculation (0ms, 0 extra queries)
export function calculateApprovalMetrics(approvals: ActionApprovalWithRelations[]) {
  const total = approvals.length;
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  for (let i = 0; i < approvals.length; i++) {
    const a = approvals[i];
    if (a.status === 'pending') pendingCount++;
    else if (a.status === 'approved' || a.status === 'executed') approvedCount++;
    else if (a.status === 'rejected') rejectedCount++;
  }

  return {
    total,
    pendingCount,
    approvedCount,
    rejectedCount,
  };
}

