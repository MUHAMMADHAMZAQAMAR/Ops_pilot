import React from 'react';
import Link from 'next/link';
import { getRunsOverview } from '@/features/runs/services/runs.service';
import { RunsStatsCards } from '@/features/runs/components/runs-stats-cards';
import { RunsListView } from '@/features/runs/components/runs-list-view';
import { GlassButton } from '@/components/ui/glass-button';
import { Plus, Bot } from 'lucide-react';

export const metadata = {
  title: 'Agent Runs | OpsPilot Orchestration',
  description: 'Real-time telemetry and state ledger for autonomous agent workflows.',
};

export default async function RunsPage() {
  const { runs, metrics } = await getRunsOverview();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c8f135]">
            <Bot className="w-4 h-4" />
            <span>Autonomous Execution Core</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Agent Orchestration Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live monitoring of autonomous multi-step agent executions, deterministic tool actions, and human-in-the-loop verification gates.
          </p>
        </div>

        <div className="shrink-0">
          <Link href="/requests">
            <GlassButton variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Dispatch New Directive</span>
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <RunsStatsCards metrics={metrics} />

      {/* Runs Ledger and Filters */}
      <RunsListView runs={runs} />
    </div>
  );
}
