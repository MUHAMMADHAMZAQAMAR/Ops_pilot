'use client';

import React, { useState } from 'react';
import { AgentStep } from '@/types/database';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import {
  CheckCircle2,
  Clock,
  Play,
  XCircle,
  ChevronDown,
  ChevronRight,
  Terminal,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface StepTimelineProps {
  steps: AgentStep[];
}

export function StepTimeline({ steps }: StepTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    // Expand the latest active or completed step by default
    [steps[steps.length - 1]?.id || '']: true,
  });

  function toggleStep(id: string) {
    setExpandedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Autonomous Execution Graph
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step verification, tool input/output contracts & state checkpoints
          </p>
        </div>
        <GlassBadge variant="cyan" pulseDot>
          {steps.filter((s) => s.status === 'completed').length} / {steps.length} Steps Completed
        </GlassBadge>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/[0.08]">
        {steps.map((step, idx) => {
          const isExpanded = !!expandedSteps[step.id];
          const isCompleted = step.status === 'completed';
          const isRunning = step.status === 'running';
          const isFailed = step.status === 'failed';

          return (
            <div key={step.id} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-[30px] top-1.5 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-[#c8f135] text-slate-950 shadow-[0_0_12px_rgba(200,241,53,0.4)]'
                    : isRunning
                    ? 'bg-[#22d3ee] text-slate-950 animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                    : isFailed
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/[0.1] text-slate-400 border border-white/20'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isRunning ? (
                  <Play className="w-3 h-3 fill-slate-950" />
                ) : isFailed ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <span>{step.sequence_no}</span>
                )}
              </div>

              {/* Step Card */}
              <div className="glass-panel-inset rounded-2xl p-4 transition-all">
                <div
                  onClick={() => toggleStep(step.id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      STEP {String(step.sequence_no).padStart(2, '0')}
                    </span>
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      {step.step_name}
                    </h4>
                    {step.tool_name && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[#22d3ee]">
                        tool: {step.tool_name}
                      </span>
                    )}
                    {typeof step.output === 'object' && step.output !== null && (step.output as any).plannerModel && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-[#c8f135]" />
                        <span>{(step.output as any).plannerModel}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <GlassBadge
                      variant={
                        isCompleted ? 'lime' : isRunning ? 'cyan' : isFailed ? 'rose' : 'glass'
                      }
                      pulseDot={isRunning}
                    >
                      {step.status}
                    </GlassBadge>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-white transition-colors p-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible I/O Details */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-3 text-xs animate-fade-in-up">
                    {/* Input */}
                    {step.input && (
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          Tool Input:
                        </span>
                        <pre className="p-3 rounded-xl bg-black/40 border border-white/[0.05] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Neural Rationale Callout */}
                    {typeof step.output === 'object' && step.output !== null && (step.output as any).reasoning && (
                      <div className="p-3 rounded-xl bg-cyan-500/[0.05] border border-cyan-500/20 text-xs text-slate-200">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px] mb-1">
                          <Sparkles className="w-3 h-3 text-[#c8f135]" />
                          <span>Gemini Neural Rationale:</span>
                        </div>
                        <p className="leading-relaxed">{(step.output as any).reasoning}</p>
                      </div>
                    )}

                    {/* Output */}
                    {step.output && (
                      <div>
                        <span className="text-[10px] font-mono text-[#c8f135] uppercase tracking-wider block mb-1">
                          Verified Tool Output:
                        </span>
                        <pre className="p-3 rounded-xl bg-black/40 border border-[#c8f135]/20 text-[11px] font-mono text-[#c8f135] overflow-x-auto max-h-48">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Error */}
                    {step.error_message && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                        <strong>Execution Error:</strong> {step.error_message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

