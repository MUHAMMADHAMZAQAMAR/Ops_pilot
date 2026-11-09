"use client";

import * as React from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { truncateHash, formatDateTime } from "@/lib/utils";
import { BackendAPI } from "@/lib/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [verifying, setVerifying] = React.useState(false);
  const [chainVerified, setChainVerified] = React.useState<boolean | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await BackendAPI.getAuditLogs(100);
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await BackendAPI.verifyAuditChain();
      setChainVerified(res.verification.isValid);
    } catch {
      setChainVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
    handleVerifyChain();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Tamper-Evident SHA-256 Audit Log Chain
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable append-only audit trail. Database triggers prohibit UPDATE or DELETE operations; all records are cryptographically linked.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              chainVerified === true
                ? "success"
                : chainVerified === false
                ? "critical"
                : "secondary"
            }
            className="px-3 py-1"
          >
            {chainVerified === true
              ? "Chain Integrity: 100% Unbroken"
              : chainVerified === false
              ? "Integrity Verification Failed"
              : "Verifying..."}
          </Badge>
          <Button
            size="sm"
            onClick={handleVerifyChain}
            disabled={verifying}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${verifying ? "animate-spin" : ""}`} />
            {verifying ? "Verifying..." : "Re-Verify Proof"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/60">
            <TableRow className="border-zinc-800">
              <TableHead>Event Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Previous Hash (SHA-256)</TableHead>
              <TableHead>Current Record Hash (SHA-256)</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-zinc-500">
                  No audit logs recorded yet. Platform actions automatically append cryptographic logs.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id} className="border-zinc-800/80 hover:bg-zinc-900/40">
                <TableCell className="font-mono text-xs font-semibold text-zinc-200">
                  {log.action}
                </TableCell>
                <TableCell className="text-xs text-zinc-400">
                  {log.resource_type}: <span className="font-mono text-zinc-300">{log.resource_id.slice(0, 8)}...</span>
                </TableCell>
                <TableCell className="font-mono text-xs text-emerald-400">
                  {log.user_id ? log.user_id.slice(0, 8) : "SYSTEM"}
                </TableCell>
                <TableCell className="font-mono text-[11px] text-zinc-500">
                  {truncateHash(log.previous_hash, 8)}
                </TableCell>
                <TableCell className="font-mono text-[11px] text-emerald-400/90 font-medium">
                  {truncateHash(log.current_hash, 8)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-zinc-400">
                  {formatDateTime(log.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
