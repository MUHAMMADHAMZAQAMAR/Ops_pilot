"use client";

import { CheckCircle2, Circle, Clock, AlertTriangle, ShieldCheck, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GraphVisualizerProps {
  currentNode?: string;
  status: string;
  riskLevel?: string;
}

const NODES = [
  { id: "sanitize", name: "Firewall & Sanitize", type: "Security Gateway" },
  { id: "plan", name: "Decompose & Plan", type: "Untrusted LLM Advisor" },
  { id: "risk_eval", name: "Risk Taxonomy", type: "Dual-Boundary Gate" },
  { id: "tool_runner", name: "Sandboxed Tools", type: "Execution Engine" },
  { id: "verify", name: "Outcome Verification", type: "Integrity Assertion" },
];

export function GraphVisualizer({ currentNode = "plan", status, riskLevel = "LOW" }: GraphVisualizerProps) {
  const currentIndex = NODES.findIndex((n) => n.id === currentNode);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            LangGraph Finite State Machine Topology
          </h3>
          <p className="text-xs text-zinc-400">
            Real-time state channels, checkpointed workflow boundaries, and HITL gates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              status === "COMPLETED"
                ? "success"
                : status === "WAITING_APPROVAL"
                ? "warning"
                : status === "FAILED"
                ? "critical"
                : "default"
            }
          >
            {status}
          </Badge>
          <Badge
            variant={
              riskLevel === "CRITICAL"
                ? "critical"
                : riskLevel === "HIGH"
                ? "warning"
                : "secondary"
            }
          >
            Risk: {riskLevel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {NODES.map((node, index) => {
          const isPast = status === "COMPLETED" || index < currentIndex;
          const isCurrent = status !== "COMPLETED" && index === currentIndex;
          const isPending = !isPast && !isCurrent;

          return (
            <div
              key={node.id}
              className={cn(
                "relative rounded-lg border p-3 flex flex-col justify-between transition-all",
                isCurrent
                  ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50"
                  : isPast
                  ? "border-zinc-800 bg-zinc-900/50 text-zinc-300"
                  : "border-zinc-900 bg-zinc-950 text-zinc-600"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-zinc-500">0{index + 1}</span>
                {isPast ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  status === "WAITING_APPROVAL" ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                  )
                ) : (
                  <Circle className="h-3.5 w-3.5 text-zinc-700" />
                )}
              </div>
              <div>
                <p className={cn("text-xs font-semibold leading-tight", isCurrent ? "text-emerald-300" : isPast ? "text-zinc-200" : "text-zinc-500")}>
                  {node.name}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">{node.type}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

