"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import { BackendAPI } from "@/lib/api";

interface JwtSignerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalToken: string;
  actionName: string;
  taskId: string;
  onSuccess: () => void;
}

export function JwtSignerModal({
  open,
  onOpenChange,
  approvalToken,
  actionName,
  taskId,
  onSuccess,
}: JwtSignerModalProps) {
  const [decisionNotes, setDecisionNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleResolve = async (decision: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await BackendAPI.resolveApproval({
        token: approvalToken,
        decision,
        decisionNotes,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Resolution failure";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-emerald-400">
          <KeyRound className="h-5 w-5" />
          <DialogTitle>Authorize Cryptographic Mutation</DialogTitle>
        </div>
        <DialogDescription>
          Verify the HMAC-SHA256 token and execute the action under your authenticated role.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-4 text-xs">
        <div className="rounded-lg bg-zinc-900/80 p-3 border border-zinc-800 space-y-1">
          <p className="font-semibold text-zinc-300">Target Action: {actionName}</p>
          <p className="font-mono text-zinc-500">Task: {taskId}</p>
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 font-medium">Single-Use Signed JWT / Hash:</label>
          <pre className="rounded bg-zinc-950 p-2 text-[10px] font-mono text-zinc-500 border border-zinc-800 break-all max-h-24 overflow-y-auto">
            {approvalToken}
          </pre>
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 font-medium">Approver Decision Notes (Immutable Audit Entry):</label>
          <Textarea
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            placeholder="Verified parameters and confirmed customer dispatch authorization..."
            className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
            rows={3}
          />
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-950/40 p-2.5 text-xs text-rose-300 border border-rose-900/50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleResolve("REJECTED")}
          disabled={isSubmitting}
        >
          Reject Mutation
        </Button>
        <Button
          onClick={() => handleResolve("APPROVED")}
          disabled={isSubmitting}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
        >
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Confirm Sign & Resume
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
