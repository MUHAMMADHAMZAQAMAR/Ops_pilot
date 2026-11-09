"use client";

import { ShieldAlert, Key, CheckCircle, XCircle, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ActionInspectorProps {
  taskId: string;
  runId: string;
  actionName: string;
  riskLevel: string;
  parameters: Record<string, unknown>;
  tokenHash: string;
  onApprove: () => void;
  onReject: () => void;
}

export function ActionInspector({
  taskId,
  runId,
  actionName,
  riskLevel,
  parameters,
  tokenHash,
  onApprove,
  onReject,
}: ActionInspectorProps) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-amber-900/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              Human-in-the-Loop Mutation Gate Active
            </h3>
            <p className="text-xs text-zinc-400">
              Workflow execution halted. Requires cryptographic single-use JWT authorization.
            </p>
          </div>
        </div>
        <Badge variant={riskLevel === "CRITICAL" ? "critical" : "warning"}>
          {riskLevel} RISK MUTATION
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <span className="font-mono text-zinc-500 uppercase">Target Tool Action:</span>
          <p className="font-mono font-semibold text-amber-300">{actionName}</p>
        </div>
        <div className="space-y-1">
          <span className="font-mono text-zinc-500 uppercase">Task Identifier:</span>
          <p className="font-mono text-zinc-300">{taskId}</p>
        </div>
        <div className="space-y-1 md:col-span-2">
          <span className="font-mono text-zinc-500 uppercase flex items-center gap-1.5">
            <Key className="h-3 w-3 text-amber-400" />
            Cryptographic Token Hash (SHA-256):
          </span>
          <p className="font-mono text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800 break-all">
            {tokenHash}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 uppercase">
          <FileCode className="h-3.5 w-3.5" />
          <span>Payload Inspection:</span>
        </div>
        <pre className="rounded-lg bg-zinc-950 p-3 text-xs font-mono text-zinc-300 border border-zinc-800 max-h-48 overflow-y-auto">
          {JSON.stringify(parameters, null, 2)}
        </pre>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-900/30">
        <Button
          variant="destructive"
          onClick={onReject}
          className="flex items-center gap-2"
        >
          <XCircle className="h-4 w-4" />
          <span>Reject & Abort Run</span>
        </Button>
        <Button
          onClick={onApprove}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Cryptographically Sign & Authorize</span>
        </Button>
      </div>
    </div>
  );
}

