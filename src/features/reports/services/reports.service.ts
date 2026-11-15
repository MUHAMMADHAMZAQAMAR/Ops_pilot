import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ComplianceAuditRecord {
  id: string;
  category: 'agent_run' | 'approval_gate' | 'customer_draft';
  timestamp: string;
  title: string;
  status: string;
  actor: string;
  details: string;
  durationSeconds: number | null;
  runId: string | null;
}

export interface ComplianceReportSummary {
  records: ComplianceAuditRecord[];
  metrics: {
    totalEvents: number;
    completedRuns: number;
    approvedGates: number;
    rejectedGates: number;
    dispatchedDrafts: number;
    avgDurationSeconds: number;
  };
}

/**
 * Aggregates immutable audit & compliance records across agent runs,
 * human approval gates, and customer communication drafts.
 */
export const getComplianceReportData = cache(async (): Promise<ComplianceReportSummary> => {
  const supabase = createAdminClient();

  const [runsRes, approvalsRes, draftsRes] = await Promise.all([
    supabase
      .from('agent_runs')
      .select('id, task, status, result, started_at, completed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('action_approvals')
      .select('id, run_id, action_type, status, payload, reviewed_at, executed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('message_drafts')
      .select('id, run_id, status, content, created_at, customer:customers(name, email), order:orders(order_number)')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const records: ComplianceAuditRecord[] = [];
  let completedRuns = 0;
  let approvedGates = 0;
  let rejectedGates = 0;
  let dispatchedDrafts = 0;
  let totalDurationSec = 0;
  let durationSamples = 0;

  for (const run of (runsRes.data || []) as any[]) {
    if (run.status === 'completed') completedRuns++;

    let durationSeconds: number | null = null;
    if (run.started_at && run.completed_at) {
      durationSeconds = Number(
        ((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(2)
      );
      if (durationSeconds >= 0) {
        totalDurationSec += durationSeconds;
        durationSamples++;
      }
    }

    const planner = run.result?.planner || 'opspilot-orchestrator';
    records.push({
      id: run.id,
      category: 'agent_run',
      timestamp: run.completed_at || run.created_at,
      title: run.task,
      status: run.status,
      actor: String(planner),
      details: run.result?.reasoning || `Execution status: ${run.status}`,
      durationSeconds,
      runId: run.id,
    });
  }

  for (const approval of (approvalsRes.data || []) as any[]) {
    if (approval.status === 'approved' || approval.status === 'executed') approvedGates++;
    if (approval.status === 'rejected') rejectedGates++;

    const actionLabel = String(approval.action_type || 'action').replace(/_/g, ' ');
    const skuOrOrder =
      approval.payload?.product_sku ||
      approval.payload?.order_number ||
      approval.id.slice(0, 8);

    records.push({
      id: approval.id,
      category: 'approval_gate',
      timestamp: approval.executed_at || approval.reviewed_at || approval.created_at,
      title: `Gate: ${actionLabel} (${skuOrOrder})`,
      status: approval.status,
      actor: approval.reviewed_at ? 'Human Operator' : 'Pending Operator',
      details: JSON.stringify(approval.payload || {}),
      durationSeconds: null,
      runId: approval.run_id || null,
    });
  }

  for (const draft of (draftsRes.data || []) as any[]) {
    if (draft.status === 'approved') dispatchedDrafts++;

    const recipient = draft.customer?.name || draft.customer?.email || 'Customer';
    const orderTag = draft.order?.order_number ? ` • #${draft.order.order_number}` : '';

    records.push({
      id: draft.id,
      category: 'customer_draft',
      timestamp: draft.created_at,
      title: `Customer Notice: ${recipient}${orderTag}`,
      status: draft.status,
      actor: draft.status === 'approved' ? 'Operator Authorized' : 'Agent Staged',
      details: String(draft.content || '').slice(0, 160),
      durationSeconds: null,
      runId: draft.run_id || null,
    });
  }

  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    records,
    metrics: {
      totalEvents: records.length,
      completedRuns,
      approvedGates,
      rejectedGates,
      dispatchedDrafts,
      avgDurationSeconds:
        durationSamples > 0 ? Number((totalDurationSec / durationSamples).toFixed(2)) : 0,
    },
  };
});
