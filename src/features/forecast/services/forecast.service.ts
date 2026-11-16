import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export type StockoutRiskTier = 'critical' | 'warning' | 'healthy';

export interface ForecastSkuItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  dailyVelocity: number;
  daysUntilStockout: number;
  riskTier: StockoutRiskTier;
  recommendedQty: number;
  unitCost: number;
  estimatedCost: number;
  supplierId: string;
  supplierName: string;
  leadTimeDays: number;
  safetyStock?: number;
  trendDirection?: 'rising' | 'stable' | 'cooling';
}

export interface ForecastSummary {
  usingLiveInventory: boolean;
  items: ForecastSkuItem[];
  metrics: {
    criticalSkus: number;
    warningSkus: number;
    avgDaysCover: number;
    totalRestockCapital: number;
  };
}

const SUPPLIER_BY_CATEGORY: Record<
  string,
  { supplierId: string; supplierName: string; leadTimeDays: number }
> = {
  'Braking Systems': {
    supplierId: '11111111-1111-4111-8111-111111111101',
    supplierName: 'Brembo Wholesale Direct',
    leadTimeDays: 4,
  },
  'Performance Tires': {
    supplierId: '11111111-1111-4111-8111-111111111102',
    supplierName: 'Michelin Motorsport Supply',
    leadTimeDays: 6,
  },
  'Electronics & Ignition': {
    supplierId: '11111111-1111-4111-8111-111111111103',
    supplierName: 'Bosch Aftermarket Logistics',
    leadTimeDays: 3,
  },
  'Lubricants & Fluids': {
    supplierId: '11111111-1111-4111-8111-111111111104',
    supplierName: 'Motul Performance Fluids',
    leadTimeDays: 5,
  },
};

const FALLBACK_ITEMS: ForecastSkuItem[] = [
  {
    id: 'fc-1',
    sku: 'BRM-6P-CAL',
    name: 'Brembo GT 6-Piston Front Caliper Kit',
    category: 'Braking Systems',
    currentStock: 6,
    reorderLevel: 10,
    dailyVelocity: 1.4,
    daysUntilStockout: 4,
    riskTier: 'critical',
    recommendedQty: 18,
    unitCost: 1180,
    estimatedCost: 21240,
    supplierId: '11111111-1111-4111-8111-111111111101',
    supplierName: 'Brembo Wholesale Direct',
    leadTimeDays: 4,
  },
  {
    id: 'fc-2',
    sku: 'MCH-PS4S-245',
    name: 'Michelin Pilot Sport 4S 245/35ZR19',
    category: 'Performance Tires',
    currentStock: 18,
    reorderLevel: 20,
    dailyVelocity: 2.1,
    daysUntilStockout: 9,
    riskTier: 'warning',
    recommendedQty: 28,
    unitCost: 245,
    estimatedCost: 6860,
    supplierId: '11111111-1111-4111-8111-111111111102',
    supplierName: 'Michelin Motorsport Supply',
    leadTimeDays: 6,
  },
  {
    id: 'fc-3',
    sku: 'MOT-300V-5W40',
    name: 'Motul 300V Competition 5W-40 (4L)',
    category: 'Lubricants & Fluids',
    currentStock: 14,
    reorderLevel: 24,
    dailyVelocity: 2.8,
    daysUntilStockout: 5,
    riskTier: 'critical',
    recommendedQty: 36,
    unitCost: 68,
    estimatedCost: 2448,
    supplierId: '11111111-1111-4111-8111-111111111104',
    supplierName: 'Motul Performance Fluids',
    leadTimeDays: 5,
  },
  {
    id: 'fc-4',
    sku: 'BSH-IGN-COIL',
    name: 'Bosch Motorsport High-Output Ignition Coil Pack',
    category: 'Electronics & Ignition',
    currentStock: 52,
    reorderLevel: 20,
    dailyVelocity: 2.0,
    daysUntilStockout: 26,
    riskTier: 'healthy',
    recommendedQty: 12,
    unitCost: 62.5,
    estimatedCost: 750,
    supplierId: '11111111-1111-4111-8111-111111111103',
    supplierName: 'Bosch Aftermarket Logistics',
    leadTimeDays: 3,
  },
];

function classifyRisk(daysUntilStockout: number): StockoutRiskTier {
  if (daysUntilStockout < 7) return 'critical';
  if (daysUntilStockout <= 14) return 'warning';
  return 'healthy';
}

function computeMetrics(items: ForecastSkuItem[]) {
  const criticalSkus = items.filter((i) => i.riskTier === 'critical').length;
  const warningSkus = items.filter((i) => i.riskTier === 'warning').length;
  const avgDaysCover =
    items.length > 0
      ? Math.round(
          items.reduce((sum, i) => sum + i.daysUntilStockout, 0) / items.length,
        )
      : 0;
  const totalRestockCapital = items
    .filter((i) => i.riskTier !== 'healthy')
    .reduce((sum, i) => sum + i.estimatedCost, 0);

  return {
    criticalSkus,
    warningSkus,
    avgDaysCover,
    totalRestockCapital,
  };
}

