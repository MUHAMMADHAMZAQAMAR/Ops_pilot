import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRunById } from '@/features/runs/services/runs.service';
import { StepTimeline } from '@/features/runs/components/step-timeline';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import {
  Bot,
  ArrowLeft,
  Clock,
  ShieldAlert,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react';

export default async function RunDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getRunById(id);

  if (!run) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/requests"
        className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
        <span>Back to Requests Ledger</span>
      </Link>

      {/* Top Run Header Banner */}
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950 shrink-0 shadow-[0_0_20px_rgba(200,241,53,0.35)]">
              <Bot className="w-6 h-6 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <GlassBadge
                  variant={
                    run.status === 'completed'
                      ? 'lime'
                      : run.status === 'running'
                      ? 'cyan'
                      : run.status === 'waiting_approval'
                      ? 'amber'
                      : 'rose'
                  }
                  pulseDot={run.status === 'running' || run.status === 'waiting_approval'}
                >
                  {run.status.replace(/_/g, ' ')}
                </GlassBadge>
                <span className="text-[11px] font-mono text-slate-400">
                  Thread: {run.thread_id}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {run.task}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span>
                  Dispatched:{' '}
                  {new Date(run.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {run.completed_at && (
                  <span>
                    Completed:{' '}
                    {new Date(run.completed_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Link if waiting for human decision */}
          {run.status === 'waiting_approval' && (
            <Link href="/approvals">
              <GlassButton variant="amber" className="text-xs font-bold whitespace-nowrap">
                Review Approval Gate <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </GlassButton>
            </Link>
          )}
        </div>
      </GlassCard>

      {/* Two-Column Grid: Visual Graph Timeline & Action Artifacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Step Execution Graph (8 cols) */}
        <div className="lg:col-span-8">
          <StepTimeline steps={run.steps} />
        </div>

        {/* Right Column: Linked Approvals & Drafts Artifacts (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Approvals Pod */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#fbbf24]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Associated Approval Gates
                </h3>
              </div>
              <GlassBadge variant="glass">{run.approvals.length}</GlassBadge>
            </div>

            {run.approvals.length === 0 ? (
              <p className="text-xs text-slate-400 glass-panel-inset rounded-xl p-3 text-center">
                No sensitive gates attached to this workflow.
              </p>
            ) : (
              <div className="space-y-3">
                {run.approvals.map((app) => (
                  <div key={app.id} className="glass-panel-inset rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white capitalize">
                        {app.action_type.replace(/_/g, ' ')}
                      </span>
                      <GlassBadge
                        variant={app.status === 'approved' ? 'lime' : app.status === 'pending' ? 'amber' : 'rose'}
                      >
                        {app.status}
                      </GlassBadge>
                    </div>
                    <pre className="text-[10px] font-mono text-slate-300 p-2 rounded-xl bg-black/30 overflow-x-auto max-h-24">
                      {JSON.stringify(app.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Customer Message Drafts Pod */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#22d3ee]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Prepared Message Drafts
                </h3>
              </div>
              <GlassBadge variant="glass">{run.drafts.length}</GlassBadge>
            </div>

            {run.drafts.length === 0 ? (
              <p className="text-xs text-slate-400 glass-panel-inset rounded-xl p-3 text-center">
                No customer communications prepared.
              </p>
            ) : (
              <div className="space-y-3">
                {run.drafts.map((d) => (
                  <div key={d.id} className="glass-panel-inset rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#22d3ee]">Customer Notice</span>
                      <GlassBadge variant="cyan">{d.status}</GlassBadge>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic bg-black/20 p-2.5 rounded-xl border border-white/[0.04]">
                      "{d.content}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

