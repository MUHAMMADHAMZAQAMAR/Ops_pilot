'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AgentRunSummary } from '../services/runs.service';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import {
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Bot,
  Activity,
  Layers,
} from 'lucide-react';

interface RunsListViewProps {
  runs: AgentRunSummary[];
}

export function RunsListView({ runs }: RunsListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'failed') {
          if (run.status !== 'failed' && run.status !== 'cancelled') return false;
        } else if (run.status !== statusFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTask = run.task.toLowerCase().includes(query);
        const matchesId = run.id.toLowerCase().includes(query);
        const matchesAction = run.pendingApproval?.action_type?.toLowerCase().includes(query);
        return matchesTask || matchesId || matchesAction;
      }

      return true;
    });
  }, [runs, searchQuery, statusFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: runs.length,
      waiting_approval: runs.filter((r) => r.status === 'waiting_approval').length,
      running: runs.filter((r) => r.status === 'running').length,
      completed: runs.filter((r) => r.status === 'completed').length,
      failed: runs.filter((r) => r.status === 'failed' || r.status === 'cancelled').length,
    };
  }, [runs]);

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runs by task prompt or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-full glass-panel-inset text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full glass-panel-inset text-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium ${
              statusFilter === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('waiting_approval')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium flex items-center gap-1.5 ${
              statusFilter === 'waiting_approval'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Waiting Approval ({counts.waiting_approval})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('running')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium flex items-center gap-1.5 ${
              statusFilter === 'running'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Running ({counts.running})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Completed ({counts.completed})</span>
          </button>
        </div>
      </div>

      {/* Runs Ledger Cards */}
      {filteredRuns.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Bot className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No agent executions found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No orchestrations match "${searchQuery}". Clear your search or filter.`
              : 'Autonomous workflows triggered from the Requests portal will appear here in real time.'}
          </p>
          <div className="mt-4">
            <Link href="/requests">
              <GlassButton variant="primary">
                Dispatch New Task
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run) => {
            const isWaiting = run.status === 'waiting_approval';
            const isRunning = run.status === 'running';
            const isCompleted = run.status === 'completed';
            const isFailed = run.status === 'failed' || run.status === 'cancelled';

            const progressPercent = run.stepsCount > 0
              ? Math.round((run.completedStepsCount / run.stepsCount) * 100)
              : 0;

            return (
              <GlassCard
                key={run.id}
                className={`p-5 transition-all duration-300 hover:scale-[1.005] hover:border-white/20 ${
                  isWaiting ? 'border-amber-400/30 bg-amber-500/[0.02]' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Task & Metadata */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      {isWaiting && (
                        <GlassBadge variant="amber" className="flex items-center gap-1.5 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Waiting Approval
                        </GlassBadge>
                      )}
                      {isRunning && (
                        <GlassBadge variant="cyan" className="flex items-center gap-1.5 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          Running Tools
                        </GlassBadge>
                      )}
                      {isCompleted && (
                        <GlassBadge variant="emerald" className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Completed
                        </GlassBadge>
                      )}
                      {isFailed && (
                        <GlassBadge variant="rose" className="flex items-center gap-1.5 font-semibold">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          {run.status === 'cancelled' ? 'Rejected' : 'Failed'}
                        </GlassBadge>
                      )}

                      {/* Step Progress Pill */}
                      <span className="text-[11px] font-mono text-slate-400 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>Step {run.completedStepsCount}/{run.stepsCount || 4}</span>
                      </span>

                      {/* Timestamp */}
                      <span className="text-[11px] text-slate-500">
                        {new Date(run.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })} • {new Date(run.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Task Title */}
                    <div className="text-sm font-semibold text-white tracking-tight leading-snug">
                      {run.task}
                    </div>

                    {/* Pending Human Approval Pill */}
                    {run.pendingApproval && (
                      <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl max-w-fit">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          Action Gated: <strong className="font-semibold text-white">{run.pendingApproval.action_type.replace(/_/g, ' ')}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Mini Progress & Execution Details */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 text-right shrink-0">
                    <div className="w-28 sm:w-36">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Workflow</span>
                        <span className="font-mono text-white font-medium">{progressPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-emerald-400'
                              : isWaiting
                              ? 'bg-amber-400'
                              : isFailed
                              ? 'bg-rose-400'
                              : 'bg-cyan-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {run.durationMs && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Runtime: {(run.durationMs / 1000).toFixed(2)}s
                      </div>
                    )}
                  </div>

                  {/* Right Column: Single Action Button */}
                  <div className="shrink-0 flex items-center justify-end">
                    <Link href={`/runs/${run.id}`}>
                      <GlassButton
                        variant={isWaiting ? 'amber' : 'primary'}
                        className="flex items-center gap-1.5 font-semibold text-xs"
                      >
                        <span>Inspect Timeline</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
