'use client';

import { useState, useTransition } from 'react';
import {
  RotateCcw,
  ShieldCheck,
  DollarSign,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  BadgeDollarSign,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge, type BadgeVariant } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import { createRmaClaim, updateRmaStatus } from '../actions/returns.actions';
import type { ReturnsSummary, RmaClaimRecord } from '../services/returns.service';

interface ReturnsViewProps {
  initialData: ReturnsSummary;
}

const CLAIM_TYPE_LABEL: Record<RmaClaimRecord['claim_type'], string> = {
  warranty: 'Warranty',
  defective: 'Defective',
  core_return: 'Core Deposit',
  fitment_mismatch: 'Fitment Mismatch',
};

const RMA_STATUS_BADGE: Record<
  RmaClaimRecord['status'],
  { label: string; variant: BadgeVariant }
> = {
  pending_review: { label: 'Pending Review', variant: 'amber' },
  inspecting: { label: 'Inspecting', variant: 'cyan' },
  approved: { label: 'Approved', variant: 'lime' },
  refunded: { label: 'Refunded', variant: 'emerald' },
  rejected: { label: 'Rejected', variant: 'rose' },
};

export function ReturnsView({ initialData }: ReturnsViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [claims, setClaims] = useState<RmaClaimRecord[]>(initialData.claims);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [orderRef, setOrderRef] = useState('ORD-9850');
  const [customerName, setCustomerName] = useState('Bay Area Track Club');
  const [customerEmail, setCustomerEmail] = useState('ops@batc.example');
  const [sku, setSku] = useState('BRM-6P-CAL');
  const [itemName, setItemName] = useState('Brembo GT 6-Piston Front Caliper Kit');
  const [claimType, setClaimType] = useState<RmaClaimRecord['claim_type']>('warranty');
  const [refundAmount, setRefundAmount] = useState('1180');
  const [reason, setReason] = useState('Caliper bleed valve thread tolerance issue');

  const openClaimsCount = claims.filter(
    (c) => c.status !== 'refunded' && c.status !== 'rejected',
  ).length;
  const warrantyCount = claims.filter(
    (c) => c.claim_type === 'warranty' || c.claim_type === 'core_return',
  ).length;
  const pendingRefundTotal = claims
    .filter((c) => c.status !== 'refunded' && c.status !== 'rejected')
    .reduce((sum, c) => sum + c.refund_amount, 0);

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createRmaClaim({
        orderRef,
        customerName,
        customerEmail,
        sku,
        itemName,
        reason,
        claimType,
        refundAmount: Number(refundAmount),
      });

      if (!res.success || !res.claim) {
        pushToast({
          title: 'RMA Creation Failed',
          message: res.error ?? 'Could not create RMA claim.',
          tone: 'rose',
        });
        return;
      }

      setClaims((prev) => [res.claim!, ...prev]);
      setShowForm(false);
      pushToast({
        title: `${res.claim.rma_number} Logged`,
        message: `${res.claim.customer_name} • ${res.claim.sku} staged for review.${res.previewOnly ? ' (Preview Mode)' : ''}`,
        tone: 'emerald',
      });
    });
  };

  const handleStatusChange = (
    claim: RmaClaimRecord,
    nextStatus: 'approved' | 'refunded' | 'rejected',
  ) => {
    startTransition(async () => {
      const res = await updateRmaStatus(claim.id, nextStatus);
      if (!res.success) {
        pushToast({
          title: 'RMA Update Failed',
          message: res.error ?? 'Could not update RMA status.',
          tone: 'rose',
        });
        return;
      }

      const isTerminal = nextStatus === 'refunded' || nextStatus === 'rejected';
      setClaims((prev) =>
        prev.map((item) =>
          item.id === claim.id
            ? {
                ...item,
                status: nextStatus,
                resolved_at: isTerminal ? new Date().toISOString() : null,
              }
            : item,
        ),
      );

      pushToast({
        title: `${claim.rma_number} ${nextStatus.toUpperCase()}`,
        message: `${claim.sku} for ${claim.customer_name} updated.${res.previewOnly ? ' (Preview Mode)' : ''}`,
        tone: nextStatus === 'rejected' ? 'amber' : 'emerald',
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Returns, RMA & Warranty Claims Hub
            </h1>
            {!initialData.tableReady && (
              <GlassBadge variant="cyan">Preview Mode</GlassBadge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Inspect automotive core returns, verify warranty claims, and authorize customer refunds or replacements.
          </p>
        </div>

        <GlassButton
          variant="primary"
          onClick={() => setShowForm((prev) => !prev)}
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Hide RMA Form' : 'Log RMA Claim'}
        </GlassButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Open RMA Cases
            </span>
            <RotateCcw className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{openClaimsCount}</p>
          <p className="mt-1 text-xs text-slate-500">Awaiting review or refund</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Warranty & Core
            </span>
            <ShieldCheck className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{warrantyCount}</p>
          <p className="mt-1 text-xs text-slate-500">Technical inspection queue</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Refund Exposure
            </span>
            <DollarSign className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ${pendingRefundTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-slate-500">Open claim liability</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Resolution SLA
            </span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {initialData.metrics.avgResolutionHours}h
          </p>
          <p className="mt-1 text-xs text-slate-500">Intake to refund issuance</p>
        </GlassCard>
      </div>

      {/* Collapsible New RMA Form */}
      {showForm && (
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Register New RMA / Warranty Claim
          </h2>
          <form onSubmit={handleCreateClaim} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Order Ref
              </label>
              <input
                type="text"
                required
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Claim Type
              </label>
              <select
                value={claimType}
                onChange={(e) =>
                  setClaimType(e.target.value as RmaClaimRecord['claim_type'])
                }
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              >
                <option value="warranty">Warranty</option>
                <option value="defective">Defective</option>
                <option value="core_return">Core Deposit</option>
                <option value="fitment_mismatch">Fitment Mismatch</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Refund Amount ($)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                SKU
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Part Name
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Reason
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <GlassButton type="submit" variant="lime" disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit RMA Claim'}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      {/* RMA Claims Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Active RMA & Warranty Queue
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">RMA # / Order</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Part & Reason</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Refund</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {claims.map((claim) => {
                const badge = RMA_STATUS_BADGE[claim.status];
                const isOpen =
                  claim.status === 'pending_review' || claim.status === 'inspecting';
                const isApproved = claim.status === 'approved';

                return (
                  <tr key={claim.id} className="hover:bg-white/30">
                    <td className="px-6 py-3.5">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {claim.rma_number}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
                        {claim.order_ref}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900">
                        {claim.customer_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {claim.customer_email}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900">{claim.item_name}</div>
                      <div className="text-xs text-slate-600">{claim.reason}</div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium text-slate-700">
                      {CLAIM_TYPE_LABEL[claim.claim_type]}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      ${claim.refund_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5">
                      <GlassBadge variant={badge.variant}>{badge.label}</GlassBadge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isOpen && (
                          <>
                            <GlassButton
                              variant="secondary"
                              disabled={isPending}
                              onClick={() => handleStatusChange(claim, 'approved')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Approve
                            </GlassButton>
                            <GlassButton
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => handleStatusChange(claim, 'rejected')}
                            >
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                              Reject
                            </GlassButton>
                          </>
                        )}
                        {isApproved && (
                          <GlassButton
                            variant="lime"
                            disabled={isPending}
                            onClick={() => handleStatusChange(claim, 'refunded')}
                          >
                            <BadgeDollarSign className="h-3.5 w-3.5" />
                            Issue Refund
                          </GlassButton>
                        )}
                        {!isOpen && !isApproved && (
                          <span className="text-xs text-slate-400">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
