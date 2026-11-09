import { RequestForm } from "@/components/requests/request-form";
import { ShieldCheck, Info } from "lucide-react";

export default function NewRequestPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Request Workspace & Prompt Injection Sanitizer
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Direct ingestion boundary. Input directives are filtered for system instruction overrides, delimiter breakouts, and hidden unicode before execution planning.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <RequestForm />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex items-start gap-3 text-xs text-zinc-400">
        <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-300">Zero-Trust Isolation Principle:</p>
          <p className="leading-relaxed">
            All user directives are parsed by an untrusted planner model. Any step requesting state mutation (such as outbound email dispatch or database writes) automatically halts the graph and generates a cryptographic single-use JWT for Human-In-The-Loop review.
          </p>
        </div>
      </div>
    </div>
  );
}

