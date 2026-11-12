import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { AgentRun, AgentStep, ActionApproval, MessageDraft } from '@/types/database';

export interface AgentRunComplete extends AgentRun {
  steps: AgentStep[];
  approvals: ActionApproval[];
  drafts: MessageDraft[];
}

export interface AgentRunSummary extends AgentRun {
  stepsCount: number;
  completedStepsCount: number;
  pendingApproval?: ActionApproval | null;
  durationMs?: number;
}

export interface RunsOverviewData {
  runs: AgentRunSummary[];
  metrics: {
    totalRuns: number;
    activeRuns: number;
    waitingApproval: number;
    completedRuns: number;
    failedRuns: number;
    successRate: number;
  };
}

export const getRunById = cache(async (runId: string): Promise<AgentRunComplete | null> => {
  const supabase = createAdminClient();

  const { data: run, error: runError } = await supabase
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
      steps:agent_steps(id, sequence_no, step_name, tool_name, input, output, status, error_message, started_at, completed_at),
      approvals:action_approvals(id, action_type, payload, status, reviewed_at, executed_at),
      drafts:message_drafts(id, customer_id, order_id, content, status, created_at)
    `)
    .eq('id', runId)
    .single();

  if (runError || !run) {
    console.error('Error fetching run by id:', runError?.message);
    return null;
  }

  // Sort steps by sequence_no ascending
  const sortedSteps = ((run.steps as unknown as AgentStep[]) || []).sort(
    (a, b) => a.sequence_no - b.sequence_no
  );

  return {
    ...(run as unknown as AgentRun),
    steps: sortedSteps,
    approvals: (run.approvals as unknown as ActionApproval[]) || [],
    drafts: (run.drafts as unknown as MessageDraft[]) || [],
  };
});

export const getRunsOverview = cache(async (): Promise<RunsOverviewData> => {
  const supabase = createAdminClient();

  const { data: runsData, error } = await supabase
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
      steps:agent_steps(id, sequence_no, status, step_name),
      approvals:action_approvals(id, action_type, status, payload)
    `)
    .order('created_at', { ascending: false });

  if (error || !runsData) {
    console.error('Error fetching runs overview:', error?.message);
    return {
      runs: [],
      metrics: {
        totalRuns: 0,
        activeRuns: 0,
        waitingApproval: 0,
        completedRuns: 0,
        failedRuns: 0,
        successRate: 100,
      },
    };
  }

  let waitingApprovalCount = 0;
  let activeRunsCount = 0;
  let completedRunsCount = 0;
  let failedRunsCount = 0;

  const runs: AgentRunSummary[] = runsData.map((rawRun: any) => {
    const steps = (rawRun.steps as AgentStep[]) || [];
    const approvals = (rawRun.approvals as ActionApproval[]) || [];
    const pendingApproval = approvals.find((a) => a.status === 'pending') || null;

    if (rawRun.status === 'waiting_approval') waitingApprovalCount++;
    if (rawRun.status === 'running') activeRunsCount++;
    if (rawRun.status === 'completed') completedRunsCount++;
    if (rawRun.status === 'failed' || rawRun.status === 'cancelled') failedRunsCount++;

    const completedStepsCount = steps.filter((s) => s.status === 'completed').length;

    let durationMs: number | undefined;
    if (rawRun.started_at && rawRun.completed_at) {
      durationMs = new Date(rawRun.completed_at).getTime() - new Date(rawRun.started_at).getTime();
    }

    return {
      id: rawRun.id,
      user_id: rawRun.user_id,
      task: rawRun.task,
      status: rawRun.status,
      result: rawRun.result,
      error_message: rawRun.error_message,
      thread_id: rawRun.thread_id,
      started_at: rawRun.started_at,
      completed_at: rawRun.completed_at,
      created_at: rawRun.created_at,
      stepsCount: steps.length,
      completedStepsCount,
      pendingApproval,
      durationMs,
    };
  });

  const totalRuns = runs.length;
  const finishedRuns = completedRunsCount + failedRunsCount;
  const successRate = finishedRuns > 0 ? Math.round((completedRunsCount / finishedRuns) * 100) : 100;

  return {
    runs,
    metrics: {
      totalRuns,
      activeRuns: activeRunsCount,
      waitingApproval: waitingApprovalCount,
      completedRuns: completedRunsCount,
      failedRuns: failedRunsCount,
      successRate,
    },
  };
});
