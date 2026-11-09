"use client";

import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Terminal, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskStep } from "@/types/agent";

interface StepTimelineProps {
  steps: TaskStep[];
  currentStepIndex: number;
  toolResults?: Record<string, unknown>;
}

export function StepTimeline({ steps = [], currentStepIndex, toolResults = {} }: StepTimelineProps) {
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center text-xs text-zinc-500">
        Awaiting LLM Execution Plan generation...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const isCurrent = idx === currentStepIndex;
        const isCompleted = idx < currentStepIndex || step.status === "COMPLETED";
        const hasResult = toolResults[step.toolName] !== undefined;

        return (
          <div
            key={step.id || idx}
            className={`rounded-xl border p-4 transition-all ${
              isCurrent
                ? "border-emerald-500/50 bg-zinc-900/80 shadow-md"
                : isCompleted
                ? "border-zinc-800/80 bg-zinc-950/60"
                : "border-zinc-900 bg-zinc-950/30 opacity-70"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-500">Step {idx + 1}:</span>
                <span className="text-sm font-semibold text-zinc-200">{step.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    step.riskLevel === "CRITICAL"
                      ? "critical"
                      : step.riskLevel === "HIGH"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {step.riskLevel} Risk
                </Badge>
                <span className="font-mono text-xs text-emerald-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {step.toolName}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-3">{step.description}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 uppercase">
                <Terminal className="h-3.5 w-3.5" />
                <span>Validated Input Parameters:</span>
              </div>
              <pre className="rounded bg-zinc-950 p-2.5 text-[11px] font-mono text-zinc-300 border border-zinc-900 overflow-x-auto">
                {JSON.stringify(step.parameters, null, 2)}
              </pre>
            </div>

            {hasResult && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Untrusted Output Context (Isolated):</span>
                </div>
                <pre className="rounded bg-zinc-950 p-2.5 text-[11px] font-mono text-emerald-300 border border-emerald-950 overflow-x-auto">
                  {typeof toolResults[step.toolName] === "string"
                    ? (toolResults[step.toolName] as string)
                    : JSON.stringify(toolResults[step.toolName], null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

