import { createAdminClient } from '@/lib/supabase/admin';

export interface DepletedProductReport {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  unitsNeeded: number;
  unitPriceCents: number;
  estimatedRestockCostCents: number;
}

/**
 * Deterministic tool: scans inventory for depleted and low-stock SKUs
 */
export async function scanInventoryDepletionTool(thresholdMultiplier = 1): Promise<{
  totalDepleted: number;
  totalLowStock: number;
  items: DepletedProductReport[];
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      product_id,
      stock_quantity,
      reorder_level,
      product:products(id, sku, name, brand, category, price_cents)
    `)
    .order('stock_quantity', { ascending: true });

  if (error || !data) {
    console.error('Error in scanInventoryDepletionTool:', error?.message);
    return { totalDepleted: 0, totalLowStock: 0, items: [] };
  }

  const items: DepletedProductReport[] = [];
  let totalDepleted = 0;
  let totalLowStock = 0;

  for (const row of data) {
    const prod = row.product as any;
    if (!prod) continue;

    const threshold = row.reorder_level * thresholdMultiplier;
    if (row.stock_quantity <= threshold) {
      if (row.stock_quantity === 0) totalDepleted++;
      else totalLowStock++;

      // Recommended minimum replenishment batch: 10 units or up to 2x safety stock
      const unitsNeeded = Math.max(10, (row.reorder_level * 2) - row.stock_quantity);
      const estimatedRestockCostCents = unitsNeeded * prod.price_cents;

      items.push({
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        brand: prod.brand,
        category: prod.category,
        currentStock: row.stock_quantity,
        reorderLevel: row.reorder_level,
        unitsNeeded,
        unitPriceCents: prod.price_cents,
        estimatedRestockCostCents,
      });
    }
  }

  return {
    totalDepleted,
    totalLowStock,
    items,
  };
}

