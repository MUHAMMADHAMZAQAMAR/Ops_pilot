import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { Boxes, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import {
  getInventoryItems,
  calculateInventoryMetrics,
} from '@/features/inventory/services/inventory.service';

export default async function InventoryPage() {
  // Only 1 single cached database query
  const items = await getInventoryItems();
  // Computed in memory with 0 network latency
  const metrics = calculateInventoryMetrics(items);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Catalog SKUs</span>
            <div className="h-8 w-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{metrics.totalSkus} Items</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Automotive parts tracked</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Low Stock Warnings</span>
            <div className="h-8 w-8 rounded-full bg-[#fbbf24] flex items-center justify-center text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.35)]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#fbbf24]">
              {metrics.lowStockCount} Critical
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Below reorder threshold</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Out of Stock Alerts</span>
            <div className="h-8 w-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-[0_0_12px_rgba(244,63,94,0.35)]">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-rose-400">
              {metrics.outOfStockCount} Depleted
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Immediate reorder required</span>
          </div>
        </GlassCard>
      </div>

      {/* Inventory Glass Table */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Automotive Parts & Stock Thresholds
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live stock levels vs automated reorder trigger points
            </p>
          </div>
          <GlassBadge variant="lime" pulseDot>
            Live Warehouse
          </GlassBadge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-semibold">
                <th className="pb-3 pl-3">SKU</th>
                <th className="pb-3">Part Name & Brand</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Unit Price</th>
                <th className="pb-3 text-center">In Stock</th>
                <th className="pb-3 text-center">Reorder Point</th>
                <th className="pb-3 pr-3 text-right">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {items.map((item) => {
                const isOutOfStock = item.stock_quantity === 0;
                const isLowStock =
                  item.stock_quantity > 0 && item.stock_quantity <= item.reorder_level;

                const statusBadge = isOutOfStock ? (
                  <GlassBadge variant="rose">OUT OF STOCK</GlassBadge>
                ) : isLowStock ? (
                  <GlassBadge variant="amber">LOW STOCK</GlassBadge>
                ) : (
                  <GlassBadge variant="lime">OPTIMAL</GlassBadge>
                );

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-4 pl-3 font-mono font-bold text-white">
                      {item.product?.sku}
                    </td>
                    <td className="py-4 font-semibold text-slate-100">
                      {item.product?.name}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        Brand: {item.product?.brand}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px]">
                        {item.product?.category}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-white">
                      {((item.product?.price_cents || 0) / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </td>
                    <td className="py-4 text-center font-black text-sm">
                      <span
                        className={
                          isOutOfStock
                            ? 'text-rose-400'
                            : isLowStock
                            ? 'text-[#fbbf24]'
                            : 'text-[#c8f135]'
                        }
                      >
                        {item.stock_quantity}
                      </span>
                    </td>
                    <td className="py-4 text-center text-slate-400 font-mono">
                      {item.reorder_level}
                    </td>
                    <td className="py-4 pr-3 text-right">{statusBadge}</td>
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
