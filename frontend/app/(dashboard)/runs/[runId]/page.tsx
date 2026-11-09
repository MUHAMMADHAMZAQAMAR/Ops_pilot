"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { GraphVisualizer } from "@/components/agent/graph-visualizer";
import { StepTimeline } from "@/components/agent/step-timeline";
import { ActionInspector } from "@/components/approvals/action-inspector";
import { JwtSignerModal } from "@/components/approvals/jwt-signer";
import { Button } from "@/components/ui/button";
import { TaskStep } from "@/types/agent";
import { RefreshCw, Database, Terminal, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BackendAPI } from "@/lib/api";

export default function RunViewerPage() {
  const params = useParams();
  const runId = (params?.runId as string) || "";

  const [runData, setRunData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [signerModalOpen, setSignerModalOpen] = React.useState(false);

  const fetchRun = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const data = await BackendAPI.getRunById(runId);
      setRunData(data.run);
    } catch {
      setRunData(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRun();
  }, [runId]);

  const status = runData?.status || "RUNNING";
  const graphJson = runData?.execution_graph_json || {};
  const toolResults = graphJson.toolResults || {};
  const auditTrail = graphJson.auditTrail || [];

  // Reconstruct steps from tasks table or fallback
  const tasks: TaskStep[] = (runData?.tasks || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description || "",
    toolName: t.title.toLowerCase().replace(/\s+/g, "_"),
    parameters: {},
    riskLevel: t.risk_level || "LOW",
    dependencies: t.dependency_ids || [],
    status: t.status,
  }));

  const pendingApproval = (runData?.approvals || []).find((a: any) => a.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/runs" className="text-zinc-500 hover:text-zinc-300">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              Run Inspector: <span className="font-mono text-emerald-400">{runId}</span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Durable PostgreSQL checkpoint thread: <code className="font-mono text-zinc-300">{runId}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRun}
            disabled={loading}
            className="border-zinc-800 text-xs text-zinc-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
            Refresh State
          </Button>
        </div>
      </div>

      {/* State Machine Visualizer */}
      <GraphVisualizer
        currentNode={runData?.current_step_id || "verify"}
        status={status}
        riskLevel={pendingApproval ? "HIGH" : "LOW"}
      />

      {/* HITL Approval Gate Callout if Waiting */}
      {status === "WAITING_APPROVAL" && pendingApproval && (
        <ActionInspector
          taskId={pendingApproval.task_id}
          runId={runId}
          actionName="email_sender"
          riskLevel="HIGH"
          parameters={{ notice: "Pending cryptographic signature" }}
          tokenHash={pendingApproval.token_hash}
          onApprove={() => setSignerModalOpen(true)}
          onReject={async () => {
            await BackendAPI.resolveApproval({
              token: pendingApproval.token_hash,
              decision: "REJECTED",
            });
            fetchRun();
          }}
        />
      )}

      {/* Steps Timeline & Parameter Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              Decomposed Execution Steps
            </h2>
            <span className="text-xs text-zinc-500 font-mono">{tasks.length} Step(s)</span>
          </div>
          <StepTimeline
            steps={tasks}
            currentStepIndex={tasks.length}
            toolResults={toolResults}
          />
        </div>

        {/* Checkpoint & Security Snapshot */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            PostgreSQL Checkpoint Metadata
          </h2>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 text-xs">
            <div>
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Active Thread ID:</span>
              <p className="font-mono text-zinc-300 break-all text-[11px]">{runId}</p>
            </div>
            <div>
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Checkpointer Adapter:</span>
              <p className="font-medium text-emerald-400">PostgresWorkflowCheckpointer</p>
            </div>
            <div>
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Tenancy Boundary:</span>
              <p className="text-zinc-400">Org: {runData?.org_id || "RLS Enforced"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Cryptographic Signing */}
      {pendingApproval && (
        <JwtSignerModal
          open={signerModalOpen}
          onOpenChange={setSignerModalOpen}
          approvalToken={pendingApproval.token_hash}
          actionName="email_sender"
          taskId={pendingApproval.task_id}
          onSuccess={() => {
            fetchRun();
          }}
        />
      )}
    </div>
  );
}
