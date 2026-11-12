import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { InventoryItem, Product } from '@/types/database';

export interface InventoryItemWithProduct extends InventoryItem {
  product: Product | null;
}

// React cache() guarantees this query runs at most ONCE per page request
export const getInventoryItems = cache(async (): Promise<InventoryItemWithProduct[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      product_id,
      stock_quantity,
      reorder_level,
      updated_at,
      product:products(id, sku, name, brand, category, price_cents)
    `)
    .order('stock_quantity', { ascending: true });

  if (error) {
    console.error('Error fetching inventory:', error.message);
    return [];
  }

  return (data as unknown as InventoryItemWithProduct[]) || [];
});

// Compute metrics in-memory without making ANY extra database queries
export function calculateInventoryMetrics(items: InventoryItemWithProduct[]) {
  const totalSkus = items.length;
  const outOfStockItems: InventoryItemWithProduct[] = [];
  const lowStockItems: InventoryItemWithProduct[] = [];
  let healthyStockCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.stock_quantity === 0) {
      outOfStockItems.push(item);
    } else if (item.stock_quantity <= item.reorder_level) {
      lowStockItems.push(item);
    } else {
      healthyStockCount++;
    }
  }

  return {
    totalSkus,
    outOfStockCount: outOfStockItems.length,
    lowStockCount: lowStockItems.length,
    healthyStockCount,
    outOfStockItems,
    lowStockItems,
  };
}
