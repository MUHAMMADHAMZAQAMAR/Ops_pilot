import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge, BadgeVariant } from '@/components/ui/glass-badge';
import { AgentRunWithDetails } from '../services/requests.service';
import { Bot, Clock, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Layers } from 'lucide-react';

interface RequestsLedgerProps {
  runs: AgentRunWithDetails[];
}

export function RequestsLedger({ runs }: RequestsLedgerProps) {
  return (
    <GlassCard>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Agent Execution Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Traceable history of autonomous runs, tool invocations & human checkpoints
          </p>
        </div>
        <GlassBadge variant="cyan" pulseDot>
          {runs.length} Runs Recorded
        </GlassBadge>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-12 glass-panel-inset rounded-2xl p-6">
          <Bot className="w-8 h-8 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-white">No Agent Operations Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Use the command console above or select a suggested prompt to dispatch your first autonomous business workflow.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-semibold">
                <th className="pb-3 pl-3">Task & Directive</th>
                <th className="pb-3">Run ID</th>
                <th className="pb-3">Steps</th>
                <th className="pb-3">Approvals</th>
                <th className="pb-3">Dispatched</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {runs.map((run) => {
                const statusVariant: Record<string, BadgeVariant> = {
                  completed: 'lime',
                  running: 'cyan',
                  waiting_approval: 'amber',
                  queued: 'glass',
                  failed: 'rose',
                };

                const stepsCount = run.steps?.length || 0;
                const completedSteps = run.steps?.filter((s) => s.status === 'completed').length || 0;
                const hasPendingApproval = run.approvals?.some((a) => a.status === 'pending');

                return (
                  <tr key={run.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Task Title */}
                    <td className="py-4 pl-3 max-w-md">
                      <Link
                        href={`/runs/${run.id}`}
                        className="flex items-start gap-2.5 group hover:text-[#c8f135] transition-colors"
                      >
                        <div className="h-7 w-7 rounded-xl bg-white/[0.06] group-hover:bg-[#c8f135]/20 border border-white/10 flex items-center justify-center text-[#c8f135] shrink-0 mt-0.5 transition-colors">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-white group-hover:text-[#c8f135] block text-xs line-clamp-2 transition-colors">
                            {run.task}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            Thread: {run.thread_id}
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* Run ID */}
                    <td className="py-4 font-mono text-[11px] text-slate-300">
                      {run.id.slice(0, 8)}...
                    </td>

                    {/* Steps Progress */}
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 px-2 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-medium text-slate-300 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#22d3ee]" />
                          <span>{completedSteps}/{stepsCount}</span>
                        </div>
                      </div>
                    </td>

                    {/* Approvals */}
                    <td className="py-4">
                      {hasPendingApproval ? (
                        <GlassBadge variant="amber" pulseDot>
                          Approval Required
                        </GlassBadge>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None pending</span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(run.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 text-center">
                      <GlassBadge
                        variant={statusVariant[run.status] || 'glass'}
                        pulseDot={run.status === 'running' || run.status === 'waiting_approval'}
                      >
                        {run.status.replace('_', ' ')}
                      </GlassBadge>
                    </td>

                    {/* Inspect Link */}
                    <td className="py-4 pr-3 text-right">
                      <Link
                        href={`/runs/${run.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c8f135] hover:text-white transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

