'use server';

import { revalidatePath } from 'next/cache';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';

export async function createSchedule(formData: FormData) {
  const user = await getVerifiedOperator();
  if (!user) {
    return { error: 'Authentication required.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const prompt = (formData.get('prompt') as string)?.trim();
  const cronExpression = (formData.get('cron_expression') as string)?.trim() || '0 8 * * *';
  const scheduleLabel = (formData.get('schedule_label') as string)?.trim() || 'Daily at 08:00 AM';
  const priority = ((formData.get('priority') as string) || 'normal') as
    | 'normal'
    | 'urgent'
    | 'critical';

  if (!name || !prompt || prompt.length < 5) {
    return { error: 'Please provide a routine name and an agent directive prompt.' };
  }

  const supabase = createAdminClient();
  const { error } = await (supabase.from('automation_schedules' as any) as any).insert({
    name,
    prompt,
    cron_expression: cronExpression,
    schedule_label: scheduleLabel,
    priority,
    is_active: true,
    created_by: user.id,
  });

  if (error) {
    return {
      error:
        'Schedule table not initialized in Supabase yet. Run supabase/migrations/002_automation_schedules.sql in Supabase SQL Editor.',
    };
  }

  revalidatePath('/automation');
  return { success: true };
}

export async function toggleScheduleStatus(scheduleId: string, nextActive: boolean) {
  const user = await getVerifiedOperator();
  if (!user) {
    return { error: 'Authentication required.' };
  }

  if (scheduleId.startsWith('sched-default-')) {
    return {
      error:
        'Default preview schedule cannot be persisted until 002_automation_schedules.sql is applied.',
    };
  }

  const supabase = createAdminClient();
  const { error } = await (supabase.from('automation_schedules' as any) as any)
    .update({ is_active: nextActive })
    .eq('id', scheduleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/automation');
  return { success: true };
}

export async function triggerScheduleNow(
  scheduleId: string,
  prompt: string,
  priority: string = 'normal'
) {
  const user = await getVerifiedOperator();
  if (!user) {
    return { error: 'Authentication required.' };
  }

  const adminClient = createAdminClient();
  const threadId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const { data: run, error: runError } = await (adminClient.from('agent_runs') as any)
    .insert({
      user_id: user.id,
      task: `[Scheduled • ${priority.toUpperCase()}] ${prompt}`,
      status: 'queued',
      thread_id: threadId,
    })
    .select('id')
    .single();

  if (runError || !run) {
    return { error: 'Failed to dispatch scheduled run.' };
  }

  const steps = [
    {
      run_id: run.id,
      sequence_no: 1,
      step_name: 'Decompose Intent & Formulate Execution Plan',
      tool_name: 'gemini_neural_planner',
      status: 'completed' as const,
      input: { prompt, priority, source: 'automation_schedule' },
      output: { status: 'planned' },
      started_at: new Date().toISOString(),
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

  try {
    const { executeAgentWorkflow } = await import(
      '@/features/agent/services/agent-orchestrator.service'
    );
    await executeAgentWorkflow(run.id);
  } catch (err) {
    console.error('Scheduled workflow run notice:', err);
  }

  if (!scheduleId.startsWith('sched-default-')) {
    const { data: sched } = await (adminClient.from('automation_schedules' as any) as any)
      .select('run_count')
      .eq('id', scheduleId)
      .single();

    await (adminClient.from('automation_schedules' as any) as any)
      .update({
        last_run_at: new Date().toISOString(),
        run_count: (sched?.run_count || 0) + 1,
      })
      .eq('id', scheduleId);
  }

  revalidatePath('/automation');
  return { success: true, runId: run.id };
}
