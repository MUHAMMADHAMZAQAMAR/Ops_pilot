import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { AgentRun, AgentStep, ActionApproval } from '@/types/database';

export interface AgentRunWithDetails extends AgentRun {
  steps?: AgentStep[];
  approvals?: ActionApproval[];
}

// React cache() guarantees this query runs at most ONCE per page request
export const getAgentRuns = cache(async (): Promise<AgentRunWithDetails[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('agent_runs')
    .select(`
      id,
      user_id,
      task,
      status,
      result,
      error_message,
      thread_id,
      started_at,
      completed_at,
      created_at,
      steps:agent_steps(id, sequence_no, step_name, tool_name, status),
      approvals:action_approvals(id, action_type, status)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agent runs:', error.message);
    return [];
  }

  return (data as unknown as AgentRunWithDetails[]) || [];
});

// Compute metrics synchronously in-memory (0ms, 0 extra DB calls)
export function calculateRequestMetrics(runs: AgentRunWithDetails[]) {
  const totalRequests = runs.length;
  let activeRuns = 0;
  let waitingApproval = 0;
  let completedRuns = 0;
  let failedRuns = 0;

  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (r.status === 'running' || r.status === 'queued') activeRuns++;
    else if (r.status === 'waiting_approval') waitingApproval++;
    else if (r.status === 'completed') completedRuns++;
    else if (r.status === 'failed') failedRuns++;
  }

  return {
    totalRequests,
    activeRuns,
    waitingApproval,
    completedRuns,
    failedRuns,
  };
}
