"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SanitizerIndicator } from "./sanitizer-indicator";
import { PromptFirewall } from "@/lib/security/firewall";
import { FirewallScanResult } from "@/types/security";
import { ArrowRight, Shield } from "lucide-react";
import { BackendAPI } from "@/lib/api";

export function RequestForm() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [category, setCategory] = React.useState("CUSTOMER_OPERATIONS");
  const [priority, setPriority] = React.useState("NORMAL");
  const [scanResult, setScanResult] = React.useState<FirewallScanResult | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Real-time firewall scanning with debounce
  React.useEffect(() => {
    if (!prompt.trim()) {
      setScanResult(null);
      return;
    }
    const timer = setTimeout(() => {
      const result = PromptFirewall.scan(prompt, true);
      setScanResult(result);
    }, 150);

    return () => clearTimeout(timer);
  }, [prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = await BackendAPI.submitRequest({ prompt, category, priority });
      if (data.runId) {
        router.push(`/runs/${data.runId}`);
      } else {
        alert("Failed to submit request to LangGraph");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error occurred";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Raw Business Automation Directive
        </label>
        <Textarea
          placeholder="E.g., Locate top enterprise customers from last quarter, calculate revenue trends, draft an executive strategic update, and dispatch emails to executives."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 font-sans"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">Category Domain</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="CUSTOMER_OPERATIONS">Customer Operations</option>
            <option value="FINANCIAL_ANALYSIS">Financial & Sales Analysis</option>
            <option value="EXECUTIVE_DISPATCH">Executive Dispatch</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-400">Execution Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent (Expedited)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span>Real-time Ingestion Firewall Inspection</span>
        </div>
        <SanitizerIndicator scanResult={scanResult} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPrompt("Find all customer accounts with high growth, calculate quarterly trends, and draft an executive briefing.")}
        >
          Load Template Prompt
        </Button>
        <Button
          type="submit"
          disabled={!prompt.trim() || isSubmitting}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold flex items-center gap-2"
        >
          {isSubmitting ? (
            <span>Ingesting & Executing...</span>
          ) : (
            <>
              <span>Dispatch to LangGraph Machine</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
