'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { MessageDraftWithRelations } from '../services/drafts.service';
import { updateDraftContent, approveAndSendDraft, rejectDraft } from '../actions/drafts.actions';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import {
  Mail,
  Send,
  X,
  Edit3,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Package,
  Bot,
  Copy,
} from 'lucide-react';

interface DraftCardProps {
  draft: MessageDraftWithRelations;
}

export function DraftCard({ draft }: DraftCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(draft.content);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDraft = draft.status === 'draft';
  const isApproved = draft.status === 'approved';
  const isRejected = draft.status === 'rejected';

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (!editedContent.trim()) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateDraftContent(draft.id, editedContent);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setIsEditing(false);
      }
    });
  };

  const handleApprove = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await approveAndSendDraft(draft.id);
      if (res?.error) setErrorMsg(res.error);
    });
  };

  const handleReject = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await rejectDraft(draft.id);
      if (res?.error) setErrorMsg(res.error);
    });
  };

  const customerName = draft.customer?.name || 'Customer';
  const customerEmail = draft.customer?.email || 'N/A';
  const initials = customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <GlassCard
      className={`p-5 space-y-4 transition-all duration-300 hover:border-white/20 ${
        isDraft ? 'border-amber-400/30 bg-amber-500/[0.015]' : ''
      }`}
    >
      {/* Top Header: Customer Info & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Customer Pod */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">{customerName}</span>
              {draft.order && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 flex items-center gap-1">
                  <Package className="w-3 h-3 text-[#c8f135]" />
                  <span>#{draft.order.order_number}</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{customerEmail}</span>
              {draft.customer?.phone && (
                <>
                  <span>•</span>
                  <span>{draft.customer.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isDraft && (
            <GlassBadge variant="amber" className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Pending Authorization</span>
            </GlassBadge>
          )}
          {isApproved && (
            <GlassBadge variant="emerald" className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Dispatched to Customer</span>
            </GlassBadge>
          )}
          {isRejected && (
            <GlassBadge variant="rose" className="flex items-center gap-1.5 font-semibold">
              <X className="w-3 h-3 text-rose-400" />
              <span>Rejected by Operator</span>
            </GlassBadge>
          )}
        </div>
      </div>

      {/* Originating Run Context */}
      {draft.run && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div className="flex items-center gap-2 truncate pr-2">
            <Bot className="w-3.5 h-3.5 text-[#c8f135] shrink-0" />
            <span className="truncate">Directive: {draft.run.task}</span>
          </div>
          <Link
            href={`/runs/${draft.run.id}`}
            className="shrink-0 text-[11px] text-[#22d3ee] hover:underline flex items-center gap-1"
          >
            <span>Inspect Run</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Message Body (View or Edit Mode) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Prepared Email Notification</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            {isDraft && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[11px] text-[#22d3ee] hover:text-[#38bdf8] flex items-center gap-1 transition-colors cursor-pointer font-medium"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Copy</span>
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={5}
              className="w-full p-3 rounded-2xl glass-panel-inset text-xs text-white leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-[#22d3ee]/50 resize-y"
              placeholder="Refine customer message..."
            />
            <div className="flex justify-end gap-2">
              <GlassButton
                variant="ghost"
                onClick={() => {
                  setEditedContent(draft.content);
                  setIsEditing(false);
                }}
                disabled={isPending}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleSaveEdit}
                disabled={isPending || !editedContent.trim()}
                className="flex items-center gap-1.5 text-xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Refinements</span>
              </GlassButton>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl glass-panel-inset text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line border border-white/[0.05]">
            {draft.content}
          </div>
        )}
      </div>

      {/* Error banner if action fails */}
      {errorMsg && (
        <div className="text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 p-2.5 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Action Footer for Pending Drafts */}
      {isDraft && (
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Authorization requires 1-click confirmation
          </span>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="danger"
              onClick={handleReject}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </GlassButton>

            <GlassButton
              variant="lime"
              onClick={handleApprove}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Authorize & Transmit</span>
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

