"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JwtSignerModal } from "@/components/approvals/jwt-signer";
import { BackendAPI } from "@/lib/api";
import { formatDateTime, truncateHash } from "@/lib/utils";

export default function ApprovalsActionCenterPage() {
  const [approvals, setApprovals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [signerModalOpen, setSignerModalOpen] = React.useState(false);
  const [activeApproval, setActiveApproval] = React.useState<{
    token: string;
    actionName: string;
    taskId: string;
  } | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await BackendAPI.getApprovals();
      setApprovals(data.approvals || []);
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchApprovals();
  }, []);

  const handleOpenSigner = (appr: any) => {
    setActiveApproval({
      token: appr.token_hash,
      actionName: appr.tasks?.tool_name || "High-Risk Action",
      taskId: appr.task_id,
    });
    setSignerModalOpen(true);
  };

  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-amber-400" />
            Human-in-the-Loop (HITL) Approval Center
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Authorize or reject high-risk state mutations using single-use cryptographic HMAC-SHA256 tokens.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={pendingCount > 0 ? "warning" : "secondary"}>
            {pendingCount} Awaiting Authorization
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApprovals}
            disabled={loading}
            className="border-zinc-800 text-xs text-zinc-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/60">
            <TableRow className="border-zinc-800">
              <TableHead className="font-mono text-xs">Approval ID</TableHead>
              <TableHead>Target Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Token Hash (SHA-256)</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-zinc-500">
                  No approval records found for your organization tenant.
                </TableCell>
              </TableRow>
            )}
            {approvals.map((appr) => (
              <TableRow key={appr.id} className="border-zinc-800/80 hover:bg-zinc-900/40">
                <TableCell className="font-mono text-xs text-zinc-400">
                  {appr.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="font-semibold text-zinc-200">
                  {appr.tasks?.tool_name || "email_sender"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      appr.status === "APPROVED"
                        ? "success"
                        : appr.status === "PENDING"
                        ? "warning"
                        : "critical"
                    }
                  >
                    {appr.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-[11px] text-zinc-500">
                  {truncateHash(appr.token_hash, 8)}
                </TableCell>
                <TableCell className="text-xs text-zinc-400">
                  {formatDateTime(appr.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/runs/${appr.run_id}`}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Inspect
                    </Link>
                    {appr.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenSigner(appr)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold h-7 px-2.5"
                      >
                        Authorize
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {activeApproval && (
        <JwtSignerModal
          open={signerModalOpen}
          onOpenChange={setSignerModalOpen}
          approvalToken={activeApproval.token}
          actionName={activeApproval.actionName}
          taskId={activeApproval.taskId}
          onSuccess={() => {
            fetchApprovals();
          }}
        />
      )}
    </div>
  );
}
