"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus2, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { BackendAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function BusinessRequestsPage() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await BackendAPI.getRequests();
      setRequests(data.requests || []);
    } catch {
      // In case no requests yet or error
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Business Automation Requests</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Enterprise request stream with prompt injection sanitization records and multi-tenant RLS binding.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={loading}
            className="border-zinc-800 text-xs text-zinc-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/requests/new">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
              <FilePlus2 className="h-4 w-4 mr-1.5" />
              Submit New Request
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/60">
            <TableRow className="border-zinc-800">
              <TableHead className="font-mono text-xs">Request ID</TableHead>
              <TableHead>Directive Preview</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Firewall Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-xs text-zinc-500">
                  No business requests found for your organization. Submit one to trigger LangGraph.
                </TableCell>
              </TableRow>
            )}
            {requests.map((r) => (
              <TableRow key={r.id} className="border-zinc-800/80 hover:bg-zinc-900/40">
                <TableCell className="font-mono text-xs text-zinc-400">
                  {r.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="max-w-md truncate font-medium text-zinc-200">
                  {r.raw_prompt}
                </TableCell>
                <TableCell className="text-xs text-zinc-400 font-mono">{r.category}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> Sanitized
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={r.priority === "URGENT" ? "critical" : r.priority === "HIGH" ? "warning" : "secondary"}>
                    {r.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={r.status === "COMPLETED" ? "success" : r.status === "WAITING_APPROVAL" ? "warning" : "default"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-zinc-500 font-mono">
                  {formatDateTime(r.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/runs`} className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium">
                    View Runs <ArrowRight className="h-3 w-3" />
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
