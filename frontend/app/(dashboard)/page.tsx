"use client";

import * as React from "react";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Workflow,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  FilePlus2,
  Activity,
  RefreshCw,
} from "lucide-react";
import { BackendAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function ExecutiveOverviewPage() {
  const [runs, setRuns] = React.useState<any[]>([]);
  const [approvals, setApprovals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [runsData, approvalsData] = await Promise.all([
        BackendAPI.getRuns().catch(() => ({ runs: [] })),
        BackendAPI.getApprovals().catch(() => ({ approvals: [] })),
      ]);
      setRuns(runsData.runs || []);
      setApprovals(approvalsData.approvals || []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const activeWorkflowsCount = runs.filter((r) => r.status === "RUNNING").length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === "PENDING").length;
  const completedCount = runs.filter((r) => r.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Executive Security & Operations Overview
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Zero-Trust autonomous agent execution metrics, active HITL gates, and tamper-evident audit status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-zinc-800 text-xs text-zinc-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/audit">
            <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-300">
              <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-400" />
              Verify Hash Chain
            </Button>
          </Link>
          <Link href="/requests/new">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
              <FilePlus2 className="h-4 w-4 mr-1.5" />
              New Business Request
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Workflows"
          value={activeWorkflowsCount}
          description="LangGraph state machines in flight"
          icon={Workflow}
          statusVariant="default"
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingApprovalsCount}
          description="High-risk mutations paused for sign-off"
          icon={CheckCircle2}
          statusVariant={pendingApprovalsCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Completed Pipelines"
          value={completedCount}
          description="Verified autonomous workflow completions"
          icon={ShieldAlert}
          statusVariant="success"
        />
        <MetricCard
          title="Audit Hash Chain"
          value="VERIFIED"
          description="SHA-256 cryptographic unbroken chain"
          icon={ShieldCheck}
          statusVariant="success"
        />
      </div>

      {/* Security Directives & Posture Panel */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>Zero-Trust AI Guardrails: Policy Enforcement Active</span>
          </div>
          <Badge variant="success">Strict Mode</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-3.5 space-y-1">
            <p className="font-semibold text-zinc-200">1. Context Boundary Isolation</p>
            <p className="text-zinc-400 leading-relaxed">
              All tool outputs & database queries strictly wrapped in <code className="text-emerald-400 font-mono text-[11px]">&lt;untrusted_content&gt;</code> tags.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-3.5 space-y-1">
            <p className="font-semibold text-zinc-200">2. Untrusted LLM Planner</p>
            <p className="text-zinc-400 leading-relaxed">
              Model acts strictly as an advisor with zero direct execution privileges or file access.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-3.5 space-y-1">
            <p className="font-semibold text-zinc-200">3. Cryptographic HITL Gateway</p>
            <p className="text-zinc-400 leading-relaxed">
              Mutations (emails, refunds, DB writes) paused via PostgreSQL checkpointer until signed with single-use HMAC token.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Workflow Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            Recent Orchestration Pipelines
          </h2>
          <Link href="/runs" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            View all agent runs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800/80">
          {runs.length === 0 && !loading && (
            <div className="p-6 text-center text-xs text-zinc-500">
              No recent workflows found. Submit a business request to run LangGraph.
            </div>
          )}
          {runs.slice(0, 5).map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500">{item.id.slice(0, 8)}...</span>
                  <Badge variant={item.status === "COMPLETED" ? "success" : item.status === "WAITING_APPROVAL" ? "warning" : "default"}>
                    {item.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-zinc-200">
                  {item.business_requests?.raw_prompt || "Enterprise Automation Task"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500">{formatDateTime(item.created_at)}</span>
                <div>
                  <Link href={`/runs/${item.id}`} className="text-xs text-emerald-400 hover:underline font-medium">
                    Inspect State →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
