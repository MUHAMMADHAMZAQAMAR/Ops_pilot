import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { ShoppingCart, Clock, DollarSign } from 'lucide-react';
import { getOrders, calculateOrderMetrics } from '@/features/orders/services/orders.service';

export default async function OrdersPage() {
  // Only 1 single cached database query
  const orders = await getOrders();
  // Computed in memory with 0 network latency
  const metrics = calculateOrderMetrics(orders);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Purchase Orders</span>
            <div className="h-8 w-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{metrics.totalOrders}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Database synced</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Pending Execution</span>
            <div className="h-8 w-8 rounded-full bg-[#fbbf24] flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#fbbf24]">{metrics.pendingOrders}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Awaiting fulfillment</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Settled Order Volume</span>
            <div className="h-8 w-8 rounded-full bg-[#c8f135] flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(200,241,53,0.35)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#c8f135]">
              {metrics.totalRevenueFormatted}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Gross settled transactions</span>
          </div>
        </GlassCard>
      </div>

      {/* Orders Glass Table Card */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Purchase Orders Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automotive client order records & fulfillment lifecycle
            </p>
          </div>
          <GlassBadge variant="cyan" pulseDot>
            Live Database
          </GlassBadge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-semibold">
                <th className="pb-3 pl-3">Order Number</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Placement Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3 pr-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {orders.map((order) => {
                const badgeVariant =
                  order.status === 'fulfilled'
                    ? 'lime'
                    : order.status === 'processing'
                    ? 'cyan'
                    : order.status === 'pending'
                    ? 'amber'
                    : 'rose';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-4 pl-3 font-mono font-bold text-white">
                      {order.order_number}
                    </td>
                    <td className="py-4 font-semibold text-slate-100">
                      {order.customer?.name || 'Customer Record'}
                    </td>
                    <td className="py-4 text-slate-400 font-mono text-[11px]">
                      {order.customer?.email}
                      {order.customer?.phone && (
                        <span className="block text-slate-500">{order.customer.phone}</span>
                      )}
                    </td>
                    <td className="py-4 text-slate-300">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 font-bold text-white">
                      {(order.total_cents / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </td>
                    <td className="py-4 pr-3 text-right">
                      <GlassBadge variant={badgeVariant}>
                        {order.status.toUpperCase()}
                      </GlassBadge>
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