/**
 * Holt's Double Exponential Smoothing + 95% Service-Level Safety Stock (Z = 1.645)
 */
function holtExponentialForecast(series: number[], leadTimeDays: number) {
  const alpha = 0.35; // level smoothing
  const beta = 0.15;  // trend smoothing
  const zScore = 1.645; // 95% service level

  let level = series[0] ?? 1.2;
  let trend = series.length > 1 ? series[1] - series[0] : 0;

  for (let t = 1; t < series.length; t++) {
    const val = series[t];
    const prevLevel = level;
    level = alpha * val + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const forecastVelocity = Math.max(0.5, Number((level + trend).toFixed(2)));
  const mean = series.reduce((a, b) => a + b, 0) / Math.max(1, series.length);
  const variance =
    series.reduce((sum, x) => sum + (x - mean) ** 2, 0) / Math.max(1, series.length);
  const stdDev = Math.sqrt(variance);
  const safetyStock = Math.ceil(zScore * stdDev * Math.sqrt(Math.max(1, leadTimeDays)));
  const trendDirection: 'rising' | 'stable' | 'cooling' =
    trend > 0.08 ? 'rising' : trend < -0.08 ? 'cooling' : 'stable';

  return { forecastVelocity, safetyStock, trendDirection };
}

export const getDemandForecastSummary = cache(async (): Promise<ForecastSummary> => {
  try {
    const supabase = createAdminClient();
    const [{ data, error }, { data: orderItems }] = await Promise.all([
      supabase
        .from('products')
        .select('id, sku, name, category, price_cents, inventory(stock_quantity, reorder_level)')
        .order('name', { ascending: true })
        .limit(20),
      supabase
        .from('order_items')
        .select('product_id, quantity')
        .limit(200),
    ]);

    if (error || !data || data.length === 0) {
      return {
        usingLiveInventory: false,
        items: FALLBACK_ITEMS,
        metrics: computeMetrics(FALLBACK_ITEMS),
      };
    }

    // Group observed historical demand per product across recent buckets
    const demandByProduct = new Map<string, number[]>();
    if (orderItems) {
      for (const oi of orderItems as Array<{ product_id: string; quantity: number }>) {
        const list = demandByProduct.get(oi.product_id) ?? [];
        list.push(Number(oi.quantity ?? 1));
        demandByProduct.set(oi.product_id, list);
      }
    }

    const items: ForecastSkuItem[] = data.map((row: any, idx: number) => {
      const inv = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
      const currentStock = Number(inv?.stock_quantity ?? 12);
      const reorderLevel = Number(inv?.reorder_level ?? 15);
      const category = String(row.category ?? 'Braking Systems');
      const supplier =
        SUPPLIER_BY_CATEGORY[category] ?? SUPPLIER_BY_CATEGORY['Braking Systems'];

      // Build 14-day demand series from live order_items if >= 4 observations, else deterministic baseline series
      const observed = demandByProduct.get(String(row.id));
      const baseRate = 1.1 + ((idx * 7 + currentStock) % 15) * 0.12;
      const series =
        observed && observed.length >= 4
          ? observed.slice(-14)
          : Array.from({ length: 14 }, (_, d) =>
              Number(Math.max(0.4, baseRate + Math.sin((d + idx) * 0.6) * 0.35 + (d * 0.02)).toFixed(2))
            );

      const { forecastVelocity, safetyStock, trendDirection } = holtExponentialForecast(
        series,
        supplier.leadTimeDays
      );

      const dailyVelocity = Number(forecastVelocity.toFixed(1));
      const daysUntilStockout = Math.max(1, Math.round(currentStock / Math.max(0.5, dailyVelocity)));
      const riskTier = classifyRisk(daysUntilStockout);

      const targetCoverDays = 21 + supplier.leadTimeDays;
      const recommendedQty = Math.max(
        10,
        Math.ceil(dailyVelocity * targetCoverDays + safetyStock - currentStock),
      );
      const unitCost = Number(((Number(row.price_cents ?? 12000) / 100) * 0.62).toFixed(2));

      return {
        id: String(row.id),
        sku: String(row.sku),
        name: String(row.name),
        category,
        currentStock,
        reorderLevel,
        dailyVelocity,
        daysUntilStockout,
        riskTier,
        recommendedQty,
        unitCost,
        estimatedCost: Number((recommendedQty * unitCost).toFixed(2)),
        supplierId: supplier.supplierId,
        supplierName: supplier.supplierName,
        leadTimeDays: supplier.leadTimeDays,
        safetyStock,
        trendDirection,
      };
    });

    items.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

    return {
      usingLiveInventory: true,
      items,
      metrics: computeMetrics(items),
    };
  } catch {
    return {
      usingLiveInventory: false,
      items: FALLBACK_ITEMS,
      metrics: computeMetrics(FALLBACK_ITEMS),
    };
  }
});
