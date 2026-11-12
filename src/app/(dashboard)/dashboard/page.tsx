import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import {
  Boxes,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Package,
} from 'lucide-react';
import {
  getOrders,
  calculateOrderMetrics,
} from '@/features/orders/services/orders.service';
import {
  getInventoryItems,
  calculateInventoryMetrics,
} from '@/features/inventory/services/inventory.service';

export default async function DashboardPage() {
  // Only 2 single, cached queries in parallel - zero duplicate network calls
  const [orders, inventoryItems] = await Promise.all([
    getOrders(),
    getInventoryItems(),
  ]);

  // Calculated synchronously in-memory (0ms)
  const orderMetrics = calculateOrderMetrics(orders);
  const inventoryMetrics = calculateInventoryMetrics(inventoryItems);

  return (
    <div className="space-y-6">
      {/* Top 3-Column Glass Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Operations Statistics */}
        <GlassCard className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-200">
              Operations Statistics
            </span>

            <div className="flex items-baseline gap-3 mt-4 mb-4">
              <span className="text-4xl font-black tracking-tight text-white">
                {orderMetrics.totalOrders > 0
                  ? Math.round(
                      (orderMetrics.fulfilledOrders / orderMetrics.totalOrders) * 100
                    )
                  : 0}
                %
              </span>
              <span className="text-xs text-slate-300 font-medium leading-tight">
                Fulfillment <br /> Success Rate
              </span>
            </div>

            {/* Tri-Color Segmented Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] flex overflow-hidden mb-6">
              <div
                style={{
                  width: `${(orderMetrics.fulfilledOrders / (orderMetrics.totalOrders || 1)) * 100}%`,
                }}
                className="h-full bg-[#c8f135]"
              />
              <div
                style={{
                  width: `${(orderMetrics.processingOrders / (orderMetrics.totalOrders || 1)) * 100}%`,
                }}
                className="h-full bg-[#22d3ee]"
              />
              <div
                style={{
                  width: `${(orderMetrics.pendingOrders / (orderMetrics.totalOrders || 1)) * 100}%`,
                }}
                className="h-full bg-[#fbbf24]"
              />
            </div>
          </div>

          {/* 3 Live Nested Glass Pods */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-panel-inset rounded-[20px] p-3 text-center flex flex-col items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-[#c8f135] flex items-center justify-center text-slate-950 mb-2 shadow-[0_0_12px_rgba(200,241,53,0.35)]">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white leading-none">
                {inventoryMetrics.healthyStockCount}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">In Stock</span>
            </div>

            <div className="glass-panel-inset rounded-[20px] p-3 text-center flex flex-col items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-[#fbbf24] flex items-center justify-center text-slate-950 mb-2 shadow-[0_0_12px_rgba(251,191,36,0.35)]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white leading-none">
                {inventoryMetrics.lowStockCount}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Low Stock</span>
            </div>

            <div className="glass-panel-inset rounded-[20px] p-3 text-center flex flex-col items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-rose-500 flex items-center justify-center text-white mb-2 shadow-[0_0_12px_rgba(244,63,94,0.35)]">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white leading-none">
                {inventoryMetrics.outOfStockCount}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Out of Stock</span>
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Center Critical Alerts Pod */}
        <GlassCard className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GlassBadge variant="amber">Critical Inventory</GlassBadge>
              <GlassBadge variant="cyan">Instant Memory Cache</GlassBadge>
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">
              {inventoryMetrics.outOfStockItems[0]?.product?.name ||
                'Vossen HF-5 Wheel (SKU: WHL-VOS-001)'}
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Stock level at 0 units. Customer demand pending. Reorder threshold is 10 units.
            </p>
          </div>

          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-panel-inset rounded-[18px] p-2.5">
                <span className="text-[10px] text-slate-400 font-medium block">
                  Pending Orders
                </span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {orderMetrics.pendingOrders} Active
                </span>
              </div>

              <div className="glass-panel-inset rounded-[18px] p-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Gross Volume</span>
                </div>
                <span className="text-sm font-bold text-[#c8f135] mt-1 block">
                  {orderMetrics.totalRevenueFormatted}
                </span>
              </div>
            </div>

            <Link href="/inventory" className="block w-full">
              <GlassButton variant="lime" className="w-full py-2.5">
                Inspect Inventory Depletion <ArrowRight className="w-3.5 h-3.5" />
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        {/* Card 3: Activity & Weekly Volume */}
        <GlassCard className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-200">Weekly Activity</span>
              <GlassBadge variant="glass">Last 7 days</GlassBadge>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {orderMetrics.totalOrders}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Live Customer Orders Processed
              </span>
            </div>

            {/* Tactile Pill Bar Chart */}
            <div className="flex items-end justify-between h-28 px-1 mb-6">
              {[
                { day: 'Mon', h: '35%', active: false },
                { day: 'Tue', h: '55%', active: false },
                { day: 'Wed', h: '45%', active: false },
                { day: 'Thu', h: '60%', active: false },
                { day: 'Fri', h: '95%', active: true },
                { day: 'Sat', h: '70%', active: false },
                { day: 'Sun', h: '85%', active: false },
              ].map((bar) => (
                <div key={bar.day} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-6 h-24 rounded-full bg-white/[0.04] flex items-end p-0.5 justify-center">
                    <div
                      style={{ height: bar.h }}
                      className={`w-full rounded-full origin-bottom animate-grow-up transition-all duration-300 ${
                        bar.active
                          ? 'bg-white shadow-[0_0_18px_rgba(255,255,255,0.7)]'
                          : 'bg-white/[0.14] hover:bg-white/[0.25]'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel-inset rounded-[20px] p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400">Total Catalog Items</span>
              <span className="font-semibold text-white">{inventoryMetrics.totalSkus} SKUs</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400">Fulfilled Lifecycle</span>
              <span className="font-semibold text-[#c8f135]">
                {orderMetrics.fulfilledOrders} Completed
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Live Recent Orders Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Recent Customer Orders
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live records from Supabase PostgreSQL database
            </p>
          </div>
          <Link href="/orders">
            <GlassButton variant="primary">
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </GlassButton>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-semibold">
                <th className="pb-3 pl-3">Order #</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Total Amount</th>
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
                    <td className="py-3.5 pl-3 font-mono font-bold text-white">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 font-medium text-slate-200">
                      {order.customer?.name || 'Customer'}
                      <span className="block text-[11px] text-slate-400">
                        {order.customer?.email}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 font-semibold text-white">
                      {(order.total_cents / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </td>
                    <td className="py-3.5 pr-3 text-right">
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
