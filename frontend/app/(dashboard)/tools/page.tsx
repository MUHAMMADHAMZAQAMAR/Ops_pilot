"use client";

import * as React from "react";
import { Wrench, Lock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackendAPI } from "@/lib/api";

export default function ToolsRegistryPage() {
  const [tools, setTools] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const data = await BackendAPI.getTools();
      setTools(data.tools || []);
    } catch {
      setTools([
        {
          name: "customer_search",
          description: "Scoped search across tenant customer records with strict RLS isolation.",
          riskLevel: "LOW",
          requiredRole: "member",
          mutation: false,
        },
        {
          name: "sales_analyzer",
          description: "Aggregates revenue volume, MRR growth, and customer churn rate metrics.",
          riskLevel: "MEDIUM",
          requiredRole: "member",
          mutation: false,
        },
        {
          name: "email_generator",
          description: "Drafts compliant executive emails from customer and analytics contexts.",
          riskLevel: "MEDIUM",
          requiredRole: "member",
          mutation: false,
        },
        {
          name: "email_sender",
          description: "Dispatches external transactional or notification emails via SMTP/API gateway.",
          riskLevel: "HIGH",
          requiredRole: "admin",
          mutation: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTools();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-emerald-400" />
            Sandboxed Tool Registry & RBAC Permissions Matrix
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Zero-Trust dual-boundary enforcement. Every tool execution is strictly validated with runtime Zod schemas and scoped to caller organization credentials.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTools}
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
              <TableHead>Tool Identifier</TableHead>
              <TableHead>Purpose & Description</TableHead>
              <TableHead>Risk Classification</TableHead>
              <TableHead>Min. Role</TableHead>
              <TableHead>State Mutation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.map((t) => (
              <TableRow key={t.name} className="border-zinc-800/80 hover:bg-zinc-900/40">
                <TableCell className="font-mono text-xs font-semibold text-emerald-400">
                  {t.name}
                </TableCell>
                <TableCell className="text-xs text-zinc-300 max-w-xs">{t.description}</TableCell>
                <TableCell>
                  <Badge variant={t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL" ? "warning" : "secondary"}>
                    {t.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-300 uppercase">
                  {t.requiredRole}
                </TableCell>
                <TableCell>
                  {t.mutation ? (
                    <span className="text-amber-400 font-semibold text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Yes (HITL Gate)
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-xs">Read-Only</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
