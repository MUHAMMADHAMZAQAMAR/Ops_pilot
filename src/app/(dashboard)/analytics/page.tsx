import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { LineChart, TrendingUp, DollarSign, PackageCheck, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { getOrders, calculateOrderMetrics } from '@/features/orders/services/orders.service';
import { getInventoryItems, calculateInventoryMetrics } from '@/features/inventory/services/inventory.service';

export default async function AnalyticsPage() {
  // Only 2 single cached database queries running in parallel
  const [orders, inventoryItems] = await Promise.all([
    getOrders(),
    getInventoryItems(),
  ]);

  // Zero-latency in-memory calculations
  const orderMetrics = calculateOrderMetrics(orders);
  const inventoryMetrics = calculateInventoryMetrics(inventoryItems);

  const fulfillmentRatio =
    orderMetrics.totalOrders > 0
      ? Math.round((orderMetrics.fulfilledOrders / orderMetrics.totalOrders) * 100)
      : 0;

  const stockHealthRatio =
    inventoryMetrics.totalSkus > 0
      ? Math.round(
        (inventoryMetrics.healthyStockCount / inventoryMetrics.totalSkus) * 100
      )
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-[#22d3ee]">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Operations & Financial Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic business intelligence computed from Supabase records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlassBadge variant="cyan" pulseDot>
              Real-Time Query
            </GlassBadge>
            <Link href="/analytics/reports">
              <GlassButton variant="lime">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Compliance Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </GlassButton>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Fulfillment Ratio</span>
            <PackageCheck className="w-4 h-4 text-[#c8f135]" />
          </div>
          <div className="text-3xl font-black text-white">{fulfillmentRatio}%</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {orderMetrics.fulfilledOrders} of {orderMetrics.totalOrders} orders completed
          </span>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Catalog Stock Health</span>
            <AlertCircle className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div className="text-3xl font-black text-[#fbbf24]">{stockHealthRatio}%</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {inventoryMetrics.healthyStockCount} SKUs above threshold
          </span>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-[#c8f135]" />
          </div>
          <div className="text-3xl font-black text-[#c8f135]">
            {orderMetrics.totalRevenueFormatted}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Settled ledger balance</span>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="text-3xl font-black text-white">
            {orderMetrics.totalOrders > 0
              ? (
                orderMetrics.totalRevenueCents /
                orderMetrics.totalOrders /
                100
              ).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })
              : '$0.00'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Per purchase order</span>
        </GlassCard>
      </div>

      {/* Breakdown Pods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4">
            Orders Lifecycle Breakdown
          </h3>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Fulfilled Orders</span>
                <span className="text-[#c8f135] font-bold">
                  {orderMetrics.fulfilledOrders} Orders
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  style={{
                    width: `${(orderMetrics.fulfilledOrders / (orderMetrics.totalOrders || 1)) * 100}%`,
                  }}
                  className="h-full bg-[#c8f135] rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Processing in Warehouse</span>
                <span className="text-[#22d3ee] font-bold">
                  {orderMetrics.processingOrders} Orders
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  style={{
                    width: `${(orderMetrics.processingOrders / (orderMetrics.totalOrders || 1)) * 100}%`,
                  }}
                  className="h-full bg-[#22d3ee] rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Pending Execution</span>
                <span className="text-[#fbbf24] font-bold">
                  {orderMetrics.pendingOrders} Orders
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  style={{
                    width: `${(orderMetrics.pendingOrders / (orderMetrics.totalOrders || 1)) * 100}%`,
                  }}
                  className="h-full bg-[#fbbf24] rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Cancelled / Refunded</span>
                <span className="text-rose-400 font-bold">
                  {orderMetrics.cancelledOrders} Orders
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  style={{
                    width: `${(orderMetrics.cancelledOrders / (orderMetrics.totalOrders || 1)) * 100}%`,
                  }}
                  className="h-full bg-rose-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4">
            Stock Criticality & Depletion
          </h3>
          <div className="space-y-3 text-xs">
            <div className="glass-panel-inset rounded-[20px] p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Vossen HF-5 Wheel</span>
                <span className="text-rose-400 text-[11px]">0 units (Immediate reorder needed)</span>
              </div>
              <GlassBadge variant="rose">Depleted</GlassBadge>
            </div>

            <div className="glass-panel-inset rounded-[20px] p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Michelin Defender LTX</span>
                <span className="text-[#fbbf24] text-[11px]">3 units (Reorder threshold: 10)</span>
              </div>
              <GlassBadge variant="amber">Low Stock</GlassBadge>
            </div>

            <div className="glass-panel-inset rounded-[20px] p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Rough Country Lift Kit</span>
                <span className="text-[#fbbf24] text-[11px]">5 units (Reorder threshold: 10)</span>
              </div>
              <GlassBadge variant="amber">Low Stock</GlassBadge>
            </div>

            <div className="glass-panel-inset rounded-[20px] p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">BFGoodrich KO2</span>
                <span className="text-[#c8f135] text-[11px]">25 units (Optimal supply)</span>
              </div>
              <GlassBadge variant="lime">Optimal</GlassBadge>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
