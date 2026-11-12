'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Bot, Clock, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

interface RunsStatsCardsProps {
  metrics: {
    totalRuns: number;
    activeRuns: number;
    waitingApproval: number;
    completedRuns: number;
    failedRuns: number;
    successRate: number;
  };
}

export function RunsStatsCards({ metrics }: RunsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Runs */}
      <GlassCard className="p-4 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Total Orchestrations
          </span>
          <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300">
            <Bot className="w-4 h-4 text-[#c8f135]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.totalRuns}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Lifecycle tracked</span>
            <span>in Supabase ledger</span>
          </p>
        </div>
      </GlassCard>

      {/* Metric 2: Waiting Approval */}
      <GlassCard className="p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Waiting Human Gate
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-300 tracking-tight flex items-center gap-2">
            {metrics.waitingApproval}
            {metrics.waitingApproval > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Operator authorization required
          </p>
        </div>
      </GlassCard>

      {/* Metric 3: Active Executions */}
      <GlassCard className="p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Active / In-Flight
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            <Bot className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-cyan-300 tracking-tight flex items-center gap-2">
            {metrics.activeRuns}
            {metrics.activeRuns > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Executing deterministic tool steps
          </p>
        </div>
      </GlassCard>

      {/* Metric 4: Success Rate */}
      <GlassCard className="p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#c8f135]/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Execution Integrity
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <TrendingUp className="w-4 h-4 text-[#c8f135]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {metrics.successRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{metrics.completedRuns} completed successfully</span>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

