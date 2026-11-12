import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { getAgentRuns, calculateRequestMetrics } from '@/features/requests/services/requests.service';
import { RequestInputForm } from '@/features/requests/components/request-input-form';
import { RequestsLedger } from '@/features/requests/components/requests-ledger';
import { Bot, Play, CheckCircle2, AlertTriangle } from 'lucide-react';

export default async function RequestsPage() {
  // 1 single cached query
  const runs = await getAgentRuns();
  // 0ms in-memory metrics
  const metrics = calculateRequestMetrics(runs);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Agent Tasks</span>
            <div className="h-8 w-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{metrics.totalRequests}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Dispatched directives</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Active Execution</span>
            <div className="h-8 w-8 rounded-full bg-[#22d3ee] flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#22d3ee]">{metrics.activeRuns}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Queued & running</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Awaiting Approval</span>
            <div className="h-8 w-8 rounded-full bg-[#fbbf24] flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#fbbf24]">{metrics.waitingApproval}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Operator checkpoints</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Completed Workflows</span>
            <div className="h-8 w-8 rounded-full bg-[#c8f135] flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(200,241,53,0.35)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#c8f135]">{metrics.completedRuns}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Verified outputs</span>
          </div>
        </GlassCard>
      </div>

      {/* Interactive Command Console */}
      <RequestInputForm />

      {/* Traceable Execution Ledger */}
      <RequestsLedger runs={runs} />
    </div>
  );
}

