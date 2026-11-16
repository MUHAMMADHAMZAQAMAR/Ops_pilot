'use client';

import { useState, useTransition } from 'react';
import {
  Truck,
  PackageCheck,
  Clock,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge, type BadgeVariant } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import {
  createPurchaseOrder,
  markPurchaseOrderReceived,
} from '../actions/suppliers.actions';
import type {
  SuppliersSummary,
  PurchaseOrderRecord,
  SupplierRecord,
} from '../services/suppliers.service';

interface SuppliersViewProps {
  initialData: SuppliersSummary;
}

const PO_STATUS_BADGE: Record<
  PurchaseOrderRecord['status'],
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: 'Draft', variant: 'glass' },
  ordered: { label: 'Ordered', variant: 'cyan' },
  in_transit: { label: 'In Transit', variant: 'amber' },
  received: { label: 'Received', variant: 'emerald' },
  cancelled: { label: 'Cancelled', variant: 'rose' },
};

const VENDOR_STATUS_BADGE: Record<
  SupplierRecord['status'],
  { label: string; variant: BadgeVariant }
> = {
  active: { label: 'Active Partner', variant: 'emerald' },
  review: { label: 'SLA Review', variant: 'amber' },
  paused: { label: 'Paused', variant: 'glass' },
};

export function SuppliersView({ initialData }: SuppliersViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [suppliers] = useState<SupplierRecord[]>(initialData.suppliers);
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>(initialData.purchaseOrders);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectedSupplierId, setSelectedSupplierId] = useState(
    initialData.suppliers[0]?.id ?? '',
  );
  const [sku, setSku] = useState('BRM-PAD-CER');
  const [itemName, setItemName] = useState('Brembo Ceramic Performance Brake Pad Set');
  const [quantity, setQuantity] = useState('20');
  const [unitCost, setUnitCost] = useState('145');

  const openPoCount = orders.filter(
    (po) => po.status === 'draft' || po.status === 'ordered' || po.status === 'in_transit',
  ).length;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    startTransition(async () => {
      const res = await createPurchaseOrder({
        supplierId: supplier.id,
        supplierName: supplier.name,
        sku,
        itemName,
        quantity: Number(quantity),
        unitCost: Number(unitCost),
        leadTimeDays: supplier.lead_time_days,
      });

      if (!res.success || !res.order) {
        pushToast({
          title: 'Purchase Order Failed',
          message: res.error ?? 'Could not create purchase order.',
          tone: 'rose',
        });
        return;
      }

      setOrders((prev) => [res.order!, ...prev]);
      setShowCreateForm(false);
      pushToast({
        title: `${res.order.po_number} Dispatched`,
        message: `${res.order.quantity}× ${res.order.sku} ordered from ${supplier.name}.${res.previewOnly ? ' (Preview Mode)' : ''}`,
        tone: 'emerald',
      });
    });
  };

  const handleMarkReceived = (po: PurchaseOrderRecord) => {
    startTransition(async () => {
      const res = await markPurchaseOrderReceived(po.id, po.sku, po.quantity);
      if (!res.success) {
        pushToast({
          title: 'Update Failed',
          message: res.error ?? 'Could not mark PO received.',
          tone: 'rose',
        });
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === po.id
            ? {
                ...item,
                status: 'received',
                received_at: new Date().toISOString(),
              }
            : item,
        ),
      );

      pushToast({
        title: `${po.po_number} Received`,
        message: `+${po.quantity} units of ${po.sku} logged to replenishment ledger.${res.previewOnly ? ' (Preview Mode)' : ''}`,
        tone: 'emerald',
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Supplier & Vendor Replenishment Hub
            </h1>
            {!initialData.tableReady && (
              <GlassBadge variant="cyan">Preview Mode</GlassBadge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Coordinate automotive vendor SLAs, dispatch replenishment purchase orders, and receive stock into inventory.
          </p>
        </div>

        <GlassButton
          variant="primary"
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? 'Hide PO Form' : 'New Purchase Order'}
        </GlassButton>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verified Vendors
            </span>
            <Truck className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {initialData.metrics.totalSuppliers}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {initialData.metrics.activeVendors} active SLA partners
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Open Purchase Orders
            </span>
            <PackageCheck className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{openPoCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            Ordered or in-transit shipments
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Vendor Lead Time
            </span>
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {initialData.metrics.avgLeadTimeDays}d
          </p>
          <p className="mt-1 text-xs text-slate-500">Door-to-warehouse average</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              SLA Reliability
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">97.7%</p>
          <p className="mt-1 text-xs text-slate-500">On-time fulfillment rate</p>
        </GlassCard>
      </div>

      {/* Collapsible Create PO Form */}
      {showCreateForm && (
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Dispatch Replenishment Purchase Order
          </h2>
          <form onSubmit={handleCreateOrder} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Vendor
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.lead_time_days}d lead)
                  </option>
                ))}
              </select>
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
                Qty
              </label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Unit Cost ($)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Item Description
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full rounded-xl border border-slate-300/70 bg-white/75 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <GlassButton
                type="submit"
                variant="lime"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? 'Dispatching...' : 'Submit PO'}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Vendor Directory */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Automotive Vendor Directory
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {suppliers.map((vendor) => {
            const badge = VENDOR_STATUS_BADGE[vendor.status] ?? VENDOR_STATUS_BADGE.active;
            return (
              <GlassCard key={vendor.id} className="p-5" hoverEffect>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {vendor.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {vendor.category}
                    </p>
                  </div>
                  <GlassBadge variant={badge.variant}>{badge.label}</GlassBadge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-200/60 pt-3 text-xs">
                  <div>
                    <span className="text-slate-500">Lead Time</span>
                    <p className="font-semibold text-slate-800">
                      {vendor.lead_time_days} days
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">SLA Score</span>
                    <p className="font-semibold text-emerald-700">
                      {vendor.reliability_score}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{vendor.contact_email}</span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Purchase Order Ledger */}
      <GlassCard className="overflow-hidden p-0">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Replenishment Purchase Orders
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">PO #</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">SKU & Item</th>
                <th className="px-6 py-3">Qty</th>
                <th className="px-6 py-3">Total Cost</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {orders.map((po) => {
                const badge = PO_STATUS_BADGE[po.status] ?? PO_STATUS_BADGE.ordered;
                const isReceivable =
                  po.status === 'ordered' || po.status === 'in_transit' || po.status === 'draft';
                return (
                  <tr key={po.id} className="hover:bg-white/30">
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-900">
                      {po.po_number}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{po.supplier_name}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900">{po.item_name}</div>
                      <div className="font-mono text-xs text-slate-500">{po.sku}</div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">
                      {po.quantity}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      ${po.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5">
                      <GlassBadge variant={badge.variant}>{badge.label}</GlassBadge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {isReceivable ? (
                        <GlassButton
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleMarkReceived(po)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Mark Received
                        </GlassButton>
                      ) : (
                        <span className="text-xs text-slate-400">Completed</span>
                      )}
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
