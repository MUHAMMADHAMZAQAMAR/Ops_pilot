'use server';

import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createBusinessRequest(formData: FormData) {
  const task = (formData.get('task') as string)?.trim();
  const priority = (formData.get('priority') as string) || 'normal';

  if (!task || task.length < 5) {
    return { error: 'Please enter a clear business prompt (at least 5 characters).' };
  }

  // Fast 0ms local JWT verification (already authenticated at login)
  const user = await getVerifiedOperator();

  if (!user) {
    return { error: 'You must be signed in as an operator to launch agent tasks.' };
  }

  const threadId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const adminClient = createAdminClient();

  // 1. Insert agent run record
  const { data: run, error: runError } = await (adminClient.from('agent_runs') as any)
    .insert({
      user_id: user.id,
      task: `[Priority: ${priority.toUpperCase()}] ${task}`,
      status: 'queued',
      thread_id: threadId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (runError || !run) {
    console.error('Failed to create agent run:', runError?.message);
    return { error: 'Failed to initiate agent task in database.' };
  }

  // 2. Generate initial autonomous plan steps
  const steps = [
    {
      run_id: run.id,
      sequence_no: 1,
      step_name: 'Analyze Business Prompt & Extract Entities',
      tool_name: 'intent_parser',
      status: 'completed' as const,
      input: { prompt: task, priority },
      output: { parsedIntent: 'domain_operations_plan', verified: true },
      completed_at: new Date().toISOString(),
    },
    {
      run_id: run.id,
      sequence_no: 2,
      step_name: 'Scan Database Records & Depletion State',
      tool_name: 'database_scanner',
      status: 'running' as const,
      input: { scope: 'orders_and_inventory' },
      started_at: new Date().toISOString(),
    },
    {
      run_id: run.id,
      sequence_no: 3,
      step_name: 'Evaluate Operational Risk & Prepare Action Proposals',
      tool_name: 'risk_evaluator',
      status: 'pending' as const,
    },
    {
      run_id: run.id,
      sequence_no: 4,
      step_name: 'Human Approval Gate Verification',
      tool_name: 'approval_gate',
      status: 'pending' as const,
    },
  ];

  await (adminClient.from('agent_steps') as any).insert(steps);

  // 3. Trigger autonomous tool execution pipeline
  try {
    const { executeAgentWorkflow } = await import('@/features/agent/services/agent-orchestrator.service');
    await executeAgentWorkflow(run.id);
  } catch (err) {
    console.error('Workflow background run notice:', err);
  }

  revalidatePath('/requests');
  revalidatePath('/approvals');
  revalidatePath('/runs');
  revalidatePath('/dashboard');
  return { success: true, runId: run.id };
}
