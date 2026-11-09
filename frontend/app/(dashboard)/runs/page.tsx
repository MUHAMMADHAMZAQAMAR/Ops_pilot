"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Workflow, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackendAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function AgentRunsListPage() {
  const [runs, setRuns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await BackendAPI.getRuns();
      setRuns(data.runs || []);
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRuns();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-emerald-400" />
            Active & Historical Agent Runs
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Durable LangGraph state machine executions, checkpoint snapshots, and node transitions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRuns}
          disabled={loading}
          className="border-zinc-800 text-xs text-zinc-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/60">
            <TableRow className="border-zinc-800">
              <TableHead className="font-mono text-xs">Run ID</TableHead>
              <TableHead>Workflow Intent</TableHead>
              <TableHead>Current Step</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Inspection</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-zinc-500">
                  No agent runs recorded yet. Submit a business request to initialize a run.
                </TableCell>
              </TableRow>
            )}
            {runs.map((r) => (
              <TableRow key={r.id} className="border-zinc-800/80 hover:bg-zinc-900/40">
                <TableCell className="font-mono text-xs text-zinc-400">
                  {r.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="max-w-md truncate font-medium text-zinc-200">
                  {r.business_requests?.raw_prompt || "Enterprise Automation Task"}
                </TableCell>
                <TableCell className="font-mono text-xs text-emerald-400">
                  {r.current_step_id || "Initial"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "COMPLETED"
                        ? "success"
                        : r.status === "WAITING_APPROVAL"
                        ? "warning"
                        : r.status === "FAILED"
                        ? "critical"
                        : "default"
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-zinc-500 font-mono">
                  {formatDateTime(r.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/runs/${r.id}`}
                    className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Inspect State <ArrowRight className="h-3 w-3" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
