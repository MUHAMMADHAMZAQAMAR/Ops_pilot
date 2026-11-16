'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  TrendingDown,
  AlertOctagon,
  PackagePlus,
  Flame,
  Clock,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge, type BadgeVariant } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import { autoDraftRestockPO } from '../actions/forecast.actions';
import type {
  ForecastSummary,
  ForecastSkuItem,
  StockoutRiskTier,
} from '../services/forecast.service';

interface ForecastViewProps {
  initialData: ForecastSummary;
}

const RISK_BADGE: Record<
  StockoutRiskTier,
  { label: string; variant: BadgeVariant }
> = {
  critical: { label: 'Imminent (<7d)', variant: 'rose' },
  warning: { label: 'Reorder Soon (7-14d)', variant: 'amber' },
  healthy: { label: 'Healthy (>14d)', variant: 'emerald' },
};

export function ForecastView({ initialData }: ForecastViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [surgeMode, setSurgeMode] = useState<'baseline' | 'surge30'>('baseline');
  const [dispatchedSkus, setDispatchedSkus] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const multiplier = surgeMode === 'surge30' ? 1.3 : 1;

  const computedItems = useMemo(() => {
    return initialData.items.map((item) => {
      const velocity = Number((item.dailyVelocity * multiplier).toFixed(1));
      const days = Math.max(1, Math.round(item.currentStock / Math.max(0.5, velocity)));
      const riskTier: StockoutRiskTier =
        days < 7 ? 'critical' : days <= 14 ? 'warning' : 'healthy';
      const targetDays = 21 + item.leadTimeDays;
      const recommendedQty = Math.max(
        10,
        Math.ceil(velocity * targetDays - item.currentStock),
      );
      const estimatedCost = Number((recommendedQty * item.unitCost).toFixed(2));
      return {
        ...item,
        dailyVelocity: velocity,
        daysUntilStockout: days,
        riskTier,
        recommendedQty,
        estimatedCost,
      };
    });
  }, [initialData.items, multiplier]);

  const criticalCount = computedItems.filter((i) => i.riskTier === 'critical').length;
  const warningCount = computedItems.filter((i) => i.riskTier === 'warning').length;
  const avgDaysCover =
    computedItems.length > 0
      ? Math.round(
          computedItems.reduce((sum, i) => sum + i.daysUntilStockout, 0) /
            computedItems.length,
        )
      : 0;
  const restockCapital = computedItems
    .filter((i) => i.riskTier !== 'healthy')
    .reduce((sum, i) => sum + i.estimatedCost, 0);

  const handleAutoDraftPO = (item: ForecastSkuItem) => {
    startTransition(async () => {
      const res = await autoDraftRestockPO({
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        sku: item.sku,
        itemName: item.name,
        quantity: item.recommendedQty,
        unitCost: item.unitCost,
        leadTimeDays: item.leadTimeDays,
      });

      if (!res.success || !res.order) {
        pushToast({
          title: 'PO Draft Failed',
          message: res.error ?? 'Could not stage replenishment PO.',
          tone: 'rose',
        });
        return;
      }

      setDispatchedSkus((prev) => ({
        ...prev,
        [item.sku]: res.order!.po_number,
      }));

      pushToast({
        title: `${res.order.po_number} Staged`,
        message: `${item.recommendedQty}× ${item.sku} routed to ${item.supplierName}.${res.previewOnly ? ' (Preview Mode)' : ''}`,
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
              AI Demand Forecasting & Restock Optimizer
            </h1>
            {!initialData.usingLiveInventory && (
              <GlassBadge variant="cyan">Preview Mode</GlassBadge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Predict automotive SKU stockouts from daily burn rates and auto-dispatch Economic Order Quantity POs.
          </p>
        </div>

        {/* Demand Surge Simulator Toggle */}
        <div className="flex items-center gap-2">
          <GlassButton
            variant={surgeMode === 'baseline' ? 'primary' : 'secondary'}
            onClick={() => setSurgeMode('baseline')}
          >
            Standard Baseline
          </GlassButton>
          <GlassButton
            variant={surgeMode === 'surge30' ? 'amber' : 'secondary'}
            onClick={() => setSurgeMode('surge30')}
          >
            <Flame className="h-4 w-4" />
            +30% Track Surge
          </GlassButton>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Imminent Stockouts
            </span>
            <AlertOctagon className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{criticalCount}</p>
          <p className="mt-1 text-xs text-slate-500">Under 7 days of supply</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Approaching Reorder
            </span>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{warningCount}</p>
          <p className="mt-1 text-xs text-slate-500">7–14 days runway left</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Inventory Cover
            </span>
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{avgDaysCover}d</p>
          <p className="mt-1 text-xs text-slate-500">
            {surgeMode === 'surge30' ? 'Under +30% surge load' : 'At baseline velocity'}
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Restock Capital Needed
            </span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ${restockCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-slate-500">For critical & warning SKUs</p>
        </GlassCard>
      </div>

      {/* 30-Day Depletion Runway Visualizer */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-slate-900">
          30-Day Depletion Runway
        </h2>
        <div className="mt-4 space-y-3">
          {computedItems.slice(0, 5).map((item) => {
            const pct = Math.min(100, Math.round((item.daysUntilStockout / 30) * 100));
            const barColor =
              item.riskTier === 'critical'
                ? 'bg-rose-500'
                : item.riskTier === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500';
            return (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">
                    {item.name} ({item.sku})
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {item.daysUntilStockout}d left • {item.dailyVelocity}/day
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Forecast & EOQ Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            SKU Replenishment Recommendations
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">SKU & Part</th>
                <th className="px-6 py-3">On Hand</th>
                <th className="px-6 py-3">Burn / Day</th>
                <th className="px-6 py-3">Runway</th>
                <th className="px-6 py-3">EOQ Order</th>
                <th className="px-6 py-3">Risk</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {computedItems.map((item) => {
                const badge = RISK_BADGE[item.riskTier];
                const poNum = dispatchedSkus[item.sku];

                return (
                  <tr key={item.id} className="hover:bg-white/30">
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="font-mono text-xs text-slate-500">
                        {item.sku} • {item.supplierName}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">
                      {item.currentStock}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-700">
                      {item.dailyVelocity}/d
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {item.daysUntilStockout} days
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {item.recommendedQty} units
                      </div>
                      <div className="text-xs text-slate-500">
                        ${item.estimatedCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <GlassBadge variant={badge.variant}>{badge.label}</GlassBadge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {poNum ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {poNum}
                        </span>
                      ) : (
                        <GlassButton
                          variant={item.riskTier === 'critical' ? 'lime' : 'secondary'}
                          disabled={isPending}
                          onClick={() => handleAutoDraftPO(item)}
                        >
                          <PackagePlus className="h-3.5 w-3.5" />
                          Auto-Draft PO
                        </GlassButton>
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
