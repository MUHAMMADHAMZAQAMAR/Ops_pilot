'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { DraftMetrics } from '../services/drafts.service';
import { Mail, Clock, Send, ShieldX, CheckCircle2 } from 'lucide-react';

interface DraftsStatsCardsProps {
  metrics: DraftMetrics;
}

export function DraftsStatsCards({ metrics }: DraftsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Pending Review */}
      <GlassCard className="p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Pending Dispatch
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-300 tracking-tight flex items-center gap-2">
            {metrics.pendingReview}
            {metrics.pendingReview > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Awaiting operator approval
          </p>
        </div>
      </GlassCard>

      {/* Dispatched */}
      <GlassCard className="p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Dispatched & Sent
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <Send className="w-4 h-4 text-[#c8f135]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {metrics.approved}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Transmitted to customers</span>
          </p>
        </div>
      </GlassCard>

      {/* Rejected */}
      <GlassCard className="p-4 flex flex-col justify-between relative overflow-hidden group hover:border-rose-400/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Rejected
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <ShieldX className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-rose-300 tracking-tight">
            {metrics.rejected}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Filtered out by operator
          </p>
        </div>
      </GlassCard>

      {/* Delivery Rate */}
      <GlassCard className="p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#c8f135]/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Clearance Rate
          </span>
          <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300">
            <Mail className="w-4 h-4 text-[#22d3ee]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.deliveryRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metrics.totalDrafts} total prepared drafts
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

