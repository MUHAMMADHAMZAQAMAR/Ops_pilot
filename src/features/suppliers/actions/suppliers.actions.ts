'use server';

import { revalidatePath } from 'next/cache';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PurchaseOrderRecord } from '../services/suppliers.service';

export interface CreatePurchaseOrderInput {
  supplierId: string;
  supplierName: string;
  sku: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  leadTimeDays?: number;
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<{ success: boolean; error?: string; order?: PurchaseOrderRecord; previewOnly?: boolean }> {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { success: false, error: 'Unauthorized: Please sign in as an operator.' };
  }

  const sku = input.sku.trim().toUpperCase();
  const itemName = input.itemName.trim();
  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 0));
  const unitCost = Math.max(0, Number(input.unitCost) || 0);

  if (!input.supplierId || !sku || !itemName) {
    return { success: false, error: 'Supplier, SKU, and item name are required.' };
  }

  const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const expectedDeliveryAt = new Date(
    Date.now() + Math.max(1, Number(input.leadTimeDays ?? 5)) * 86400000,
  ).toISOString();

  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase.from('purchase_orders' as any) as any)
      .insert({
        po_number: poNumber,
        supplier_id: input.supplierId,
        sku,
        item_name: itemName,
        quantity,
        unit_cost: unitCost,
        status: 'ordered',
        expected_delivery_at: expectedDeliveryAt,
        created_by: operator.email,
      })
      .select(
        'id, po_number, supplier_id, sku, item_name, quantity, unit_cost, total_cost, status, expected_delivery_at, received_at, created_at',
      )
      .single();

    if (error || !data) {
      return {
        success: true,
        previewOnly: true,
        order: {
          id: `po-local-${Date.now()}`,
          po_number: poNumber,
          supplier_id: input.supplierId,
          supplier_name: input.supplierName,
          sku,
          item_name: itemName,
          quantity,
          unit_cost: unitCost,
          total_cost: quantity * unitCost,
          status: 'ordered',
          expected_delivery_at: expectedDeliveryAt,
          received_at: null,
          created_at: new Date().toISOString(),
        },
      };
    }

    revalidatePath('/suppliers');
    return {
      success: true,
      order: {
        id: String(data.id),
        po_number: String(data.po_number),
        supplier_id: String(data.supplier_id),
        supplier_name: input.supplierName,
        sku: String(data.sku),
        item_name: String(data.item_name),
        quantity: Number(data.quantity),
        unit_cost: Number(data.unit_cost),
        total_cost: Number(data.total_cost ?? quantity * unitCost),
        status: data.status,
        expected_delivery_at: String(data.expected_delivery_at),
        received_at: null,
        created_at: String(data.created_at),
      },
    };
  } catch {
    return {
      success: true,
      previewOnly: true,
      order: {
        id: `po-local-${Date.now()}`,
        po_number: poNumber,
        supplier_id: input.supplierId,
        supplier_name: input.supplierName,
        sku,
        item_name: itemName,
        quantity,
        unit_cost: unitCost,
        total_cost: quantity * unitCost,
        status: 'ordered',
        expected_delivery_at: expectedDeliveryAt,
        received_at: null,
        created_at: new Date().toISOString(),
      },
    };
  }
}

export async function markPurchaseOrderReceived(
  orderId: string,
  sku: string,
  quantity: number,
): Promise<{ success: boolean; error?: string; previewOnly?: boolean }> {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { success: false, error: 'Unauthorized: Please sign in as an operator.' };
  }

  try {
    const supabase = createAdminClient();
    const receivedAt = new Date().toISOString();

    const { error: updateError } = await (supabase.from('purchase_orders' as any) as any)
      .update({
        status: 'received',
        received_at: receivedAt,
      })
      .eq('id', orderId);

    if (updateError) {
      return { success: true, previewOnly: true };
    }

    // Increment matching inventory SKU if present in products + inventory
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .maybeSingle();

    if (product) {
      const { data: invItem } = await supabase
        .from('inventory')
        .select('id, stock_quantity')
        .eq('product_id', product.id)
        .maybeSingle();

      if (invItem) {
        await supabase
          .from('inventory')
          .update({ stock_quantity: Number(invItem.stock_quantity ?? 0) + quantity })
          .eq('id', invItem.id);
      }
    }

    revalidatePath('/suppliers');
    revalidatePath('/inventory');
    return { success: true };
  } catch {
    return { success: true, previewOnly: true };
  }
}
