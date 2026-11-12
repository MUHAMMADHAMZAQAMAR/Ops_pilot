'use client';

import React, { useState, useTransition } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { ActionApprovalWithRelations } from '../services/approvals.service';
import { resolveApproval } from '../actions/approvals.actions';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Package,
  Mail,
  DollarSign,
  ArrowRight,
  Bot,
  AlertCircle,
} from 'lucide-react';

interface ApprovalCardProps {
  approval: ActionApprovalWithRelations;
}

export function ApprovalCard({ approval }: ApprovalCardProps) {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();
  const payload = (approval.payload as Record<string, unknown>) || {};

  function handleDecision(decision: 'approved' | 'rejected') {
    setFeedback(null);
    startTransition(async () => {
      const res = await resolveApproval(approval.id, decision);
      if (res.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        setFeedback({
          message: decision === 'approved' ? 'Action authorized & executed successfully.' : 'Proposal rejected.',
          type: 'success',
        });
      }
    });
  }

  const isResolved = approval.status !== 'pending';

  return (
    <GlassCard className="p-6 transition-all">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#fbbf24] shrink-0">
            {approval.action_type === 'order_inventory_restock' ? (
              <Package className="w-5 h-5" />
            ) : approval.action_type === 'send_customer_email' ? (
              <Mail className="w-5 h-5 text-[#22d3ee]" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-[#fbbf24]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white capitalize">
                {approval.action_type.replace(/_/g, ' ')}
              </h3>
              <GlassBadge
                variant={
                  approval.status === 'approved' || approval.status === 'executed'
                    ? 'lime'
                    : approval.status === 'rejected'
                    ? 'rose'
                    : 'amber'
                }
                pulseDot={approval.status === 'pending'}
              >
                {approval.status}
              </GlassBadge>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Checkpoint ID: {approval.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          {new Date(approval.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Parent Task Context */}
      {approval.run && (
        <div className="glass-panel-inset rounded-2xl p-3.5 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1 text-[11px]">
            <Bot className="w-3.5 h-3.5 text-[#c8f135]" />
            <span>Originating Autonomous Directive:</span>
          </div>
          <p className="text-slate-200 line-clamp-2">{approval.run.task}</p>
        </div>
      )}

      {/* Structured Payload Parameters */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 mb-5 space-y-2.5">
        <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-2">
          Proposed Operation Parameters:
        </span>

        {Object.entries(payload).map(([key, value]) => {
          const displayKey = key.replace(/_/g, ' ');
          const isCents = key.includes('cents') && typeof value === 'number';
          const displayValue = isCents
            ? (value / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            : String(value);

          return (
            <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-white/[0.04] last:border-0">
              <span className="text-slate-400 capitalize">{displayKey}</span>
              <span className={`font-mono font-medium ${isCents ? 'text-[#c8f135] font-bold text-sm' : 'text-slate-200'}`}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>

      {/* Decision Controls (Only if pending) */}
      {!isResolved ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleDecision('rejected')}
            className="px-4 py-2 rounded-full text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            Reject Proposal
          </button>

          <GlassButton
            type="button"
            variant="lime"
            disabled={isPending}
            onClick={() => handleDecision('approved')}
            className="py-2 px-5 text-xs font-bold cursor-pointer"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                Executing...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Execute Operation</span>
              </span>
            )}
          </GlassButton>
        </div>
      ) : (
        <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-white/[0.05]">
          <span>
            Resolved as{' '}
            <strong className="text-white capitalize">{approval.status}</strong>
          </span>
          {approval.executed_at && (
            <span className="text-[#c8f135] flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Executed to Database
            </span>
          )}
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`mt-3 p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in-up ${
            feedback.type === 'success'
              ? 'bg-[#c8f135]/10 border border-[#c8f135]/20 text-[#c8f135]'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </GlassCard>
  );
}

