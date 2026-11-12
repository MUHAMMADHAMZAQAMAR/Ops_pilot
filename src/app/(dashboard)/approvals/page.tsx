import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { getActionApprovals, calculateApprovalMetrics } from '@/features/approvals/services/approvals.service';
import { ApprovalsList } from '@/features/approvals/components/approvals-list';
import { ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default async function ApprovalsPage() {
  // 1 single cached query
  const approvals = await getActionApprovals();
  // 0ms in-memory metrics
  const metrics = calculateApprovalMetrics(approvals);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Pending Review</span>
            <div className="h-8 w-8 rounded-full bg-[#fbbf24] flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#fbbf24]">{metrics.pendingCount}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Awaiting human signoff</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Authorized & Executed</span>
            <div className="h-8 w-8 rounded-full bg-[#c8f135] flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(200,241,53,0.35)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#c8f135]">{metrics.approvedCount}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Committed to database</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Rejected Actions</span>
            <div className="h-8 w-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-rose-400">{metrics.rejectedCount}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Blocked proposals</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Checkpoints</span>
            <div className="h-8 w-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{metrics.total}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Audited safety gates</span>
          </div>
        </GlassCard>
      </div>

      {/* Approvals Interactive List & History */}
      <ApprovalsList approvals={approvals} />
    </div>
  );
}

