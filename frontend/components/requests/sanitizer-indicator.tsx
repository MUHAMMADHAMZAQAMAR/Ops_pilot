"use client";

import { ShieldCheck, AlertTriangle, Cpu, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FirewallScanResult } from "@/types/security";

interface SanitizerIndicatorProps {
  scanResult: FirewallScanResult | null;
  isScanning?: boolean;
}

export function SanitizerIndicator({ scanResult, isScanning }: SanitizerIndicatorProps) {
  if (isScanning) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400">
        <Cpu className="h-4 w-4 animate-spin text-emerald-400" />
        <span>Zero-Trust Ingestion Firewall analyzing prompt structure & unicode entropy...</span>
      </div>
    );
  }

  if (!scanResult) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-500 flex items-center gap-2">
        <Terminal className="h-4 w-4" />
        <span>Type a business request above to trigger real-time injection sanitization & entropy inspection.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {scanResult.isSafe ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          )}
          <span className="text-sm font-semibold text-zinc-100">
            {scanResult.isSafe ? "Ingestion Firewall Clearance: PASSED" : "Firewall Neutralization: THREATS ISOLATED"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={scanResult.isSafe ? "success" : "critical"}>
            {scanResult.detectedThreats.length} Threat(s) Found
          </Badge>
          <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            Entropy: {scanResult.entropyScore}
          </span>
        </div>
      </div>

      {scanResult.detectedThreats.length > 0 && (
        <div className="space-y-1 rounded-lg border border-rose-950/50 bg-rose-950/20 p-3 text-xs text-rose-300">
          <p className="font-semibold uppercase tracking-wider text-[10px] text-rose-400">Neutralized Vectors:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {scanResult.detectedThreats.map((threat, idx) => (
              <li key={idx}>{threat}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1">
        <span className="text-[11px] font-mono text-zinc-500 uppercase">Sanitized Inert Payload:</span>
        <pre className="rounded-md border border-zinc-900 bg-zinc-900/70 p-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
          {scanResult.sanitizedContent || "(Empty)"}
        </pre>
      </div>
    </div>
  );
}

